import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// TODO: 로그인 토큰 처리 방식이 확정되면 추가 (현재는 구현하지 않음)

export default axiosInstance
