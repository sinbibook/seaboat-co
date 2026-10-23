# Data Mapping 정의서 — t-template-KIDS1

`standard-template-data.json` 기준 HTML의 `data-*` 속성 매핑 정의.

원본 디자인: [남양주제이펜션.com](https://xn--q20bm03aw8ch7b8xan2bcy4b.com/) (정본) / 동일 계열 대조: [bomps.co.kr](https://bomps.co.kr/)

두 사이트는 같은 트립일레븐 원본의 **완전히 동일한 스킨**이다.
`custom.js` 는 공백 한 줄만 다르고, `reset.css` · `board_black.css` · `popup_black.css` 는 바이트 단위로 같다.
`style.css` 차이는 **45줄뿐**이고, 갈리는 지점은 아래 셋이 전부다.

| 갈리는 것           | 남양주제이펜션                           | bomps                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------ |
| 헤더 바탕 / 메뉴 색 | `rgba(255,255,255,.2)` / `#333` (라이트) | `rgba(0,0,0,.2)` / `#fff` (다크)           |
| 헤더 예약 버튼      | 1개 (코랄 `#f16b68`)                     | **2개** (둘째는 초록 `#5de97d` 네이버예약) |

⚠️ **CSS 정본은 남양주제이펜션**(라이트 헤더)이다. bomps 전용 규칙(`.btn_hd_res + .btn_hd_res`,
`.ft_kakao` 모바일 보정, `.footer .ft_logo{display:none}`)은 가져오지 않았다 —
백오피스에 `realtimeBookingId` 가 하나뿐이라 예약 버튼을 2개 달 수 없다.
⚠️ **푸터는 jpension 을 따른다** — bomps 에만 있는 「실시간 달력」 알약은 싣지 않았다.
아래 「원본과 다르게 간 것」 참고.

장식은 키즈 펜션답게 비행기·구름·점선·아이 일러스트가 스킨 전반에 깔려 있다.

## 베이스 선정

원본 `style.css` 의 셀렉터 464개를 기존 템플릿 `styles/style.css` 와 교집합으로 비교했다.

| 템플릿  | 공통 셀렉터 | 비고                                                                 |
| ------- | ----------- | -------------------------------------------------------------------- |
| **PET** | **79**      | `.header .hd_lnb` / `.aside .aisde_inner` / `.visual .arw` 전부 일치 |
| G / H   | 74          |                                                                      |
| J       | 70          |                                                                      |
| F       | 66          |                                                                      |

- **베이스는 t-template-PET** — 마크업도 인프라도 가장 가깝고 가장 최신이다.
  매퍼 코어 / `preview-handler` / `image-helpers` / `popup` / `kakao-maps-sdk` /
  `header-footer-loader` / 린트 설정 / `404.html` 을 그대로 가져왔다.
- **디자인(CSS·마크업·UI 스크립트)은 한 줄도 가져오지 않았다.** 전부 원본 이식이다.
- `base-mapper.js` 의 **공용 렌더러는 KIDS 규격으로 교체**했다 —
  `renderRoomTabs`(Swiper → `inline-block` 목록) / `renderRoomSlides` / `renderFacilitySlides` /
  `buildPreviewCard` / `setCopySlot` / `mapPropertyNames`.

### 원본과 다르게 간 것

- **`view.html`(외경보기) 전용 페이지를 만들지 않았다.** 템플릿 페이지 파일명이 고정이라
  외경 전용 슬롯이 없다. `main.html` 에 흡수하고 ABOUT 서브메뉴에서 「외경보기」를 뺐다.
- **`LOCATION` 대메뉴를 살렸다.** 원본에 `traffic.html` 이 실제로 있어 `directions.html` 과 1:1 이다.
- **다음 「지도 퍼가기」 위젯 → Kakao SDK.** 원본은 `root_daum_roughmap` 이라 사이트별 key 가
  마크업에 박혀 있다. 템플릿은 `property.latitude/longitude` 로 그린다.
- **푸터 「실시간 달력」을 싣지 않았다.** bomps 에만 있는 알약이다.
  `tripPropertyId` 에서 URL 을 유도할 수는 있지만, **jpension 은 `tripPropertyId` 가 있는데도
  (예약 URL 이 `/partner/item/2522/`) 실시간달력과 상담하기를 둘 다 안 단다.**
  즉 식별자 유무가 아니라 **업체별 선택 사항**인데 백오피스에 on/off 필드가 없다.
  노출 기준이 정해지면 그때 넣는다. (사용자 판단 2026-09-15)
- **로고가 3단 폴백이다.** 원본은 `<img>` 한 장 고정이다. 템플릿은 로고 파일을 저장하지 않으므로
  이미지 → 숙소 영문명 텍스트 → placeholder 로 떨어뜨린다.
- **`.btn_more`(VIEW MORE)에 실제 링크를 넣었다.** 원본은 `href="#"` 라 누르면 페이지 맨 위로 튄다.
  카드 전체를 덮는 `.link` 와 같은 상세 URL 을 넣었다.
- **`#hd_lnb` hover 를 폭 검사로 바꿨다.** 원본은 로드 시점 폭으로 한 번만 분기해서,
  창을 줄였다 늘리면 PC 메뉴가 죽는다. 이벤트 위임 + 매번 폭 검사로 그 버그를 없앴다.
- **`.scroll_down` 클릭 목표 높이를 클릭 시점에 잰다.** 원본은 로드 시점 값을 가둬 둔다.

### 원본의 깨진 것 / 죽은 것

| 무엇                                               | 원본 상태                                                                         | 템플릿 처리                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Noto Sans KR` 웹폰트                              | `fonts.gstatic.com/ea/notosanskr/v2/` 18개 전부 **404 + CORS 차단** (서비스 종료) | 현행 CSS2 가변축 엔드포인트로 교체                                                                                                |
| `Jalnan` 웹폰트                                    | eot/ttf/woff/woff2 4종(2.3MB)을 싣는데 **어디서도 쓰지 않는다**                   | 싣지 않음 (`fonts/` 없음)                                                                                                         |
| `.ff_fredoka`                                      | index/room/view 제목에 붙는데 **대응 CSS 규칙이 없다**                            | 쓰지 않음 (`.ff_jua` 만 유지)                                                                                                     |
| `.landscape_ico .ico01`                            | `…bottom:-32%;backg}` — 콜론도 값도 없는 **깨진 선언**                            | 깨진 토큰만 제거(렌더 결과 동일)                                                                                                  |
| `.special_list:before`                             | 미디어쿼리 override 만 있고 **기본 규칙이 없다**, 끝에서 `display:none`           | 원본 그대로 둠                                                                                                                    |
| `.room_list .ico03` / `.special_ico .ico02·.ico03` | `url('')` 로 **비어 있는 장식**                                                   | 마크업에서 제외                                                                                                                   |
| `.main_wide_bnr` 안의 `</section>`                 | 섹션 닫는 태그가 **블록 안에** 있다                                               | 바로잡음                                                                                                                          |
| 빈 CSS 규칙 112개                                  | `.main_room {}` 처럼 선언이 없다                                                  | 제거 (stylelint `block-no-empty`)                                                                                                 |
| Swiper 기본 화살표                                 | 원본은 **구버전** `swiper.min.css` 라 `::after` 가 `content:none`                 | 템플릿은 CDN **Swiper 8** 이라 `content:'prev'/'next'`(44px) 글리프가 자체 PNG 화살표 위에 겹친다 → `::after{display:none}` 로 끔 |
| `box-sizing` 중복 / `font-size` + `font:inherit`   | 한 규칙 안에 중복 선언                                                            | 하나만 남김                                                                                                                       |

## 진행 현황

| 구분   | 파일                                                               | 상태               |
| ------ | ------------------------------------------------------------------ | ------------------ |
| 공통   | `styles/theme.css` (토큰 5개)                                      | 완료               |
| 공통   | `styles/reset.css` (원본 reset + 폰트 교체)                        | 완료               |
| 공통   | `styles/style.css` (원본 이식 + 토큰화 + 린트 정리)                | 완료               |
| 공통   | `styles/popup.css`                                                 | 공통본 그대로      |
| 공통   | `images/common/` 장식 PNG/WEBP 27종                                | 완료               |
| 공통   | `js/` 인프라 (PET 복사본 + KIDS 대응)                              | 완료               |
| 공통   | `common/header.html` + `common/footer.html` + 매퍼                 | 완료               |
| 공통   | `js/common.js` (원본 `custom.js` UI 동작 + `TplSwiper` + `TplAos`) | 완료               |
| 페이지 | `index.html` — 원본 `index.html`                                   | 완료               |
| 페이지 | `main.html` — 원본 `about.html` + `view.html` **합본**             | 완료               |
| 페이지 | `layout-map.html` — 원본 `room.html` 목록                          | 완료               |
| 페이지 | `room.html` — 원본 `room.html?room_id=`                            | 완료               |
| 페이지 | `facility.html` — 원본 `special1~9.html`                           | 완료               |
| 페이지 | `reservation.html` — 원본 `reservation.html`                       | 완료               |
| 페이지 | `nearby-attractions.html` — 원본 `travel.html`                     | 완료               |
| 페이지 | `directions.html` — 원본 `traffic.html`                            | 완료               |
| 페이지 | `404.html`                                                         | 공통본 그대로 사용 |

---

## 원본 페이지 → 템플릿 파일명

| 원본 (남양주제이펜션.com) | 템플릿                    | 데이터 소스                                  |
| ------------------------- | ------------------------- | -------------------------------------------- |
| `index.html`              | `index.html`              | `pages.index.sections[0]`                    |
| `about.html`              | `main.html`               | `pages.main.sections[0]`                     |
| `view.html` (외경보기)    | `main.html` **에 흡수**   | `property.images[0].exterior`                |
| `room.html` 목록          | `layout-map.html`         | `pages.layoutMap.sections[0]`                |
| `room.html?room_id=`      | `room.html?room_id=`      | `pages.room[]` + `roomtypes[]` + `rooms[]`   |
| `special1~9.html`         | `facility.html?id=`       | `property.facilities[]`                      |
| `reservation.html`        | `reservation.html`        | `pages.reservation.sections[0]` + `property` |
| `travel.html`             | `nearby-attractions.html` | `pages.nearbyAttractions.sections[0]`        |
| `traffic.html`            | `directions.html`         | `pages.directions.sections[0]` + `property`  |
| —                         | `404.html`                | 공통본                                       |

원본 메뉴는 `ABOUT / ROOMS / SPECIAL / RESERVE / TRAVEL / LOCATION` 6개다.
원본 객실 id 참고 — 남양주제이펜션: `26646~26696` (8실) / bomps: `17918~17922` (5실).
원본 시설 — 남양주제이펜션 7개(`special6`·`special8` 은 주석 처리) / bomps 8개.

⚠️ **원본 `special*.html` 은 시설마다 한 장씩 있는 상세 페이지다.**
그래서 `facility.html?id=` 상세 구조가 원본과 그대로 맞는다.

---

## 공통 — 헤더 / 푸터

`common/header.html` · `common/footer.html` 을 `js/header-footer-loader.js` 가 `#header-wrap` /
`#footer-wrap` 에 주입하고, 주입이 끝나면 `headerFooterLoaded` 이벤트로 `header-footer-mapper.js` 가 돈다.

