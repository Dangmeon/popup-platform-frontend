import http from '../axiosInstance.js'

// 관리자 회원 목록을 페이지 단위로 조회
export async function getMembers({ signal } = {}) {
  const members = new Map()
  let page = 0
  let totalPages
  do {
    const { data } = await http.get('/api/admin/members', { params: { page, size: 50 }, signal })
    if (!Array.isArray(data?.content) || data.number !== page ||
        !Number.isSafeInteger(data.totalPages) || data.totalPages < 0) {
      throw new Error('회원 목록 응답을 확인하지 못했습니다.')
    }
    for (const member of data.content) {
      if (!Number.isSafeInteger(member?.memberId) || member.memberId < 1) {
        throw new Error('회원 정보 응답을 확인하지 못했습니다.')
      }
      members.set(member.memberId, member)
    }
    totalPages = data.totalPages
    page += 1
  } while (page < totalPages)
  return [...members.values()]
}
