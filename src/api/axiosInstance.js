import axios from 'axios'
import { getAccessToken } from './authToken'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// 인증 토큰 연결
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

export default axiosInstance