### 헤더

| `data-*`                              | 소스                                          | 대상                                                           |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `data-logo-image`                     | `homepage.images[0].logo[isSelected].url`     | `.header .logo img`                                            |
| `data-property-name-en`               | `customFields.property.nameEn`                | 로고 텍스트 폴백 (`.logo_text`)                                |
| `data-property-name`                  | `property.name`                               | 로고 부제 폴백 (`.logo_sub`)                                   |
| `data-booking-link`                   | `property.realtimeBookingId`                  | RESERVE 대메뉴 / 예약하기 / `.btn_hd_res`                      |
| `data-rooms-submenu`                  | `customFields.roomtypes[]`                    | ROOMS 서브 (PC `.depth_box` + aside `.depth_list` 동시)        |
| `data-special-submenu`                | `property.facilities[].name`                  | SPECIAL 서브                                                   |
| `data-special-menu`                   | `property.facilities[].length`                | 시설 0개면 SPECIAL 대메뉴째 숨김                               |
| `data-travel-menu`                    | `pages.nearbyAttractions.sections[0].enabled` | TRAVEL 대메뉴 표시/숨김                                        |
| `data-menu-id="layout-map"`           | `pages.layoutMap.sections[0].enabled`         | 「미리보기」 항목 표시/숨김                                    |
| `data-rooms-link`                     | `pages.layoutMap.sections[0].enabled`         | ROOMS 대메뉴 — 켜짐 `layout-map.html` / 꺼짐 첫 객실 상세      |
| `data-homepage-socialLinks-blog`      | `homepage.socialLinks.blog`                   | 네이버 버튼 (헤더 `.hd_sns` + aside `.aside_sns`, 없으면 숨김) |
| `data-homepage-socialLinks-instagram` | `homepage.socialLinks.instagram`              | 인스타그램 버튼 (같은 두 곳, 없으면 숨김)                      |

⚠️ **PC 와 모바일이 같은 `data-*` 를 쓴다.** 매퍼가 `querySelectorAll` 로 돌므로 접미 변형이 필요 없다.

⚠️ **aside 는 `<li>` 구조가 아니다.** `.depth1`(제목 `div`) + `.depth_list`(항목 `ul`) 를
번갈아 늘어놓은 평면 구조이고, 제목을 누르면 `slideToggle` 로 열린다.

⚠️ **`.hd_lnb` hover 는 항목별로 열리지 않는다.** `#hd_lnb` 에 마우스가 들어오면
**모든** `.depth_box` 를 한꺼번에 펼치고 뒤에 `.hd_lnb_bg`(반투명 띠)를 깐다.

⚠️ **`.depth_box` 는 클래스가 아니라 `fadeIn`/`fadeOut` 으로 연다.**
원본 CSS 에 `.depth_box.on` 규칙이 없고 `display:none` 만 있다.
반대로 `.hd_lnb_bg` 는 `.on` 이 `height:460px` 를 주는 **클래스 방식**이다 —
둘이 서로 다른 방식이라는 점이 이 스킨의 함정이다.

