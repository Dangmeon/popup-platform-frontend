import {
  getMockMembers,
  getMockMember,
} from './mockMembers'

// 회원 목록 조회
export async function getMembers(params = {}) {
  // 나중에 바꿀 부분: 실제 관리자 회원 목록 API 호출
  const response = await getMockMembers(params)

  // 나중에 바꿀 부분: 서버의 페이지 응답을 화면 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 회원 상세 조회
export async function getMember(id) {
  // 나중에 바꿀 부분: 팀 명세에 맞는 회원 상세 조회 방식으로 교체
  const response = await getMockMember(id)

  // 나중에 바꿀 부분: 실제 서버 응답을 화면의 회원 필드로 변환
  return response
}