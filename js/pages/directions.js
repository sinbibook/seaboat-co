/* ============================================================
   directions.js — 오시는길 페이지
   ⚠️ 이 페이지에도 Swiper 가 없다. 지도는 directions-mapper 가 그린다.
   ============================================================ */

(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (global.TplAos) global.TplAos.refresh();
    }, 3000);
  });
})(window);