⚠️ **헤더는 `position:fixed` 반투명 고정이다.** 스크롤 반전이 없다 — scroll 핸들러를 만들지 말 것.
1023px 이하에서 PC LNB 가 사라지고 로고가 가운데로, 햄버거가 좌측으로 간다.

**네이버·인스타그램 버튼 (`homepage.socialLinks`)** — 원본(jpension/bomps) 헤더에는 없어서 템플릿 구조 기준으로 뒀다.

- 네이버 N 로고 ↔ `socialLinks.blog`(어드민 blog 칸에 네이버 플레이스 주소), 인스타 ↔ `socialLinks.instagram`.
  값이 있을 때만 `href`(+`target=_blank rel=noopener`)를 넣고 노출, `null`·빈 문자열·공백·키 없음 → 숨김.
  마크업은 `style="display: none"` 으로 시작한다(깜빡임 방지).
- `mapSocialLinks()` 는 `facebook / instagram / blog / youtube` 4종을 처리한다(KIDS1 마크업은 blog·instagram 둘).
  버튼이 하나라도 보이면 루트에 `data-social="on"`, 아니면 `"off"` — 래퍼 노출·aside 전환 CSS 의 기준이다
  (`:has()` 는 쓰지 않는다).
- 위치·크기
  - PC(≥1024): 예약하기 박스 바로 왼쪽 `.hd_sns`(absolute `right:92px` / ≤1280 `84px`). 박스와 16px,
    버튼 사이 10px, 높이 30px. 1024px·TRAVEL 켬에서도 메뉴와 72px 떨어져 메뉴 보정은 없다.
  - 480~1023px: 햄버거 오른쪽 14px(`left:65px` / ≤860 `55px`), 높이 24px(예약 아이콘 25px 에 맞춤).
  - 479px 이하: 가운데 로고와 부딪쳐 헤더에서 숨기고 aside 맨 아래(LOCATION 다음) `.aside_sns` 에 30px.
  - 인스타 로고(122×126)는 높이만 고정하고 폭은 비율대로 둔다.
- 어드민 프리뷰 `section_update` 의 `section === 'socialLinks'` 는 `pages[page].sections[0]` 이 아니라
  `homepage.socialLinks` 에 반영하고 헤더 버튼만 다시 매핑한다.

### 푸터

| `data-*`                                       | 소스                                                | 대상                              |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------- |
| `data-logo-image`                              | `homepage.images[0].logo`                           | `.ft_logo img`                    |
| `data-footer-phone-link` / `data-footer-phone` | `property.contactPhone[]`                           | `.tel` (번호 개수만큼 복제 + `    | ` 구분) |
| `data-footer-property-name`                    | `property.name`                                     | `.address` 1행                    |
| `data-footer-address`                          | `property.address` → `businessInfo.businessAddress` | `.address` 2행                    |
| `data-footer-representative`                   | `businessInfo.representativeName`                   | `.address` 3행                    |
| `data-footer-business-number`                  | `businessInfo.businessNumber`                       | `.address` 4행                    |
| `data-ybs-button` / `data-ybs-wrap`            | `property.ybsId`                                    | 야놀자 YBS (없으면 `<p>` 째 숨김) |
| `data-consult-button` / `data-consult-wrap`    | `property.tripPropertyId` + `partnerType`           | `#talk_custom_button`             |

⚠️ **YBS 줄은 두 원본 모두 주석 처리해 뒀다.** 백오피스에 `ybsId` 슬롯이 있으므로 살려 두고
값이 없을 때만 숨긴다.
⚠️ **jpension 은 `.ft_logo` 를 2개 단다**(둘째는 「농어촌민박」 인증마크). 업체 고유 이미지라
백오피스 슬롯이 없다 — 템플릿은 1개만 둔다.
⚠️ `ybsId` / `tripPropertyId` 는 **URL 쿼리에 그대로 붙는 값**이라 `^[A-Za-z0-9_-]+$` 토큰 형태만
통과시킨다. 플레이스홀더 문자열이 내려와도 링크가 깨지지 않는다.
`if (!ybsId)` 만으로는 막히지 않는다 — `"YBS ID"` 같은 안내 문구도 truthy 라
`?ypIdx=YBS ID` 가 만들어진다. 빈 문자열 / 플레이스홀더 / `null` 셋 다 `<p>` 째 숨긴다.

**상담하기 노출 조건** — `partnerType === 'distributor_a'`(총판A) **이고** `tripPropertyId` 가 있을 때.
예약하기(`.ft_btn_reserve`)는 파트너 타입과 무관하고 `.for_m` 이라 **모바일에서만** 뜬다.

⚠️ **`#talk_custom_button` 은 원본 CSS 에 규칙이 없다.** bomps 가 마크업에 인라인 `style` 로
`position:fixed; right:7px; bottom:6px; z-index:999` 를 박아 둔다.
템플릿은 인라인을 걷어내고 `styles/style.css` 에서 규격으로 잡는다 —
**규칙이 없으면 버튼이 문서 흐름에 남아 푸터 아래 흰 띠 + 좌측 하단 버튼이 된다.**

⚠️ 예약하기 버튼의 `bottom` 이 두 원본에서 다르다 — jpension(상담하기 없음) `20px` /
bomps(상담하기 있음) `80px`. 상담하기 노출이 런타임에 갈리므로
`mapConsult` 가 `<html data-consult="on|off">` 를 찍고 CSS 가 그 값으로 두 수치를 재현한다.

---

## index.html

원본 섹션은 **7개**인데 `pages.index` 블록은 **5개**다. 배정은 아래와 같다.

| 원본 섹션                     | 블록                                                   | `data-*`                                                                        |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `.vimeoWrap` 인트로 영상      | `hero.videos[0]`                                       | `data-index-hero-video-wrap` / `data-index-hero-video`                          |
| `.main_visual` 히어로         | `hero`                                                 | `data-index-hero-title` / `-description` / `-slides`                            |
| `.main_about` 펜션 소개       | `essence`                                              | `data-index-about-title` / `-description` / `-list` / `-image`                  |
| `.main_room` 객실 미리보기    | `signature` (문구) + `customFields.roomtypes[]` (카드) | `data-index-room-title` / `-description` / `-list`                              |
| `.main_landscape` 주변 풍경   | `gallery`                                              | `data-index-landscape-section` / `-title` / `-description` / `-list` / `-image` |
| `.main_special` 시설 미리보기 | `closing` (문구) + `property.facilities[]` (카드)      | `data-index-special-section` / `-title` / `-description` / `-list`              |
| `.main_wide_bnr` 마무리 밴드  | **없음** — 숙소명에서 유도                             | `data-property-caption` / `data-index-closing-bg`                               |

⚠️ **`.main_wide_bnr` 에 전용 슬롯이 없다.** 블록 5개는 위 다섯 섹션이 이미 다 쓴다.
원본 문구 자체가 `Thank you for visit {영문 숙소명}` / `저희 {숙소명}에 오신 것을 환영합니다.` 라
`data-property-caption` 으로 유도하고, 배경은 `property.images[0].exterior` → `thumbnail` → `hero` 순으로 채운다.

