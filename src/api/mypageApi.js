import axiosInstance from './axiosInstance'

// 내 예약 목록 조회 (GET /api/mypage/reservations)
export async function getMyReservations() {
  const res = await axiosInstance.get('/api/mypage/reservations')
  return Array.isArray(res.data) ? res.data : (res.data?.content ?? [])
}
// 내 쿠폰 목록 조회
export async function getMyCoupons(signal) {
  const { data } = await axiosInstance.get('/api/coupons/my', { signal })
  if (!Array.isArray(data)) throw new Error('쿠폰 목록 응답 형식이 올바르지 않습니다.')
  return data
}
