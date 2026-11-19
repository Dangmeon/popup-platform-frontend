export const featuredPopups = [
  {
    id: 'loopy',
    category: '캐릭터',
    tag: '잔망루피 POP-UP STORE',
    title: '잔망루피는 못 말려!',
    poster: '/poster-loopy.png',
    period: '2026.12.01(화) ~ 12.31(목)',
    time: '10:00 ~ 20:00',
    location: '롯데월드몰 1F 아트리움 팝업존',
    zones: ['PHOTO ZONE', 'GOODS SHOP', 'EVENT ZONE', 'LOOPY BAR'],
    goodsGuide: '/loopy-goods-guide.png',
    goods: [
      { id: 'loopy-1', name: '잔망루피 보조배터리', price: 32900, image: '/loopy-battery.png', limited: true },
      { id: 'loopy-2', name: '잔망루피 탁상시계', price: 19900, image: '/loopy-clock.png', limited: true },
      { id: 'loopy-3', name: '잔망루피 LED 무드등', price: 27900, image: '/loopy-lamp.png', limited: true },
      { id: 'loopy-4', name: '잔망루피 블루투스 스피커', price: 49900, image: '/loopy-speaker.png', limited: true },
      { id: 'loopy-5', name: '잔망루피 마우스 패드', price: 15900, image: '/loopy-mousepad.png', limited: true },
    ],
  },
  {
    id: 'chiikawa',
    category: '캐릭터',
    tag: '치이카와 POP-UP STORE',
    title: '치이카와는 귀여워!',
    poster: '/chiikawa/poster.png',
    period: '2027.02.02(화) ~ 02.28(일)',
    time: '10:00 ~ 20:00',
    location: 'IFC몰 서울 L1 팝업존',
    zones: ['PHOTO ZONE', 'GOODS SHOP', 'EVENT ZONE', 'SWEETS CAFE'],
    goodsGuide: '/chiikawa/goods-guide.png',
    goods: [
      { id: 'chiikawa-1', name: '치이카와 티셔츠', price: 39900, image: '/chiikawa/tshirt.png', limited: true },
      { id: 'chiikawa-2', name: '치이카와 2027 캘린더', price: 12900, image: '/chiikawa/calendar.png', limited: true },
      { id: 'chiikawa-3', name: '치이카와 인형', price: 24900, image: '/chiikawa/doll.png', limited: true },
      { id: 'chiikawa-4', name: '치이카와 토트백', price: 22900, image: '/chiikawa/totebag.png', limited: true },
      { id: 'chiikawa-5', name: '우사기 산타 키링', price: 16900, image: '/chiikawa/keyring.png', limited: true },
    ],
  },
  {
    id: 'gal',
    category: '패션',
    tag: 'GAL POP-UP STORE',
    title: 'GAL POP-UP STORE',
    poster: '/gal/GYARU 포스터.webp',
    period: '2027.03.01(월) ~ 03.31(수)', // TODO: 실제 일정으로 교체 (임시값)
    time: '10:00 ~ 20:00', // TODO: 임시값
    location: '장소 미정', // TODO: 실제 장소로 교체
    zones: ['PHOTO ZONE', 'GOODS SHOP', 'EVENT ZONE'], // TODO: 포스터에 존 안내가 없어 임시값
    goodsGuide: '', // 굿즈 안내 이미지가 없으면 비워 둠 (안내 섹션이 자동으로 숨겨짐)
    imageFit: 'contain', // 흰 배경 누끼 사진이라 잘리지 않게 전체 표시
    goods: [
      { id: 'gal-1', name: '핑크 퍼 후드 크롭 집업', price: 54000, image: '/gal/핑크 퍼 후드 크롭 집업.webp', limited: true, popupId: 'gal', popupTitle: 'GAL POP-UP STORE' },
      { id: 'gal-2', name: '핑크 벨트 러플 데님 스커트', price: 43000, image: '/gal/핑크 벨트 러플 데님 스커트.webp', limited: true, popupId: 'gal', popupTitle: 'GAL POP-UP STORE' },
      { id: 'gal-3', name: '핑크 크로스 빈티지 볼캡', price: 29000, image: '/gal/핑크 크로스 빈티지 볼캡.webp', limited: false, popupId: 'gal', popupTitle: 'GAL POP-UP STORE' },
      { id: 'gal-4', name: '핑크 하트 리본 숄더백', price: 46000, image: '/gal/핑크 하트 리본 숄더백.webp', limited: true, popupId: 'gal', popupTitle: 'GAL POP-UP STORE' },
      { id: 'gal-5', name: '핑크 버터플라이 고글 선글라스', price: 27000, image: '/gal/핑크 버터플라이 고글 선글라스.webp', limited: false, popupId: 'gal', popupTitle: 'GAL POP-UP STORE' },
    ],
  },
  {
    id: 'kinetic',
    category: '스포츠',
    tag: 'KINETIC POP-UP STORE',
    title: 'KINETIC 팝업스토어',
    poster: '/kinetic/poster-kinetic.png',
    period: '2026.12.01(화) ~ 12.31(목)', // TODO: 임시값 (가상 브랜드)
    time: '10:00 ~ 20:00', // TODO: 임시값
    location: '서울 성수 팝업존', // TODO: 임시값
    zones: ['LIMITED DROP', 'GOODS SHOP', 'RUNNING LAB', 'LOCKER ROOM'], // TODO: 임시값
    goodsGuide: '', // 굿즈 안내 이미지 없음 (안내 섹션이 자동으로 숨겨짐)
    goods: [
      // TODO: 가격은 모두 임시값
      { id: 'kinetic-bag', name: '차콜 더플백', price: 89000, image: '/kinetic/kinetic-bag.png', limited: true },
      { id: 'kinetic-shoe', name: '러닝화', price: 129000, image: '/kinetic/kinetic-shoe.png', limited: true },
      { id: 'kinetic-bottle', name: '텀블러', price: 29000, image: '/kinetic/kinetic-bottle.png', limited: false },
      { id: 'kinetic-towel', name: '스포츠 타월', price: 15000, image: '/kinetic/kinetic-towel.png', limited: false },
      { id: 'kinetic-cap', name: '볼캡', price: 39000, image: '/kinetic/kinetic-cap.png', limited: true },
    ],
  },
  // 홍보 배너 시연용 팝업. 실제 팝업 API 연결 시 교체합니다.
  {
    "id": "aespa",
    "category": "ENTERTAINMENT",
    "tag": "에스파 POP-UP STORE",
    "title": "aespa LEMONADE 팝업스토어",
    "poster": "/promo/aespa.png",
    "period": "2026.12.01(화) ~ 12.31(목)",
    "time": "운영시간 안내 예정",
    "location": "롯데월드몰 1F 아트리움 팝업존",
    "zones": [
      "POP-UP EXPERIENCE"
    ],
    "goodsGuide": "",
    "goods": [],
    "description": "에스파의 강렬한 LEMONADE 콘셉트를 만나는 팝업 공간입니다.",
    "about": "에스파의 강렬한 LEMONADE 콘셉트를 만나는 팝업 공간입니다. 프론트엔드 시연용 더미 팝업이며 실제 예약은 제공하지 않습니다.",
    "isPromoDemo": true,
    "mainBanner": true,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "imageFit": "contain"
  },
  {
    "id": "chimchakman",
    "category": "ENTERTAINMENT",
    "tag": "침착맨 POP-UP STORE",
    "title": "침착맨 팝업스토어",
    "poster": "/promo/chimchakman.png",
    "period": "2026.12.01(화) ~ 12.31(목)",
    "time": "운영시간 안내 예정",
    "location": "롯데월드몰 1F 아트리움 팝업존",
    "zones": [
      "POP-UP EXPERIENCE"
    ],
    "goodsGuide": "",
    "goods": [],
    "description": "침착맨 특유의 유쾌한 세계관을 담은 팝업 공간입니다.",
    "about": "침착맨 특유의 유쾌한 세계관을 담은 팝업 공간입니다. 프론트엔드 시연용 더미 팝업이며 실제 예약은 제공하지 않습니다.",
    "isPromoDemo": true,
    "mainBanner": true,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "imageFit": "contain"
  },
  {
    "id": "black-white-cooks",
    "category": "FOOD",
    "tag": "흑백요리사 POP-UP STORE",
    "title": "흑백요리사 팝업스토어",
    "poster": "/promo/black-white-cooks.png",
    "period": "2026.12.01(화) ~ 12.31(목) · 예시 일정",
    "time": "운영시간 안내 예정",
    "location": "장소 안내 예정",
    "zones": [
      "POP-UP EXPERIENCE"
    ],
    "goodsGuide": "",
    "goods": [],
    "description": "흑과 백, 두 가지 콘셉트로 만나는 요리 테마 팝업입니다.",
    "about": "흑과 백, 두 가지 콘셉트로 만나는 요리 테마 팝업입니다. 프론트엔드 시연용 더미 팝업이며 실제 예약은 제공하지 않습니다.",
    "isPromoDemo": true,
    "mainBanner": true,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "imageFit": "contain"
  },
  {
    "id": "rescene",
    "category": "ENTERTAINMENT",
    "tag": "리센느 POP-UP STORE",
    "title": "RESCENE 팝업스토어",
    "poster": "/promo/rescene.png",
    "period": "2026.12.01(화) ~ 12.31(목) · 예시 일정",
    "time": "운영시간 안내 예정",
    "location": "장소 안내 예정",
    "zones": [
      "POP-UP EXPERIENCE"
    ],
    "goodsGuide": "",
    "goods": [],
    "description": "리센느의 감성을 담은 포토 공간과 팝업 콘텐츠를 만나보세요.",
    "about": "리센느의 감성을 담은 포토 공간과 팝업 콘텐츠를 만나보세요. 프론트엔드 시연용 더미 팝업이며 실제 예약은 제공하지 않습니다.",
    "isPromoDemo": true,
    "mainBanner": true,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "imageFit": "contain"
  },
  {
    "id": "squid-game",
    "category": "ENTERTAINMENT",
    "tag": "오징어게임 POP-UP STORE",
    "title": "오징어게임 팝업스토어",
    "poster": "/promo/squid-game.png",
    "period": "2026.12.01(화) ~ 12.31(목) · 예시 일정",
    "time": "운영시간 안내 예정",
    "location": "장소 안내 예정",
    "zones": [
      "POP-UP EXPERIENCE"
    ],
    "goodsGuide": "",
    "goods": [],
    "description": "오징어게임의 상징적인 공간과 소품을 만나는 테마 팝업입니다.",
    "about": "오징어게임의 상징적인 공간과 소품을 만나는 테마 팝업입니다. 프론트엔드 시연용 더미 팝업이며 실제 예약은 제공하지 않습니다.",
    "isPromoDemo": true,
    "mainBanner": true,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "imageFit": "contain"
  },
]

