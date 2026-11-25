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

// 자동 조회에서 거절된 번호는 사용자가 다시 조회할 때까지 재요청하지 않음
export function createWaitingPoll() {
  const blocked = new Map()
  return async function pollWaiting(waitingId) {
    if (blocked.has(waitingId)) throw blocked.get(waitingId)
    try {
      return await getWaiting(waitingId)
    } catch (error) {
      if ([400, 401, 403, 404].includes(error.response?.status)) blocked.set(waitingId, error)
      throw error
    }
  }
}

// 웨이팅 취소
export async function cancelWaiting(waitingId) {
  const res = await axiosInstance.patch(`/api/waitings/${waitingId}/cancel`)
  return res.data
}
