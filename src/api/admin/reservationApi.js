import {
  getMockReservations,
  getMockReservation,
  visitMockReservation,
} from './mockReservations'

// 예약 목록 조회
export async function getReservations(params = {}) {
  // 나중에 바꿀 부분: 실제 관리자 예약 목록 API 호출
  const response = await getMockReservations(params)

  // 나중에 바꿀 부분: 실제 서버 응답을 아래 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 예약 상세 조회
export async function getReservation(id) {
  // 나중에 바꿀 부분: 실제 관리자 예약 상세 API 호출
  const response = await getMockReservation(id)

  // 나중에 바꿀 부분: 실제 서버 응답을 화면의 예약 필드로 변환
  return response
}

// 방문 처리
export async function visitReservation(id) {
  // 나중에 바꿀 부분: 실제 관리자 수동 방문 처리 API 호출
  const response = await visitMockReservation(id)

  // 나중에 바꿀 부분: 실제 서버 응답을 화면의 예약 필드로 변환
  return response
}