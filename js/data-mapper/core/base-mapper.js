(function (global) {
  'use strict';

  function BaseDataMapper() {
    this.data = null;
    this.isDataLoaded = false;
  }

  BaseDataMapper.prototype.initialize = function () {
    var self = this;
    var url = 'standard-template-data.json?t=' + Date.now();
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load standard-template-data.json');
        return res.json();
      })
      .then(function (json) {
        self.data = json;
        self.isDataLoaded = true;
        self.mapPage();
        if (window.__tplReveal) window.__tplReveal(); // 매핑 완료 → 화면 노출(페이드인)
      })
      .catch(function (err) {
        console.error('[BaseDataMapper] initialize error:', err);
        if (window.__tplReveal) window.__tplReveal(); // 실패해도 화면은 노출
      });
  };

  BaseDataMapper.prototype.mapPage = function () {};

  BaseDataMapper.prototype.updateData = function (newData) {
    this.data = newData;
    this.isDataLoaded = true;
    this.mapPage();
    if (window.__tplReveal) window.__tplReveal(); // 매핑 완료 → 화면 노출(페이드인)
  };

  // ── 데이터 접근 헬퍼 ──────────────────────────────────────
  // ── 백오피스 preview 판별 ────────────────────────────────
  // ⚠️ `window.previewHandler` 로 판별하면 안 된다.
  //    preview-handler.js 가 **로드되기만 하면 항상** 인스턴스를 만들기 때문에
  //    standalone 페이지에서도 늘 truthy 다.
  //    실제 preview 는 백오피스가 iframe 으로 띄운 상태다.
  BaseDataMapper.prototype.isPreviewMode = function () {
    try {
      return window.parent !== window;
    } catch (e) {
      // 크로스 오리진 접근이 막히면 iframe 안이라는 뜻이다
      return true;
    }
  };

  BaseDataMapper.prototype.getProperty = function () {
    return (this.data && this.data.property) || {};
  };

  BaseDataMapper.prototype.getHomepage = function () {
    return (this.data && this.data.homepage) || {};
  };

  BaseDataMapper.prototype.getCustomFields = function () {
    return this.getHomepage().customFields || {};
  };

  // customFields.roomtypes (localhost / preview 경로 모두 대응)
  // 객실 목록의 단일 소스. rooms[] 는 roomtypes[i].id === rooms[j].id 매칭으로
  // 인원/평형/집기 등 상세값을 조회할 때만 쓴다.
  BaseDataMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  BaseDataMapper.prototype.getPages = function () {
    // localhost 경로: this.data.homepage.customFields.pages
    var pagesFromHomepage = this.getCustomFields().pages;
    if (pagesFromHomepage && Object.keys(pagesFromHomepage).length > 0) {
      return pagesFromHomepage;
    }

    // preview 경로: this.data.customFields.pages
    if (this.data && this.data.customFields && this.data.customFields.pages) {
      return this.data.customFields.pages;
    }

    return {};
  };

  // customFields.property.name 우선, 없으면 property.name
  BaseDataMapper.prototype.getPropertyName = function () {
    var cf = this.getCustomFields();
    if (cf.property && cf.property.name) return cf.property.name;
    return this.getProperty().name || '';
  };

  // customFields.property 영문명 우선, 없으면 property.nameEn
  BaseDataMapper.prototype.getPropertyNameEn = function () {
    var cf = this.getCustomFields();
    var cfProperty = cf.property || {};
    return this.firstText(
      cfProperty.propertyUnameEn,
      cfProperty.propertyunameen,
      cfProperty.propertyNameEn,
      cfProperty.propertynameen,
      cfProperty.nameEn,
      this.getProperty().nameEn
    );
  };

  // homepage.images[0].logo 중 isSelected인 URL
  BaseDataMapper.prototype.getLogo = function () {
    var hp = this.getHomepage();
    var images = hp.images;
    if (!images || !images[0] || !images[0].logo) return '';
    var logos = images[0].logo;
    var selected = logos.find(function (l) {
      return l.isSelected;
    });
    return selected ? selected.url : logos[0] ? logos[0].url : '';
  };

  // property.realtimeBookingId
  // realtimeBookingId 는 "실시간예약링크" 같은 플레이스홀더/설명 문구가 그대로 들어올 수 있다.
  // 그걸 href 로 쓰면 상대경로로 해석돼 404 페이지가 새 탭으로 열리므로,
  // 실제 URL 로 보일 때만 링크로 취급하고 그 외에는 '#!'(비활성) 로 처리한다.
  BaseDataMapper.prototype.getBookingUrl = function () {
    var raw = this.getProperty().realtimeBookingId;
    if (typeof raw !== 'string') return '#!';

    var v = raw.trim();
    if (!v || v === '#!') return '#!';

    if (/^https?:\/\//i.test(v)) return v; // http(s)://...
    if (/^\/\//.test(v)) return 'https:' + v; // //도메인/...

    // 프로토콜 없이 도메인만 들어온 경우(booking.example.com/abc)는 https 를 붙여준다
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]|$)/i.test(v)) return 'https://' + v;

    return '#!';
  };

  // ── 숙소 이미지 카테고리 ─────────────────────────────────
  // property.images[0] 은 카테고리 묶음이다 — thumbnail / exterior / surrounding / commonArea.
  // (객실 이미지처럼 images[].category 로 갈리지 않고 배열 키로 갈린다)
  BaseDataMapper.prototype.getPropertyImageSet = function () {
    var propImages = this.getProperty().images || [];
    return propImages[0] || {};
  };

  // ── 원본이 고른 컷 마커 ────────────────────────────────
  // 원본은 여러 자리에 사진을 손으로 골라 둔다(객실 3칸 · 외경 3칸 · 시설 카드 …).
  // 크롤러가 순서는 그대로 두고 그 컷을 **사본**으로 덧붙이며 description 에 마커를 남긴다
  // (D2 room_bnr · E2 room_gallery · A about_banner · I special_card 와 같은 규약).
  //   `{mark}` 또는 `{mark}:{N}` — N 은 그 자리의 칸 번호
  // 마커 사본은 그 자리 전용이라 일반 사진 목록(히어로 · 폴백 pool)에서는 뺀다.
  var PHOTO_MARKS = [
    'room_gallery', // 객실 상세 .room_img 3칸
    'view_card', // main LANDSCAPE 3칸
    'view_banner', // main 와이드
    'special_card', // index / facility 하단 SPECIAL 카드
    'special_gallery', // 시설 상세 .special_img 2칸
    'special_wide' // 시설 상세 와이드
  ];

  // img 의 마커 [이름, 번호]. 마커가 아니면 null
  BaseDataMapper.prototype.getPhotoMark = function (img) {
    var m = /^([a-z_]+)(?::(\d+))?$/.exec(String((img && img.description) || '').trim());
    if (!m || PHOTO_MARKS.indexOf(m[1]) < 0) return null;
    return [m[1], m[2] ? parseInt(m[2], 10) : 0];
  };

  BaseDataMapper.prototype.isMarkedPhoto = function (img) {
    return !!this.getPhotoMark(img);
  };

  // images 중 mark 가 붙은 선택된 사진을 칸 번호 순으로. 없으면 빈 배열 → 호출부가 종전 규칙으로 폴백
  BaseDataMapper.prototype.pickMarkedPhotos = function (images, mark) {
    var self = this;
    return this.getSelectedImages(images || [])
      .filter(function (img) {
        var m = self.getPhotoMark(img);
        return m && m[0] === mark && img.url;
      })
      .sort(function (a, b) {
        return self.getPhotoMark(a)[1] - self.getPhotoMark(b)[1];
      });
  };

  // 외경 마커 사진 — property.images[0].exterior(적재 후) 와 customFields.property.images(평탄형) 둘 다 본다
  BaseDataMapper.prototype.getMarkedExterior = function (mark) {
    var found = this.pickMarkedPhotos(this.getPropertyImageSet().exterior || [], mark);
    if (found.length) return found;
    var flat = ((this.getCustomFields().property || {}).images || []).filter(function (img) {
      return img && img.category === 'property_exterior';
    });
    return this.pickMarkedPhotos(flat, mark);
  };

  // isSelected + sortOrder 순. isSelected 가 하나도 없으면 카테고리 전체를 폴백으로 쓴다.
  // 원본이 고른 컷의 마커 사본은 뺀다 (getMarkedExterior 로만 읽는다).
  BaseDataMapper.prototype.getPropertyImagesByCategory = function (category) {
    var self = this;
    var list = (this.getPropertyImageSet()[category] || []).filter(function (img) {
      return !self.isMarkedPhoto(img);
    });
    var selected = this.getSelectedImages(list);
    return selected.length ? selected : list.slice();
  };

  // 카테고리 여러 개를 순서대로 훑어 첫 이미지를 고른다.
  // 숙소가 각 카테고리에 몇 장을 올릴지 알 수 없으므로 장수에 기대지 않는다.
  BaseDataMapper.prototype.pickPropertyImage = function (categories) {
    for (var i = 0; i < categories.length; i++) {
      var list = this.getPropertyImagesByCategory(categories[i]);
      if (list.length) return list[0];
    }
    return null;
  };

  // ── 이미지 헬퍼 ──────────────────────────────────────────
  // isSelected=true인 이미지를 sortOrder 순으로 반환
  BaseDataMapper.prototype.getSelectedImages = function (images) {
    if (!images || !images.length) return [];
    return images
      .filter(function (img) {
        return img.isSelected;
      })
      .sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
      });
  };

  // 첫 번째 isSelected 이미지의 URL
  BaseDataMapper.prototype.getFirstSelectedImage = function (images) {
    var list = this.getSelectedImages(images);
    return list.length ? list[0].url : '';
  };

  // 데이터 변환 (스네이크 케이스 → 카멜 케이스)
  BaseDataMapper.prototype.convertToCamelCase = function (obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.convertToCamelCase(obj[key]);
        return result;
      }, {});
    }
    return obj;
  };

  // 텍스트 이스케이프 + 줄바꿈(\n) → <br />
  BaseDataMapper.prototype.nl2br = function (text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');
  };

  // ── 숙소명이 들어가는 문장 ───────────────────────────────
  // [data-property-caption="{name}의 객실을 소개합니다."] 처럼 템플릿 문자열을 속성에 두고
  // {name} / {nameEn} 을 치환한다.
  //
  // HTML 에 <span data-property-name></span>의 객실을… 형태로 두면
  // prettier(htmlWhitespaceSensitivity: ignore)가 인라인 텍스트를 줄바꿈하면서
  // 조사 앞에 공백이 끼어 "펜션 의 객실을" 로 렌더된다. 그래서 문장 전체를 매퍼가 조립한다.
  BaseDataMapper.prototype.applyPropertyCaptions = function () {
    var name = this.getPropertyName();
    var nameEn = this.getPropertyNameEn();

    document.querySelectorAll('[data-property-caption]').forEach(function (el) {
      var tpl = el.getAttribute('data-property-caption') || '';
      el.innerHTML = tpl
        .replace(/\{name\}/g, name)
        .replace(/\{nameEn\}/g, nameEn)
        .replace(/\\n/g, '<br />');
    });
  };

  // ── 조사 선택 ───────────────────────────────────────────
  // 숙소명은 백오피스 입력값이라 받침 유무를 미리 알 수 없다.
  // "{name}을 소개합니다" 같은 문장에서 을/를, 이/가, 은/는, 와/과를 골라 준다.
  // 한글이 아닌 문자로 끝나면(영문/숫자) 받침 없는 쪽을 쓴다.
  BaseDataMapper.prototype.hasFinalConsonant = function (word) {
    var s = String(word || '').trim();
    if (!s) return false;
    var code = s.charCodeAt(s.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아님
    return (code - 0xac00) % 28 !== 0;
  };

  // withJosa('스테이', '을/를') → '스테이를'  /  withJosa('펜션', '을/를') → '펜션을'
  BaseDataMapper.prototype.withJosa = function (word, pair) {
    var s = this.cleanText(word);
    if (!s) return '';
    var parts = String(pair).split('/');
    return s + (this.hasFinalConsonant(s) ? parts[0] : parts[1]);
  };

  // ── 텍스트 정규화 ───────────────────────────────────────
  // 백오피스에서 빈 값이 공백 한 칸(' ')으로 내려오는 경우가 흔하다.
  // 그대로 두면 truthy 라서 폴백이 동작하지 않으므로, 공백만 있는 값은 '' 로 본다.
  BaseDataMapper.prototype.cleanText = function (value) {
    if (value === undefined || value === null) return '';
    var s = String(value).trim();
    return s;
  };

  // 앞에서부터 비어있지 않은 첫 값을 고른다 (폴백 체인)
  BaseDataMapper.prototype.firstText = function () {
    for (var i = 0; i < arguments.length; i++) {
      var s = this.cleanText(arguments[i]);
      if (s) return s;
    }
    return '';
  };

  // ── 객실 공용 유틸 ──────────────────────────────────────
  // index / layout-map / room 세 페이지가 같은 구조 문자열을 쓴다.

  // totalRoomCount 키 → 한글 라벨 (값이 1 이상인 항목만 나열)
  // ⚠️ **선언 순서가 곧 노출 순서다.** 원본 두 사이트 모두
  //    `침대룸 → 온돌룸 → 거실 → 주방 → 화장실` 로 고정이다.
  //      hillstay: `독채형/분리형/복층형/ 침대룸2 거실 주방 화장실2`
  //      milagro : `원룸형/ 침대룸6 온돌룸2 주방8 화장실8`
  //    J 의 순서(침대룸/화장실/거실/주방)를 그대로 두면 안 된다.
  BaseDataMapper.prototype.ROOM_COUNT_LABELS = {
    bedroom: '침대룸',
    ondol: '온돌룸',
    livingRoom: '거실',
    kitchen: '주방',
    bathroom: '화장실'
  };

  // roomtypes[i].id === rooms[j].id 매칭으로 상세 객실 정보를 조회
  BaseDataMapper.prototype.findRoomById = function (id) {
    var rooms = (this.data && this.data.rooms) || [];
    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i].id === id) return rooms[i];
    }
    return null;
  };

  // 객실명. roomtypes[i] 에 name 이 없는 응답이 흔하므로
  // 같은 id 의 rooms[j].name 으로 폴백한다 (동일 엔티티).
  BaseDataMapper.prototype.getRoomtypeName = function (roomtype) {
    if (!roomtype) return '';
    var room = this.findRoomById(roomtype.id);
    return this.firstText(roomtype.name, room && room.name);
  };

  // 객실 메뉴/미리보기 그룹 규칙.
  // roomtypes[].groupName 이 하나라도 있으면 groupName 을 메뉴명으로 쓰고,
  // 같은 그룹의 첫 번째 객실 id 로 상세 페이지에 진입한다.
  BaseDataMapper.prototype.getRoomGroupName = function (roomtype) {
    return this.firstText(roomtype && roomtype.groupName);
  };

  BaseDataMapper.prototype.hasRoomGroups = function (roomtypes) {
    var self = this;
    return (roomtypes || []).some(function (rt) {
      return !!self.getRoomGroupName(rt);
    });
  };

  BaseDataMapper.prototype.getRoomMenuItems = function () {
    var self = this;
    var roomtypes = this.getRoomtypes();
    if (!this.hasRoomGroups(roomtypes)) {
      return roomtypes.map(function (rt) {
        return { label: self.getRoomtypeName(rt), roomtype: rt, roomtypes: [rt] };
      });
    }

    var seen = {};
    var items = [];
    roomtypes.forEach(function (rt) {
      var groupName = self.getRoomGroupName(rt);
      // 그룹 숙소에서는 미그룹 객실을 메뉴에 내지 않는다.
      // 원본 헤더가 그룹만 노출하고, 미그룹 객실은 목록 / Room Preview 로만 도달한다.
      // (Room Preview 는 roomtypes[] 전체를 그리므로 영향 없다)
      if (!groupName) return;

      var label = groupName || self.getRoomtypeName(rt);
      if (!String(label).trim()) return;

      var key = groupName ? 'group:' + groupName : 'room:' + rt.id;
      if (!seen[key]) {
        seen[key] = { label: label, groupName: groupName, roomtype: rt, roomtypes: [rt] };
        items.push(seen[key]);
      } else {
        seen[key].roomtypes.push(rt);
      }
    });
    return items;
  };

  BaseDataMapper.prototype.getRoomMenuLabel = function (item) {
    return (item && item.label) || '';
  };

  BaseDataMapper.prototype.getRoomMenuRoomtype = function (item) {
    return (item && item.roomtype) || item;
  };

  BaseDataMapper.prototype.getRoomMenuLink = function (item) {
    var roomtype = this.getRoomMenuRoomtype(item);
    return './room.html?room_id=' + (roomtype && roomtype.id);
  };

  // ── 객실 미리보기(layout-map) 사용 여부 ──────────────────
  // layout-map.html 이 404 로 보내는 기준과 같아야 한다.
  // 섹션이 없거나 enabled=false 면 그 페이지는 열리지 않는다.
  BaseDataMapper.prototype.isLayoutMapEnabled = function () {
    var page = this.getPages().layoutMap;
    var section = page && page.sections && page.sections[0];
    return Boolean(section) && section.enabled !== false;
  };

  // 대메뉴 ROOMS 가 갈 곳.
  //   미리보기 켜짐 → layout-map.html (객실 목록·배치도)
  //   미리보기 꺼짐 → 첫 번째 객실 상세 (헤더 객실 메뉴의 첫 항목과 같은 곳)
  // 객실이 하나도 없으면 갈 곳이 없으므로 null — 호출부가 원래 href 를 둔다.
  BaseDataMapper.prototype.getRoomsEntryLink = function () {
    if (this.isLayoutMapEnabled()) return './layout-map.html';
    var self = this;
    var link = null;
    this.getRoomMenuItems().some(function (item) {
      if (!String(self.getRoomMenuLabel(item)).trim()) return false;
      link = self.getRoomMenuLink(item);
      return true;
    });
    return link;
  };

  // 이 메뉴 항목이 현재 객실을 담고 있는가.
  // 그룹 항목이면 **멤버 전체**를 본다 — 그룹의 두 번째 객실로 들어와도 그 그룹이 활성이다.
  BaseDataMapper.prototype.isRoomMenuItemActive = function (item, currentId) {
    if (!item || currentId === undefined || currentId === null || currentId === '') return false;
    var target = String(currentId);
    return (item.roomtypes || []).some(function (rt) {
      return rt && String(rt.id) === target;
    });
  };

  // "원룸형/ 침대룸 화장실 주방" 형태의 구조 문자열
  BaseDataMapper.prototype.formatRoomStructure = function (room) {
    if (!room) return '';
    var labels = this.ROOM_COUNT_LABELS;
    var counts = room.totalRoomCount || {};
    // ⚠️ 개수가 2 이상이면 라벨 뒤에 숫자를 붙인다 — 원본 그대로다.
    //    `침대룸2 거실 주방 화장실2` / `침대룸6 온돌룸2 주방8 화장실8`
    //    1개면 숫자를 붙이지 않는다 (`침대룸 거실 주방 화장실`).
    var parts = Object.keys(labels)
      .filter(function (key) {
        return Number(counts[key]) >= 1;
      })
      .map(function (key) {
        var n = Number(counts[key]);
        return n >= 2 ? labels[key] + n : labels[key];
      });

    var structure = (room.roomStructures && room.roomStructures[0]) || '';
    if (!structure && !parts.length) return '';
    if (!parts.length) return structure;
    if (!structure) return parts.join(' ');
    return structure + '/ ' + parts.join(' ');
  };

  // rooms[].size 는 제곱미터(㎡). 화면에는 평으로 환산해 노출한다.
  // 1평 = 3.305785㎡, 소수 1자리. 예) 62.81㎡ → "19평"
  BaseDataMapper.prototype.toPyeong = function (sqm) {
    var n = Number(sqm);
    if (!n || isNaN(n)) return '';
    return Math.round((n / 3.305785) * 10) / 10 + '평';
  };

  // roomtypes[i].images 중 특정 category 만 isSelected + sortOrder 순으로 반환
  // category 예) 'roomtype_thumbnail' | 'roomtype_interior' | 'roomtype_exterior'
  // 마커 사본(room_gallery:N)은 뺀다 — pickMarkedPhotos 로만 읽는다.
  BaseDataMapper.prototype.getRoomtypeImages = function (roomtype, category) {
    var self = this;
    var images = (roomtype && roomtype.images) || [];
    var filtered = images.filter(function (img) {
      return img.category === category && !self.isMarkedPhoto(img);
    });
    var selected = this.getSelectedImages(filtered);
    // isSelected 가 하나도 없으면 카테고리 전체를 sortOrder 순으로 폴백
    if (selected.length) return selected;
    return filtered.slice().sort(function (a, b) {
      return a.sortOrder - b.sortOrder;
    });
  };

  // 객실 평면도 소스.
  // 크롤러가 원본 객실 상세의 평면도 영역에서 이미지를 찾았을 때만 이 필드/카테고리를 채운다.
  BaseDataMapper.prototype.getRoomFloorplanImages = function (roomtype) {
    if (!roomtype) return [];

    var direct =
      roomtype.floorplanImages ||
      roomtype.floorplans ||
      (roomtype.floorplan && roomtype.floorplan.images) ||
      [];
    if (direct && !Array.isArray(direct)) direct = [direct];

    var selectedDirect = this.getSelectedImages(direct);
    if (direct.length) return selectedDirect.length ? selectedDirect : direct;

    var images = roomtype.images || [];
    var filtered = images.filter(function (img) {
      return /^(roomtype_)?floorplan$|^room_floorplan$|^floor_plan$/i.test(img.category || '');
    });
    var selected = this.getSelectedImages(filtered);
    return selected.length ? selected : filtered.slice();
  };

  BaseDataMapper.prototype.getRoomFloorplanImage = function (roomtype) {
    var images = this.getRoomFloorplanImages(roomtype);
    return images.length ? images[0] : null;
  };

  // ── 배경 이미지 유틸 ────────────────────────────────────
  // url 이 있으면 cover 배경, 없으면 매핑 위치 안내용 placeholder
  BaseDataMapper.prototype.setBackground = function (el, url, label) {
    if (!el) return;
    if (url) {
      el.style.backgroundImage = 'url(' + url + ')';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.backgroundSize = 'cover';
      el.classList.remove('empty-image-placeholder');
    } else {
      ImageHelpers.applyBackgroundPlaceholder(el, label);
    }
  };

  // ── 객실 썸네일 URL ─────────────────────────────────────
  // thumbnail 우선, 없으면 interior 첫 장으로 폴백
  BaseDataMapper.prototype.getRoomThumbUrl = function (roomtype) {
    var thumbs = this.getRoomtypeImages(roomtype, 'roomtype_thumbnail');
    if (thumbs.length && thumbs[0].url) return thumbs[0].url;
    var interiors = this.getRoomtypeImages(roomtype, 'roomtype_interior');
    return interiors.length ? interiors[0].url : '';
  };

  // ── 공용 텍스트 슬롯 ────────────────────────────────────
  // 값이 없으면 요소째 숨긴다. 빈 <h3>/<p> 를 남기면 원본 여백(`.title_box` 는
  // 위아래 100px 이 넘는다) 때문에 문구 없는 빈 띠가 들어간다.
  BaseDataMapper.prototype.setCopySlot = function (selector, value, asHtml) {
    var self = this;
    document.querySelectorAll(selector).forEach(function (el) {
      if (!value) {
        el.textContent = '';
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      if (asHtml) el.innerHTML = self.nl2br(value);
      else el.textContent = value;
    });
  };

  // [data-property-name] / [data-property-name-en] / [data-property-caption] 일괄 처리
  BaseDataMapper.prototype.mapPropertyNames = function () {
    var nameEn = this.getPropertyNameEn();
    var name = this.getPropertyName();
    document.querySelectorAll('[data-property-name-en]').forEach(function (el) {
      if (el.classList.contains('logo_text')) return; // 로고는 header-footer-mapper 몫
      el.textContent = nameEn;
    });
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      if (el.classList.contains('logo_sub')) return;
      el.textContent = name;
    });
    this.applyPropertyCaptions();
  };

  // ── 객실 탭 공용 렌더러 ──────────────────────────────────
  // layout-map(목록) / room(상세) 상단의 `.sub_cate_wrap ul` 이 같은 목록을 쓴다.
  //
  // ⚠️ **Swiper 가 아니다.** 원본 `.sub_cate_wrap ul li` 는 `inline-block` 이고
  //    폭을 넘으면 그냥 줄바꿈된다. PET/K 처럼 `.swiper-slide` 를 붙이면 안 된다.
  //
  // 원본 마크업:
  //   ul > li[.on] > a
  // 첫 칸(「미리보기」 = 목록으로 가는 링크)은 마크업에 정적으로 두고, 그 뒤에 객실을 만든다.
  //
  // ── 그룹(`roomtypes[].groupName`) 규칙 ───────────────────
  // 헤더 메뉴와 객실 카드는 **그룹 단위**로 접힌다(그룹명 하나 → 그룹의 첫 객실 상세).
  // 그러면 그룹 안 두 번째 객실부터는 도달할 경로가 없어지므로, **탭이 그 통로가 된다.**
  //
  //   목록(layout-map)  →  미리보기 | 스파동 | 프리미엄동          (그룹 단위)
  //   스파동 클릭 → 첫 객실 →  미리보기 | 에버골드 | 퍼블하제 | 유메  (그룹 멤버 전개)
  //
  // 멤버가 1실인 그룹은 펼치지 않는다 — 항목이 하나뿐이라 그룹명 그대로가 낫다.
  // `groupName` 이 없으면 객실 하나가 항목 하나다(전개할 것이 없다).
  //
  // activeRoomtypeId 가 있으면 그 탭에 `.on`, 없으면 첫 칸(목록)에 `.on` 을 준다.
  BaseDataMapper.prototype.renderRoomTabs = function (selector, activeRoomtypeId) {
    var self = this;
    // ⚠️ `String(null)` 은 `'null'`(truthy)이다. null/undefined/'' 를 모두 "활성 없음"으로 본다.
    var activeId =
      activeRoomtypeId === undefined || activeRoomtypeId === null || activeRoomtypeId === ''
        ? null
        : String(activeRoomtypeId);

    var tabItems = this.getRoomTabItems(activeId);

    document.querySelectorAll(selector).forEach(function (container) {
      // 이전 생성분 제거 (preview 재렌더 대비)
      container.querySelectorAll('[data-generated="room-tab"]').forEach(function (li) {
        li.remove();
      });

      // 첫 칸은 「미리보기」(layout-map) 다. 미리보기가 꺼져 있으면 눌러도 404 이므로 숨긴다.
      var firstTab = container.querySelector('li');
      if (firstTab) {
        firstTab.classList.toggle('on', !activeId);
        firstTab.style.display = self.isLayoutMapEnabled() ? '' : 'none';
      }

      tabItems.forEach(function (item) {
        var name = self.getRoomMenuLabel(item);
        if (!String(name).trim()) return;

        var li = document.createElement('li');
        li.setAttribute('data-generated', 'room-tab');
        if (self.isRoomMenuItemActive(item, activeId)) li.classList.add('on');

        var a = document.createElement('a');
        a.href = self.getRoomMenuLink(item);
        a.textContent = name;
        a.title = name; // 탭 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // 탭에 세울 항목. 현재 객실이 **멤버 2실 이상인 그룹**에 속하면 그 그룹을 객실 단위로 펼친다.
  BaseDataMapper.prototype.getRoomTabItems = function (activeId) {
    var self = this;
    var items = this.getRoomMenuItems();
    if (!activeId) return items;

    var activeGroup = null;
    items.forEach(function (item) {
      var members = (item && item.roomtypes) || [];
      if (members.length > 1 && self.isRoomMenuItemActive(item, activeId)) activeGroup = item;
    });
    if (!activeGroup) return items;

    return activeGroup.roomtypes.map(function (rt) {
      return { label: self.getRoomtypeName(rt), roomtype: rt, roomtypes: [rt] };
    });
  };

  // ── 카드 공용 렌더러 ────────────────────────────────────
  // index / layout-map / room / facility 가 **완전히 같은 카드 마크업**을 쓴다.
  //   .swiper-slide > a.link(카드 전체 덮개)
  //                 + .img_box(배경 그 자체 — 안쪽 div 가 없다)
  //                 + .txt_box > div > strong + p + a.btn_more
  //
  // ⚠️ `.img_box` 는 `padding-bottom:100%` 로 정사각 비율을 잡는다. 높이를 주면 안 된다.
  // ⚠️ hover 하면 `.img_box` 라운드가 펴지고 어두운 막이 올라오면서
  //    `.txt_box` 가 카드 가운데로 떠오른다. 전부 CSS 몫이다.
  // ⚠️ 원본 `.btn_more` 는 `href="#"` 다(카드 전체를 덮는 `.link` 가 이동을 맡는다).
  //    그대로 두면 클릭 시 페이지 맨 위로 튀므로 같은 상세 링크를 넣었다.
  BaseDataMapper.prototype.buildPreviewCard = function (opts) {
    var slide = document.createElement('div');
    slide.className = 'swiper-slide';

    var link = document.createElement('a');
    link.className = 'link';
    link.href = opts.href;
    link.title = opts.title || '';
    slide.appendChild(link);

    var imgBox = document.createElement('div');
    imgBox.className = 'img_box';
    this.setBackground(imgBox, opts.imageUrl, opts.placeholder);
    slide.appendChild(imgBox);

    var txtBox = document.createElement('div');
    txtBox.className = 'txt_box';
    var inner = document.createElement('div');

    var strong = document.createElement('strong');
    strong.textContent = opts.title || '';
    inner.appendChild(strong);

    // 부제가 없으면 <p> 를 만들지 않는다 — 빈 줄만큼 여백이 생긴다
    if (opts.subtitle) {
      var p = document.createElement('p');
      p.textContent = opts.subtitle;
      inner.appendChild(p);
    }

    var more = document.createElement('a');
    more.className = 'btn_more';
    more.href = opts.href;
    more.textContent = 'VIEW MORE';
    inner.appendChild(more);

    txtBox.appendChild(inner);
    slide.appendChild(txtBox);
    return slide;
  };

  // 객실 카드 슬라이더 — index `.main_room` / layout-map / room 하단이 공유한다.
  //
  // 카드 제목은 getRoomMenuLabel() 이다 — 그룹이 있으면 그룹명, 없으면 객실명.
  // 링크도 getRoomMenuLink() 라 그룹이면 그 그룹의 첫 객실 상세로 간다.
  BaseDataMapper.prototype.renderRoomSlides = function (selector) {
    var self = this;
    document.querySelectorAll(selector).forEach(function (wrapper) {
      wrapper.innerHTML = '';
      // Room Preview 카드는 groupName 과 무관하게 **항상 전체 객실**을 깐다.
      // 그룹으로 접히는 곳은 헤더 ROOMS 메뉴와 객실 상세 탭뿐이고,
      // 카드는 저마다 자기 객실 상세로 연결한다.
      self.getRoomtypes().forEach(function (rt) {
        // 원본이 내려둔 객실은 카드도 내지 않는다 — 그룹도 없고 사진도 없으면 보여줄 게 없다.
        // 크롤러가 이름·사진을 못 읽은 경우는 groupName 이 남아 있어 여기서 걸리지 않는다.
        if (rt && !self.getRoomGroupName(rt) && !(rt.images || []).length) return;

        var name = self.getRoomtypeName(rt);
        if (!String(name).trim() || !rt) return;

        wrapper.appendChild(
          self.buildPreviewCard({
            href: './room.html?room_id=' + rt.id,
            title: name,
            subtitle: self.formatRoomStructure(self.findRoomById(rt.id)),
            imageUrl: self.getRoomThumbUrl(rt),
            placeholder: '객실 이미지'
          })
        );
      });
    });
  };

  // 부대시설 카드 슬라이더 — index `.main_special` / facility 하단이 공유한다.
  //
  // ⚠️ 카드 제목은 시설 **영문명**, 부제가 한글명이다(원본 그대로 — 객실 카드와 반대다).
  //    영문명이 없으면 한글명을 제목에 올리고 부제는 만들지 않는다.
  BaseDataMapper.prototype.renderFacilitySlides = function (selector) {
    var self = this;
    var facilities = this.getFacilities();

    document.querySelectorAll(selector).forEach(function (wrapper) {
      wrapper.innerHTML = '';
      facilities.forEach(function (facility) {
        // 원본 카드 컷(special_card) → 마커 아닌 시설 사진 첫 장
        var card = self.pickMarkedPhotos(facility.images, 'special_card');
        var images = card.length
          ? card
          : self.getSelectedImages(facility.images || []).filter(function (img) {
              return img && img.url && !self.isMarkedPhoto(img);
            });
        var nameEn = self.cleanText(facility.nameEn);
        var name = self.cleanText(facility.name);
        if (!nameEn && !name) return;

        wrapper.appendChild(
          self.buildPreviewCard({
            href: './facility.html?id=' + facility.id,
            title: nameEn || name,
            subtitle: nameEn ? name : '',
            imageUrl: images.length ? images[0].url : '',
            placeholder: '시설 이미지'
          })
        );
      });
    });
  };

  // ── 부대시설 목록 ───────────────────────────────────────
  // displayOrder 는 문자열('0','1','2','4'…)로 내려오고 결번도 있다.
  // 숫자로 변환해 정렬하고, 값이 없는 항목은 뒤로 보낸다.
  // 헤더 서브메뉴 / index 카드 / facility 탭이 모두 이 순서를 쓴다.
  BaseDataMapper.prototype.getFacilities = function () {
    var list = (this.getProperty().facilities || []).slice();
    return list.sort(function (a, b) {
      var x = Number(a && a.displayOrder);
      var y = Number(b && b.displayOrder);
      if (isNaN(x) && isNaN(y)) return 0;
      if (isNaN(x)) return 1;
      if (isNaN(y)) return -1;
      return x - y;
    });
  };

  // ── 연락처 정규화 ────────────────────────────────────────
  // BFF의 property.contactPhone 은 문자열 배열(string[])로 내려온다.
  // 배포 시점 차이로 문자열/누락도 들어올 수 있으므로 셋 다 허용해 문자열 배열로 정규화한다.
  // 계약 타입(총판A/총판B/판매대행) 분기는 BFF가 판단하므로 템플릿은 받은 배열을 그대로 렌더링한다.
  BaseDataMapper.prototype.toPhoneList = function (value) {
    var fallbackPhone = '1833-9306';
    var list = [];
    if (Array.isArray(value)) {
      list = value.filter(function (v) {
        return typeof v === 'string' && v.trim();
      });
    } else if (typeof value === 'string' && value.trim()) {
      list = [value];
    }
    return list.length > 0 ? list : [fallbackPhone];
  };

  // ── SEO 메타태그 업데이트 ──────────────────────────────────────
  BaseDataMapper.prototype.updateMetaTags = function (pageSEO) {
    var hp = this.getHomepage();
    var globalSEO = (hp && hp.seo) || {};
    var finalSEO = Object.assign({}, globalSEO, pageSEO || {});

    if (Object.keys(finalSEO).length > 0) {
      this.updateSEOInfo(finalSEO);
    }
  };

  BaseDataMapper.prototype.updateSEOInfo = function (seo) {
    if (!seo) return;

    // name 기반 meta 태그를 upsert (값 없으면 태그 생성 안 함 → 빈 태그 방지)
    function upsertMetaByName(name, content) {
      if (!content) return;
      var meta = document.head.querySelector('meta[name="' + name + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    }

    if (seo.title) {
      var titleEl =
        document.querySelector('title[data-page-title]') || document.querySelector('title');
      if (titleEl) titleEl.textContent = seo.title;
    }

    upsertMetaByName('description', seo.description);
    upsertMetaByName('keywords', seo.keywords);
    upsertMetaByName('naver-site-verification', seo.naverSiteVerification);
    upsertMetaByName('google-site-verification', seo.googleSiteVerification);
  };

  global.BaseDataMapper = BaseDataMapper;
})(window);
