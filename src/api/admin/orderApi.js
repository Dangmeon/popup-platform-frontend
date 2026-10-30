import {
  getMockOrders,
  getMockOrder,
} from './mockOrders'

// 주문 목록 조회
export async function getOrders(params = {}) {
  // 나중에 바꿀 부분: 실제 관리자 주문 목록 API 호출
  const response = await getMockOrders(params)

  // 나중에 바꿀 부분: 서버의 페이지 응답을 화면 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 주문 상세 조회
export async function getOrder(id) {
  // 나중에 바꿀 부분: 실제 관리자 주문 상세 API 호출
  const response = await getMockOrder(id)

  // 나중에 바꿀 부분: 서버의 상태값과 금액 정보를 화면 형식으로 변환
  return response
}