import axiosInstance from './axiosInstance'

// 로그인
export async function loginRequest({ username, password }) {
  if (!axiosInstance.defaults.baseURL?.trim()) {
    throw new Error('백엔드 서버 주소가 설정되지 않았습니다.')
  }

  if (typeof username !== 'string' || !username.trim()) {
    throw new Error('아이디를 입력해 주세요.')
  }

  if (typeof password !== 'string' || !password.trim()) {
    throw new Error('비밀번호를 입력해 주세요.')
  }

  const response = await axiosInstance.post('/api/auth/login', {
    username: username.trim(),
    password,
  })

  const token = response.data

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('로그인 응답에서 토큰을 확인하지 못했습니다.')
  }

  return token.trim()
}