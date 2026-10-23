import axiosInstance from './axiosInstance'

// TODO: API 명세서에 맞게 주소 확인
export const getPopups = (params) => axiosInstance.get('/api/popups', { params })
export const getPopupById = (popupId) => axiosInstance.get(`/api/popups/${popupId}`)
