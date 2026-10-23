/**
 * Image Helpers
 * Utility functions for image handling and placeholder management
 */

var ImageHelpers = {
  // Empty image SVG placeholder
  EMPTY_IMAGE_SVG:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E',

  /**
   * 커스텀 라벨 텍스트를 가진 placeholder SVG 생성 (이미지 없을 때 매핑 위치 안내용)
   * @param {string} text - 표시할 라벨 텍스트
   * @returns {string} data URI
   */
  buildPlaceholderSvg: function (text, opts) {
    var label = text || 'No Image';
    var o = opts || {};
    // 기본은 4:3(800×600). 로고처럼 비율이 다른 슬롯은 크기를 직접 준다 —
    // 4:3 SVG 를 가로로 긴 칸에 우겨넣으면 글씨가 잘리거나 지나치게 작아진다.
    var w = o.width || 800;
    var h = o.height || 600;
    var fontSize = o.fontSize || 24;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      w +
      '" height="' +
      h +
      '">' +
      '<rect width="' +
      w +
      '" height="' +
      h +
      '" fill="#f0f0f0"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
      'font-family="sans-serif" font-size="' +
      fontSize +
      '" fill="#999">' +
      label +
      '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  },

  /**
   * Apply placeholder to an image element
   * @param {HTMLImageElement} imgElement - The image element to apply placeholder to
   * @param {string} [text] - 표시할 라벨 텍스트 (없으면 기본 "No Image")
   * @param {{width?:number,height?:number,fontSize?:number}} [opts] - 슬롯 비율이 4:3 이 아닐 때
   */
  applyPlaceholder: function (imgElement, text, opts) {
    if (!imgElement) return;
    imgElement.src = text
      ? ImageHelpers.buildPlaceholderSvg(text, opts)
      : ImageHelpers.EMPTY_IMAGE_SVG;
    imgElement.alt = text || 'No Image Available';
    imgElement.classList.add('empty-image-placeholder');
  },

  /**
   * Apply placeholder to a background-image element (배경 이미지 요소용)
   * @param {HTMLElement} element - The element to apply the background placeholder to
   * @param {string} [text] - 표시할 라벨 텍스트 (없으면 기본 "No Image")
   * @param {{width?:number,height?:number,fontSize?:number}} [opts] - 슬롯 비율이 4:3 이 아닐 때
   */
  /**
   * <img> 에 URL 을 물리면서 **로드 실패까지** 처리한다.
   *
   * applyPlaceholder 는 "URL 이 아예 없을 때"만 막아 준다.
   * URL 은 있는데 404/차단이면 브라우저가 깨진 이미지 아이콘 + alt 텍스트를 그린다.
   * 크롤링으로 받은 원본 경로가 이미 사라진 숙소가 실제로 있어서(호스팅 이전 등)
   * 그 경우에도 placeholder 로 떨어지게 한다.
   *
   * @param {HTMLImageElement} imgElement
   * @param {string} url - 없으면 바로 placeholder
   * @param {string} [text] - placeholder 라벨 겸 alt
   * @param {Function} [onFail] - placeholder 대신 쓸 폴백 (로고의 텍스트 폴백 등)
   */
  setImage: function (imgElement, url, text, onFail) {
    if (!imgElement) return;
    imgElement.onerror = null;

    if (!url) {
      if (onFail) onFail();
      else ImageHelpers.applyPlaceholder(imgElement, text);
      return;
    }

    imgElement.onerror = function () {
      // placeholder 는 data URI 라 다시 실패하지 않지만, 재진입은 막아 둔다
      imgElement.onerror = null;
      if (onFail) onFail();
      else ImageHelpers.applyPlaceholder(imgElement, text);
    };
    imgElement.classList.remove('empty-image-placeholder');
    imgElement.alt = text || '';
    imgElement.src = url;
  },

  applyBackgroundPlaceholder: function (element, text, opts) {
    if (!element) return;
    // EMPTY_IMAGE_SVG는 공백/큰따옴표를 포함하므로 url()에 작은따옴표로 감싸야 CSS 파싱됨
    var svg = text ? ImageHelpers.buildPlaceholderSvg(text, opts) : ImageHelpers.EMPTY_IMAGE_SVG;
    element.style.backgroundImage = "url('" + svg + "')";
    element.style.backgroundColor = '#f0f0f0';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'center';
    element.style.backgroundSize = 'cover';
    element.classList.add('empty-image-placeholder');
  }
};

// Ensure ImageHelpers is available globally
window.ImageHelpers = ImageHelpers;