### 고정 칸 수

| 자리                              | 칸 수 | CSS 근거                   | 이미지 배정                               |
| --------------------------------- | ----- | -------------------------- | ----------------------------------------- |
| `.main_about .bnr_list ul li`     | **4** | `width:calc(25% - 20px)`   | `essence.images[0..3]`                    |
| `.main_about .bnr_list .bnr`      | 1     |                            | `essence.images[4]` (없으면 `[0]` 재사용) |
| `.main_landscape .bnr_list ul li` | **3** | `width:calc(33.3% - 20px)` | `gallery.images[0..2]`                    |
| `.main_landscape .bnr_list .bnr`  | 1     |                            | `gallery.images[3]` (없으면 `[0]` 재사용) |

### 카드 마크업 (객실 / 시설 공용)

```
.swiper-slide > a.link           (카드 전체 덮개)
              + .img_box          (배경 그 자체 — 안쪽 div 가 없다)
              + .txt_box > div > strong + p + a.btn_more
```

⚠️ `.img_box` 는 `padding-bottom:100%` 로 정사각 비율을 잡는다. 높이를 주면 안 된다.
⚠️ hover 하면 `.img_box` 라운드가 펴지고 어두운 막이 올라오면서 `.txt_box` 가 가운데로 떠오른다.
⚠️ **객실 카드는 `strong`=객실명 / `p`=구조**, **시설 카드는 `strong`=영문명 / `p`=한글명** 이다.
순서가 서로 반대다 — 원본 그대로다.

### 인트로 영상

⚠️ `.vimeoWrap` 에는 **CSS 규칙이 하나도 없다.** `<video width="100%">` 가 그대로 문서 흐름에
놓이는 밴드다. 두 원본 다 200MB 가 넘는 파일을 `autoplay` 로 건다.
템플릿은 `hero.videos[]` 에 URL 이 있을 때만 노출하고, 없으면 `.vimeoWrap` 째 숨긴다
(`<video>` 만 비우면 빈 플레이어 박스가 검은 띠로 남는다).
`hero.mediaType` 은 참고만 한다 — `'video'` 인데 `videos[]` 가 빈 응답이 실제로 내려온다.

---

## main.html (원본 `about.html` + `view.html`)

| 구간                 | 소스                                                                        | `data-*`                                            |
| -------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `.sub_visual` 히어로 | 문구 `pages.main.sections[0].hero` / **사진 `property.images[0].exterior`** | `data-main-hero-title` / `-description` / `-slides` |
| `.main_about` 소개   | `pages.main.sections[0].about[]` **블록 수만큼 복제**                       | `data-main-about-blocks`                            |
| `LANDSCAPE` 외경     | `view_card:N` 마커 컷 → `property.images[0].exterior`                       | `data-main-view-section` / `-title` / `-list`       |
| `.wide_img`          | `view_banner` 마커 컷 → 외경 4번째 장                                       | `data-main-wide-image`                              |

### 합본 방식

원본 두 페이지는 **골격이 같고 `.sub_cont` 안의 본문만 다르다.** 그래서 골격을 한 벌만 두고
본문을 세로로 이어붙였다.

```
원본 about.html                    원본 view.html
.sub_visual (슬라이더)              .sub_visual (슬라이더)          ← 골격 동일
.sub_cate_wrap (펜션소개|외경보기)   .sub_cate_wrap (펜션소개|외경보기)  ← 골격 동일
.sub_cont { .main_about            .sub_cont { .title_box(LANDSCAPE)
            .wide_img }                        .landscape_img
                                               .wide_img }
                        ↓
템플릿 main.html
.sub_visual (한 벌만)
.sub_cont { .main_about  →  [data-main-view-section]  →  .wide_img(1개로 통합) }
```

- **서브 탭을 삭제했다.** 한 장으로 합치면 `펜션소개 | 외경보기` 탭이 **자기 자신 둘로 갈리는 꼴**이
  된다. 헤더 ABOUT 서브메뉴에서도 「외경보기」를 뺐다.
- **`.wide_img` 를 1개로 합쳤다.** 원본은 about 끝·view 끝에 각각 하나씩 있어서 그대로 두면
  와이드 사진이 두 장 연달아 나온다.

⚠️ **히어로는 문구와 사진의 출처가 다르다** — 문구는 `about.html`, 사진은 `view.html`(외경)이다.
(사용자 판단 2026-09-15) 그래서 **이 페이지에서 이미지만 `property` 가 1순위**다:
`property.images[0].exterior` → `pages.main.hero.images` → `thumbnail`.
외경 구간도 같은 `exterior` 를 쓴다 — 반복 블록이 `about[]` 을 전부 소비하므로
예전처럼 남는 블록 사진을 주워올 필요가 없다.
원본 `view.html` 히어로가 외경 전체(`view/1~23`)를 도는 구조라 그것을 그대로 재현한 것이다.

⚠️ **히어로와 아래 외경 구간이 같은 pool 을 공유한다.** 원본도 그렇다 —
view.html 히어로가 `view/1~23`, 본문 3칸이 그 중 `view/8` 을 다시 쓴다.

### `.main_about` 반복 블록

`about[]` **길이만큼 `.main_about` 을 복제한다.** 원본은 한 장짜리 페이지라 블록이
하나뿐이지만 백오피스는 배열로 내려준다. 마크업은 `main-mapper.buildAboutBlock()` 이 만든다.

블록 하나 = 제목 + 본문 + 큰 사진 1장 + 가로 그리드(최대 4칸).

| 이미지         | 자리             |
| -------------- | ---------------- |
| `images[0]`    | 큰 사진 (`.bnr`) |
| `images[1..4]` | 가로 그리드      |
| `images[5+]`   | 무시             |

(사용자 판단 2026-09-15 — 「첫 장 = 대표 사진」이 업주가 예측하기 쉽다)

⚠️ **그리드 칸 폭은 장수에 따라 동적이다.** 매퍼가 `ul[data-cols]` 를 찍고 CSS 가 폭을 나눈다.
**1장일 때만 원본 그대로 25% 를 유지한다** — 한 칸이 100% 로 부풀면 옆의 큰 사진(37%)과 겹친다.
그리드 이미지가 없으면 `ul` 자체를 만들지 않는다(큰 사진만 나온다).

⚠️ 제목·본문·사진이 **전부 빈 블록은 건너뛴다** — 배경만 깔린 빈 띠가 남는다.

⚠️ 외경 사진이 한 장도 없으면 제목만 남으므로 구간째 숨긴다.
⚠️ **`LANDSCAPE` 제목 위 여백은 템플릿이 따로 준다**(`[data-main-view-section]{padding-top}`).
원본 `view.html` 은 히어로 아래 서브 탭(`padding:34px 0`)이 그 간격을 만들어 줬는데,
합본하면서 탭을 뺐고 위에 반복 블록이 붙어 제목이 앞 블록 배경에 달라붙기 때문이다.
⚠️ 원본 서브 탭(`.sub_cate_wrap` — 펜션소개 / 외경보기)은 뺐다. 한 장이 됐으므로
탭이 자기 자신 둘로 갈리는 꼴이 된다.

