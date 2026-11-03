import axiosInstance from './axiosInstance'

// 내 예약 목록 조회 (GET /api/mypage/reservations)
export async function getMyReservations() {
  const res = await axiosInstance.get('/api/mypage/reservations')
  return Array.isArray(res.data) ? res.data : (res.data?.content ?? [])
}