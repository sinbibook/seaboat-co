import prettierConfig from 'eslint-config-prettier';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  Promise: 'readonly',
  fetch: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  location: 'readonly',
  getComputedStyle: 'readonly',
  navigator: 'readonly',
  requestAnimationFrame: 'readonly',
  IntersectionObserver: 'readonly',
  module: 'writable'
};

const projectGlobals = {
  kakao: 'readonly',
  jQuery: 'readonly',
  $: 'readonly',
  Swiper: 'readonly',
  AOS: 'readonly', // 원본이 쓰는 등장 애니메이션 라이브러리 (각 페이지가 CDN 으로 로드)
  TplSwiper: 'writable', // js/common.js 가 window 에 붙이는 Swiper 공용 헬퍼
  TplAos: 'writable', // js/common.js 가 window 에 붙이는 AOS 래퍼 (없어도 동작하도록 감쌌다)
  BaseDataMapper: 'writable',
  ImageHelpers: 'readonly',
  HeaderFooterMapper: 'readonly',
  IndexMapper: 'readonly',
  MainMapper: 'readonly',
  RoomMapper: 'readonly',
  FacilityMapper: 'readonly',
  ReservationMapper: 'readonly',
  DirectionsMapper: 'readonly',
  NearbyAttractionsMapper: 'readonly',
  LayoutMapMapper: 'readonly',
  LandingMapper: 'readonly',
  PopupManager: 'writable'
};

export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...browserGlobals,
        ...projectGlobals
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
      eqeqeq: ['warn', 'always'],
      'no-var': 'off'
    }
  },
  prettierConfig
];