---

## layout-map.html (원본 `room.html` 목록)

| 구간                      | 소스                                | `data-*`                                             |
| ------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `.sub_visual_wide` 히어로 | `pages.layoutMap.sections[0].hero`  | `data-layoutmap-hero-title` / `-description` / `-bg` |
| 객실 탭                   | `customFields.roomtypes[]`          | `data-room-tabs`                                     |
| `ROOM LAYOUT` 제목        | `pages.layoutMap.sections[0].about` | `data-layoutmap-title` / `-description`              |
| 배치도 이미지             | `about.images[isSelected]`          | `data-layoutmap-images`                              |
| 객실 카드                 | `customFields.roomtypes[]`          | `data-room-preview-title` / `data-room-preview-list` |

⚠️ **히어로가 `.sub_visual_wide`(고정 배경형)다.** main / room 상세 / facility 의
`.sub_visual`(슬라이더형)과 구조가 다르다 — `.swiper-container` 도 `.arw` 도 없다.
원본 문구는 `room preview` / `객실 미리보기` 이고, `strong` 은 CSS `text-transform:uppercase` 로 대문자가 된다.
⚠️ **히어로 배경은 객실 사진으로 폴백한다** — `hero.images[0]` → 첫 객실 썸네일 → 숙소 대표 순.
객실 페이지인데 외경이 나오지 않도록 숙소 대표보다 객실 사진을 앞에 둔다.
(원본도 이 자리에 객실 사진 `room/1/9.webp` 를 쓴다)
⚠️ 배치도는 이 페이지의 본론이라 **비어도 영역을 숨기지 않고** placeholder 를 세운다.
⚠️ `sections[0].enabled === false` 면(섹션 자체가 없어도) `404.html?from=layout-map` 으로 리다이렉트한다.

**대메뉴 `ROOMS`(`data-rooms-link`)는 이 값에 따라 이동처가 갈린다.** — `getRoomsEntryLink()`

| `layoutMap` | ROOMS 클릭 시                                     |
| ----------- | ------------------------------------------------- |
| 켜짐        | `layout-map.html` (객실 목록·배치도)              |
| 꺼짐        | 첫 번째 객실 상세 (헤더 객실 메뉴 첫 항목과 같음) |

꺼진 상태에서 그대로 두면 `layout-map.html` 이 404 로 튕긴다. 판정은 이 페이지의 404 기준과 같은
`isLayoutMapEnabled()`(섹션 없음 / `enabled:false` → 꺼짐)를 쓴다. 객실이 하나도 없으면 원래 href 를 둔다.
헤더 「미리보기」 항목과 객실 탭 첫 칸 「미리보기」(layout-map / room 공통)도 같은 기준으로 숨긴다.

### 객실 탭 규칙

⚠️ **Swiper 가 아니다.** `.sub_cate_wrap ul li` 는 `inline-block` 이고 폭을 넘으면 줄바꿈된다.
(PET/K 의 `.swiper-slide` 탭과 다르다)

`roomtypes[].groupName` 이 하나라도 있으면 헤더 ROOMS 메뉴는 **그룹 단위**로 접힌다.
그러면 헤더로는 그룹 안 두 번째 객실부터 도달할 경로가 없어지므로 **탭이 그 통로가 된다.**

**그룹으로 접히는 곳은 헤더 ROOMS 메뉴와 객실 상세 탭뿐이다.**
Room Preview(미리보기) 카드는 그룹과 무관하게 **항상 전체 객실**을 깔고,
카드마다 자기 객실 상세로 연결한다 — 원본이 그렇다.

```
헤더 ROOMS 서브   →  스파동 | 프리미엄동                      (그룹 단위)
스파동 클릭 → 첫 객실 →  미리보기 | 에버골드 | 퍼블하제 | 유메   (그룹 멤버 전개)
미리보기 카드     →  에버골드 | 퍼블하제 | 유메 | …             (전체 객실, 그룹과 무관)
```

멤버가 1실인 그룹은 펼치지 않는다. `groupName` 이 없으면 객실 하나가 항목 하나다.

---

## room.html (원본 `room.html?room_id=`)

| 구간                     | 소스                                                                        | `data-*`                                            |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `.sub_visual` 히어로     | `pages.room[].hero.images` → 객실 사진 전체                                 | `data-room-hero-title` / `-description` / `-slides` |
| 객실 탭                  | `customFields.roomtypes[]`                                                  | `data-room-tabs`                                    |
| `ROOM #N`                | **목록 순번** (`getRoomtypes()` 순서)                                       | `data-room-index`                                   |
| 객실명                   | `roomtypes[].name` → `rooms[].name`                                         | `data-room-name`                                    |
| 설명                     | `pages.room[].gallery.description` → `rooms[].description` → 영문 장식 문구 | `data-room-description`                             |
| `.room_img` 갤러리       | `room_gallery:N` 마커 컷 → `pages.room[].gallery.images` → 객실 사진 (**3칸 고정**) | `data-room-gallery`                                 |
| 정보 표 (PC)             | `rooms[]`                                                                   | `data-room-table-pc`                                |
| 정보 표 (모바일)         | `rooms[]`                                                                   | `data-room-table-m`                                 |
| 집기품목                 | `rooms[].amenities[]`                                                       | `data-room-amenities`                               |
| `.room_floorplan` 평면도 | `roomtype_floorplan` 계열 **1장**                                           | `data-room-floorplan`                               |
| `.wide_img`              | `roomtype_exterior` → 객실 사진 **마지막 장**                               | `data-room-wide-image`                              |
| 객실 카드                | `customFields.roomtypes[]`                                                  | `data-room-preview-list`                            |

⚠️ **PC/모바일 표가 따로다.** 열 구성이 달라 하나로 합칠 수 없다 —
모바일은 「평형」 열이 없고 객실명·유형을 `colspan=2` 로 늘리며, 객실명 칸만 `<span>` 을 한 겹 더 감싼다
(`.table_default td span` 이 폰트 크기를 따로 잡는다).

| 열     | PC                       | 모바일                        |
| ------ | ------------------------ | ----------------------------- |
| 객실명 | `roomtypes[].name`       | 같음 (`colspan=2` + `<span>`) |
| 기준   | `rooms[].baseOccupancy`  | 같음                          |
| 최대   | `rooms[].maxOccupancy`   | 같음                          |
| 유형   | `formatRoomStructure()`  | 같음 (`colspan=2`)            |
| 평형   | `toPyeong(rooms[].size)` | **없음**                      |

⚠️ **구조 문자열 순서는 `침대룸 → 온돌룸 → 거실 → 주방 → 화장실` 고정이다**
(`ROOM_COUNT_LABELS` 선언 순서 = 노출 순서). 개수가 2 이상이면 라벨 뒤에 숫자를 붙인다.
예) `분리형/ 온돌룸2 거실 주방 화장실`
⚠️ 평형은 `rooms[].size`(㎡)를 평으로 환산한다. 원본 표기는 `30.00평` 이지만 `toPyeong()` 은
소수 1자리(`30평`)로 만든다 — 다른 템플릿과 같은 규칙을 따른다.

