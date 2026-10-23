/* ============================================================
   main.js — 소개 페이지 슬라이더 초기화
   원본 `about.html` 의 히어로 슬라이더 하나뿐이다.
   ⚠️ `.sub_visual` 도 `.visual` 클래스를 함께 갖는다 —
      TplSwiper.initVisual 의 `.visual .swiper-container` 셀렉터가 그대로 맞는다.
   ============================================================ */

(function (global) {
  'use strict';

  function initMain() {
    TplSwiper.initVisual('visual');
    if (global.TplAos) global.TplAos.refresh();
  }

  global.initMain = initMain;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances.visual) initMain();
    }, 3000);
  });
})(window);
