/* ============================================================
   common.js — 전 페이지 공통 스크립트
   원본 남양주제이펜션.com `/js/custom.js` 의 UI 동작을 옮긴 것.
   (대조: bomps.co.kr — 두 파일은 공백 한 줄 빼고 완전히 같다)

   - PC 상단 메뉴(#hd_lnb) hover 로 `.depth_box` 전부 + `.hd_lnb_bg` 동시 열기
   - 모바일 사이드 메뉴(.aside) 열고 닫기 + `.depth_list` 아코디언
   - 히어로 `.scroll_down` 흔들림 + 클릭 스크롤
   - 히어로 재생/일시정지(`#play` / `#stop`)
   - TOP 버튼

   ⚠️ **원본에는 스크롤 헤더 반전이 없다.** `.header` 는 `position:fixed` 로
      반투명(`rgba(255,255,255,.2)`) 고정이고 스크롤해도 색이 바뀌지 않는다.
      scroll 핸들러를 만들지 말 것.

   ⚠️ **`.depth_box` 는 클래스가 아니라 `fadeIn`/`fadeOut` 으로 연다.**
      원본 CSS 에 `.depth_box.on` 규칙이 없고 `display:none` 만 있다.
      PET 처럼 `addClass('on')` 로 바꾸면 서브메뉴가 영영 안 열린다.
      반대로 `.hd_lnb_bg` 는 `.on` 이 `height:460px` 를 주는 클래스 방식이다 —
      **둘이 서로 다른 방식**이라는 점이 이 스킨의 함정이다.

   ⚠️ 원본은 AOS(등장 애니메이션)를 쓴다 — 제목/배너에 `data-aos` 가 깔려 있다.
      원본은 `/js/aos.js` 를 자체 호스팅하지만 템플릿은 jQuery·Swiper 와 같이
      CDN 에서 받는다(각 페이지 하단 `<script>`). AOS 가 없어도 페이지는
      동작해야 하므로 호출은 전부 존재 검사를 거친다.

   헤더·푸터는 header-footer-loader.js 가 fetch 로 주입하고, 객실·시설 메뉴는
   매퍼가 나중에 만든다. 그래서 동적으로 생기는 요소는 전부 이벤트 위임으로 잡는다.
   ============================================================ */

