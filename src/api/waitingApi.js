import axiosInstance from './axiosInstance'

// 현장 웨이팅 등록
export async function createWaiting({ popId, phone, peopleCount }) {
  const res = await axiosInstance.post('/api/waitings', { popId, phone, peopleCount })
  return res.data
}

// 웨이팅 상태 조회
export async function getWaiting(waitingId) {
  const res = await axiosInstance.get(`/api/waitings/${waitingId}`)
  return res.data
}

// 웨이팅 취소
export async function cancelWaiting(waitingId) {
  const res = await axiosInstance.patch(`/api/waitings/${waitingId}/cancel`)
  return res.data
}
