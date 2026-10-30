import {
  getMockWaitings,
  getMockWaiting,
} from './mockWaitings'

// 현장 대기 목록 조회
export async function getWaitings(params = {}) {
  // 나중에 바꿀 부분: 실제 관리자 팝업별 웨이팅 목록 API 호출
  const response = await getMockWaitings(params)

  // 나중에 바꿀 부분: 서버의 목록 응답을 화면 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 현장 대기 상세 조회
export async function getWaiting(waitingId) {
  // 나중에 바꿀 부분: 관리자 권한에 맞는 웨이팅 상세 조회 방식으로 교체
  const response = await getMockWaiting(waitingId)

  // 나중에 바꿀 부분: 서버 필드와 상태값을 화면 형식으로 변환
  return response
}