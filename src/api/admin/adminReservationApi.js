import http from '../axiosInstance.js'
import { id, rows } from './liveUtils.js'

export const reservationStatusLabels={HOLD:'확정 대기',CONFIRMED:'예약 확정',CANCELLED:'예약 취소',EXPIRED:'예약 만료',USED:'이용 완료'}

// 백엔드 feature/104-admin-reservation-list의 AdminReservationResponse 계약.
// develop 반영 전의 404를 빈 목록이나 데모 데이터로 바꾸지 않습니다.
export async function getAdminReservations({popId,status='',signal} = {}) {
  if(status && !(status in reservationStatusLabels))throw new Error('예약 상태를 확인해 주세요.')
  const response=await http.get(`/api/admin/popups/${id(popId)}/reservations`,{params:{status:status||undefined},signal})
  const data=rows(response.data)
  if(data.some(row=>!Number.isSafeInteger(row.reservationId)||row.popId!==Number(popId)||!(row.reservationStatus in reservationStatusLabels)))throw new Error('예약 목록 응답을 확인하지 못했습니다.')
  return data
}
export function adminReservationError(error) {
  if(error.response?.status===404)return '예약 현황을 조회할 수 없습니다. 서버 반영 상태와 선택한 팝업을 확인해 주세요.'
  if(error.response?.status===403)return '이 팝업의 예약을 조회할 권한이 없습니다.'
  if(error.response?.status===401)return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  return error.response?.data?.message || '예약 현황을 불러오지 못했습니다. 다시 시도해 주세요.'
}
