(function (global) {
  'use strict';

  function LayoutMapMapper() {
    BaseDataMapper.call(this);
  }
  LayoutMapMapper.prototype = Object.create(BaseDataMapper.prototype);
  LayoutMapMapper.prototype.constructor = LayoutMapMapper;

  // 섹션 배정 — pages.layoutMap.sections[0] 은 `enabled` + `hero` + `about` 이다.
  //   hero  → `.sub_visual_wide` (`room preview` / `객실 미리보기`)
  //   about → `ROOM LAYOUT` 제목·설명 + 배치도 이미지
  LayoutMapMapper.prototype.getSection = function () {
    var page = this.getPages().layoutMap;
    return (page && page.sections && page.sections[0]) || null;
  };

  LayoutMapMapper.prototype.mapPage = function () {
    // enabled=false (또는 섹션 자체가 없음) → 404 리다이렉트.
    // 헤더 「미리보기」 항목·객실 탭 첫 칸 숨김과 대메뉴 ROOMS 이동처(첫 객실 상세)도
    // 같은 기준(isLayoutMapEnabled)으로 정한다.
    // ⚠️ `?from=` 을 남긴다. 프리뷰에서 업주가 다시 「노출」로 바꾸면
    //    `js/pages/not-found.js` 가 이 값을 보고 원래 페이지로 되돌린다.
    if (!this.isLayoutMapEnabled()) {
      window.location.href = '404.html?from=layout-map';
      return;
    }

    this.mapPropertyNames();
    this.mapHero();
    this.mapLayout();
    this.mapRoomPreview();

    if (typeof window.initLayoutMap === 'function') window.initLayoutMap();
    if (window.TplAos) window.TplAos.refresh();
  };

  // MAPPER: hero → `.sub_visual_wide`
  //
  // ⚠️ 배경은 `hero.images[0]` 1순위, 없으면 **객실 사진**으로 폴백한다 —
  //    원본도 이 자리에 객실 사진 한 장(`room/1/9.webp`)을 쓴다.
  //    숙소 대표 사진으로 떨어뜨리면 객실 페이지인데 외경이 나온다.
  LayoutMapMapper.prototype.mapHero = function () {
    var self = this;
    var hero = (this.getSection() || {}).hero || {};

    this.setCopySlot(
      '[data-layoutmap-hero-title]',
      this.firstText(hero.title, 'room preview'),
      true
    );
    this.setCopySlot(
      '[data-layoutmap-hero-description]',
      this.firstText(hero.description, '객실 미리보기'),
      true
    );

    var images = this.getSelectedImages(hero.images || []).filter(function (img) {
      return img && img.url;
    });
    var url = images.length ? images[0].url : '';

    if (!url) {
      // 첫 객실의 사진 → 숙소 대표 순으로 폴백
      var roomtypes = this.getRoomtypes();
      for (var i = 0; i < roomtypes.length && !url; i++) {
        url = this.getRoomThumbUrl(roomtypes[i]);
      }
    }
    if (!url) {
      var fallback = this.getPropertyImagesByCategory('thumbnail').concat(
        this.getPropertyImagesByCategory('exterior')
      );
      url = fallback.length ? fallback[0].url : '';
    }

    document.querySelectorAll('[data-layoutmap-hero-bg]').forEach(function (el) {
      self.setBackground(el, url, '객실 이미지');
    });
  };

  // MAPPER: about → `ROOM LAYOUT` 제목 + 배치도 이미지
  //
  // ⚠️ 배치도는 이 페이지의 본론이라 비어도 영역을 숨기지 않는다.
  //    placeholder 를 세워 매핑 위치를 보여 준다.
  LayoutMapMapper.prototype.mapLayout = function () {
    var about = (this.getSection() || {}).about || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-layoutmap-title]', this.firstText(about.title, 'ROOM LAYOUT'), true);
    this.setCopySlot(
      '[data-layoutmap-description]',
      this.firstText(about.description, name ? name + ' 배치도 안내' : '배치도 안내'),
      true
    );

    var images = this.getSelectedImages(about.images || []).filter(function (img) {
      return img && img.url;
    });

    document.querySelectorAll('[data-layoutmap-images]').forEach(function (host) {
      host.innerHTML = '';
      host.classList.remove('empty-image-placeholder');
      host.style.backgroundImage = '';

      // ⚠️ **배경 placeholder 를 쓰면 안 된다.** 이 호스트는 빈 `<div>` 라
      //    내용이 없으면 높이가 0 이 되어 배경이 아예 보이지 않는다.
      //    실제 배치도도 `<img>` 로 들어오므로 placeholder 도 `<img>` 로 세운다.
      if (!images.length) {
        var ph = document.createElement('img');
        ImageHelpers.applyPlaceholder(ph, '배치도 이미지', {
          width: 1440,
          height: 810,
          fontSize: 48
        });
        host.appendChild(ph);
        return;
      }

      images.forEach(function (img) {
        var el = document.createElement('img');
        ImageHelpers.setImage(el, img.url, '배치도', function () {
          ImageHelpers.applyPlaceholder(el, '배치도 이미지', {
            width: 1440,
            height: 810,
            fontSize: 48
          });
        });
        host.appendChild(el);
      });
    });
  };

  // MAPPER: customFields.roomtypes[] → 객실 탭 + 객실 카드
  LayoutMapMapper.prototype.mapRoomPreview = function () {
    // 활성 탭 없음 → 첫 칸(「미리보기」)에 `.on`
    this.renderRoomTabs('[data-room-tabs]', null);

    this.setCopySlot('[data-room-preview-title]', 'ROOM PREVIEW', true);
    this.renderRoomSlides('[data-room-preview-list]');
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new LayoutMapMapper().initialize();
  });

  global.LayoutMapMapper = LayoutMapMapper;
})(window);
