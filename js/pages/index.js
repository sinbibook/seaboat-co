/* ============================================================
   index.js — 메인 페이지 슬라이더 초기화
   원본 남양주제이펜션.com `/js/custom.js` 의 Swiper 중 index 에서 실제로 도는 3개다.

   ⚠️ 원본 custom.js 는 Swiper 를 3개 만들고 index 에서 **셋 다 살아 있다.**
      - `.visual .swiper-container`        히어로 (분수 페이지네이션 + 재생/정지)
      - `.room_list .swiper-container`     객실 미리보기 3열
      - `.special_list .swiper-container`  부대시설 미리보기 3열
      뒤 둘은 옵션이 브레이크포인트까지 완전히 같다(TplSwiper.initCardList).

   ⚠️ 뒤 둘은 `navigation` / `pagination` 셀렉터 기준이 슬라이더 컨테이너가 아니라
      **바깥 섹션**(`.main_room` / `.main_special`)이다. 원본 옵션 그대로다.

   매퍼가 슬라이드를 동적으로 만든 뒤 호출되므로 window.initIndexSwipers 로
   내보내고, 매퍼가 없는 상황(데이터 로드 실패)에 대비해 스스로도 한 번 돈다.
   ============================================================ */

(function (global) {
  'use strict';

  function initIndexSwipers() {
    // ── 히어로 ──────────────────────────────────────────────
    // 기본 slide 전환 + `01 / 20` 분수 페이지네이션.
    // 재생·정지 버튼은 js/common.js 가 이 인스턴스를 찾아 제어한다
    // (그래서 키를 'visual' 로 고정한다).
    TplSwiper.initVisual('visual');

    // ── 객실 / 부대시설 미리보기 ────────────────────────────
    TplSwiper.initCardList('index-room', '.room_list', '.main_room');
    TplSwiper.initCardList('index-special', '.special_list', '.main_special');

    // 슬라이드가 늘어나면 AOS 가 잡고 있던 위치가 어긋난다
    if (global.TplAos) global.TplAos.refresh();
  }

  global.initIndexSwipers = initIndexSwipers;

  // 매퍼가 돌지 않는 경우(데이터 로드 실패 등)에도 마크업이 있으면 초기화한다
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances.visual) initIndexSwipers();
    }, 3000);
  });
})(window);
