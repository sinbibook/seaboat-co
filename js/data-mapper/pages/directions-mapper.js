(function (global) {
  'use strict';

  function DirectionsMapper() {
    BaseDataMapper.call(this);
  }
  DirectionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  DirectionsMapper.prototype.constructor = DirectionsMapper;

  // 섹션 배정 — pages.directions.sections[0] 은 `hero` + `notice` 다.
  //   hero.title   → 히어로 제목 (원본은 `location`)
  //   hero.images  → 히어로 배경
  //   notice       → `.map_wrap dl` 3번째 줄 (대중교통)
  //
  // ⚠️ `hero` 에 `description` 필드가 **없다**(스키마상 title/images 뿐).
  //    히어로 설명은 매퍼가 숙소명으로 만든다.
  DirectionsMapper.prototype.getSection = function () {
    var page = this.getPages().directions;
    return (page && page.sections && page.sections[0]) || {};
  };

  DirectionsMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapHero();
    this.mapInfo();
    this.mapKakaoMap();

    if (window.TplAos) window.TplAos.refresh();
  };

  // MAPPER: hero → 히어로 + `.title_box h3`
  //
  // ⚠️ 원본은 히어로 제목이 `location`(영문), 본문 제목이 `오시는길`(한글)로 서로 다르다.
  //    받을 필드가 하나뿐이라 히어로에만 쓰고 본문 제목은 고정값을 둔다.
  DirectionsMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-directions-hero-title]', this.firstText(hero.title, 'location'), true);
    this.setCopySlot(
      '[data-directions-hero-description]',
      name ? name + ' 오시는 길' : '오시는 길',
      true
    );
    this.setCopySlot('[data-directions-title]', '오시는길', true);

    var images = this.getSelectedImages(hero.images || []).filter(function (img) {
      return img && img.url;
    });
    var url = images.length ? images[0].url : '';
    if (!url) {
      var fallback = this.getPropertyImagesByCategory('exterior').concat(
        this.getPropertyImagesByCategory('thumbnail')
      );
      url = fallback.length ? fallback[0].url : '';
    }
    document.querySelectorAll('[data-directions-hero-bg]').forEach(function (el) {
      self.setBackground(el, url, '외경 이미지');
    });
  };

  // MAPPER: property.address / notice → `.map_wrap dl` 3줄
  //
  // ⚠️ 아이콘 3개가 줄 순서에 고정돼 있다(주소 / 네비게이션 / 대중교통).
  //    줄을 늘리거나 줄이면 아이콘 짝이 어긋나므로 3줄 고정으로 둔다.
  // ⚠️ 원본 주소 줄은 `도로명 주소` + `지번 주소` 2줄인데 지번은 받을 필드가 없다.
  //    한 줄만 둔다(라벨 없이 주소만) — `도로명 주소 :` 접두어를 붙이면
  //    지번이 빠진 것이 더 도드라진다.
  DirectionsMapper.prototype.mapInfo = function () {
    var prop = this.getProperty();
    var biz = prop.businessInfo || {};
    var address = this.firstText(prop.address, biz.businessAddress);

    this.setCopySlot('[data-directions-address]', address, true);
    this.setCopySlot('[data-directions-navigation]', address, true);

    var notice = this.getSection().notice || {};
    var transit = this.cleanText(notice.description);
    this.setCopySlot(
      '[data-directions-transit-title]',
      this.firstText(notice.title, '대중교통 이용시')
    );
    this.setCopySlot('[data-directions-transit]', transit, true);

    // 본문이 비면 아이콘만 남은 빈 줄이 되므로 `<dl>` 째 숨긴다
    document.querySelectorAll('[data-directions-transit-row]').forEach(function (el) {
      el.style.display = transit ? '' : 'none';
    });
  };

  // MAPPER: property.latitude / longitude → Kakao 지도
  //
  // ⚠️ 원본은 다음 「지도 퍼가기」 위젯(`root_daum_roughmap`)이라 사이트별 key 가
  //    마크업에 박혀 있다. 템플릿은 좌표로 그리는 Kakao SDK 로 바꿨다.
  DirectionsMapper.prototype.mapKakaoMap = function () {
    var self = this;
    var container = document.getElementById('kakao-map');
    if (!container) return;

    var prop = this.getProperty();
    var lat = Number(prop.latitude);
    var lng = Number(prop.longitude);

    // 좌표가 없어도 영역은 유지한다. 안을 비우면 빈 띠가 되어 페이지가 무너진 것처럼 보인다.
    // ⚠️ placeholder 는 지도 영역 비율(원본 위젯 1440×392)로 만든다 —
    //    기본 4:3 을 가로로 긴 띠에 cover 로 깔면 글씨가 잘려 보이지 않는다.
    // ⚠️ `#kakao-map` 의 높이는 CSS 가 준다(`styles/style.css` 「#kakao-map」).
    //    높이가 0 이면 이 placeholder 도, 실제 지도도 그려지지 않는다.
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      ImageHelpers.applyBackgroundPlaceholder(container, '지도', {
        width: 1440,
        height: 392,
        fontSize: 40
      });
      return;
    }
    container.classList.remove('empty-image-placeholder');
    container.style.backgroundImage = '';

    function createMap() {
      try {
        var position = new kakao.maps.LatLng(lat, lng);

        if (self._kakaoMap) {
          self._kakaoMap.setCenter(position);
          self._kakaoMap.relayout();
          if (self._kakaoMarker) self._kakaoMarker.setPosition(position);
          return;
        }

        self._kakaoMap = new kakao.maps.Map(container, { center: position, level: 4 });
        self._kakaoMarker = new kakao.maps.Marker({ position: position });
        self._kakaoMarker.setMap(self._kakaoMap);

        // 지도가 숨겨진 상태로 생성되면 크기를 0 으로 잡는다. 노출 후 다시 계산한다.
        window.addEventListener('resize', function () {
          if (!self._kakaoMap) return;
          self._kakaoMap.relayout();
          self._kakaoMap.setCenter(position);
        });
      } catch (e) {
        console.error('[directions] kakao map init failed:', e);
      }
    }

    if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
      window.kakao.maps.load(createMap);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new DirectionsMapper().initialize();
  });

  global.DirectionsMapper = DirectionsMapper;
})(window);
