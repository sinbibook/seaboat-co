(function (global) {
  'use strict';

  // 원본 `.room_img li` 는 3칸 고정이다 (`width:calc(33.3% - …)`).
  var GALLERY_COUNT = 3;

  function RoomMapper() {
    BaseDataMapper.call(this);
  }
  RoomMapper.prototype = Object.create(BaseDataMapper.prototype);
  RoomMapper.prototype.constructor = RoomMapper;

  RoomMapper.prototype.mapPage = function () {
    var rt = this.getCurrentRoomtype();

    // 객실이 하나도 없으면 상세가 성립하지 않는다 → 목록으로 보낸다.
    if (!rt) {
      window.location.href = 'layout-map.html';
      return;
    }

    this.mapPropertyNames();
    this.mapHero(rt);
    this.renderRoomTabs('[data-room-tabs]', rt.id);
    this.mapRoomInfo(rt);
    this.mapGallery(rt);
    this.mapTables(rt);
    this.mapFloorplan(rt);
    this.mapWideImage(rt);
    this.mapRoomPreview();

    if (typeof window.initRoomSwipers === 'function') window.initRoomSwipers();
    if (window.TplAos) window.TplAos.refresh();
  };

  // URL 의 `?room_id=` 로 객실을 고른다.
  //
  // ⚠️ 그룹(`groupName`)이 있으면 헤더 메뉴·객실 카드는 **그룹의 첫 객실**로 링크한다.
  //    하지만 상세 자체는 **들어온 객실 그대로** 보여준다 — 탭에서 그룹의 두 번째 객실을
  //    눌렀는데 첫 객실로 튕기면 그 객실에 영영 도달할 수 없다.
  RoomMapper.prototype.getRoomIdFromUrl = function () {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('room_id') || params.get('id') || '';
    } catch (e) {
      return '';
    }
  };

  RoomMapper.prototype.getCurrentRoomtype = function () {
    var roomtypes = this.getRoomtypes();
    if (!roomtypes.length) return null;

    var id = this.getRoomIdFromUrl();
    if (id) {
      var found = roomtypes.filter(function (rt) {
        return String(rt.id) === String(id);
      })[0];
      if (found) return found;
    }
    return roomtypes[0];
  };

  // `pages.room[]` 에서 이 객실의 블록을 찾는다 (id 매칭).
  RoomMapper.prototype.getSection = function (rt) {
    var pages = this.getPages().room || [];
    var entry = pages.filter(function (p) {
      return rt && String(p.id) === String(rt.id);
    })[0];
    return (entry && entry.sections && entry.sections[0]) || {};
  };

  RoomMapper.prototype.blockImages = function (block) {
    return this.getSelectedImages((block && block.images) || []).filter(function (img) {
      return img && img.url;
    });
  };

  // 객실 사진 pool — 히어로 / 갤러리 / 와이드가 같이 쓴다.
  //   interior → thumbnail → exterior 순, URL 중복 제거.
  // ⚠️ 평면도는 섞이지 않는다 (`getRoomtypeImages` 가 category 로 거른다).
  RoomMapper.prototype.getRoomImages = function (rt) {
    var self = this;
    var seen = {};
    var pool = [];
    // 인테리어가 먼저다 — 원본 히어로는 객실 사진(인테리어) 순서로 돈다.
    // 썸네일은 목록 카드용으로 따로 고른 컷이라 앞에 두면 히어로 첫 장이 원본과 달라진다.
    ['roomtype_interior', 'roomtype_thumbnail', 'roomtype_exterior'].forEach(function (category) {
      self.getRoomtypeImages(rt, category).forEach(function (img) {
        if (!img || !img.url || seen[img.url]) return;
        seen[img.url] = true;
        pool.push(img);
      });
    });
    return pool;
  };

  // MAPPER: 현재 객실 사진 → 히어로 슬라이더
  //
  // ⚠️ `pages.room[].hero.images` 가 있으면 그것을 우선 쓴다(업주가 고른 순서).
  //    비면 객실 사진 전체로 떨어진다 — 원본이 객실 사진을 전부 도는 구조다.
  RoomMapper.prototype.mapHero = function (rt) {
    var self = this;
    var section = this.getSection(rt);
    var hero = section.hero || {};
    var name = this.getRoomtypeName(rt);
    var room = this.findRoomById(rt.id);

    // ⚠️ 원본은 이 문구를 통째로 주석 처리해 뒀다(사진만 돈다).
    //    템플릿은 살려 두되 객실명이 없으면 setCopySlot 이 알아서 숨긴다.
    this.setCopySlot('[data-room-hero-title]', this.firstText(hero.title, name), true);
    this.setCopySlot(
      '[data-room-hero-description]',
      this.firstText(hero.description, this.formatRoomStructure(room)),
      true
    );

    var wrapper = document.querySelector('[data-room-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    var urls = this.blockImages(hero).map(function (img) {
      return img.url;
    });
    if (!urls.length) {
      urls = this.getRoomImages(rt).map(function (img) {
        return img.url;
      });
    }

    if (!urls.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, '객실 이미지');
      wrapper.appendChild(empty);
      return;
    }

    urls.forEach(function (url) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, url, '객실 이미지');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: 객실명 / 설명 / 순번 → `.title_box`
  //
  // ⚠️ `<em>` 의 `ROOM #1` 은 **목록 순번**이다(객실 id 가 아니다).
  //    `getRoomtypes()` 순서를 그대로 쓴다 — 헤더 메뉴·탭·카드와 같은 순서다.
  // ⚠️ 설명은 원본이 영문 장식 문구(`Place where … , {숙소 영문명}`)다.
  //    업주 입력(`pages.room[].hero.description` / `rooms[].description`)이 있으면
  //    그것을 쓰고, 없으면 원본과 같은 꼴을 숙소 영문명으로 만든다.
  RoomMapper.prototype.mapRoomInfo = function (rt) {
    var room = this.findRoomById(rt.id);
    var section = this.getSection(rt);

    var roomtypes = this.getRoomtypes();
    var index = 0;
    roomtypes.forEach(function (item, i) {
      if (String(item.id) === String(rt.id)) index = i;
    });
    this.setCopySlot('[data-room-index]', 'ROOM #' + (index + 1));

    this.setCopySlot('[data-room-name]', this.getRoomtypeName(rt));

    var nameEn = this.getPropertyNameEn();
    this.setCopySlot(
      '[data-room-description]',
      this.firstText(
        section.gallery && section.gallery.description,
        room && room.description,
        nameEn ? "Place where my family's precious happiness is filled,\n" + nameEn : ''
      ),
      true
    );
  };

  // MAPPER: 객실 사진 → `.room_img` (3칸 고정)
  //
  // 히어로에서 이미 쓴 사진과 겹쳐도 그대로 둔다 — 원본도 같은 사진을 다시 쓴다.
  RoomMapper.prototype.mapGallery = function (rt) {
    var self = this;
    var section = this.getSection(rt);

    // 원본이 고른 3칸(room_gallery:N) → pages.room gallery → 객실 사진
    var images = this.pickMarkedPhotos(rt && rt.images, 'room_gallery');
    if (!images.length) images = this.blockImages(section.gallery);
    if (!images.length) images = this.getRoomImages(rt);

    var list = document.querySelector('[data-room-gallery]');
    if (!list) return;
    list.innerHTML = '';

    var cards = images.slice(0, GALLERY_COUNT);
    var count = cards.length || GALLERY_COUNT;
    for (var i = 0; i < count; i++) {
      var li = document.createElement('li');
      self.setBackground(li, cards[i] && cards[i].url, '객실 이미지');
      list.appendChild(li);
    }
  };

  // MAPPER: rooms[] → 객실 정보 표 (PC / 모바일 2벌)
  //
  // ⚠️ 원본은 PC/모바일 표를 **따로** 둔다. 열 구성이 달라 하나로 합칠 수 없다 —
  //    모바일은 「평형」 열이 없고 객실명·유형을 `colspan=2` 로 늘린다.
  // ⚠️ 평형은 `rooms[].size`(㎡)를 평으로 환산해 노출한다. 원본 표기는 `30.00평` 이지만
  //    `toPyeong()` 은 소수 1자리(`19평`)로 만든다 — 다른 템플릿과 같은 규칙을 따른다.
  RoomMapper.prototype.mapTables = function (rt) {
    var room = this.findRoomById(rt.id);
    var name = this.getRoomtypeName(rt);
    var structure = this.formatRoomStructure(room);
    var base = room && room.baseOccupancy ? String(room.baseOccupancy) : '-';
    var max = room && room.maxOccupancy ? String(room.maxOccupancy) : '-';
    var pyeong = this.toPyeong(room && room.size) || '-';

    function cell(text, colspan, wrapSpan) {
      var td = document.createElement('td');
      if (colspan) td.setAttribute('colspan', String(colspan));
      if (wrapSpan) {
        var span = document.createElement('span');
        span.textContent = text;
        td.appendChild(span);
      } else {
        td.textContent = text;
      }
      return td;
    }

    document.querySelectorAll('[data-room-table-pc]').forEach(function (tbody) {
      tbody.innerHTML = '';
      var tr = document.createElement('tr');
      tr.appendChild(cell(name));
      tr.appendChild(cell(base));
      tr.appendChild(cell(max));
      tr.appendChild(cell(structure || '-'));
      tr.appendChild(cell(pyeong));
      tbody.appendChild(tr);
    });

    document.querySelectorAll('[data-room-table-m]').forEach(function (tbody) {
      tbody.innerHTML = '';
      var tr = document.createElement('tr');
      // ⚠️ 모바일 객실명 칸만 `<span>` 으로 한 겹 더 감싼다 — `.table_default td span`
      //    규칙이 폰트 크기를 따로 잡는다.
      tr.appendChild(cell(name, 2, true));
      tr.appendChild(cell(base));
      tr.appendChild(cell(max));
      tr.appendChild(cell(structure || '-', 2));
      tbody.appendChild(tr);
    });

    // 집기품목 — 없으면 `<ul>` 째 숨긴다(「집기품목 :」 만 남는 줄 방지)
    var amenities = (room && room.amenities) || [];
    var text = amenities
      .map(function (v) {
        return String(v || '').trim();
      })
      .filter(Boolean)
      .join(', ');

    document.querySelectorAll('[data-room-amenities]').forEach(function (ul) {
      ul.innerHTML = '';
      if (!text) {
        ul.style.display = 'none';
        return;
      }
      ul.style.display = '';
      var li = document.createElement('li');
      var strong = document.createElement('strong');
      strong.textContent = '집기품목';
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' : ' + text));
      ul.appendChild(li);
    });
  };

  // MAPPER: roomtype_floorplan → `.room_floorplan` (객실 평면도)
  //
  // ⚠️ **원본에는 이 영역이 없다** — 백오피스가 내려주는 표준 슬롯이라 템플릿이 추가한 것이다.
  // ⚠️ **없으면 영역째 숨긴다.** 평면도는 부가 정보라 없어도 페이지가 성립한다
  //    (배치도 = layout-map 의 본론이라 placeholder 를 세우는 것과 반대다).
  // ⚠️ **객실당 한 장만** 쓰고 일반 객실 사진으로 폴백하지 않는다 —
  //    평면도 자리에 인테리어 사진이 들어가면 잘못된 정보다.
  RoomMapper.prototype.mapFloorplan = function (rt) {
    var image = this.getRoomFloorplanImage(rt);
    var name = this.getRoomtypeName(rt);

    document.querySelectorAll('[data-room-floorplan]').forEach(function (host) {
      host.innerHTML = '';
      if (!image || !image.url) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var img = document.createElement('img');
      ImageHelpers.setImage(img, image.url, (name ? name + ' ' : '') + '평면도');
      host.appendChild(img);
    });
  };

  // MAPPER: 객실 외경 → `.wide_img`
  //
  // 외경이 있으면 그것을, 없으면 객실 사진의 **마지막 장**을 쓴다
  // (앞쪽은 히어로·갤러리가 이미 쓴다). 한 장도 없으면 영역째 숨긴다.
  RoomMapper.prototype.mapWideImage = function (rt) {
    var exterior = this.getRoomtypeImages(rt, 'roomtype_exterior').filter(function (img) {
      return img && img.url;
    });
    var url = exterior.length ? exterior[0].url : '';
    if (!url) {
      var pool = this.getRoomImages(rt);
      url = pool.length ? pool[pool.length - 1].url : '';
    }

    document.querySelectorAll('[data-room-wide-image]').forEach(function (el) {
      el.innerHTML = '';
      if (!url) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      var img = document.createElement('img');
      ImageHelpers.setImage(img, url, '객실 이미지');
      el.appendChild(img);
    });
  };

  RoomMapper.prototype.mapRoomPreview = function () {
    this.setCopySlot('[data-room-preview-title]', 'ROOM PREVIEW', true);
    this.renderRoomSlides('[data-room-preview-list]');
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new RoomMapper().initialize();
  });

  global.RoomMapper = RoomMapper;
})(window);
