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
    poster: '/gal/poster.png',
    period: '2027.03.01(월) ~ 03.31(수)', // TODO: 실제 일정으로 교체 (임시값)
    time: '10:00 ~ 20:00', // TODO: 임시값
    location: '장소 미정', // TODO: 실제 장소로 교체
    zones: ['PHOTO ZONE', 'GOODS SHOP', 'EVENT ZONE'], // TODO: 포스터에 존 안내가 없어 임시값
    goodsGuide: '', // 굿즈 안내 이미지가 없으면 비워 둠 (안내 섹션이 자동으로 숨겨짐)
    imageFit: 'contain', // 흰 배경 누끼 사진이라 잘리지 않게 전체 표시
    goods: [
      { id: 'gal-1', name: '핑크 퍼 후드 집업', price: 0, image: '/gal/hoodie.png', limited: true }, // TODO: 가격
      { id: 'gal-2', name: '데님 레이어드 미니스커트', price: 0, image: '/gal/skirt.png', limited: true },
      { id: 'gal-3', name: '블랙 카고 팬츠', price: 0, image: '/gal/pants.png', limited: true },
      { id: 'gal-4', name: '핑크 빈티지 볼캡', price: 0, image: '/gal/cap-1.png', limited: true },
      { id: 'gal-5', name: '블랙 빈티지 볼캡', price: 0, image: '/gal/cap-2.png', limited: true },
      { id: 'gal-6', name: '핑크 숄더백', price: 0, image: '/gal/bag-pink.png', limited: true },
      { id: 'gal-7', name: '블랙 숄더백', price: 0, image: '/gal/bag-black.png', limited: true },
      { id: 'gal-8', name: '버터플라이 선글라스', price: 0, image: '/gal/sunglasses.png', limited: true },
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
export const featuredGoods = featuredPopups.flatMap((f) =>
  f.goods.map((g) => ({
    ...g,
    popupId: f.id,
    popupTitle: f.title,
    imageFit: f.imageFit,
  }))
)