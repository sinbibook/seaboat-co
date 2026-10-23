/* ============================================================
   layout-map.js — 객실 목록 페이지
   ⚠️ 이 페이지에는 히어로 슬라이더가 **없다**(원본 `room.html` 목록 그대로).
      도는 Swiper 는 하단 객실 카드 하나뿐이다.
   ============================================================ */

(function (global) {
  'use strict';

  function initLayoutMap() {
    TplSwiper.initCardList('room-preview', '.room_list', '.main_room');
    if (global.TplAos) global.TplAos.refresh();
  }

  global.initLayoutMap = initLayoutMap;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['room-preview']) initLayoutMap();
    }, 3000);
  });
})(window);