// 목록 카드(PopupCard)용으로 변환 — 샘플 팝업과 같은 필드 구조
// likes, reserved, capacity는 임시 숫자입니다.
const CARD_META = {
  loopy:    { startDate: '2026-12-01', endDate: '2026-12-31', likes: 150, reserved: 40, capacity: 100 },
  chiikawa: { startDate: '2027-02-02', endDate: '2027-02-28', likes: 180, reserved: 50, capacity: 100 },
  gal:      { startDate: '2027-03-01', endDate: '2027-03-31', likes: 160, reserved: 20, capacity: 100 }, // TODO: 임시값
  kinetic:  { startDate: '2026-12-01', endDate: '2026-12-31', likes: 140, reserved: 30, capacity: 100 }, // TODO: 임시값
}

export const featuredCards = featuredPopups.map((f) => ({
  id: f.id,
  title: f.title,
  category: f.category,
  location: f.location,
  image: f.poster,
  startDate: f.startDate,
  endDate: f.endDate,
  ...CARD_META[f.id],
}))

// 홈 '인기 굿즈' 섹션용 — 모든 포스터 팝업의 굿즈를 한 배열로 펼침
export const featuredGoods = [
  ...featuredPopups.flatMap((f) =>
    f.goods.map((g) => ({
      ...g,
      popupId: f.id,
      popupTitle: f.title,
      imageFit: f.imageFit,
    }))
  ),
  { id: 'maru-1', name: '마루는 강쥐 디오라마 아크릴 스탠드', price: 25000, image: '/마루는강쥐/diorama.webp', limited: true, popupId: 'maru', popupTitle: '마루는 강쥐 팝업스토어' },
  { id: 'maru-2', name: '마루는 강쥐 봉제 인형', price: 28000, image: '/마루는강쥐/doll.webp', limited: true, popupId: 'maru', popupTitle: '마루는 강쥐 팝업스토어' },
  { id: 'maru-3', name: '마루는 강쥐 인형 키링', price: 14000, image: '/마루는강쥐/keyring.webp', limited: true, popupId: 'maru', popupTitle: '마루는 강쥐 팝업스토어' },
  { id: 'maru-4', name: '마루는 강쥐 LED 무드등', price: 32000, image: '/마루는강쥐/lamp.webp', limited: true, popupId: 'maru', popupTitle: '마루는 강쥐 팝업스토어' },
  { id: 'maru-5', name: '마루는 강쥐 폴라로이드 세트', price: 9000, image: '/마루는강쥐/polaroid.webp', limited: false, popupId: 'maru', popupTitle: '마루는 강쥐 팝업스토어' },
  
  { id: 'shinchan-1', name: '짱구는못말려 맹구 피규어', price: 24000, image: '/짱구는못말려/맹구 피규어.webp', limited: true, popupId: 'shinchan', popupTitle: '짱구는못말려 팝업스토어' },
  { id: 'shinchan-2', name: '짱구는못말려 짱구 피규어', price: 26000, image: '/짱구는못말려/짱구 피규어.webp', limited: true, popupId: 'shinchan', popupTitle: '짱구는못말려 팝업스토어' },
  { id: 'shinchan-3', name: '짱구는못말려 토끼 인형 키링', price: 14000, image: '/짱구는못말려/토끼 키링.webp', limited: true, popupId: 'shinchan', popupTitle: '짱구는못말려 팝업스토어' },
  { id: 'shinchan-4', name: '짱구는못말려 흰둥이 가방', price: 32000, image: '/짱구는못말려/흰둥이 가방.webp', limited: false, popupId: 'shinchan', popupTitle: '짱구는못말려 팝업스토어' },
  { id: 'shinchan-5', name: '짱구는못말려 흰둥이 텀블러', price: 19000, image: '/짱구는못말려/흰둥이 텀블러.webp', limited: false, popupId: 'shinchan', popupTitle: '짱구는못말려 팝업스토어' },
  
  { id: 'choonsik-1', name: '춘식이 토토리 파우치', price: 34000, image: '/춘식이/도토리 파우치.webp', limited: true, popupId: 'choonsik', popupTitle: '춘식이 팝업스토어' },
  { id: 'choonsik-2', name: '춘식이 실내슬리퍼', price: 22000, image: '/춘식이/실내슬리퍼.webp', limited: false, popupId: 'choonsik', popupTitle: '춘식이 팝업스토어' },
  { id: 'choonsik-3', name: '춘식이 잠옷', price: 45000, image: '/춘식이/잠옷.webp', limited: true, popupId: 'choonsik', popupTitle: '춘식이 팝업스토어' },
  { id: 'choonsik-4', name: '춘식이 키링', price: 14000, image: '/춘식이/키링.webp', limited: true, popupId: 'choonsik', popupTitle: '춘식이 팝업스토어' },
  { id: 'choonsik-5', name: '춘식이 텀블러', price: 21000, image: '/춘식이/텀블러.webp', limited: false, popupId: 'choonsik', popupTitle: '춘식이 팝업스토어' },
  
  { id: 'rescene-1', name: '리센느 리트와메트 티셔츠', price: 38000, image: '/리센느/리트와메트 티셔츠.webp', limited: true, popupId: 'rescene', popupTitle: 'RESCENE 팝업스토어' },
  { id: 'rescene-2', name: '리센느 미나미 선크림', price: 22000, image: '/리센느/미나미 선크림.webp', limited: false, popupId: 'rescene', popupTitle: 'RESCENE 팝업스토어' },
  { id: 'rescene-3', name: '리센느 섬유탈취제', price: 16000, image: '/리센느/섬유탈취제.webp', limited: false, popupId: 'rescene', popupTitle: 'RESCENE 팝업스토어' },
  { id: 'rescene-4', name: '리센느 신라공주 보냉병', price: 29000, image: '/리센느/신라공주 보냉병.webp', limited: true, popupId: 'rescene', popupTitle: 'RESCENE 팝업스토어' },
  { id: 'rescene-5', name: '리센느 오이쉬 트레이닝복', price: 68000, image: '/리센느/오이쉬 트레이닝복.webp', limited: true, popupId: 'rescene', popupTitle: 'RESCENE 팝업스토어' },
  
  { id: 'aespa-1', name: '에스파 레모네이드 링', price: 25000, image: '/에스파/레모네이드 링.webp', limited: true, popupId: 'aespa', popupTitle: 'aespa LEMONADE 팝업스토어' },
  { id: 'aespa-2', name: '에스파 레모네이드 반팔', price: 42000, image: '/에스파/레모네이드 반팔.webp', limited: true, popupId: 'aespa', popupTitle: 'aespa LEMONADE 팝업스토어' },
  { id: 'aespa-3', name: '에스파 레모네이드 백', price: 36000, image: '/에스파/레모네이드 백.webp', limited: true, popupId: 'aespa', popupTitle: 'aespa LEMONADE 팝업스토어' },
  { id: 'aespa-4', name: '에스파 레모네이드 캡', price: 34000, image: '/에스파/레모네이드 캡.webp', limited: false, popupId: 'aespa', popupTitle: 'aespa LEMONADE 팝업스토어' },
  { id: 'aespa-5', name: '에스파 레모네이드 텀블러', price: 23000, image: '/에스파/레모네이드 텀블러.webp', limited: false, popupId: 'aespa', popupTitle: 'aespa LEMONADE 팝업스토어' },
  
  { id: 'squid-game-1', name: '오징어게임 달고나', price: 12000, image: '/오징어게임/달고나 .webp', limited: false, popupId: 'squid-game', popupTitle: '오징어게임 팝업스토어' },
  { id: 'squid-game-2', name: '오징어게임 십자가 목걸이', price: 24000, image: '/오징어게임/십자가 목걸이.webp', limited: true, popupId: 'squid-game', popupTitle: '오징어게임 팝업스토어' },
  { id: 'squid-game-3', name: '오징어게임 에코백', price: 22000, image: '/오징어게임/에코백.webp', limited: false, popupId: 'squid-game', popupTitle: '오징어게임 팝업스토어' },
  { id: 'squid-game-4', name: '오징어게임 영희 무드등', price: 35000, image: '/오징어게임/영희 무드등.webp', limited: true, popupId: 'squid-game', popupTitle: '오징어게임 팝업스토어' },
  { id: 'squid-game-5', name: '오징어게임 참가자 저지', price: 69000, image: '/오징어게임/참가자 저지.webp', limited: true, popupId: 'squid-game', popupTitle: '오징어게임 팝업스토어' },
  
  { id: 'chimchakman-1', name: '침착맨 침렉스 시계', price: 49000, image: '/침착맨/침렉스 시계.webp', limited: true, popupId: 'chimchakman', popupTitle: '침착맨 팝업스토어' },
  { id: 'chimchakman-2', name: '침착맨 침착 모자', price: 32000, image: '/침착맨/침착 모자.webp', limited: false, popupId: 'chimchakman', popupTitle: '침착맨 팝업스토어' },
  { id: 'chimchakman-3', name: '침착맨 침착 소주잔', price: 14000, image: '/침착맨/침착 소주잔.webp', limited: true, popupId: 'chimchakman', popupTitle: '침착맨 팝업스토어' },
  { id: 'chimchakman-4', name: '침착맨 침착 장패드', price: 24000, image: '/침착맨/침착 장패드.webp', limited: false, popupId: 'chimchakman', popupTitle: '침착맨 팝업스토어' },
  { id: 'chimchakman-5', name: '침착맨 침착 쿠션', price: 29000, image: '/침착맨/침착 쿠션.webp', limited: true, popupId: 'chimchakman', popupTitle: '침착맨 팝업스토어' },
  
  { id: 'black-white-cooks-1', name: '흑백요리사 그릇,주걱 세트', price: 32000, image: '/흑백요리사/그릇,주걱.webp', limited: true, popupId: 'black-white-cooks', popupTitle: '흑백요리사 팝업스토어' },
  { id: 'black-white-cooks-2', name: '흑백요리사 블라인드 안대', price: 15000, image: '/흑백요리사/블라인드 안대.webp', limited: false, popupId: 'black-white-cooks', popupTitle: '흑백요리사 팝업스토어' },
  { id: 'black-white-cooks-3', name: '흑백요리사 흑백 머그컵', price: 19000, image: '/흑백요리사/흑백 머그컵.webp', limited: false, popupId: 'black-white-cooks', popupTitle: '흑백요리사 팝업스토어' },
  { id: 'black-white-cooks-4', name: '흑백요리사 흑백 숟가락 뱃지', price: 12000, image: '/흑백요리사/흑백 숟가락 뱃지.webp', limited: true, popupId: 'black-white-cooks', popupTitle: '흑백요리사 팝업스토어' },
  { id: 'black-white-cooks-5', name: '흑백요리사 흑백 앞치마', price: 36000, image: '/흑백요리사/흑백 앞치마.webp', limited: true, popupId: 'black-white-cooks', popupTitle: '흑백요리사 팝업스토어' },
  
  { id: 'wig-1', name: '브라운 롱 웨이브 가발', price: 35000, image: '/wig&hair/브라운 롱 웨이브 가발.webp', limited: false, popupId: 'wig-hair', popupTitle: 'WIG & HAIR 팝업스토어' },
  { id: 'wig-2', name: '다크 브라운 시스루뱅 스트레이트 가발', price: 33000, image: '/wig&hair/다크 브라운 시스루뱅 스트레이트 가발.webp', limited: false, popupId: 'wig-hair', popupTitle: 'WIG & HAIR 팝업스토어' },
  { id: 'wig-3', name: '애쉬 베이지 여신 웨이브 가발', price: 37000, image: '/wig&hair/애쉬 베이지 여신 웨이브 가발.webp', limited: true, popupId: 'wig-hair', popupTitle: 'WIG & HAIR 팝업스토어' },
  { id: 'wig-4', name: '모카 브라운 블랙 리본 하프업 가발', price: 39000, image: '/wig&hair/모카 브라운 블랙 리본 하프업 가발.webp', limited: true, popupId: 'wig-hair', popupTitle: 'WIG & HAIR 팝업스토어' },
  { id: 'wig-5', name: '로즈 핑크 번 헤어 롱 가발', price: 38000, image: '/wig&hair/로즈 핑크 번 헤어 롱 가발.webp', limited: true, popupId: 'wig-hair', popupTitle: 'WIG & HAIR 팝업스토어' },
  
  { id: 'another-day-1', name: '마운틴 맨투맨', price: 59000, image: '/어나더데이/마운틴 맨투맨.webp', limited: true, popupId: 'another-day', popupTitle: '어나더데이 팝업스토어' },
  { id: 'another-day-2', name: '어반 카고 와이드 바지', price: 68000, image: '/어나더데이/어반 카고 와이드 바지.webp', limited: false, popupId: 'another-day', popupTitle: '어나더데이 팝업스토어' },
  { id: 'another-day-3', name: '슬로우 앤 스테디 마운틴 캡', price: 36000, image: '/어나더데이/슬로우 앤 스테디 마운틴 캡.webp', limited: false, popupId: 'another-day', popupTitle: '어나더데이 팝업스토어' },
  { id: 'another-day-4', name: '마운틴 핸들 텀블러', price: 32000, image: '/어나더데이/마운틴 핸들 텀블러.webp', limited: true, popupId: 'another-day', popupTitle: '어나더데이 팝업스토어' },
  { id: 'another-day-5', name: '마운틴 드로우스트링 가방', price: 45000, image: '/어나더데이/마운틴 드로우스트링 가방.webp', limited: false, popupId: 'another-day', popupTitle: '어나더데이 팝업스토어' },
  
  { id: 'nevore-1', name: 'NEVORE 트위드 크롭 자켓 ', price: 128000, image: '/NEVORE/트위드 크롭 자켓.webp', limited: true, popupId: 'nevore', popupTitle: 'NEVORE 팝업스토어' },
  { id: 'nevore-2', name: 'NEVORE 핀턱 와이드 팬츠 ', price: 78000, image: '/NEVORE/핀턱 와이드 팬츠.webp', limited: false, popupId: 'nevore', popupTitle: 'NEVORE 팝업스토어' },
  { id: 'nevore-3', name: 'NEVORE 골드 엠블럼 숄더백 ', price: 96000, image: '/NEVORE/골드 엠블럼 숄더백.webp', limited: true, popupId: 'nevore', popupTitle: 'NEVORE 팝업스토어' },
  { id: 'nevore-4', name: 'NEVORE 스퀘어 선글라스 ', price: 64000, image: '/NEVORE/스퀘어 선글라스.webp', limited: false, popupId: 'nevore', popupTitle: 'NEVORE 팝업스토어' },
  { id: 'nevore-5', name: 'NEVORE 스트랩 앵클부츠 ', price: 118000, image: '/NEVORE/스트랩 앵클부츠.webp', limited: true, popupId: 'nevore', popupTitle: 'NEVORE 팝업스토어' },
  
  { id: 'runner-1', name: '러너 스니커즈 실버 화이트', price: 119000, image: '/STEP-IN/러너 스니커즈 실버 화이트.webp', limited: false, popupId: 'STEP-IN', popupTitle: 'STEP-IN 팝업스토어' },
  { id: 'runner-2', name: '러너 스니커즈 샌드 베이지', price: 119000, image: '/STEP-IN/러너 스니커즈 샌드 베이지.webp', limited: false, popupId: 'STEP-IN', popupTitle: 'STEP-IN 팝업스토어' },
  { id: 'runner-3', name: '러너 스니커즈 올블랙', price: 119000, image: '/STEP-IN/러너 스니커즈 올블랙.webp', limited: false, popupId: 'STEP-IN', popupTitle: 'STEP-IN 팝업스토어' },
  { id: 'runner-4', name: '러너 스니커즈 화이트', price: 129000, image: '/STEP-IN/러너 스니커즈 화이트 블랙.webp', limited: true, popupId: 'STEP-IN', popupTitle: 'STEP-IN 팝업스토어' },
  { id: 'runner-5', name: '러너 스니커즈 메탈릭', price: 129000, image: '/STEP-IN/러너 스니커즈 메탈릭 실버.webp', limited: true, popupId: 'STEP-IN', popupTitle: 'STEP-IN 팝업스토어' },
  
  { id: 'funky-1', name: 'FUNKY 스타 레더 라이더 자켓', price: 149000, image: '/FUNKY/스타 레더 라이더 자켓.webp', limited: true, popupId: 'FUNKY', popupTitle: 'FUNKY 팝업스토어' },
  { id: 'funky-2', name: 'FUNKY 체인 카고 팬츠', price: 98000, image: '/FUNKY/체인 카고 팬츠.webp', limited: false, popupId: 'FUNKY', popupTitle: 'FUNKY 팝업스토어' },
  { id: 'funky-3', name: 'FUNKY 크로스 워싱 볼캡', price: 42000, image: '/FUNKY/크로스 워싱 볼캡.webp', limited: false, popupId: 'FUNKY', popupTitle: 'FUNKY 팝업스토어' },
  { id: 'funky-4', name: 'FUNKY 스터드 숄더백', price: 89000, image: '/FUNKY/스터드 숄더백.webp', limited: true, popupId: 'FUNKY', popupTitle: 'FUNKY 팝업스토어' },
  { id: 'funky-5', name: 'FUNKY 버클 플랫폼 부츠', price: 135000, image: '/FUNKY/버클 플랫폼 부츠.webp', limited: true, popupId: 'FUNKY', popupTitle: 'FUNKY 팝업스토어' },
  
  { id: 'neoguri-1', name: '너구리 봉제 인형', price: 27900, image: '/너구리/봉제 인형.webp', limited: true, popupId: 'neoguri', popupTitle: '너구리 팝업스토어' },
  { id: 'neoguri-2', name: '너구리 스노클 키링', price: 14900, image: '/너구리/스노클 키링.webp', limited: true, popupId: 'neoguri', popupTitle: '너구리 팝업스토어' },
  { id: 'neoguri-3', name: '너구리 스낵 백팩', price: 29900, image: '/너구리/스낵 백팩.webp', limited: true, popupId: 'neoguri', popupTitle: '너구리 팝업스토어' },
  { id: 'neoguri-4', name: '너구리 아크릴 스탠드 세트', price: 22900, image: '/너구리/아크릴 스탠드 세트.webp', limited: true, popupId: 'neoguri', popupTitle: '너구리 팝업스토어' },
  { id: 'neoguri-5', name: '너구리 스페셜 박스', price: 34900, image: '/너구리/스페셜 박스.webp', limited: true, popupId: 'neoguri', popupTitle: '너구리 팝업스토어' },
  
  { id: 'br-1', name: '스쿱 인형', price: 28900, image: '/베스킨라빈스/스쿱 인형.webp', limited: false, popupId: 'baskin-robbins', popupTitle: '베스킨라빈스 팝업스토어' },
  { id: 'br-2', name: '아이스크림 랜덤박스', price: 34900, image: '/베스킨라빈스/아이스크림 랜덤박스.webp', limited: true, popupId: 'baskin-robbins', popupTitle: '베스킨라빈스 팝업스토어' },
  { id: 'br-3', name: '아이스크림 키링', price: 14900, image: '/베스킨라빈스/아이스크림 키링.webp', limited: false, popupId: 'baskin-robbins', popupTitle: '베스킨라빈스 팝업스토어' },
  { id: 'br-4', name: '플레이버 파우치', price: 22900, image: '/베스킨라빈스/플레이버 파우치.webp', limited: false, popupId: 'baskin-robbins', popupTitle: '베스킨라빈스 팝업스토어' },
  { id: 'br-5', name: '핑스 스쿱 텀블러', price: 26900, image: '/베스킨라빈스/핑스 스쿱 텀블러.webp', limited: true, popupId: 'baskin-robbins', popupTitle: '베스킨라빈스 팝업스토어' },
  
  { id: 'binggrae-1', name: '골든 바나나 피규어', price: 39900, image: '/빙그레/골든 바나나 피규어.webp', limited: true, popupId: 'binggrae', popupTitle: '빙그레 팝업스토어' },
  { id: 'binggrae-2', name: '달콤 왕국 텀블러', price: 24900, image: '/빙그레/달콤 왕국 텀블러.webp', limited: false, popupId: 'binggrae', popupTitle: '빙그레 팝업스토어' },
  { id: 'binggrae-3', name: '미니 바나나 우유 키링', price: 14900, image: '/빙그레/미니 바나나 우유 키링.webp', limited: false, popupId: 'binggrae', popupTitle: '빙그레 팝업스토어' },
  { id: 'binggrae-4', name: '밀크 프렌즈 블랭킷', price: 27900, image: '/빙그레/밀크 프렌즈 블랭킷.webp', limited: true, popupId: 'binggrae', popupTitle: '빙그레 팝업스토어' },
  { id: 'binggrae-5', name: '바나나 우유 인형', price: 29900, image: '/빙그레/바나나 우유 인형.webp', limited: false, popupId: 'binggrae', popupTitle: '빙그레 팝업스토어' },
  
  { id: 'jinramen-1', name: '골드 라면 피규어', price: 39900, image: '/진라면/골드 라면 피규어.webp', limited: true, popupId: 'jinramen', popupTitle: '진라면 팝업스토어' },
  { id: 'jinramen-2', name: '진라면 그릇 머그컵', price: 24900, image: '/진라면/진라면 그릇 머그컵.webp', limited: false, popupId: 'jinramen', popupTitle: '진라면 팝업스토어' },
  { id: 'jinramen-3', name: '진라면 로고 에코백', price: 26900, image: '/진라면/진라면 로고 에코백.webp', limited: false, popupId: 'jinramen', popupTitle: '진라면 팝업스토어' },
  { id: 'jinramen-4', name: '진라면 캐릭터 인형', price: 28900, image: '/진라면/진라면 캐릭터 인형.webp', limited: true, popupId: 'jinramen', popupTitle: '진라면 팝업스토어' },
  { id: 'jinramen-5', name: '진라면 패키지 키링', price: 12900, image: '/진라면/진라면 패키지 키링.webp', limited: false, popupId: 'jinramen', popupTitle: '진라면 팝업스토어' },
  
  { id: 'jinro-1', name: '골드 두꺼비 피규어', price: 49900, image: '/진로/골드 두꺼비 피규어.webp', limited: true, popupId: 'jinro', popupTitle: '진로 팝업스토어' },
  { id: 'jinro-2', name: '두꺼비 소주잔 세트', price: 19900, image: '/진로/두꺼비 소주잔 세트.webp', limited: false, popupId: 'jinro', popupTitle: '진로 팝업스토어' },
  { id: 'jinro-3', name: '두꺼비 왕 인형', price: 34900, image: '/진로/두꺼비 왕 인형.webp', limited: true, popupId: 'jinro', popupTitle: '진로 팝업스토어' },
  { id: 'jinro-4', name: '두꺼비 키캡 세트', price: 24900, image: '/진로/두꺼비 키캡 세트.webp', limited: false, popupId: 'jinro', popupTitle: '진로 팝업스토어' },
  { id: 'jinro-5', name: '두꺼비 후드티', price: 39900, image: '/진로/두꺼비 후드티.webp', limited: false, popupId: 'jinro', popupTitle: '진로 팝업스토어' },
  
  { id: 'slowave-1', name: 'SLOW/AVE 세라믹 티팟 & 컵 세트', price: 48000, image: '/SLOWAVE/슬로우웨이브 세라믹 티팟 & 컵 세트.webp', limited: false, popupId: 'slowave', popupTitle: 'SLOWAVE 팝업스토어' },
  { id: 'slowave-2', name: 'SLOW/AVE 세라믹 화병 & 트레이 세트', price: 39000, image: '/SLOWAVE/슬로우웨이브 세라믹 화병 & 트레이 세트.webp', limited: false, popupId: 'slowave', popupTitle: 'SLOWAVE 팝업스토어' },
  { id: 'slowave-3', name: 'SLOW/AVE 코튼 파자마 & 리넨 패브릭 세트', price: 64000, image: '/SLOWAVE/슬로우웨이브 코튼 파자마 & 리넨 패브릭 세트.webp', limited: true, popupId: 'slowave', popupTitle: 'SLOWAVE 팝업스토어' },
  { id: 'slowave-4', name: 'SLOW/AVE 스톤 인센스 홀더 & 스틱 세트', price: 28000, image: '/SLOWAVE/슬로우웨이브 스톤 인센스 홀더 & 스틱 세트.webp', limited: true, popupId: 'slowave', popupTitle: 'SLOWAVE 팝업스토어' },
  { id: 'slowave-5', name: 'SLOW/AVE 룸 스프레이 & 왁스 타블렛 세트', price: 32000, image: '/SLOWAVE/슬로우웨이브 룸 스프레이 & 왁스 타블렛 세트.webp', limited: false, popupId: 'slowave', popupTitle: 'SLOWAVE 팝업스토어' },

  { id: 'lost-found-1', name: 'LOST&FOUND 아웃도어 후드 자켓', price: 118000, image: '/LOST&FOUND/LOST&FOUND 아웃도어 후드 자켓.webp', limited: false, popupId: 'LOST&FOUND', popupTitle: 'LOST & FOUND 팝업스토어' },
  { id: 'lost-found-2', name: 'LOST&FOUND 롤탑 백팩', price: 89000, image: '/LOST&FOUND/LOST&FOUND 롤탑 백팩.webp', limited: true, popupId: 'LOST&FOUND', popupTitle: 'LOST & FOUND 팝업스토어' },
  { id: 'lost-found-3', name: 'LOST&FOUND 파라코드 나이프 & 카라비너 세트', price: 46000, image: '/LOST&FOUND/LOST&FOUND 파라코드 나이프 & 카라비너 세트.webp', limited: false, popupId: 'LOST&FOUND', popupTitle: 'LOST & FOUND 팝업스토어' },
  { id: 'lost-found-4', name: 'LOST&FOUND 폴딩 화로대 & 매트 세트', price: 74000, image: '/LOST&FOUND/LOST&FOUND 폴딩 화로대 & 매트 세트.webp', limited: true, popupId: 'LOST&FOUND', popupTitle: 'LOST & FOUND 팝업스토어' },
  { id: 'lost-found-5', name: 'LOST&FOUND 티타늄 머그 & 폴딩 커트러리 세트', price: 38000, image: '/LOST&FOUND/LOST&FOUND 티타늄 머그 & 폴딩 커트러리 세트.webp', limited: false, popupId: 'LOST&FOUND', popupTitle: 'LOST & FOUND 팝업스토어' },

  { id: 'soum-1', name: 'SOUM 코르크 요가매트 & 스트레치 밴드 세트', price: 54000, image: '/SOUM/SOUM 코르크 요가매트 & 스트레치 밴드 세트.webp', limited: false, popupId: 'SOUM', popupTitle: 'SOUM 팝업스토어' },
  { id: 'soum-2', name: 'SOUM 핸들 텀블러 세트', price: 36000, image: '/SOUM/SOUM 핸들 텀블러 세트.webp', limited: false, popupId: 'SOUM', popupTitle: 'SOUM 팝업스토어' },
  { id: 'soum-3', name: 'SOUM 싱잉볼 & 아로마 오일 명상 세트', price: 62000, image: '/SOUM/SOUM 싱잉볼 & 아로마 오일 명상 세트.webp', limited: true, popupId: 'SOUM', popupTitle: 'SOUM 팝업스토어' },
  { id: 'soum-4', name: 'SOUM 슈퍼푸드 허브티 & 로우푸드 그래놀라 세트', price: 34000, image: '/SOUM/SOUM 슈퍼푸드 허브티 & 로우푸드 그래놀라 세트.webp', limited: false, popupId: 'SOUM', popupTitle: 'SOUM 팝업스토어' },
  { id: 'soum-5', name: 'SOUM 하드커버 노트 & 만년필 세트', price: 42000, image: '/SOUM/SOUM 하드커버 노트 & 만년필 세트.webp', limited: true, popupId: 'SOUM', popupTitle: 'SOUM 팝업스토어' },

  { id: 'nmd-1', name: 'NMD 3in1 폴딩 무선 충전 스테이션 세트', price: 68000, image: '/NMD/NMD 3in1 폴딩 무선 충전 스테이션 세트.webp', limited: true, popupId: 'NMD', popupTitle: 'NMD 팝업스토어' },
  { id: 'nmd-2', name: 'NMD 알루미늄 노트북 스탠드 & 파우치 세트', price: 59000, image: '/NMD/NMD 알루미늄 노트북 스탠드 & 파우치 세트.webp', limited: false, popupId: 'NMD', popupTitle: 'NMD 팝업스토어' },
  { id: 'nmd-3', name: 'NMD 스탠드 맥세이프 보조배터리 세트', price: 54000, image: '/NMD/NMD 스탠드 맥세이프 보조배터리 세트.webp', limited: true, popupId: 'NMD', popupTitle: 'NMD 팝업스토어' },
  { id: 'nmd-4', name: 'NMD 미니멀 백팩', price: 88000, image: '/NMD/NMD 미니멀 백팩.webp', limited: false, popupId: 'NMD', popupTitle: 'NMD 팝업스토어' },
  { id: 'nmd-5', name: 'NMD 지퍼 테크 파우치', price: 29000, image: '/NMD/NMD 지퍼 테크 파우치.webp', limited: false, popupId: 'NMD', popupTitle: 'NMD 팝업스토어' },

  { id: 'vbe-1', name: 'VBE LP 바이닐 & 슬립매트 세트', price: 52000, image: '/VBE/VBE LP 바이닐 & 슬립매트 세트.webp', limited: true, popupId: 'VBE', popupTitle: 'VBE 팝업스토어' },
  { id: 'vbe-2', name: 'VBE 하드커버 다이어리 & 브라스 북마크 세트', price: 38000, image: '/VBE/VBE 하드커버 다이어리 & 브라스 북마크 세트.webp', limited: false, popupId: 'VBE', popupTitle: 'VBE 팝업스토어' },
  { id: 'vbe-3', name: 'VBE 시그니처 드립백 커피 & 위스키 시럽 세트', price: 36000, image: '/VBE/VBE 시그니처 드립백 커피 & 위스키 시럽 세트.webp', limited: true, popupId: 'VBE', popupTitle: 'VBE 팝업스토어' },
  { id: 'vbe-4', name: 'VBE 글라스 컵 & 레더·펠트 코스터 세트', price: 34000, image: '/VBE/VBE 글라스 컵 & 레더·펠트 코스터 세트.webp', limited: false, popupId: 'VBE', popupTitle: 'VBE 팝업스토어' },
  { id: 'vbe-5', name: 'VBE 우드 캔들 홀더 & 티라이트 세트', price: 29000, image: '/VBE/VBE 우드 캔들 홀더 & 티라이트 세트.webp', limited: false, popupId: 'VBE', popupTitle: 'VBE 팝업스토어' },
]