### 객실 평면도 (템플릿 추가분)

⚠️ **원본에는 이 영역이 없다.** 원본의 배치도는 목록 페이지의 사이트 공통 `layout.webp`
한 장뿐이고 객실 상세에는 그 영역 자체가 없다. 하지만 백오피스가 객실별
`roomtype_floorplan` 을 내려주므로 다른 템플릿과 같이 표준 슬롯으로 둔다.

- **제목 없이 이미지 영역만** 둔다 (사용자 판단 2026-09-15).
- **없으면 영역째 숨긴다** — 평면도는 부가 정보라 없어도 페이지가 성립한다.
  (배치도 = `layout-map` 의 본론이라 placeholder 를 세우는 것과 **반대**다)
- **객실당 한 장만** 쓰고 일반 객실 사진으로 폴백하지 않는다 —
  평면도 자리에 인테리어 사진이 들어가면 잘못된 정보다.

⚠️ CSS 는 `.wide_img` 를 재사용하지 않고 전용 `.room_floorplan` 을 쓴다 —
`.sub_room_detail .wide_img` 가 라운드를 없애고(`border-radius:0`),
`.sub_room .wide_img` 가 아래 220px 여백을 준다. 그 둘은 **외경 사진용** 규칙이라
평면도가 같이 걸리면 전체폭 이미지가 되고 여백이 두 번 쌓인다.
반응형 수치(폭·라운드)는 같은 미디어쿼리에 셀렉터를 나란히 붙여 `.wide_img` 를 그대로 따라간다.

⚠️ **기본 규칙을 반드시 `.wide_img` 옆(= 미디어쿼리보다 앞)에 둔다.**
파일 뒤쪽에 두면 같은 특정성의 미디어쿼리를 소스 순서로 덮어써서 모바일에서 1440px 로 고정된다.

⚠️ **그룹 객실이어도 상세는 들어온 객실 그대로 보여준다.** 헤더 메뉴는 그룹의 첫 객실로
링크하지만, 여기서 첫 객실로 튕기면 그룹의 두 번째 객실에 영영 도달할 수 없다.
(미리보기 카드는 애초에 객실마다 자기 상세로 연결한다.)
⚠️ 객실이 하나도 없으면 `layout-map.html` 로 보낸다.

---

## facility.html (원본 `special1~9.html`)

| 구간                  | 소스                                        | `data-*`                                                |
| --------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `.sub_visual` 히어로  | 시설 사진 전체                              | `data-facility-hero-title` / `-description` / `-slides` |
| 시설 탭               | `property.facilities[]` (`displayOrder` 순) | `data-facility-tabs`                                    |
| `SPECIAL #N`          | **목록 순번**                               | `data-facility-index`                                   |
| 시설명                | `facilities[].name`                         | `data-facility-name`                                    |
| 표어 (`.sub_title`)   | `description` **첫 문단**                   | `data-facility-subtitle`                                |
| 본문 (`.sub_txt2`)    | `description` **나머지 문단**               | `data-facility-description`                             |
| `.special_img` 갤러리 | `special_gallery:N` 마커 컷 → 시설 사진 (**2칸 고정**) | `data-facility-gallery`                                 |
| `.wide_img`           | `special_wide` 마커 컷 → 시설 사진 3번째 장 | `data-facility-wide-image`                              |
| 시설 카드             | `property.facilities[]`                     | `data-special-preview-list`                             |

⚠️ **표어와 본문은 서로 다른 슬롯인데 `facilities[]` 에는 `description` 하나뿐이다.**
그래서 **빈 줄 기준 첫 문단을 표어**, 나머지를 본문으로 가른다.
문단이 하나뿐이면 표어는 비우고 본문만 채운다.
⚠️ 시설 사진 pool 은 `pages.facility[].hero/about.images` → `property.facilities[].images` 순으로
합치고 URL 중복을 제거한다.
⚠️ 시설이 하나도 없으면 `404.html?from=facility` 로 리다이렉트한다
(헤더 SPECIAL 대메뉴도 같은 조건으로 사라진다).

---

## reservation.html

| 구간                      | 소스                                                       | `data-*`                                               |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `.sub_visual_wide` 히어로 | `pages.reservation.sections[0].hero`                       | `data-reservation-hero-title` / `-description` / `-bg` |
| 서브 탭                   | `property.realtimeBookingId`                               | `data-booking-link`                                    |
| `이용안내`                | `about.description` → `property.usageGuide`                | `data-reservation-info-title` / `-text` / `-row`       |
| `환불안내`                | `refundSettings.customerRefundNotice` → `refundPolicies[]` | `data-reservation-refund-text` / `-row`                |

⚠️ 원본은 `<dl class="info_box">` 안에 `dt`(제목) / `dd`(본문) 쌍을 **평면으로** 늘어놓는다.
`dd + dt` 에 위 여백이 붙으므로 쌍을 `<div>` 로 감싸면 안 된다 —
두 요소에 같은 `data-*-row` 를 달아 매퍼가 쌍 단위로 숨긴다.
⚠️ `customerRefundNotice` 가 비면 `refundPolicies[]` 로 원본 문구 꼴을 만든다
(`* 이용일 N일전 취소시 N% 환불`, 100% 는 `전액 환불`, 0% 는 `환불 불가`).

---

## nearby-attractions.html (원본 `travel.html`)

| 구간                      | 소스                    | `data-*`                                          |
| ------------------------- | ----------------------- | ------------------------------------------------- |
| `.sub_visual_wide` 히어로 | `hero`                  | `data-travel-hero-title` / `-description` / `-bg` |
| 본문 제목                 | **고정값 `주변여행지`** | `data-travel-title`                               |
| 목록                      | `about[]`               | `data-travel-list`                                |

⚠️ **히어로 제목은 `travel`(영문), 본문 제목은 `주변여행지`(한글)로 서로 다르다.**
받을 필드가 `hero.title` 하나뿐이라 히어로에만 쓰고 본문 제목은 고정값을 둔다.
⚠️ 원본은 본문(`<p>`)/출처(`<span>`)/거리(`<em>`)가 **서로 다른 요소**인데 `about` 블록에는
`description` 하나뿐이다. **빈 줄 기준으로 가른다** — 1문단→본문, 2문단→출처, 3문단→거리.
문단이 부족하면 그 요소를 만들지 않는다.
⚠️ 짝수 항목은 CSS(`li:nth-of-type(2n)`)가 좌우를 뒤집는다. 마크업은 동일하다.
⚠️ `sections[0].enabled === false` 면 `404.html?from=nearby-attractions` 로 리다이렉트한다.

---

## directions.html (원본 `traffic.html`)

| 구간                      | 소스                                                | `data-*`                                                      |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `.sub_visual_wide` 히어로 | `hero`                                              | `data-directions-hero-title` / `-description` / `-bg`         |
| 본문 제목                 | **고정값 `오시는길`**                               | `data-directions-title`                                       |
| 지도                      | `property.latitude` / `longitude`                   | `#kakao-map`                                                  |
| 주소                      | `property.address` → `businessInfo.businessAddress` | `data-directions-address`                                     |
| 네비게이션                | 같은 주소                                           | `data-directions-navigation`                                  |
| 대중교통                  | `notice.title` / `notice.description`               | `data-directions-transit-title` / `-transit` / `-transit-row` |

