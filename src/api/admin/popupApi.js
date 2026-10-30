import {
  getMockPopups,
  getMockPopup,
} from './mockPopups'

// 팝업 목록 조회
export async function getPopups(params = {}) {
  // 나중에 바꿀 부분: 실제 팝업 목록 API 호출
  const response = await getMockPopups(params)

  // 나중에 바꿀 부분: 서버 응답을 화면의 목록 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 팝업 상세 조회
export async function getPopup(popId) {
  // 나중에 바꿀 부분: 실제 팝업 상세 API 호출
  const response = await getMockPopup(popId)

  // 나중에 바꿀 부분: 서버 필드와 운영 상태를 화면 형식으로 변환
  return response
}