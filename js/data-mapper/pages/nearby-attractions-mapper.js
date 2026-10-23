(function (global) {
  'use strict';

  function NearbyAttractionsMapper() {
    BaseDataMapper.call(this);
  }
  NearbyAttractionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  NearbyAttractionsMapper.prototype.constructor = NearbyAttractionsMapper;

  // 섹션 배정 — pages.nearbyAttractions.sections[0] 은 `enabled` + `hero` + `about[]` 이다.
  //   hero    → `.sub_visual_wide` + `.title_box h3`
  //   about[] → `.travel_list li` (여행지 하나 = 블록 하나)
  NearbyAttractionsMapper.prototype.getSection = function () {
    var page = this.getPages().nearbyAttractions;
    return (page && page.sections && page.sections[0]) || null;
  };

  NearbyAttractionsMapper.prototype.mapPage = function () {
    var section = this.getSection();

    // enabled=false (또는 섹션 자체가 없음) → 404 리다이렉트.
    // 헤더 TRAVEL 대메뉴도 header-footer-mapper 가 같은 기준으로 숨긴다.
    // ⚠️ `?from=` 을 남긴다. 프리뷰에서 업주가 다시 「노출」로 바꾸면
    //    `js/pages/not-found.js` 가 이 값을 보고 원래 페이지로 되돌린다.
    if (!section || section.enabled === false) {
      window.location.href = '404.html?from=nearby-attractions';
      return;
    }

    this.mapPropertyNames();
    this.mapHero();
    this.mapList();

    if (window.TplAos) window.TplAos.refresh();
  };

  NearbyAttractionsMapper.prototype.blockImages = function (block) {
    return this.getSelectedImages((block && block.images) || []).filter(function (img) {
      return img && img.url;
    });
  };

  // MAPPER: hero → 히어로 + `.title_box h3`
  //
  // ⚠️ 원본은 히어로 제목이 `travel`(영문), 본문 제목이 `주변여행지`(한글)로 **서로 다르다.**
  //    받을 필드가 `hero.title` 하나뿐이라 히어로에만 쓰고, 본문 제목은 고정값을 둔다.
  NearbyAttractionsMapper.prototype.mapHero = function () {
    var self = this;
    var section = this.getSection() || {};
    var hero = section.hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-travel-hero-title]', this.firstText(hero.title, 'travel'), true);
    this.setCopySlot(
      '[data-travel-hero-description]',
      this.firstText(hero.description, name ? name + ' 여행지 안내' : '주변 여행지 안내'),
      true
    );
    this.setCopySlot('[data-travel-title]', '주변여행지', true);

    var images = this.blockImages(hero);
    var url = images.length ? images[0].url : '';
    if (!url) {
      var fallback = this.getPropertyImagesByCategory('surrounding')
        .concat(this.getPropertyImagesByCategory('exterior'))
        .concat(this.getPropertyImagesByCategory('thumbnail'));
      url = fallback.length ? fallback[0].url : '';
    }
    document.querySelectorAll('[data-travel-hero-bg]').forEach(function (el) {
      self.setBackground(el, url, '주변 여행지 이미지');
    });
  };

  // MAPPER: about[] → `.travel_list li`
  //
  // 블록 하나 = 사진 + 이름 + 본문 + 출처 + 거리. 항목 수 제한이 없다.
  //
  // ⚠️ 짝수 항목은 CSS(`li:nth-of-type(2n)`)가 좌우를 뒤집는다. 마크업은 동일하다.
  // ⚠️ 원본은 본문/출처(`<span>`)/거리(`<em>`)가 **서로 다른 요소**인데
  //    `about` 블록에는 필드가 `description` 하나뿐이다. 그래서 **빈 줄 기준으로 가른다** —
  //      1문단 → 본문, 2문단 → 출처, 3문단 → 거리.
  //    문단이 부족하면 그 요소를 만들지 않는다(빈 줄만큼 여백이 생긴다).
  NearbyAttractionsMapper.prototype.mapList = function () {
    var self = this;
    var host = document.querySelector('[data-travel-list]');
    if (!host) return;
    host.innerHTML = '';

    var blocks = ((this.getSection() || {}).about || []).filter(function (b) {
      return b && (self.cleanText(b.title) || self.cleanText(b.description));
    });
    if (!blocks.length) {
      host.style.display = 'none';
      return;
    }
    host.style.display = '';

    blocks.forEach(function (block) {
      var li = document.createElement('li');

      var imgBox = document.createElement('div');
      imgBox.className = 'img_box';
      var images = self.blockImages(block);
      var img = document.createElement('img');
      if (images.length) {
        ImageHelpers.setImage(img, images[0].url, self.cleanText(block.title) || '여행지');
      } else {
        ImageHelpers.applyPlaceholder(img, '여행지 이미지');
      }
      imgBox.appendChild(img);
      li.appendChild(imgBox);

      var txtBox = document.createElement('div');
      txtBox.className = 'txt_box';

      var strong = document.createElement('strong');
      strong.textContent = self.cleanText(block.title);
      txtBox.appendChild(strong);

      var paragraphs = String(self.cleanText(block.description) || '')
        .split(/\n\s*\n/)
        .map(function (t) {
          return t.trim();
        })
        .filter(Boolean);

      // 본문 / 출처 / 거리 — 순서대로 <p> / <span> / <em>
      [
        ['p', paragraphs[0]],
        ['span', paragraphs[1]],
        ['em', paragraphs.slice(2).join('\n')]
      ].forEach(function (pair) {
        if (!pair[1]) return;
        var el = document.createElement(pair[0]);
        el.innerHTML = self.nl2br(pair[1]);
        txtBox.appendChild(el);
      });

      li.appendChild(txtBox);
      host.appendChild(li);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new NearbyAttractionsMapper().initialize();
  });

  global.NearbyAttractionsMapper = NearbyAttractionsMapper;
})(window);
