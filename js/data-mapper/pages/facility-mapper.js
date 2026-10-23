(function (global) {
  'use strict';

  // 원본 `.special_img li` 는 2칸 고정이다.
  var GALLERY_COUNT = 2;

  function FacilityMapper() {
    BaseDataMapper.call(this);
  }
  FacilityMapper.prototype = Object.create(BaseDataMapper.prototype);
  FacilityMapper.prototype.constructor = FacilityMapper;

  FacilityMapper.prototype.mapPage = function () {
    var facilities = this.getFacilities();

    // 시설을 하나도 등록하지 않으면 이 페이지가 성립하지 않는다.
    // 헤더 SPECIAL 대메뉴도 header-footer-mapper 가 같은 기준으로 숨긴다.
    if (!facilities.length) {
      window.location.href = '404.html?from=facility';
      return;
    }

    var facility = this.getCurrentFacility(facilities);

    this.mapPropertyNames();
    this.mapHero(facility);
    this.mapTabs(facilities, facility);
    this.mapInfo(facilities, facility);
    this.mapGallery(facility);
    this.mapWideImage(facility);
    this.mapSpecialPreview();

    if (typeof window.initFacilitySwipers === 'function') window.initFacilitySwipers();
    if (window.TplAos) window.TplAos.refresh();
  };

  // URL 의 `?id=` 로 시설을 고른다. 없으면 첫 시설.
  FacilityMapper.prototype.getCurrentFacility = function (facilities) {
    var id = '';
    try {
      var params = new URLSearchParams(window.location.search);
      id = params.get('id') || params.get('facility_id') || '';
    } catch (e) {
      id = '';
    }
    if (id) {
      var found = facilities.filter(function (f) {
        return String(f.id) === String(id);
      })[0];
      if (found) return found;
    }
    return facilities[0];
  };

  // `pages.facility[]` 에서 이 시설의 블록을 찾는다 (id 매칭).
  FacilityMapper.prototype.getSection = function (facility) {
    var pages = this.getPages().facility || [];
    var entry = pages.filter(function (p) {
      return facility && String(p.id) === String(facility.id);
    })[0];
    return (entry && entry.sections && entry.sections[0]) || {};
  };

  FacilityMapper.prototype.blockImages = function (block) {
    return this.getSelectedImages((block && block.images) || []).filter(function (img) {
      return img && img.url;
    });
  };

  // 시설 사진 pool — `property.facilities[].images` 가 정본이고,
  // `pages.facility[].*.images` 가 있으면 앞에 붙인다. URL 중복은 제거한다.
  FacilityMapper.prototype.getFacilityImages = function (facility) {
    var section = this.getSection(facility);
    var pool = []
      .concat(this.blockImages(section.hero))
      .concat(this.blockImages(section.about))
      .concat(
        this.getSelectedImages(facility.images || []).filter(function (img) {
          return img && img.url;
        })
      );

    // 원본이 고른 컷의 마커 사본(special_card / special_gallery / special_wide)은 뺀다 —
    // 히어로는 원본 상세 히어로 순서 그대로 가야 한다
    var self = this;
    var seen = {};
    return pool.filter(function (img) {
      if (self.isMarkedPhoto(img)) return false;
      if (seen[img.url]) return false;
      seen[img.url] = true;
      return true;
    });
  };

  // MAPPER: 시설 사진 → 히어로 슬라이더
  //
  // ⚠️ 원본은 이 히어로의 문구를 통째로 주석 처리해 뒀다(사진만 돈다).
  //    템플릿은 살려 두되 값이 없으면 setCopySlot 이 알아서 숨긴다.
  FacilityMapper.prototype.mapHero = function (facility) {
    var self = this;
    var section = this.getSection(facility);
    var hero = section.hero || {};

    this.setCopySlot(
      '[data-facility-hero-title]',
      this.firstText(hero.title, facility.nameEn, facility.name),
      true
    );
    this.setCopySlot(
      '[data-facility-hero-description]',
      this.firstText(hero.description, facility.nameEn ? facility.name : ''),
      true
    );

    var wrapper = document.querySelector('[data-facility-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    var urls = this.getFacilityImages(facility).map(function (img) {
      return img.url;
    });

    if (!urls.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, '시설 이미지');
      wrapper.appendChild(empty);
      return;
    }

    urls.forEach(function (url) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, url, '시설 이미지');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: property.facilities[] → 시설 탭
  //
  // ⚠️ 탭은 `getFacilities()` 순서(displayOrder)를 쓴다 —
  //    헤더 SPECIAL 서브메뉴 / index 카드와 같은 순서여야 한다.
  FacilityMapper.prototype.mapTabs = function (facilities, current) {
    document.querySelectorAll('[data-facility-tabs]').forEach(function (container) {
      container.innerHTML = '';
      facilities.forEach(function (f) {
        var name = String(f.name || '').trim();
        if (!name) return;
        var li = document.createElement('li');
        if (String(f.id) === String(current.id)) li.className = 'on';
        var a = document.createElement('a');
        a.href = './facility.html?id=' + f.id;
        a.textContent = name;
        a.title = name; // 탭 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: 시설명 / 설명 / 순번 → `.title_box`
  //
  // ⚠️ `<em>` 의 `SPECIAL #1` 은 **목록 순번**이다(시설 id 가 아니다).
  // ⚠️ `.sub_title`(굵은 한 줄)과 `.sub_txt2`(본문)는 서로 다른 슬롯이다.
  //    원본은 짧은 표어 + 긴 설명으로 나눠 쓰는데 `facilities[]` 에는 필드가
  //    `description` 하나뿐이라, **빈 줄 기준 첫 문단을 표어**, 나머지를 본문으로 가른다.
  //    문단이 하나뿐이면 표어는 비우고 본문만 채운다.
  FacilityMapper.prototype.mapInfo = function (facilities, facility) {
    var section = this.getSection(facility);
    var about = section.about || {};

    var index = 0;
    facilities.forEach(function (f, i) {
      if (String(f.id) === String(facility.id)) index = i;
    });
    this.setCopySlot('[data-facility-index]', 'SPECIAL #' + (index + 1));

    this.setCopySlot(
      '[data-facility-name]',
      this.firstText(about.title, facility.name, facility.nameEn)
    );

    // description(소개문)과 usageGuide(이용안내)를 한 줄 띄워 **둘 다** 보여준다.
    // 예전에는 폴백이라 description 이 있으면 usageGuide 가 통째로 묻혔다 —
    // 이용 요금·시간·제약이 화면에서 사라졌다. 둘 다 비면 슬롯을 숨긴다.
    // (t-template-H · I · J 와 같은 방식)
    var facilityBody = this.cleanText(facility.description);
    var facilityGuide = this.cleanText(facility.usageGuide);
    var joined = facilityBody + (facilityBody && facilityGuide ? '\n\n' : '') + facilityGuide;
    var body = this.firstText(about.description, joined);
    var paragraphs = String(body || '')
      .split(/\n\s*\n/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);

    if (paragraphs.length > 1) {
      this.setCopySlot('[data-facility-subtitle]', paragraphs[0], true);
      this.setCopySlot('[data-facility-description]', paragraphs.slice(1).join('\n\n'), true);
    } else {
      this.setCopySlot('[data-facility-subtitle]', '');
      this.setCopySlot('[data-facility-description]', paragraphs[0] || '', true);
    }
  };

  // MAPPER: 시설 사진 → `.special_img` (2칸 고정)
  //
  // ⚠️ **시설 사진이 1장뿐이면 2칸을 통째로 뺀다.** 원본도 사진이 한 장인 시설
  //    (바다배펜션 special11)은 `.special_img` 를 주석 처리하고 `.wide_img` 한 장만 둔다.
  //    그대로 두면 같은 사진이 반쪽 칸 + 와이드로 두 번 나온다.
  FacilityMapper.prototype.mapGallery = function (facility) {
    var self = this;
    // 원본이 고른 2칸(special_gallery:N)이 1순위
    var marked = this.pickMarkedPhotos(facility && facility.images, 'special_gallery');
    var pool = this.getFacilityImages(facility);
    var images = marked.length ? marked : pool;

    var list = document.querySelector('[data-facility-gallery]');
    if (!list) return;
    list.innerHTML = '';

    var single = images.length === 1;
    if (list.parentNode) list.parentNode.style.display = single ? 'none' : '';
    if (single) return;

    var cards = images.slice(0, GALLERY_COUNT);
    var count = cards.length || GALLERY_COUNT;
    for (var i = 0; i < count; i++) {
      var li = document.createElement('li');
      self.setBackground(li, cards[i] && cards[i].url, '시설 이미지');
      list.appendChild(li);
    }
  };

  // MAPPER: 시설 사진 3번째 장 → `.wide_img`
  // 3장이 안 되면 마지막 장을 쓰고, 한 장도 없으면 영역째 숨긴다.
  FacilityMapper.prototype.mapWideImage = function (facility) {
    var images = this.getFacilityImages(facility);
    // 원본이 고른 와이드(special_wide)가 1순위
    var wide = this.pickMarkedPhotos(facility && facility.images, 'special_wide');
    var url = wide.length ? wide[0].url : images[GALLERY_COUNT] ? images[GALLERY_COUNT].url : '';
    if (!url && images.length) url = images[images.length - 1].url;

    document.querySelectorAll('[data-facility-wide-image]').forEach(function (el) {
      el.innerHTML = '';
      if (!url) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      var img = document.createElement('img');
      ImageHelpers.setImage(img, url, '시설 이미지');
      el.appendChild(img);
    });
  };

  FacilityMapper.prototype.mapSpecialPreview = function () {
    this.setCopySlot('[data-special-preview-title]', 'SPECIAL PREVIEW', true);
    this.renderFacilitySlides('[data-special-preview-list]');
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new FacilityMapper().initialize();
  });

  global.FacilityMapper = FacilityMapper;
})(window);
