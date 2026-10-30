import { getMockDashboard } from './mockDashboard'

// 대시보드 조회
export async function getDashboard() {
  // 나중에 바꿀 부분: 실제 관리자 대시보드 API 호출
  const response = await getMockDashboard()

  // 나중에 바꿀 부분: 서버 통계 응답을 화면 형식으로 변환
  return {
    stats: response.stats,
    weeklyReservations: response.weeklyReservations,
    popupCrowding: response.popupCrowding,
    recentOrders: response.recentOrders,
    lowStockProducts: response.lowStockProducts,
    popularPopups: response.popularPopups,
  }
}