(function () {
  'use strict';

  // ── AOS ────────────────────────────────────────────────
  // 원본 `custom.js` 의 `AOS.init({duration:1500, easing:'ease-in-out'})` 그대로다.
  // 매퍼가 슬라이드/카드를 나중에 만들므로 매핑이 끝나면 refresh 가 필요하다.
  window.TplAos = {
    init: function () {
      if (!window.AOS) return;
      AOS.init({ duration: 1500, easing: 'ease-in-out' });
    },
    refresh: function () {
      if (window.AOS && AOS.refresh) AOS.refresh();
    }
  };

  $(function () {
    window.TplAos.init();

    // ── PC 상단 메뉴 ───────────────────────────────────────
    // 원본은 `#hd_lnb` 에 마우스가 들어오면 **모든** `.depth_box` 를 한꺼번에
    // 펼치고 뒤에 `.hd_lnb_bg`(반투명 띠)를 깐다. 항목별로 따로 열리지 않는다.
    // 닫기는 `#header` 를 벗어날 때다(`.hd_lnb_bg` 위에 있어도 열린 채 유지된다).
    //
    // ⚠️ 1024px 이하에서는 PC LNB 자체가 `display:none` 이라 hover 가 성립하지
    //    않는다. 원본은 로드 시점 폭으로 한 번만 분기하는데, 그러면 창을 줄였다
    //    늘렸을 때 메뉴가 죽는다. 위임 + 폭 검사로 매번 판단해 그 버그를 없앴다.
    $(document).on('mouseenter', '#hd_lnb', function () {
      if ($(window).width() <= 1024) return;
      $('.hd_lnb_bg').addClass('on');
      $('.depth_box').stop(true, true).fadeIn();
    });

    $(document).on('mouseleave', '#header', function () {
      $('.hd_lnb_bg').removeClass('on');
      $('.depth_box').stop(true, true).fadeOut();
    });

    // 폭이 줄어 PC LNB 가 숨겨지면 열려 있던 상태를 정리한다
    $(window).on('resize', function () {
      if ($(window).width() <= 1024) {
        $('.hd_lnb_bg').removeClass('on');
        $('.depth_box').stop(true, true).hide();
      }
    });

    // ── 사이드 메뉴 열고 닫기 ──────────────────────────────
    // 원본은 `.aside` 와 `.btn_menu` 에만 `.on` 을 붙인다.
    // 닫기 버튼은 `.aisde_inner` 안의 두 번째 `.btn_menu`(이미 `.on`)다 —
    // 같은 핸들러가 잡으므로 따로 처리하지 않는다.
    $(document).on('click', '.btn_menu', function (e) {
      e.preventDefault();
      var open = !$('.aside').hasClass('on');
      $('.aside').toggleClass('on', open);
      $('.header .hd_inner .btn_menu').toggleClass('on', open);
    });

    // ── 모바일 사이드 메뉴 아코디언 ────────────────────────
    // `.aside .depth1`(제목 div)을 누르면 바로 다음 `.depth_list` 만 열고
    // 나머지는 닫는다. `.depth_list` 는 CSS 에서 display:none 이 기본이다.
    $(document).on('click', '.aside .depth1', function () {
      var $me = $(this);
      $('.aside .depth1').not($me).removeClass('on');
      $('.aside .depth_list').not($me.next()).slideUp();
      $me.toggleClass('on').next().slideToggle();
    });

    // ── 히어로 스크롤 유도 ─────────────────────────────────
    // 원본은 `.scroll_down` 을 bottom 50px ↔ 60px 로 무한 왕복시키고,
    // 클릭하면 히어로 높이만큼 내린다.
    // ⚠️ 높이는 **클릭 시점에** 잰다. 원본은 로드 시점 값을 가둬 둬서
    //    창 크기가 바뀌면 엉뚱한 위치로 간다.
    (function swing() {
      var $el = $('.scroll_down');
      if (!$el.length) return;
      $el.animate({ bottom: '50px' }, 900).animate({ bottom: '60px' }, 900, swing);
    })();

    $(document).on('click', '.scroll_down', function (e) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: $('.visual').height() }, 600);
    });

    // ── 히어로 재생 / 일시정지 ─────────────────────────────
    // 원본은 `.btn_play` 에 `.on` 을 토글해 두 아이콘을 번갈아 보인다.
    // 히어로 Swiper 는 pages/index.js 가 TplSwiper 로 만들고 인스턴스를 남긴다.
    function visualSwiper() {
      return window.TplSwiper && window.TplSwiper.instances
        ? window.TplSwiper.instances.visual
        : null;
    }

    $(document).on('click', '#stop', function () {
      var sw = visualSwiper();
      if (sw && sw.autoplay) sw.autoplay.stop();
      $(this).parent().addClass('on');
      return false;
    });

    $(document).on('click', '#play', function () {
      var sw = visualSwiper();
      if (sw && sw.autoplay) sw.autoplay.start();
      $(this).parent().removeClass('on');
      return false;
    });

    // ── TOP 버튼 ───────────────────────────────────────────
    $(document).on('click', '.btn_top', function (e) {
      e.preventDefault();
      $('html, body').stop().animate({ scrollTop: 0 }, 300);
    });
  });
})();

/* ============================================================
   Swiper 공용 헬퍼 (전 템플릿 공통본)
   매퍼가 슬라이드를 동적 생성한 뒤 호출되므로, 같은 컨테이너에
   이미 인스턴스가 있으면 destroy 후 재생성한다.
   ============================================================ */
