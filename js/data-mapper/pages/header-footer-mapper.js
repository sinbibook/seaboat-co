(function (global) {
  'use strict';

  var YBS_BASE_URL = 'https://www.yapen.co.kr/external?ypIdx=';
  // 상담하기 — 뒤에 property.tripPropertyId 가 붙는다
  var CONSULT_BASE_URL = 'https://www.bookingplay.co.kr/api/cti_eicn/kakao_happy_talk?tid=';

  // 파트너 타입 — 원천은 백오피스 DB `public.contract_info.partner_type` 이고
  // BFF 가 코드 문자열을 그대로 내려준다. **분기는 템플릿이 한다**(PC/모바일은 템플릿만 안다).
  //
  //   distributor_a  총판A     PC 상담하기        / 모바일 상담하기 + 예약하기
  //   distributor_b  총판B     PC 없음            / 모바일 예약하기
  //   sales_agency   판매대행  PC 없음            / 모바일 예약하기
  //
  // ⚠️ 예약하기는 **파트너 타입과 무관**하다 — 세 타입 모두 모바일에서만 뜬다.
  //    그건 기존 `.ft_btn_reserve.for_m` 의 미디어쿼리가 이미 하고 있어 손대지 않는다.
  //    타입으로 갈리는 것은 상담하기 하나뿐이다.
  var CONSULT_PARTNER_TYPES = ['distributor_a'];

  // ⚠️ base-mapper 에 `cleanText` 가 없는 템플릿이 있어 의존하지 않는다.
  function consultText(v) {
    return v === undefined || v === null ? '' : String(v).trim();
  }

  function HeaderFooterMapper() {
    BaseDataMapper.call(this);
  }
  HeaderFooterMapper.prototype = Object.create(BaseDataMapper.prototype);
  HeaderFooterMapper.prototype.constructor = HeaderFooterMapper;

  HeaderFooterMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapFavicon();
    this.mapBookingLinks();
    this.mapYbs();
    this.mapConsult();
    this.mapSocialLinks();
    this.mapRoomMenu();
    this.mapSpecialMenu();
    this.mapPageToggles();
    this.mapFooter();
    // SEO: homepage.seo → title + description/keywords + 네이버/구글 사이트 인증 (전 페이지 공통)
    this.updateMetaTags();
  };

  // 페이지 enabled 여부 (sections[0].enabled === false 이면 비활성)
  HeaderFooterMapper.prototype.isPageEnabled = function (pageKey) {
    var page = this.getPages()[pageKey];
    var section = page && page.sections && page.sections[0];
    return !(section && section.enabled === false);
  };

  // 로고 이미지.
  //   homepage.images[0].logo[isSelected] → 없거나 죽었으면 **이미지 placeholder**
  //
  // ⚠️ **숙소명 텍스트로 떨어뜨리지 않는다**(사용자 판단 2026-09-15).
  //    로고 자리는 이미지 슬롯이므로, 비어 있을 때 어디에 무엇을 넣어야 하는지
  //    placeholder 로 보여 주는 편이 업주에게 명확하다.
  //    (영문 숙소명이 대신 나오면 슬롯이 채워진 것처럼 보여 로고를 안 올리게 된다)
  //
  // 원본(남양주제이펜션/bomps)의 로고 자리는 2곳이다.
  //   .header .logo    = 헤더 (히어로 위 absolute, 스크롤해도 반전되지 않는다)
  //   .footer .ft_logo = 푸터 첫 칸
  // ⚠️ jpension 은 `.ft_logo` 를 2개 단다(둘째는 「농어촌민박」 인증마크).
  //    업체 고유 이미지라 백오피스 슬롯이 없다 — 템플릿은 1개만 둔다.
  HeaderFooterMapper.prototype.applyLogo = function (host, logoUrl, name) {
    if (!host) return;
    var img = host.querySelector('[data-logo-image]');
    if (!img) return;

    img.style.display = '';
    // URL 이 없거나, 있어도 404/차단이면 placeholder 로 떨어진다.
    // ⚠️ 로고 칸은 가로로 긴 슬롯이라 기본 4:3 placeholder 를 쓰면 글씨가 작아진다.
    //    원본 로고의 natural 크기(200×80)와 같은 비율로 만든다.
    function logoPlaceholder() {
      ImageHelpers.applyPlaceholder(img, '로고', { width: 200, height: 80, fontSize: 20 });
    }
    ImageHelpers.setImage(img, logoUrl, name || '로고', logoPlaceholder);
  };

  // MAPPER: homepage.images[0].logo / property name → 헤더·푸터 로고
  HeaderFooterMapper.prototype.mapPropertyNames = function () {
    var self = this;
    var nameEn = this.getPropertyNameEn();
    var name = this.getPropertyName();
    var logoUrl = this.getLogo();

    document.querySelectorAll('[data-property-name-en]').forEach(function (el) {
      el.textContent = nameEn;
    });
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      el.textContent = name;
    });

    document.querySelectorAll('.header .logo, .footer .ft_logo').forEach(function (host) {
      self.applyLogo(host, logoUrl, name);
    });
  };

  // MAPPER: favicon ← homepage.images[0].logo[isSelected].url
  HeaderFooterMapper.prototype.mapFavicon = function () {
    var logoUrl = this.getLogo();
    if (!logoUrl) return;
    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  };

  // MAPPER: property.realtimeBookingId → [data-booking-link] (href 직접 주입)
  HeaderFooterMapper.prototype.mapBookingLinks = function () {
    var bookingUrl = this.getBookingUrl();
    document.querySelectorAll('[data-booking-link]').forEach(function (el) {
      if (bookingUrl && bookingUrl !== '#!') {
        el.href = bookingUrl;
        el.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: property.ybsId → [data-ybs-button] (없으면 감싸는 줄째 숨김)
  // 원본은 이 링크가 헤더가 아니라 푸터 사업자정보 줄에 있고, **두 사이트 모두 주석 처리**해 뒀다.
  // 백오피스에 `ybsId` 슬롯이 있으므로 살려 두고 값이 없을 때만 숨긴다.
  // YBS 식별자 — URL 쿼리에 그대로 붙는 값이라 **토큰 형태만 통과시킨다.**
  // 플레이스홀더 문자열(`YBS ID` 처럼 공백·한글이 섞인 값)이 들어와도 링크가 깨지지 않는다.
  // ⚠️ `if (!ybsId)` 만으로는 막히지 않는다 — 플레이스홀더도 truthy 라
  //    버튼이 뜨고 `?ypIdx=YBS ID` 같은 깨진 링크가 된다(상담하기와 같은 규칙을 적용).
  HeaderFooterMapper.prototype.getYbsId = function () {
    var raw = consultText(this.getProperty().ybsId);
    return /^[A-Za-z0-9_-]+$/.test(raw) ? raw : '';
  };

  HeaderFooterMapper.prototype.mapYbs = function () {
    var ybsId = this.getYbsId();
    document.querySelectorAll('[data-ybs-button]').forEach(function (el) {
      var host = el.closest('[data-ybs-wrap]') || el;
      if (!ybsId) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = YBS_BASE_URL + ybsId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // 상담하기 버튼 노출 여부. 노출 조건이 늘어나면 이 함수만 고친다.
  //
  // ⚠️ 값은 **Trip 숙소 ID** 다. 카카오 계정 ID 가 아니다.
  //    bookingplay(트립일레븐) 시스템의 업체 식별자이고, 상담 URL 의 `?tid=` 에 들어간다.
  //    `ybsId` / `realtimeBookingId` 에서 유도할 수 없는 독립 식별자다
  //    (bomps: tid 1620 / ypIdx 63361, jpension: tid 2522 / ypIdx 63363).
  //
  // 백엔드는 **ID 만** 내려준다(`"4657"`). base URL 은 템플릿이 들고 있다 —
  // `ybsId` 와 같은 방식이다. (`realtimeBookingId` 만 전체 URL 을 받는다.
  //  업체마다 예약 도메인이 달라 base 를 고정할 수 없기 때문이다)
  //
  // ⚠️ 숫자만 통과시킨다. 백오피스 미입력 상태의 안내 문구가 그대로 내려오면
  //    `?tid=%EC%B9%B4...` 같은 URL 이 만들어지는데, 상담 엔드포인트는 잘못된 tid 에도
  //    200 으로 빈 상담창을 띄운다. 깨진 걸 화면으로 알 수 없으니 여기서 막는다.
  HeaderFooterMapper.prototype.getConsultId = function () {
    var property = this.getProperty();
    // 숙소별 on/off 토글 필드가 생기면 여기에 한 줄 추가한다:
    // if (property.consultEnabled === false) return '';
    var raw = consultText(property.tripPropertyId);
    // ⚠️ URL 쿼리에 그대로 붙는 값이라 토큰 형태만 통과시킨다. 플레이스홀더
    //    문자열(`숙소 ID` 같은 한글·공백)이 들어와도 링크가 깨지지 않는다.
    return /^[A-Za-z0-9_-]+$/.test(raw) ? raw : '';
  };

  // 상담하기 노출 대상인가 — 파트너 타입 + tripPropertyId 둘 다 있어야 한다.
  HeaderFooterMapper.prototype.isConsultVisible = function () {
    var partnerType = consultText(this.getProperty().partnerType);
    return Boolean(this.getConsultId()) && CONSULT_PARTNER_TYPES.indexOf(partnerType) !== -1;
  };

  // MAPPER: property.tripPropertyId + partnerType → [data-consult-button] (우측 하단 상담하기)
  //
  // 총판A 만 노출하고, `tripPropertyId` 가 비면 타입과 무관하게 숨긴다.
  // 값이 없으면 `[data-consult-wrap]` 째 숨긴다 — 버튼만 숨기면 원본 CSS 의
  // `#talk_custom_button` 박스가 빈 채로 남는다.
  HeaderFooterMapper.prototype.mapConsult = function () {
    var tripPropertyId = this.getConsultId();
    var visible = this.isConsultVisible();

    // 상담하기가 빠지면 예약하기(bottom:80px) 아래가 비어 버린다.
    // CSS 가 위치를 되돌릴 수 있도록 상태를 루트에 찍는다.
    document.documentElement.setAttribute('data-consult', visible ? 'on' : 'off');

    document.querySelectorAll('[data-consult-button]').forEach(function (el) {
      var host = el.closest('[data-consult-wrap]') || el;
      if (!visible) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = CONSULT_BASE_URL + tripPropertyId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // 소셜 링크 플랫폼 — [data-homepage-socialLinks-{platform}] 와 1:1.
  // 헤더 네이버 버튼은 blog 칸을 쓴다(어드민에서 네이버 플레이스 주소를 blog 에 입력).
  var SOCIAL_PLATFORMS = ['facebook', 'instagram', 'blog', 'youtube'];

  // MAPPER: homepage.socialLinks.{platform} → [data-homepage-socialLinks-{platform}] (href, 없으면 숨김)
  //
  // 값이 있으면 href 를 넣고 노출, 없으면(null·빈 문자열·공백·키 없음) 숨긴다.
  // 마크업은 매핑 전 깜빡임이 없도록 style="display: none" 으로 시작한다.
  // KIDS1 마크업은 네이버(blog)·인스타그램(instagram) 두 가지가 헤더 .hd_sns 와 aside .aside_sns 에
  // 하나씩 있다. facebook / youtube 는 매칭 요소가 0개라 아무 일도 없다.
  //
  // 버튼이 하나라도 보이면 루트에 data-social="on", 아니면 "off" 를 찍는다.
  // 래퍼(.hd_sns / .aside_sns) 노출과 479px 이하 aside 전환은 CSS 가 이 값을 기준으로 한다
  // (:has() 대신 — 일부 브라우저에서 스타일 미반영).
  HeaderFooterMapper.prototype.mapSocialLinks = function () {
    var socialLinks = this.getHomepage().socialLinks || {};
    var anyOn = false;
    SOCIAL_PLATFORMS.forEach(function (platform) {
      var url = consultText(socialLinks[platform]);
      document
        .querySelectorAll('[data-homepage-socialLinks-' + platform + ']')
        .forEach(function (el) {
          var host = el.closest('[data-social-wrap]') || el;
          if (!url) {
            host.style.display = 'none';
            el.setAttribute('href', '#!');
            return;
          }
          el.setAttribute('href', url);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
          host.style.display = '';
          anyOn = true;
        });
    });
    document.documentElement.setAttribute('data-social', anyOn ? 'on' : 'off');
  };

  // MAPPER: roomtypes[].name → [data-rooms-submenu] (미리보기 li 뒤에 동적 생성, PC + 모바일 aside)
  HeaderFooterMapper.prototype.mapRoomMenu = function () {
    var self = this;
    var roomItems = this.getRoomMenuItems();
    document.querySelectorAll('[data-rooms-submenu]').forEach(function (container) {
      // 이전 생성분 제거 (preview 재렌더 대비)
      container.querySelectorAll('[data-generated="room"]').forEach(function (li) {
        li.remove();
      });
      roomItems.forEach(function (item) {
        var name = self.getRoomMenuLabel(item);
        // 이름이 없으면 빈 메뉴 항목(여백)이 되므로 건너뜀
        if (!String(name).trim()) return;
        var li = document.createElement('li');
        li.setAttribute('data-generated', 'room');
        var a = document.createElement('a');
        a.href = self.getRoomMenuLink(item);
        a.textContent = name;
        a.title = name; // 메뉴 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: property.facilities[].name → [data-special-submenu] (컨테이너 비우고 동적 생성)
  //
  // ⚠️ 시설을 하나도 등록하지 않으면 SPECIAL 메뉴째 숨긴다.
  //    부대시설은 property.facilities[] 가 유일한 소스라(크롤링으로 채워지지 않는다)
  //    비어 있는 숙소가 실제로 있다. 그대로 두면 서브 0개짜리 메뉴가 남고
  //    누르면 facility.html 이 404 로 튕긴다.
  HeaderFooterMapper.prototype.mapSpecialMenu = function () {
    // getFacilities() 는 displayOrder 로 정렬한다 — index 카드 / facility 탭과 같은 순서
    var facilities = this.getFacilities();

    document.querySelectorAll('[data-special-menu]').forEach(function (el) {
      el.style.display = facilities.length ? '' : 'none';
    });

    document.querySelectorAll('[data-special-submenu]').forEach(function (container) {
      container.innerHTML = '';
      facilities.forEach(function (f) {
        if (!f.name || !f.name.trim()) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = './facility.html?id=' + f.id;
        a.textContent = f.name;
        a.title = f.name; // 메뉴 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: pages.layoutMap / nearbyAttractions enabled → 메뉴 표시/숨김
  //
  // 미리보기가 꺼지면 「미리보기」 li 를 숨기고, 대메뉴 ROOMS([data-rooms-link])는
  // 첫 번째 객실 상세로 보낸다 — 그대로 두면 layout-map.html 이 404 로 튕긴다.
  // 판정은 layout-map.html 의 404 기준과 같은 isLayoutMapEnabled() 를 쓴다.
  // (aside 의 ROOMS 는 링크가 아니라 slideToggle 제목 `div` 라 대상이 아니다)
  HeaderFooterMapper.prototype.mapPageToggles = function () {
    var layoutMapEnabled = this.isLayoutMapEnabled();
    document.querySelectorAll('[data-menu-id="layout-map"]').forEach(function (el) {
      var li = el.closest('li') || el;
      li.style.display = layoutMapEnabled ? '' : 'none';
    });

    var roomsLink = this.getRoomsEntryLink();
    if (roomsLink) {
      document.querySelectorAll('[data-rooms-link]').forEach(function (el) {
        el.setAttribute('href', roomsLink);
      });
    }

    var nearbyEnabled = this.isPageEnabled('nearbyAttractions');
    document.querySelectorAll('[data-travel-menu]').forEach(function (el) {
      el.style.display = nearbyEnabled ? '' : 'none';
    });
  };

  // 전화번호 링크(<a data-footer-phone-link>)를 번호 개수만큼 복제해 " | " 로 구분 노출.
  HeaderFooterMapper.prototype.renderFooterPhones = function (phones) {
    if (!phones.length) return;
    var tel0 = 'tel:' + String(phones[0]).replace(/[^0-9+]/g, '');

    document.querySelectorAll('[data-footer-phone-link]').forEach(function (link) {
      // 번호 텍스트 슬롯이 없는 링크(아이콘 버튼 등)는 첫 번째 번호로 href 만 연결
      if (!link.querySelector('[data-footer-phone]')) {
        link.setAttribute('href', tel0);
        return;
      }

      var parent = link.parentNode;
      if (!parent) return;

      // 멱등: 이전 렌더로 만든 복제 링크/구분자를 정리하고 원본 링크 하나만 남긴다
      parent.querySelectorAll('[data-footer-phone-link]').forEach(function (el, i) {
        if (i > 0) parent.removeChild(el);
      });
      parent.querySelectorAll('[data-footer-phone-sep]').forEach(function (el) {
        parent.removeChild(el);
      });

      phones.forEach(function (phone, idx) {
        var el = idx === 0 ? link : link.cloneNode(true);
        var span = el.querySelector('[data-footer-phone]');
        if (span) span.textContent = phone;
        el.setAttribute('href', 'tel:' + String(phone).replace(/[^0-9+]/g, ''));

        if (idx > 0) {
          var sep = document.createElement('span');
          sep.setAttribute('data-footer-phone-sep', '');
          sep.textContent = ' | ';
          parent.appendChild(sep);
          parent.appendChild(el);
        }
      });
    });
  };

  // MAPPER: property.address / property.contactPhone / property.businessInfo → 푸터
  // 원본 푸터의 주소는 사업장 주소가 아니라 숙소 주소다(Reservation 블록).
  // 전화번호도 businessInfo.businessPhone 이 아니라 노출용 contactPhone 배열을 쓴다.
  // MAPPER: property.tripProviderName → [data-copyright]
  // 공급사명이 있으면 data-copyright 의 템플릿 문자열에서 {provider} 를 치환한다.
  // 값이 없으면(백오피스 미입력 → "") HTML 의 기존 트립일레븐 문구를 그대로 둔다.
  HeaderFooterMapper.prototype.mapCopyright = function () {
    var provider = String(this.getProperty().tripProviderName || '').trim();
    if (!provider) return;
    document.querySelectorAll('[data-copyright]').forEach(function (el) {
      var tpl = el.getAttribute('data-copyright') || '';
      el.textContent = tpl.replace(/\{provider\}/g, provider);
    });
  };

  // MAPPER: customFields.footer.ruralStayMark → [data-footer-rural-stay-mark]
  // 농어촌민박사업자 이미지(표시마크 + 신고번호)가 있을 때만 줄을 노출한다.
  // 없으면 줄째 숨겨 기존 푸터와 같다. 프리뷰는 같은 페이지에서 다시 매핑하므로 매번 표시 상태를 되돌린다.
  // ⚠️ 푸터 배경(풍경 그림)이 `background-size:cover` 라 줄만큼 푸터가 길어지면 그림도 커져
  //    물가가 카피라이트 줄을 덮는다. `<html data-rural-stay-mark="on|off">` 를 찍어
  //    CSS 가 그만큼 아래 여백을 더 준다.
  HeaderFooterMapper.prototype.mapFooterRuralStayMark = function () {
    var footer = this.getCustomFields().footer || {};
    var mark = footer.ruralStayMark;
    var markUrl = mark && mark.url ? String(mark.url) : '';

    document.documentElement.setAttribute('data-rural-stay-mark', markUrl ? 'on' : 'off');
    document.querySelectorAll('[data-footer-rural-stay-mark-wrap]').forEach(function (wrap) {
      wrap.style.display = markUrl ? '' : 'none';
    });
    document.querySelectorAll('[data-footer-rural-stay-mark]').forEach(function (img) {
      if (!markUrl) {
        img.removeAttribute('src');
        return;
      }
      img.src = markUrl;
      img.alt = (mark.description && String(mark.description).trim()) || '농어촌민박사업자';
    });
  };

  HeaderFooterMapper.prototype.mapFooter = function () {
    this.mapCopyright();
    this.mapFooterRuralStayMark();
    var prop = this.getProperty();
    var biz = prop.businessInfo || {};
    var phones = this.toPhoneList(prop.contactPhone);

    var fields = {
      '[data-footer-property-name]': this.getPropertyName(),
      '[data-footer-address]': this.firstText(prop.address, biz.businessAddress),
      '[data-footer-representative]': biz.representativeName,
      '[data-footer-business-number]': biz.businessNumber,
      '[data-footer-business-name]': this.firstText(biz.businessName, this.getPropertyName())
    };
    Object.keys(fields).forEach(function (selector) {
      var value = fields[selector];
      document.querySelectorAll(selector).forEach(function (el) {
        // 값이 없으면 줄째로 숨긴다 ("대표자 :" 만 남는 빈 줄 방지).
        // 푸터는 dd(=[data-footer-row]), aside 는 p 가 줄 단위다.
        var row = el.closest('[data-footer-row]') || el.closest('p') || el;
        if (value === undefined || value === null || value === '') {
          row.style.display = 'none';
          return;
        }
        row.style.display = '';
        el.textContent = value;
      });
    });

    this.renderFooterPhones(phones);
  };

  document.addEventListener('headerFooterLoaded', function () {
    var mapper = new HeaderFooterMapper();
    mapper.initialize();
    global.headerFooterMapperInstance = mapper;
  });

  global.HeaderFooterMapper = HeaderFooterMapper;
})(window);
