/* ============================================================
   facility.js — 부대시설 상세 페이지 슬라이더 초기화
   히어로(`.sub_visual`) + 하단 시설 카드 2개가 돈다.
   ============================================================ */

(function (global) {
  'use strict';

  function initFacilitySwipers() {
    TplSwiper.initVisual('visual');
    TplSwiper.initCardList('special-preview', '.special_list', '.main_special');
    if (global.TplAos) global.TplAos.refresh();
  }

  global.initFacilitySwipers = initFacilitySwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances.visual) initFacilitySwipers();
    }, 3000);
  });
})(window);
