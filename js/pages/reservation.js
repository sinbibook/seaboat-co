/* ============================================================
   reservation.js — 이용안내 페이지
   ⚠️ 이 페이지에는 Swiper 가 하나도 없다(히어로가 고정 배경형이다).
      AOS 만 매핑 뒤에 다시 잡아 준다.
   ============================================================ */

(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (global.TplAos) global.TplAos.refresh();
    }, 3000);
  });
})(window);
