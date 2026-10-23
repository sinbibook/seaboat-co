(function (global) {
  'use strict';

  // 그리드는 최대 4칸이다 (원본 `.main_about .bnr_list ul li` 가 `width:calc(25% - 20px)`).
  // 장수가 그보다 적으면 칸 폭이 동적으로 늘어난다 — `ul[data-cols]` / styles/style.css 참고.
  var ABOUT_GRID_MAX = 4;
  // `.landscape_img li` 는 3칸 고정이다.
  var VIEW_CARD_COUNT = 3;

  // 원본이 `.main_about` 에 인라인으로 박아 둔 배경/장식
  var ABOUT_BG = "url('images/common/main_about_bg.webp') repeat-y 50% 0";
  var ABOUT_ICO = "url('images/common/main_about_kids.png') no-repeat 50%";

  function MainMapper() {
    BaseDataMapper.call(this);
  }
  MainMapper.prototype = Object.create(BaseDataMapper.prototype);
  MainMapper.prototype.constructor = MainMapper;

  // 섹션 배정 — pages.main.sections[0] 은 `hero` + `about[]` 이다.
  //   hero     → `.sub_visual` (슬라이더 + 문구)
  //   about[]  → `.main_about` **블록 개수만큼 복제**
  //
  // ⚠️ 블록 하나 = 제목 + 본문 + 큰 사진 1장 + 가로 그리드(최대 4칸).
  //    이미지 배정은 **`images[0]` = 큰 사진, `images[1..4]` = 그리드** 다
  //    (사용자 판단 2026-09-15).
  //
  // ⚠️ 외경 구간(`LANDSCAPE`)에는 대응 블록이 없다. 원본 `view.html` 이 별도 페이지였고
  //    합본하면서 흡수됐기 때문이다. 그래서 여기만 `property.images[0].exterior` 를 쓴다
  //    — 반복 블록이 `about[]` 을 전부 소비하므로 남는 사진을 주워올 필요가 없다.
  MainMapper.prototype.getSection = function () {
    var page = this.getPages().main;
    return (page && page.sections && page.sections[0]) || {};
  };

  MainMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapHero();
    this.mapAbout();
    this.mapView();

    if (typeof window.initMain === 'function') window.initMain();
    if (window.TplAos) window.TplAos.refresh();
  };

  MainMapper.prototype.blockImages = function (block) {
    return this.getSelectedImages((block && block.images) || []).filter(function (img) {
      return img && img.url;
    });
  };

  MainMapper.prototype.getAboutBlocks = function () {
    return (this.getSection().about || []).filter(Boolean);
  };

  // MAPPER: hero → `.sub_visual`
  //
  // ⚠️ **문구는 `about.html`, 사진은 `view.html`(외경) 쪽을 쓴다.**
  //    두 원본을 합치면서 정한 규칙이다(사용자 판단 2026-09-15).
  //      문구 → `pages.main.hero.title/description` (원본 `ABOUT` / `{숙소명}을 소개합니다.`)
  //      사진 → `property.images[0].exterior`       (원본 view.html 히어로 = 외경 전체 23장)
  //    그래서 이 페이지에서 **이미지만** `property` 가 1순위다.
  //    `pages.main.hero.images` 는 외경이 비었을 때의 폴백으로 남긴다.
  //
  // ⚠️ 히어로와 아래 외경 구간이 **같은 pool 을 공유한다.** 원본도 그렇다 —
  //    view.html 히어로가 `view/1~23`, 본문 3칸이 그 중 `view/8` 을 다시 쓴다.
  MainMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-main-hero-title]', this.firstText(hero.title, 'ABOUT'), true);
    this.setCopySlot(
      '[data-main-hero-description]',
      this.firstText(
        hero.description,
        name ? this.withJosa(name, '을/를') + ' 소개합니다.' : '펜션을 소개합니다.'
      ),
      true
    );

    var wrapper = document.querySelector('[data-main-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    // 외경 → (없으면) pages.main.hero.images → (없으면) 대표 사진
    var urls = this.getPropertyImagesByCategory('exterior')
      .map(function (img) {
        return img.url;
      })
      .filter(Boolean);
    if (!urls.length) {
      urls = this.blockImages(hero).map(function (img) {
        return img.url;
      });
    }
    if (!urls.length) {
      urls = this.getPropertyImagesByCategory('thumbnail')
        .map(function (img) {
          return img.url;
        })
        .filter(Boolean);
    }

    if (!urls.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, '외경 이미지');
      wrapper.appendChild(empty);
      return;
    }

    urls.forEach(function (url) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, url, '외경 이미지');
      wrapper.appendChild(slide);
    });
  };

  // ── 소개 블록 한 장 ────────────────────────────────────
  // 원본 `.main_about` 마크업을 그대로 만든다.
  //   .main_about > .inner > .title_box(h3 + p.sub_title)
  //                        + .bnr_list(.ico + ul + .bnr > div)
  //
  // ⚠️ `.bnr` 뒤에는 코랄 사각형(`:before`)이 30px 어긋나게 깔린다 — CSS 몫이다.
  // ⚠️ `ul` 에 `data-cols` 를 찍어 칸 폭을 동적으로 만든다(styles/style.css).
  MainMapper.prototype.buildAboutBlock = function (block, index) {
    var self = this;
    var images = this.blockImages(block);

    var section = document.createElement('div');
    section.className = 'main_about';
    section.setAttribute('data-generated', 'about-block');
    section.setAttribute('data-about-index', String(index));
    section.style.background = ABOUT_BG;
    section.style.backgroundSize = 'cover';

    var inner = document.createElement('div');
    inner.className = 'inner';
    section.appendChild(inner);

    // ── 제목 / 본문 ──
    var titleBox = document.createElement('div');
    titleBox.className = 'title_box';
    var h3 = document.createElement('h3');
    h3.setAttribute('data-aos', 'fade-up');
    h3.setAttribute('data-aos-duration', '1000');
    h3.textContent = this.firstText(block.title, this.getPropertyNameEn(), 'ABOUT');
    titleBox.appendChild(h3);

    var desc = this.cleanText(block.description);
    if (desc) {
      var p = document.createElement('p');
      p.className = 'sub_title';
      p.setAttribute('data-aos', 'fade-up');
      p.setAttribute('data-aos-duration', '1000');
      p.setAttribute('data-aos-delay', '100');
      p.innerHTML = this.nl2br(desc);
      titleBox.appendChild(p);
    }
    inner.appendChild(titleBox);

    // ── 사진 ──
    var bnrList = document.createElement('div');
    bnrList.className = 'bnr_list';

    var ico = document.createElement('div');
    ico.className = 'ico';
    ico.style.background = ABOUT_ICO;
    ico.style.backgroundSize = 'cover';
    ico.textContent = '키즈 아이콘';
    bnrList.appendChild(ico);

    // 그리드 — images[1..4].
    // ⚠️ 이미지가 **하나도 없으면** 4칸 placeholder 를 세워 슬롯 위치를 보여 준다
    //    (index `.main_about` 과 같은 규칙). 한 장이라도 있으면 그 장수를 따른다 —
    //    큰 사진만 올린 블록에 빈 회색 칸 3개가 붙는 것이 더 이상하다.
    var gridImages = images.slice(1, 1 + ABOUT_GRID_MAX);
    var gridCount = images.length ? gridImages.length : ABOUT_GRID_MAX;
    if (gridCount) {
      var ul = document.createElement('ul');
      ul.setAttribute('data-cols', String(gridCount));
      for (var i = 0; i < gridCount; i++) {
        var li = document.createElement('li');
        self.setBackground(li, gridImages[i] && gridImages[i].url, '소개 이미지');
        ul.appendChild(li);
      }
      bnrList.appendChild(ul);
    }

    // 큰 사진 — images[0]
    var bnr = document.createElement('div');
    bnr.className = 'bnr';
    var bnrImg = document.createElement('div');
    this.setBackground(bnrImg, images[0] && images[0].url, '소개 이미지');
    bnr.appendChild(bnrImg);
    bnrList.appendChild(bnr);

    inner.appendChild(bnrList);
    return section;
  };

  // MAPPER: about[] → `.main_about` 블록 반복
  //
  // ⚠️ 제목·본문·사진이 **전부 빈 블록은 건너뛴다** — 배경만 깔린 419px 띠가 남는다.
  // ⚠️ 블록이 하나도 없으면 컨테이너째 숨긴다.
  MainMapper.prototype.mapAbout = function () {
    var self = this;
    var host = document.querySelector('[data-main-about-blocks]');
    if (!host) return;
    host.innerHTML = '';

    var blocks = this.getAboutBlocks().filter(function (b) {
      return self.cleanText(b.title) || self.cleanText(b.description) || self.blockImages(b).length;
    });

    if (!blocks.length) {
      host.style.display = 'none';
      return;
    }
    host.style.display = '';

    blocks.forEach(function (block, i) {
      host.appendChild(self.buildAboutBlock(block, i));
    });
  };

  // MAPPER: property.images[0].exterior → 외경 구간 (원본 view.html)
  //
  // 가로 3칸 + 와이드 배너 1장 = 사진 4장을 쓴다.
  // 1순위는 숙소 외경, 없으면 `about[1..]` 의 남은 사진, 그래도 없으면 대표 사진.
  //
  // ⚠️ **사진이 없어도 구간을 숨기지 않는다.** 3칸과 배너 모두 placeholder 를 세워
  //    매핑 위치를 보여 준다(사용자 판단 2026-09-15).
  //    합본 페이지의 본론 중 하나라, 비었다고 사라지면 업주가 슬롯 존재를 모른다.
  MainMapper.prototype.mapView = function () {
    var self = this;

    var images = this.getPropertyImagesByCategory('exterior').filter(function (img) {
      return img && img.url;
    });
    if (!images.length) {
      this.getAboutBlocks()
        .slice(1)
        .forEach(function (block) {
          images = images.concat(self.blockImages(block));
        });
    }
    if (!images.length) {
      images = this.getPropertyImagesByCategory('thumbnail').filter(function (img) {
        return img && img.url;
      });
    }

    document.querySelectorAll('[data-main-view-section]').forEach(function (el) {
      el.style.display = '';
    });
    this.setCopySlot('[data-main-view-title]', 'LANDSCAPE', true);

    // 가로 3칸 — 사진이 모자라면 그 자리는 placeholder 가 된다
    var list = document.querySelector('[data-main-view-list]');
    if (list) {
      list.innerHTML = '';
      // 원본 view.html 이 고른 3칸(view_card:N)이 1순위, 없으면 외경 앞에서부터
      var cardsMarked = this.getMarkedExterior('view_card');
      for (var i = 0; i < VIEW_CARD_COUNT; i++) {
        var li = document.createElement('li');
        var card = cardsMarked[i] || images[i];
        self.setBackground(li, card && card.url, '외경 이미지');
        list.appendChild(li);
      }
    }

    // 와이드 배너 — 4번째 장, 없으면 첫 장, 그래도 없으면 placeholder.
    // ⚠️ placeholder 는 배너 비율(원본 1440×810)로 만든다. 기본 4:3 을 쓰면
    //    1440×1080 짜리 회색 띠가 되어 페이지가 무너진 것처럼 보인다.
    // 원본이 고른 와이드(view_banner)가 1순위
    var wideMarked = this.getMarkedExterior('view_banner');
    var wideUrl = wideMarked.length
      ? wideMarked[0].url
      : images[VIEW_CARD_COUNT]
        ? images[VIEW_CARD_COUNT].url
        : '';
    if (!wideUrl && images.length) wideUrl = images[0].url;

    document.querySelectorAll('[data-main-wide-image]').forEach(function (el) {
      el.innerHTML = '';
      el.style.display = '';
      var img = document.createElement('img');
      if (wideUrl) {
        ImageHelpers.setImage(img, wideUrl, '외경 이미지', function () {
          ImageHelpers.applyPlaceholder(img, '외경 이미지', {
            width: 1440,
            height: 810,
            fontSize: 48
          });
        });
      } else {
        ImageHelpers.applyPlaceholder(img, '외경 이미지', {
          width: 1440,
          height: 810,
          fontSize: 48
        });
      }
      el.appendChild(img);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new MainMapper().initialize();
  });

  global.MainMapper = MainMapper;
})(window);
