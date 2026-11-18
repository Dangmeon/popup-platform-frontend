// 현장 웨이팅은 한국 시간으로 매일 15:00 오픈.
// 화면의 시간 제한이며 서버의 최종 접수 검증(opStatus)은 그대로 따릅니다.
export function getWaitingOpeningState(now = Date.now()) {
  const day = new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const opensAt = Date.parse(`${day}T15:00:00+09:00`)
  const remainingMs = Math.max(0, opensAt - now)
  const seconds = Math.ceil(remainingMs / 1000)
  return { opensAt, isOpen:remainingMs === 0, showCountdown:remainingMs > 0 && remainingMs <= 600000,
    countdown:`${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}` }
}

export function getWaitingUnavailableReason(popup, now = Date.now()) {
  // 최신 백엔드는 walkinStatus를 제거하고 opStatus로 접수를 검증합니다.
  if (String(popup.opStatus || '').toUpperCase() !== 'OPEN') return '현재 현장 웨이팅 접수가 중단되었거나 운영 상태를 확인할 수 없습니다.'
  if (!getWaitingOpeningState(now).isOpen) return '현장 웨이팅은 오후 3시부터 접수할 수 있어요.'
  return ''
}