window.TplSwiper = (function () {
  var instances = {};

  function init(key, selector, options) {
    var el = document.querySelector(selector);
    if (!el) return null;

    // 슬라이드가 하나도 없으면 초기화하지 않는다 (매핑 전/데이터 없음)
    var slideCount = el.querySelectorAll('.swiper-slide').length;
    if (!slideCount) return null;

    if (instances[key]) {
      try {
        instances[key].destroy(true, true);
      } catch (e) {
        /* 이미 파괴된 인스턴스 무시 */
      }
      delete instances[key];
    }

    var opts = options || {};

    // loop 는 화면에 보이는 수보다 슬라이드가 많아야 정상 동작한다.
    // 부족한 상태로 켜면 Swiper 가 레이아웃을 못 잡거나 예외를 던진다.
    // ⚠️ 이 스킨은 `slidesPerView:3` 짜리 슬라이더가 둘(객실/시설)이라
    //    3실 이하 숙소에서 실제로 걸린다. breakpoints 의 최대값을 함께 본다.
    var perView = Number(opts.slidesPerView) || 1;
    if (opts.breakpoints) {
      Object.keys(opts.breakpoints).forEach(function (bp) {
        var n = Number(opts.breakpoints[bp].slidesPerView) || 0;
        if (n > perView) perView = n;
      });
    }
    if (opts.loop && slideCount <= perView) {
      var relaxed = {};
      Object.keys(opts).forEach(function (k) {
        relaxed[k] = opts[k];
      });
      relaxed.loop = false;
      opts = relaxed;
    }

    // 넘길 슬라이드가 없을 때 화살표를 숨길 대상 (Swiper 옵션이 아니므로 분리해 둔다)
    var lockHide = opts.lockHide;
    if (lockHide) {
      var cleaned = {};
      Object.keys(opts).forEach(function (k) {
        if (k !== 'lockHide') cleaned[k] = opts[k];
      });
      opts = cleaned;
    }

    // 한 슬라이더가 실패해도 같은 페이지의 나머지 초기화까지 멈추면 안 된다.
    try {
      instances[key] = new Swiper(selector, opts);
    } catch (e) {
      console.error('[TplSwiper] init failed:', key, selector, e);
      return null;
    }

    if (lockHide) bindLockHide(instances[key], lockHide);
    return instances[key];
  }

  // 슬라이드가 화면에 다 들어와 넘길 게 없으면 화살표 영역을 숨긴다.
  // Swiper 의 watchOverflow(기본 on)가 그 상태를 isLocked / lock·unlock 이벤트로 알려준다.
  // 브레이크포인트마다 slidesPerView 가 달라 잠김 여부가 바뀌므로 resize 에도 다시 본다.
  function bindLockHide(swiper, selector) {
    var target = document.querySelector(selector);
    if (!target || !swiper) return;

    function sync() {
      target.style.display = swiper.isLocked ? 'none' : '';
    }

    swiper.on('lock', sync);
    swiper.on('unlock', sync);
    swiper.on('resize', sync);
    sync();
  }

  // 풀높이 히어로 슬라이더 — `.main_visual.visual`.
  // 원본 custom.js 의 `new Swiper('.visual .swiper-container', …)` 그대로다.
  //
  // ⚠️ 페이지네이션은 `type:'fraction'`(01 / 20 꼴)이고 `.visual_txt` 안에 있다.
  //    bullet 로 바꾸면 `#wrap .visual .visual_txt .paging span` CSS 가 어긋난다.
  //    (그 규칙이 `:before` 로 앞에 `0` 을 붙여 두 자리로 만든다)
  function initVisual(key) {
    return init(key || 'visual', '.visual .swiper-container', {
      spaceBetween: 0,
      centeredSlides: true,
      loop: true,
      autoplay: { delay: 3000, disableOnInteraction: false },
      navigation: {
        nextEl: '.visual .swiper-button-next',
        prevEl: '.visual .swiper-button-prev'
      },
      pagination: {
        el: '.visual .swiper-pagination',
        type: 'fraction'
      },
      // 사진이 1장이면 넘길 게 없으므로 화살표를 숨긴다 (원본에 없는 템플릿 추가분)
      lockHide: '.visual .arw'
    });
  }

  // 3열 카드 슬라이더 — index `.main_room .room_list` / `.main_special .special_list`.
  // 원본 `swiper2` / `swiper3` 의 옵션이 브레이크포인트까지 완전히 같다.
  //
  // ⚠️ `navigation` / `pagination` 셀렉터는 슬라이더 컨테이너가 아니라
  //    **바깥 섹션**(`.main_room` / `.main_special`) 기준이다. 원본 그대로다.
  function initCardList(key, listSelector, sectionSelector) {
    return init(key, listSelector + ' .swiper-container', {
      loop: true,
      slidesPerView: 3,
      spaceBetween: 45,
      autoplay: { delay: 3000, disableOnInteraction: false },
      navigation: {
        nextEl: sectionSelector + ' .swiper-button-next',
        prevEl: sectionSelector + ' .swiper-button-prev'
      },
      pagination: {
        el: sectionSelector + ' .swiper-pagination',
        clickable: true
      },
      breakpoints: {
        280: { slidesPerView: 1, spaceBetween: 15 },
        641: { slidesPerView: 2, spaceBetween: 15 },
        861: { slidesPerView: 3, spaceBetween: 15 },
        1200: { slidesPerView: 3, spaceBetween: 20 },
        1450: { slidesPerView: 3, spaceBetween: 45 }
      },
      lockHide: sectionSelector + ' .arw'
    });
  }

  return {
    init: init,
    initVisual: initVisual,
    initCardList: initCardList,
    instances: instances
  };
})();
