// 나중에 제거할 부분: 실제 대시보드 API 연결 후 사용하지 않는 더미 데이터

// 임시 대시보드 데이터
const dashboard = {
  stats: [
    {
      title: '오늘 예약',
      value: '128',
      unit: '건',
      icon: '📅',
      change: '+12%',
    },
    {
      title: '현재 웨이팅',
      value: '24',
      unit: '명',
      icon: '👥',
      change: '혼잡 시 운영',
    },
    {
      title: '결제 완료',
      value: '46',
      unit: '건',
      icon: '🛍️',
      change: '+8%',
    },
    {
      title: '재고 부족 상품',
      value: '3',
      unit: '개',
      icon: '📦',
      change: '확인 필요',
    },
  ],

  weeklyReservations: [
    { day: '월', reserved: 75, entered: 62 },
    { day: '화', reserved: 95, entered: 80 },
    { day: '수', reserved: 82, entered: 70 },
    { day: '목', reserved: 115, entered: 92 },
    { day: '금', reserved: 105, entered: 88 },
    { day: '토', reserved: 145, entered: 128 },
    { day: '일', reserved: 128, entered: 110 },
  ],

  popupCrowding: [
    { id: 1, name: '성수 POPQ 팝업', percent: 85, waiting: 18 },
    { id: 2, name: '홍대 캐릭터 팝업', percent: 60, waiting: 6 },
    { id: 3, name: '강남 굿즈 팝업', percent: 32, waiting: 0 },
  ],

  recentOrders: [
    {
      id: 'ORD-1001',
      product: 'POPQ 한정 키링',
      price: 12000,
      status: 'PAID',
    },
    {
      id: 'ORD-1002',
      product: '캐릭터 인형',
      price: 25000,
      status: 'PAID',
    },
    {
      id: 'ORD-1003',
      product: '한정 스티커 세트',
      price: 8000,
      status: 'EXPIRED',
    },
    {
      id: 'ORD-1004',
      product: 'POPQ 에코백',
      price: 18000,
      status: 'CANCELLED',
    },
  ],

  lowStockProducts: [
    { id: 1, name: 'POPQ 한정 키링', stock: 2 },
    { id: 2, name: '캐릭터 인형', stock: 1 },
    { id: 3, name: 'POPQ 에코백', stock: 0 },
  ],

  popularPopups: [
    { id: 1, name: '성수 POPQ 팝업', reservations: 320 },
    { id: 2, name: '홍대 캐릭터 팝업', reservations: 245 },
    { id: 3, name: '강남 굿즈 팝업', reservations: 180 },
  ],
}

// 대시보드 조회
export async function getMockDashboard() {
  return {
    stats: dashboard.stats.map((item) => ({ ...item })),
    weeklyReservations: dashboard.weeklyReservations.map(
      (item) => ({ ...item })
    ),
    popupCrowding: dashboard.popupCrowding.map(
      (item) => ({ ...item })
    ),
    recentOrders: dashboard.recentOrders.map(
      (item) => ({ ...item })
    ),
    lowStockProducts: dashboard.lowStockProducts.map(
      (item) => ({ ...item })
    ),
    popularPopups: dashboard.popularPopups.map(
      (item) => ({ ...item })
    ),
  }
}