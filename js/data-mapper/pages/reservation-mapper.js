(function (global) {
  'use strict';

  function ReservationMapper() {
    BaseDataMapper.call(this);
  }
  ReservationMapper.prototype = Object.create(BaseDataMapper.prototype);
  ReservationMapper.prototype.constructor = ReservationMapper;

  // 섹션 배정 — pages.reservation.sections[0] 은 `hero` + `about` 이다.
  //   hero  → `.sub_visual_wide` (`reservation` / 한 줄 설명)
  //   about → `이용안내` 블록 (제목 + 본문)
  //
  // ⚠️ `환불안내` 는 `property.refundSettings.customerRefundNotice` 에서 온다.
  //    환불 규정은 계약 정보라 페이지 문구 블록에 두지 않는다.
  ReservationMapper.prototype.getSection = function () {
    var page = this.getPages().reservation;
    return (page && page.sections && page.sections[0]) || {};
  };

  ReservationMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapHero();
    this.mapInfo();
    this.mapRefund();

    if (window.TplAos) window.TplAos.refresh();
  };

  // MAPPER: hero → `.sub_visual_wide`
  ReservationMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    this.setCopySlot(
      '[data-reservation-hero-title]',
      this.firstText(hero.title, 'reservation'),
      true
    );
    this.setCopySlot(
      '[data-reservation-hero-description]',
      this.firstText(hero.description, name ? name + ' 이용안내' : '이용안내'),
      true
    );

    var images = this.getSelectedImages(hero.images || []).filter(function (img) {
      return img && img.url;
    });
    var url = images.length ? images[0].url : '';
    if (!url) {
      var fallback = this.getPropertyImagesByCategory('thumbnail').concat(
        this.getPropertyImagesByCategory('exterior')
      );
      url = fallback.length ? fallback[0].url : '';
    }
    document.querySelectorAll('[data-reservation-hero-bg]').forEach(function (el) {
      self.setBackground(el, url, '숙소 이미지');
    });
  };

  // MAPPER: about → `이용안내` 블록
  //
  // 본문은 `about.description` 1순위, 없으면 `property.usageGuide`.
  // ⚠️ 본문이 비면 제목만 남으므로 dt/dd 쌍째 숨긴다.
  //    원본이 `<dl>` 안에 dt/dd 를 평면으로 늘어놓아서 쌍을 감쌀 수 없다 —
  //    그래서 두 요소에 같은 `data-reservation-info-row` 를 달고 둘 다 숨긴다.
  ReservationMapper.prototype.mapInfo = function () {
    var about = this.getSection().about || {};
    var text = this.firstText(about.description, this.getProperty().usageGuide);

    document.querySelectorAll('[data-reservation-info-row]').forEach(function (el) {
      el.style.display = text ? '' : 'none';
    });
    this.setCopySlot(
      '[data-reservation-info-title]',
      text ? this.firstText(about.title, '이용안내') : ''
    );
    this.setCopySlot('[data-reservation-info-text]', text, true);
  };

  // MAPPER: property.refundSettings.customerRefundNotice → `환불안내` 블록
  //
  // ⚠️ 안내 문구가 비어 있으면 `property.refundPolicies[]` 로 문장을 만든다.
  //    원본 문구 꼴(`* 이용일 N일이전 취소시 N% 환불`)을 그대로 따른다.
  ReservationMapper.prototype.mapRefund = function () {
    var settings = this.getProperty().refundSettings || {};
    var text = this.cleanText(settings.customerRefundNotice);
    if (!text) text = this.buildRefundText();

    document.querySelectorAll('[data-reservation-refund-row]').forEach(function (el) {
      el.style.display = text ? '' : 'none';
    });
    this.setCopySlot('[data-reservation-refund-text]', text, true);
  };

  ReservationMapper.prototype.buildRefundText = function () {
    var policies = (this.getProperty().refundPolicies || []).slice().sort(function (a, b) {
      return Number(b.refundProcessingDays) - Number(a.refundProcessingDays);
    });
    if (!policies.length) return '';

    return policies
      .map(function (p) {
        var days = Number(p.refundProcessingDays);
        var rate = Number(p.refundRate);
        var when = days > 0 ? '이용일 ' + days + '일전 취소시' : '이용일 당일 취소시';
        var result = rate > 0 ? rate + '% 환불' : '환불 불가';
        if (days > 0 && rate === 100) result = '전액 환불';
        return '* ' + when + ' ' + result;
      })
      .join('\n');
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new ReservationMapper().initialize();
  });

  global.ReservationMapper = ReservationMapper;
})(window);
