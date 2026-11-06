// 사용자별 저장 키
function getStorageKey(username) {
  if (typeof username !== 'string' || !username.trim()) {
    throw new Error('웨이팅 기록을 저장할 로그인 정보가 없습니다.')
  }

  return `popQ_my_waiting_ids:${encodeURIComponent(username.trim())}`
}

// 웨이팅 번호 확인
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0
}

// 내 웨이팅 번호 조회
export function loadWaitingIds(username) {
  const key = getStorageKey(username)
  const value = localStorage.getItem(key)

  if (!value) return []

  let ids

  try {
    ids = JSON.parse(value)
  } catch {
    throw new Error('저장된 웨이팅 기록을 읽을 수 없습니다.')
  }

  if (!Array.isArray(ids)) {
    throw new Error('저장된 웨이팅 기록의 형식이 올바르지 않습니다.')
  }

  return [...new Set(ids.filter(isValidId))]
}

// 내 웨이팅 번호 저장
export function addWaitingId(id, username) {
  if (!isValidId(id)) {
    throw new Error('올바른 웨이팅 번호가 필요합니다.')
  }

  const key = getStorageKey(username)
  const ids = loadWaitingIds(username)

  if (!ids.includes(id)) {
    localStorage.setItem(key, JSON.stringify([id, ...ids]))
  }
}