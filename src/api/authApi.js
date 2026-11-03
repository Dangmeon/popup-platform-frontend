import axiosInstance from './axiosInstance'

// 로그인 (서버: email + password → { accessToken, ... })
export async function loginRequest({ username, password }) {
  if (!axiosInstance.defaults.baseURL?.trim()) {
    throw new Error('백엔드 서버 주소가 설정되지 않았습니다.')
  }

  if (typeof username !== 'string' || !username.trim()) {
    throw new Error('이메일을 입력해 주세요.')
  }

  if (typeof password !== 'string' || !password.trim()) {
    throw new Error('비밀번호를 입력해 주세요.')
  }

  const response = await axiosInstance.post('/api/auth/login', {
    username: username.trim(),
    password,
  })

  const data = response.data
  const token = typeof data === 'string' ? data : data?.accessToken

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('로그인 응답에서 토큰을 확인하지 못했습니다.')
  }

  return token.trim()
}

// 회원가입
export async function signupRequest({ email, password, name, phone }) {
  const response = await axiosInstance.post('/api/auth/signup', {
    username: email.trim(),
    password,
    name: name.trim(),
    phone: phone.trim(),
  })
  return response.data
}

// 로그아웃
export async function logoutRequest() {
  await axiosInstance.post('/api/auth/logout')
}

// 내 정보 조회
export async function getMyInfo() {
  const response = await axiosInstance.get('/api/members/me')
  return response.data
}

// 내 정보 수정 (비밀번호 변경도 이 API에 포함)
export async function updateMyInfo({ password, name, phone }) {
  const response = await axiosInstance.put('/api/members/me', { password, name, phone })
  return response.data
}

// 회원 탈퇴
export async function deleteMyAccount() {
  await axiosInstance.delete('/api/members/me')
}

// 비밀번호 재설정 (임시 비밀번호를 이메일로 발송)
export async function resetPasswordRequest({ email, name }) {
  const response = await axiosInstance.put('/api/auth/password/reset', {
    email: email.trim(),
    name: name.trim(),
  })
  return response.data
}