⚠️ **아이콘 3개가 줄 순서에 고정돼 있다**(주소 / 네비게이션 / 대중교통).
줄을 늘리거나 줄이면 아이콘 짝이 어긋나므로 3줄 고정으로 둔다.
⚠️ 원본 주소 줄은 `도로명 주소` + `지번 주소` 2줄인데 지번은 받을 필드가 없다.
한 줄만 둔다(라벨 없이 주소만) — `도로명 주소 :` 접두어를 붙이면 지번이 빠진 것이 더 도드라진다.
⚠️ `hero` 에 `description` 필드가 **없다**(스키마상 title/images 뿐). 설명은 숙소명으로 만든다.
⚠️ 좌표가 없어도 지도 영역은 유지하고 placeholder 를 세운다.

---

## 원본이 고른 컷 — `description` 마커

원본은 여러 자리에 사진을 **손으로 골라** 둔다. 사진 배열은 히어로 순서 그대로 두고,
크롤러(`trip-template-crawlers/template-kids1`)가 그 컷을 **사본**으로 덧붙이며 `description` 에
마커를 남긴다 — D2 `room_bnr` · E2 `room_gallery` · A `about_banner` · I `special_card` 와 같은 규약.
(category 는 어드민이 덮어쓰고 배열 순서도 보존되지 않아 `description` 만 살아남는다.
어드민 시설 이미지 업로드도 `description` 을 그대로 넘긴다.)

| 마커                | 실리는 곳                        | 자리                                     | 원본 예 (남양주제이펜션)              |
| ------------------- | -------------------------------- | ---------------------------------------- | ------------------------------------- |
| `room_gallery:N`    | `roomtypes[].images` (interior) | 객실 상세 `.room_img` 3칸                | 멜론 `1 · 6 · 9` (히어로는 `28 · 4 · 5 …`) |
| `view_card:N`       | 외경(`property_exterior`)        | main `LANDSCAPE` 3칸                     | `view/8 · special/1/3 · special/4/1`  |
| `view_banner`       | 외경                             | main `.wide_img`                         | `view/17`                             |
| `special_card`      | `property.facilities[].images`   | index · facility 하단 SPECIAL 카드       | 트램폴린 `special/5/2`                |
| `special_gallery:N` | 시설 사진                        | 시설 상세 `.special_img` 2칸             | 수영장 `2 · 1`                        |
| `special_wide`      | 시설 사진                        | 시설 상세 `.wide_img`                    | 수영장 `3`                            |

- `base-mapper` 의 `getPhotoMark` / `pickMarkedPhotos` / `getMarkedExterior` 가 읽는다.
- 마커 사본은 그 자리 전용이라 **일반 사진 목록에서 뺀다** — `getPropertyImagesByCategory` ·
  `getRoomtypeImages` · `getFacilityImages`(시설 히어로) 가 걸러 히어로 · 폴백 pool 에 섞이지 않는다.
- 마커가 없으면(업주가 직접 올린 사진) 각 자리의 종전 규칙으로 떨어진다.
- 객실 상세 `.wide_img` 는 마커 없이 `roomtype_exterior` 로 받는다 (원래 그 카테고리를 읽는 자리다).

### 객실 히어로 순서 — 인테리어 먼저

`getRoomImages()` 는 `interior → thumbnail → exterior` 순이다. 썸네일은 목록 카드용으로 따로 고른
컷이라(멜론 `room/1/6`) 앞에 두면 히어로 첫 장이 원본(인테리어 순서)과 달라진다.

## 테마 토큰

`js/preview-handler.js` 가 덮어쓰는 토큰은 **5개뿐**이다(색 2 + 폰트 3).
다른 이름을 추가해도 업주가 바꿀 수 없다.

| 토큰                | 값               | 쓰는 곳                                                                                                 |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `--color-primary`   | `#fafafa`        | `.table_default .bg` / `.table_box.for_m .table_default thead th`(≤1023px)                              |
| `--color-secondary` | `#f16b68`        | 예약 버튼(hover 포함) / TOP 점선 / 소개 제목·오프셋 블록 / 풍경 오프셋 블록 / VIEW MORE / 요금표 상단선 |
| `--font-en-main`    | `'Jua'`          | `.title_box h3` / `.sub_visual .visual_txt strong` / `.ff_jua`                                          |
| `--font-ko-main`    | `'Jua'`          | `.visual .visual_txt strong` / `.sub_visual_wide .visual_box strong`                                    |
| `--font-ko-sub`     | `'Noto Sans KR'` | `reset.css` 전역 본문                                                                                   |

### 색 배정

브랜드 색은 **3계열**인데 슬롯은 2개다.

| 계열    | 값        | 사용처                                    | 처리                |
| ------- | --------- | ----------------------------------------- | ------------------- |
| 🔴 코랄 | `#f16b68` | 버튼·제목·선                              | `--color-secondary` |
| 🟢 민트 | `#91cbaa` | 메뉴 hover 밑줄, 히어로 `Welcome To` 배지 | **하드코딩**        |
| 🟣 보라 | `#9d9ce9` | index 히어로 제목 배지                    | **하드코딩**        |

민트·보라를 고정한 것은 사용자 판단이다(2026-09-15) — 다른 템플릿 관례대로
primary 에 「연한 배경 톤」을 두기로 했다. 보라는 `.sub_visual .visual_txt strong{background:none}`
때문에 index 히어로 한 곳에만 살아 있다.

⚠️ **원본은 코랄을 3개로 쪼개 쓴다** — 전부 `--color-secondary` 로 통합했다.

| 원본 값   | 위치                | H / S / L          | 처리                                                   |
| --------- | ------------------- | ------------------ | ------------------------------------------------------ |
| `#f16b68` | `.btn_hd_res`       | 1° / 83% / 68%     | 토큰                                                   |
| `#ef746e` | `.btn_more`         | 3° / 80% / 68%     | 토큰 (기본색과 **밝기까지 같다** — 오타 수준)          |
| `#f27a77` | `.btn_hd_res:hover` | 1° / 83% / **71%** | `color-mix(in srgb, var(--color-secondary) 88%, #fff)` |

hover 는 기본색보다 **3% 밝다** — 오타가 아니라 의도된 효과라 그냥 통합하면 hover 가 죽는다.
흰색 12% 를 섞으면 `≈#f37d7a` 로 원본과 ΔE 1.5(육안 구분 불가)이고,
업주가 어떤 색을 넣어도 hover 가 그 색의 밝은 버전이 된다.
통합하지 않으면 업주가 색을 바꿔도 **예약버튼 hover 와 VIEW MORE 는 코랄로 남는다.**

### ⚠️ 색 토큰의 도달 범위가 좁다

섹션 바탕이 CSS 색이 아니라 **1920px 풀컬러 이미지**이고 브랜드 색이 그 안에 구워져 있다(지배색 실측).

