import axiosInstance from './axiosInstance'

// TODO: 예약 API는 명세서 확정 후 작성
export const getReservations = () => axiosInstance.get('/api/reservations')
