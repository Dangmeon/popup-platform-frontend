const TOKEN_KEY = 'popQ_access_token'

// 저장된 토큰 조회
function loadToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    return token?.trim() || null
  } catch {
    return null
  }
}

// 로그인 토큰
let accessToken = loadToken()

// 토큰 조회
export function getAccessToken() {
  return accessToken
}

// 토큰 저장
export function setAccessToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('유효한 로그인 토큰이 필요합니다.')
  }

  const normalizedToken = token.trim()

  try {
    sessionStorage.setItem(TOKEN_KEY, normalizedToken)
  } catch {
    throw new Error(
      '로그인 정보를 저장할 수 없습니다. 브라우저 저장소 설정을 확인해 주세요.'
    )
  }

  accessToken = normalizedToken
}

// 토큰 제거
export function clearAccessToken() {
  accessToken = null

  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // 저장소 접근 실패 시 메모리 토큰 제거 유지
  }
}