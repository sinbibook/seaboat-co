/* ============================================================
   not-found.js — 404 페이지에서 원래 페이지로 되돌아가기 (프리뷰 전용)

   `layout-map` / `nearby-attractions` 는 `sections[0].enabled === false` 면
   매퍼가 `404.html?from=<page>` 로 보낸다. 그런데 404 로 이동하고 나면 그 페이지의
   매퍼가 더 이상 없어서, 업주가 백오피스에서 다시 「노출」로 바꿔도 프리뷰가
   404 에 갇힌다.

   preview-handler 가 매핑을 끝낼 때마다 쏘는 `previewRendered` 를 듣고,
   `?from=` 페이지가 다시 켜졌으면 그 페이지로 돌려보낸다.

   ⚠️ **프리뷰(iframe)에서만 동작한다.** 실제 배포본에서는 `?from=` 이 붙어 있어도
      데이터가 한 번만 로드되므로 되돌아갈 일이 없다.
   ============================================================ */

(function (global) {
  'use strict';

  // 404 로 보낼 수 있는 페이지 — 파일명 → 데이터 키
  var RECOVERABLE = {
    'layout-map': 'layoutMap',
    'nearby-attractions': 'nearbyAttractions'
  };

  function getFrom() {
    try {
      return new URLSearchParams(global.location.search).get('from') || '';
    } catch (e) {
      return '';
    }
  }

  function isEnabled(data, pageKey) {
    var hp = data && data.homepage;
    var cf = (hp && hp.customFields) || (data && data.customFields) || {};
    var pages = cf.pages || {};
    var page = pages[pageKey];
    var section = page && page.sections && page.sections[0];
    // 섹션이 아직 안 온 상태(undefined)에서는 되돌리지 않는다 — false 일 때만 404 다
    return !!section && section.enabled !== false;
  }

  document.addEventListener('previewRendered', function (event) {
    var from = getFrom();
    var pageKey = RECOVERABLE[from];
    if (!pageKey) return;

    if (isEnabled(event.detail, pageKey)) {
      global.location.href = './' + from + '.html';
    }
  });
})(window);