| 이미지                   | 지배색                         | 섹션            |
| ------------------------ | ------------------------------ | --------------- |
| `main_room_bg.webp`      | 코랄 `rgb(240,96,96)` **62%**  | ROOM PREVIEW    |
| `main_landscape_bg.webp` | 청록 `rgb(72,192,192)` **99%** | LANDSCAPE       |
| `main_special_bg.webp`   | 노랑 `rgb(264,192,48)` 48%     | SPECIAL PREVIEW |
| `main_about_bg.webp`     | 연분홍                         | 소개            |
| `footer_bg.png`          | 하늘·초록 일러스트             | 푸터            |

`main_room_bg.webp` 의 코랄은 `--color-secondary` 와 사실상 같은 색이다.
업주가 secondary 를 바꾸면 버튼·제목만 바뀌고 **섹션 배경은 코랄로 남아 오히려 어긋난다.**
(PET 에서 푸터 초록을 토큰으로 빼지 않은 것과 같은 이유다)

→ **색 토큰은 사실상 바꾸지 않는 전제로 둔다.** 리브랜딩이 필요하면 토큰이 아니라
위 배경 이미지부터 교체해야 한다.

### 폰트

실제 서체는 **Jua + Noto Sans KR 2종**인데 슬롯이 3개라 en-main 과 ko-main 이 같은 값이 된다.
원본이 한/영 제목에 모두 Jua 를 쓰므로 정상이다 — 억지로 다른 서체를 끼우지 않았다.

⚠️ **토큰 뒤에는 폰트명을 붙이지 않는다.** 시스템 폴백(`'Malgun Gothic'`, `dotum`, `sans-serif`)만 단다.
토큰 바로 뒤에 `'Noto Sans KR'` 을 붙이면 업주가 고른 폰트에 없는 글자가 전부 그쪽으로 새어 나가
토큰이 무력해진다. `preview-handler.applyFont` 도 같은 전제다 —
기존 값의 **마지막 항목(generic family)만** 폴백으로 남기고 덮어쓴다.

⚠️ `--font-ko-sub` 는 `reset.css` 의 `body` / `select, input, textarea` 2곳에 배선돼 있다.
이식 직후에는 원본처럼 `'Noto Sans KR'` 이 하드코딩돼 있어 **토큰이 아무 효과가 없었다.**

---

## 검증

`standard-template-data.json` 에 **원본(남양주제이펜션) 실제 데이터**를 넣고 전 페이지를 확인했다.
JSON 은 백오피스 구조(키 트리)를 **한 글자도 바꾸지 않았다** — 값과 배열 길이만 채웠다.

| 항목                                           | 결과                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run lint` (eslint / stylelint / htmlhint) | 통과 (에러 0, 경고 12 — 전부 PET 에서 가져온 인프라 공통분)             |
| 전 페이지 jsdom 스모크                         | 매핑 정상, 콘솔 에러 0                                                  |
| Playwright PC(1600) / 모바일(390) 렌더         | 전 페이지 정상, 콘솔 에러 0                                             |
| 원본 사이트와 섹션 대조                        | `.main_landscape` / `.main_special` / 객실 표 / 시설 상세 레이아웃 일치 |

---

## 카피라이트 (`data-copyright`)

푸터 카피라이트는 `property.tripProviderName`(Trip11 공급자명)으로 렌더한다.

`common/footer.html` 의 카피라이트 요소에 템플릿 문자열을 두고,
`header-footer-mapper.js` 의 `mapCopyright()` 가 `{provider}` 를 치환한다.

```html
<a href="http://trip11.kr/" data-copyright="COPYRIGHT©{provider}. ALL RIGHTS RESERVED.">
  COPYRIGHT©(주)트립일레븐. ALL RIGHTS RESERVED.
</a>
```

| `property.tripProviderName` | 결과                                  |
| --------------------------- | ------------------------------------- |
| `"신비서"`                  | `COPYRIGHT©신비서. ALL RIGHTS RESERVED.` |
| `""` / 미입력               | HTML 에 적힌 기존 문구 그대로          |

- 문구 형식(대소문자, `ⓒ` 접두, `(주)` 표기)은 템플릿마다 달라서 **형식은 `data-copyright` 속성값이 갖고
  매퍼는 이름만 바꾼다**.
- 값이 없을 때(백오피스 미입력 → `""`) 는 건드리지 않으므로 기존 트립일레븐 문구가 그대로 남는다.
- `trip11.kr` 링크는 변경하지 않는다.

---

## landing.html (선택 기능 — 여러 숙소 게이트)

t-template-A 와 같은 구현이다 (상세 스키마·카드 구조는 `t-template-A/data-mapping.md` 의 landing 절).
헤더/푸터가 없는 별도 페이지이고, 카드(`pages.landing.sections[0].about[]`, 1~3장)를 그리드로 나란히 놓는다.

**루트 가드** — `IndexMapper.mapPage()` → `maybeRedirectToLanding()` → `shouldEnterLanding()`

- 어드민 프리뷰 iframe 안이면 skip
- `pages.landing.sections[0].enabled !== true` 면 skip — **명시적으로 켠 숙소만** 가로챈다.
  섹션이 없거나 `enabled` 가 false/누락이면 기존처럼 `index.html` 을 그대로 보여준다
- `document.referrer` 가 같은 origin 이면 skip (헤더/푸터 로고, 랜딩의 자기 자신 카드)
- `document.referrer` 호스트가 `about[].domain` 중 하나면 skip (연결 숙소 랜딩에서 카드로 넘어옴)
- 그 외 (주소 직접 입력·즐겨찾기·검색/외부 링크) → `location.replace('landing.html')`

`landing.html` 을 직접 열었는데 `enabled !== true` 면 `404.html` 로 보낸다.

쿼리 파라미터 없이 **referrer** 로 "랜딩을 이미 거쳤는지" 를 가른다. 그래서 헤더/푸터 로고 링크는 원래대로
`./index.html`, 랜딩 카드도 `./index.html` / `{domain}/` 로 보낸다.

- 크로스 도메인 referrer 는 브라우저 기본 정책(`strict-origin-when-cross-origin`)상 origin 만 오므로 호스트로만 비교한다 (`www.` 유무 무시).
- 연결 숙소 B 의 랜딩 `about[]` 에 A 의 도메인이 없으면, A 랜딩 → B 카드 클릭 시 B 의 랜딩이 한 번 더 뜬다.
- https → http 로 넘어가면 브라우저가 referrer 를 보내지 않아 랜딩이 다시 뜬다 (연결 숙소 도메인은 https 전제).

**카드 링크** (`landing-mapper.js` `getCardLink()`) — 전부 새 탭. 도착한 index 는 referrer 로 랜딩을 건너뛴다.

| 조건                                         | 이동                          |
| -------------------------------------------- | ----------------------------- |
| `about[i].propertyId === property.id`        | `./index.html`                |
| 연결 숙소 + `about[i].domain` 있음           | `{domain}/`                   |
| 연결 숙소인데 `domain` 없음                  | `href="#"` (비활성)           |

카드 배경은 `about[i].images` 첫 장, 로고는 `hero.images[]` 중 `blockId === about[i].blockId`,
로고가 없으면 `about[i].propertyName` 텍스트, `about[i].title` 은 입력했을 때만 보인다.
