(function (global) {
  'use strict';

  // 원본 `.main_about .bnr_list ul li` 는 `width:calc(25% - 20px)` **4칸 고정**이다.
  var ABOUT_CARD_COUNT = 4;
  // 원본 `.main_landscape .bnr_list ul li` 는 `width:calc(33.3% - 20px)` **3칸 고정**이다.
  var LANDSCAPE_CARD_COUNT = 3;

  // ── 랜딩 진입 판단 ─────────────────────────────────────────
  // index.html 진입을 landing.html 로 돌려야 하면 true. 쿼리 파라미터 없이 "어디서 왔는지(referrer)" 로 가른다.
  //   - 어드민 프리뷰 iframe → false (운영자가 "홈" 탭을 직접 볼 수 있어야 한다)
  //   - pages.landing.sections[0].enabled !== true → false (명시적으로 켠 경우만. 어드민 저장 시
  //     undefined 는 JSON 에서 키째 빠지므로, 누락을 '켜짐' 으로 보면 랜딩을 안 쓰는 숙소가 튕긴다)
  //   - 같은 사이트 안에서 넘어옴 → false (헤더/푸터 로고, 랜딩의 자기 자신 카드)
  //   - 랜딩 카드에 등록된 연결 숙소 도메인에서 넘어옴 → false (그 숙소 랜딩의 카드를 눌러 온 경우)
  //   - 그 외(주소 직접 입력·즐겨찾기·검색/외부 링크) → true
  function shouldEnterLanding(landingPage) {
    if (window.top !== window.self) return false;

    var section = landingPage && landingPage.sections && landingPage.sections[0];
    if (!section || section.enabled !== true) return false;

    return !isFromSameSite() && !isFromLinkedProperty(section);
  }

  function getReferrerUrl() {
    try {
      return document.referrer ? new URL(document.referrer) : null;
    } catch (e) {
      return null;
    }
  }

  function isFromSameSite() {
    var ref = getReferrerUrl();
    return !!ref && ref.origin === window.location.origin;
  }

  // 크로스 도메인 referrer 는 브라우저 기본 정책상 origin 만 오므로 호스트로만 비교한다 (www. 유무는 무시).
  function isFromLinkedProperty(section) {
    var ref = getReferrerUrl();
    if (!ref) return false;

    var refHost = normalizeHost(ref.host);
    return ((section && section.about) || []).some(function (card) {
      var domain = card && typeof card.domain === 'string' ? card.domain.trim() : '';
      if (!domain) return false;
      try {
        var url = new URL(/^https?:\/\//i.test(domain) ? domain : 'https://' + domain);
        return normalizeHost(url.host) === refHost;
      } catch (e) {
        return false;
      }
    });
  }

  // 랜딩으로 이동을 시작했으면 true. location.replace 는 즉시 페이지를 떠나지 않으므로,
  // 그 사이 다른 매핑(헤더 등)이 끝나며 부르는 __tplReveal 이 index 를 잠깐 드러내지 않게 막는 데 쓴다.
  var leavingToLanding = false;

  function goToLanding() {
    leavingToLanding = true;
    window.location.replace('landing.html');
  }

  function normalizeHost(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  }

  function IndexMapper() {
    BaseDataMapper.call(this);
  }
  IndexMapper.prototype = Object.create(BaseDataMapper.prototype);
  IndexMapper.prototype.constructor = IndexMapper;

  IndexMapper.prototype.mapPage = function () {
    if (this.maybeRedirectToLanding()) return;

    this.mapPropertyNames();
    this.mapSignatureVideo();
    this.mapHero();
    this.mapAbout();
    this.mapRooms();
    this.mapLandscape();
    this.mapSpecial();
    this.mapClosing();

    if (typeof window.initIndexSwipers === 'function') window.initIndexSwipers();
    if (window.TplAos) window.TplAos.refresh();
  };

  // 루트 가드: 랜딩 진입 대상이면 index.html 진입을 landing.html 로 되돌린다 (판단은 shouldEnterLanding).
  IndexMapper.prototype.maybeRedirectToLanding = function () {
    if (!shouldEnterLanding(this.getPages().landing)) return false;

    goToLanding();
    return true;
  };

  // 섹션 배정 — pages.index.sections[0] 의 블록 5개를 원본 섹션에 붙인다.
  //
  //   signature → .vimeoWrap        (히어로 **위** 영상 밴드 — mediaType==='video' 일 때만)
  //   hero      → .main_visual      (풀높이 슬라이더 + 가운데 텍스트)
  //   essence   → .main_about       (핵심 메시지 — 가로 4칸 + 우측 큰 사진)
  //   gallery   → .main_landscape   (Landscape — 가로 3칸 + 좌측 큰 사진)
  //   closing   → .main_special     (Special Preview — 제목 2줄, 카드는 facilities[])
  //
  // ⚠️ **영상 밴드는 히어로와 별개 영역이고 `signature` 를 받는다.**
  //    t-template-F 가 같은 `.vimeoWrap` 을 같은 방식으로 처리한다 — 크롤러가
  //    `.vimeoWrap video` 를 찾아 `signature.videos` 에 넣고 `mediaType` 을 `'video'` 로
  //    세팅한다. 영상이 없으면 `videos: []` / `mediaType: 'image'` 로 나간다.
  //    `mediaType` 은 image/video **택일**이라 게이트로 쓴다(참고값이 아니다).
  //
  // ⚠️ **원본 섹션은 7개인데 블록은 5개다.** 문구를 받을 블록이 없는 두 곳은
  //    원본 문구 자체가 숙소명을 끼운 형태라 `data-property-caption` 으로 유도한다.
  //      `.main_room`      `ROOM PREVIEW` / `{숙소명} 객실 안내`
  //      `.main_wide_bnr`  `Thank you for visit {영문 숙소명}` / `저희 {숙소명}에 …`
  //
  // ⚠️ 객실/시설 카드는 블록의 `images` 가 아니라 `customFields.roomtypes[]` /
  //    `property.facilities[]` 에서 온다. 헤더 서브메뉴·상세 페이지와 같은 소스·순서여야 한다.
  IndexMapper.prototype.getSection = function () {
    var page = this.getPages().index;
    return (page && page.sections && page.sections[0]) || {};
  };

  // 블록의 isSelected 이미지 목록
  IndexMapper.prototype.blockImages = function (key) {
    var block = this.getSection()[key] || {};
    return this.getSelectedImages(block.images || []).filter(function (img) {
      return img && img.url;
    });
  };

  // MAPPER: hero → .main_visual (+ .vimeoWrap 인트로 영상)
  //
  // 원본 문구는 `Welcome To` / 영문 숙소명 / 한 줄 설명 3단이다.
  // 제목이 비면 영문 숙소명 → 한글 숙소명 순으로 떨어뜨린다.
  //
  // ⚠️ 비어도 `.visual_txt` 를 숨기지 않는다. 화면 정중앙 고정이라 줄이 사라져도
  //    레이아웃이 흔들리지 않고, 사진만 남는 것이 원본에서도 정상 상태다.
  IndexMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var nameEn = this.getPropertyNameEn();

    this.setCopySlot(
      '[data-index-hero-title]',
      this.firstText(hero.title, nameEn, this.getPropertyName()),
      true
    );
    this.setCopySlot('[data-index-hero-description]', this.cleanText(hero.description), true);

    var wrapper = document.querySelector('[data-index-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    // hero 블록이 비면 숙소 대표 사진으로 폴백한다.
    // 히어로가 통째로 빈 화면이 되는 것보다 낫다.
    var urls = this.blockImages('hero').map(function (img) {
      return img.url;
    });

    if (!urls.length) {
      urls = this.getPropertyImagesByCategory('thumbnail')
        .concat(this.getPropertyImagesByCategory('exterior'))
        .map(function (img) {
          return img.url;
        })
        .filter(Boolean);
    }

    // 원본 슬라이드는 내용 없는 배경 <div> 다. 한 장도 없으면
    // 매핑 위치 안내용 placeholder 슬라이드를 한 장 세운다.
    if (!urls.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, 'Hero Image');
      wrapper.appendChild(empty);
      return;
    }

    urls.forEach(function (url) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, url, 'Hero Image');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: signature → `.vimeoWrap` (히어로 **위** 영상 밴드)
  //
  // ⚠️ **히어로가 아니라 `signature` 블록이다.** 히어로는 아래 `.main_visual` 슬라이더고,
  //    영상 밴드는 그 위에 따로 얹히는 별개 영역이다.
  //    t-template-F 가 같은 `.vimeoWrap` 을 같은 블록으로 처리한다.
  //
  // ⚠️ **`mediaType` 은 image/video 택일이라 게이트로 쓴다.**
  //    `'video'` 가 아니면 `videos[]` 에 값이 남아 있어도 노출하지 않는다.
  //
  // ⚠️ 영상이 없으면 `.vimeoWrap` 째 숨긴다. `<video>` 만 비워 두면 브라우저가
  //    빈 플레이어 박스(컨트롤 바)를 그려서 히어로 위에 검은 띠가 남는다
  //    (`.vimeoWrap` 에는 CSS 규칙이 하나도 없다).
  IndexMapper.prototype.mapSignatureVideo = function () {
    var signature = this.getSection().signature || {};
    var url =
      signature.mediaType === 'video' ? this.getFirstSelectedImage(signature.videos || []) : '';

    document.querySelectorAll('[data-index-hero-video-wrap]').forEach(function (wrap) {
      wrap.style.display = url ? '' : 'none';
    });

    document.querySelectorAll('[data-index-hero-video]').forEach(function (video) {
      if (!url) {
        video.removeAttribute('src');
        return;
      }
      if (video.getAttribute('src') === url) return; // 재실행 시 재생이 리셋되지 않도록
      video.src = url;
      // preload="none" 인 채로 autoplay 만 걸면 재생이 시작되지 않는 브라우저가 있다
      video.setAttribute('preload', 'metadata');
    });
  };

  // MAPPER: essence → .main_about (펜션 소개)
  //
  // 가로 4칸 + 우측 큰 사진 1장 = **이미지 5장**을 쓴다.
  //   images[0..3] → 가로 4칸,  images[4] → 우측 큰 사진
  // 4장뿐이면 큰 사진은 첫 장을 다시 쓴다(빈 칸으로 두면 코랄 사각형만 남는다).
  // 사진이 4장보다 적으면 있는 만큼만 만든다(빈 칸을 세우지 않는다).
  IndexMapper.prototype.mapAbout = function () {
    var self = this;
    var essence = this.getSection().essence || {};

    this.setCopySlot('[data-index-about-title]', this.firstText(essence.title, 'ABOUT'), true);
    this.setCopySlot('[data-index-about-description]', this.cleanText(essence.description), true);

    var images = this.blockImages('essence');

    var list = document.querySelector('[data-index-about-list]');
    if (list) {
      list.innerHTML = '';
      var cards = images.slice(0, ABOUT_CARD_COUNT);
      var count = cards.length || ABOUT_CARD_COUNT;
      for (var i = 0; i < count; i++) {
        var li = document.createElement('li');
        self.setBackground(li, cards[i] && cards[i].url, '소개 이미지');
        list.appendChild(li);
      }
    }

    var bannerUrl = images[ABOUT_CARD_COUNT] ? images[ABOUT_CARD_COUNT].url : '';
    if (!bannerUrl && images.length) bannerUrl = images[0].url;
    if (!bannerUrl) {
      var fallback = this.getPropertyImagesByCategory('exterior').concat(
        this.getPropertyImagesByCategory('thumbnail')
      );
      bannerUrl = fallback.length ? fallback[0].url : '';
    }
    document.querySelectorAll('[data-index-about-image]').forEach(function (el) {
      self.setBackground(el, bannerUrl, '소개 이미지');
    });
  };

  // MAPPER: signature + customFields.roomtypes[] → .main_room (Room Preview)
  //
  // 카드 제목은 getRoomMenuLabel() 이다 — 그룹이 있으면 그룹명, 없으면 객실명.
  // 링크도 getRoomMenuLink() 라 그룹이면 그 그룹의 첫 객실 상세로 간다.
  // (헤더 메뉴 / 객실 목록과 같은 규칙)
  // ⚠️ **문구를 받을 블록이 없다** — `signature` 는 영상 밴드가 가져갔다.
  //    원본 문구가 `ROOM PREVIEW` / `{숙소명} 객실 안내` 라 제목은 고정하고
  //    설명은 마크업의 `data-property-caption` 이 숙소명으로 만든다.
  IndexMapper.prototype.mapRooms = function () {
    this.setCopySlot('[data-index-room-title]', 'ROOM PREVIEW', true);
    this.renderRoomSlides('[data-index-room-list]');
  };

  // MAPPER: gallery → .main_landscape (주변 풍경)
  //
  // 가로 3칸 + 좌측 큰 사진 1장 = **이미지 4장**을 쓴다.
  //   images[0..2] → 가로 3칸,  images[3] → 좌측 큰 사진
  // 제목·설명이 둘 다 비면 섹션째 숨긴다(사진만 남은 400px 띠가 된다).
  IndexMapper.prototype.mapLandscape = function () {
    var self = this;
    var gallery = this.getSection().gallery || {};

    var title = this.firstText(gallery.title, 'LANDSCAPE');
    var description = this.cleanText(gallery.description);
    var images = this.blockImages('gallery');

    // 사진도 문구도 없으면 장식 아이콘만 남은 빈 띠가 된다
    document.querySelectorAll('[data-index-landscape-section]').forEach(function (el) {
      el.style.display = images.length || description ? '' : 'none';
    });
    if (!images.length && !description) return;

    this.setCopySlot('[data-index-landscape-title]', title, true);
    this.setCopySlot('[data-index-landscape-description]', description, true);

    var list = document.querySelector('[data-index-landscape-list]');
    if (list) {
      list.innerHTML = '';
      var cards = images.slice(0, LANDSCAPE_CARD_COUNT);
      var count = cards.length || LANDSCAPE_CARD_COUNT;
      for (var i = 0; i < count; i++) {
        var li = document.createElement('li');
        self.setBackground(li, cards[i] && cards[i].url, '풍경 이미지');
        list.appendChild(li);
      }
    }

    var bannerUrl = images[LANDSCAPE_CARD_COUNT] ? images[LANDSCAPE_CARD_COUNT].url : '';
    if (!bannerUrl && images.length) bannerUrl = images[0].url;
    if (!bannerUrl) {
      var fallback = this.getPropertyImagesByCategory('surrounding').concat(
        this.getPropertyImagesByCategory('exterior')
      );
      bannerUrl = fallback.length ? fallback[0].url : '';
    }
    document.querySelectorAll('[data-index-landscape-image]').forEach(function (el) {
      self.setBackground(el, bannerUrl, '풍경 이미지');
    });
  };

  // MAPPER: closing + property.facilities[] → .main_special (Special Preview)
  //
  // ⚠️ 카드 제목은 시설 **영문명**, 부제가 한글명이다(원본 그대로 — 객실 카드와 반대다).
  //    영문명이 없으면 한글명을 제목에 올리고 부제는 만들지 않는다.
  // ⚠️ 시설을 하나도 등록하지 않으면 섹션째 숨긴다 —
  //    헤더 SPECIAL 메뉴도 같은 조건으로 사라진다(header-footer-mapper.mapSpecialMenu).
  IndexMapper.prototype.mapSpecial = function () {
    var closing = this.getSection().closing || {};
    var facilities = this.getFacilities();

    document.querySelectorAll('[data-index-special-section]').forEach(function (el) {
      el.style.display = facilities.length ? '' : 'none';
    });
    if (!facilities.length) return;

    this.setCopySlot(
      '[data-index-special-title]',
      this.firstText(closing.title, 'SPECIAL PREVIEW'),
      true
    );
    this.setCopySlot('[data-index-special-description]', this.cleanText(closing.description), true);

    this.renderFacilitySlides('[data-index-special-list]');
  };

  // MAPPER: property.images → .main_wide_bnr (마무리 밴드 배경)
  //
  // 문구는 `data-property-caption` 이 숙소명에서 만든다(applyPropertyCaptions).
  // 배경만 여기서 채운다 — 외경 → 대표 → 히어로 첫 장 순으로 폴백한다.
  // ⚠️ 배경이 없으면 검은 막(`:after` opacity .5)만 남은 띠가 되므로 섹션째 숨긴다.
  IndexMapper.prototype.mapClosing = function () {
    var fallback = this.getPropertyImagesByCategory('exterior')
      .concat(this.getPropertyImagesByCategory('thumbnail'))
      .filter(function (img) {
        return img && img.url;
      });

    var url = fallback.length ? fallback[0].url : '';
    if (!url) {
      var heroImages = this.blockImages('hero');
      url = heroImages.length ? heroImages[0].url : '';
    }

    document.querySelectorAll('[data-index-closing-bg]').forEach(function (el) {
      if (!url) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      // 원본은 `repeat-y 50% 0 / cover` 다
      el.style.backgroundImage = 'url(' + url + ')';
      el.style.backgroundRepeat = 'repeat-y';
      el.style.backgroundPosition = '50% 0';
      el.style.backgroundSize = 'cover';
      el.classList.remove('empty-image-placeholder');
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new IndexMapper().initialize();
  });

  // 조기 랜딩 가드 — 매핑을 기다리지 않고 이 스크립트가 로드되자마자 랜딩 여부부터 판단한다.
  //   standalone 에서는 preview-handler 가 어드민 데이터를 2초 기다린 뒤에야 index 를 매핑하는데,
  //   그 사이 헤더 매핑이 렌더 게이트를 먼저 풀어 매핑 전 index(히어로 < > 화살표 등)가 보였다가
  //   랜딩으로 넘어갔다. 판단이 끝날 때까지 __tplReveal 을 붙잡아 둔다.
  //   - 랜딩 진입 대상(shouldEnterLanding) → 화면을 풀지 않고 곧장 landing.html. 이동 판단 뒤에 헤더 매핑이
  //     끝나며 노출을 요청해도 무시한다 (판단 = 노출 허용으로 보면 페이지를 떠나기 직전 index 가 비친다)
  //   - 그 외 → 붙잡아 둔 노출을 그대로 진행 (기존과 같은 화면. JSON 한 번 더 읽는 시간만큼 늦게 뜰 수 있다)
  //   - 네트워크 실패/지연 대비 3초 뒤에는 무조건 판단을 끝낸다 (head 의 렌더 게이트 타임아웃과 같은 값)
  //   iframe(어드민 프리뷰)·내부 이동은 JSON 을 읽기 전에 바로 건너뛴다 (어차피 랜딩으로 안 보낸다).
  (function earlyLandingGate() {
    if (window.top !== window.self) return;
    if (isFromSameSite()) return;

    var reveal = window.__tplReveal;
    var decided = false;
    var pending = false;

    function finish() {
      if (decided) return;
      decided = true;
      if (pending && reveal) reveal();
    }

    window.__tplReveal = function () {
      if (leavingToLanding) return; // 랜딩으로 떠나는 중 — 노출하지 않는다
      if (decided) {
        if (reveal) reveal();
      } else {
        pending = true;
      }
    };

    setTimeout(function () {
      pending = true;
      finish();
    }, 3000);

    fetch('standard-template-data.json?t=' + Date.now())
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var customFields =
          (data && data.homepage && data.homepage.customFields) ||
          (data && data.customFields) ||
          {};
        var landing = customFields.pages && customFields.pages.landing;
        if (!decided && shouldEnterLanding(landing)) {
          decided = true;
          goToLanding(); // 노출하지 않고 이동한다 (이후 들어오는 노출 요청은 무시)
          return;
        }
        finish();
      })
      .catch(finish);
  })();

  global.IndexMapper = IndexMapper;
})(window);
