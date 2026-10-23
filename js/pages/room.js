/* ============================================================
   room.js — 객실 상세 페이지 슬라이더 초기화
   히어로(`.sub_visual`) + 하단 객실 카드 2개가 돈다.
   ============================================================ */

(function (global) {
  'use strict';

  function initRoomSwipers() {
    TplSwiper.initVisual('visual');
    TplSwiper.initCardList('room-preview', '.room_list', '.main_room');
    if (global.TplAos) global.TplAos.refresh();
  }

  global.initRoomSwipers = initRoomSwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances.visual) initRoomSwipers();
    }, 3000);
  });
})(window);
