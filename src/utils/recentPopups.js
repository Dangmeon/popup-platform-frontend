// 최근 본 팝업 저장
export function readRecentPopups(owner) {
  if (!owner) return []
  try {
    return JSON.parse(localStorage.getItem('popq:recent:' + owner)) || []
  } catch {
    return []
  }
}

export function writeRecentPopups(owner, rows) {
  if (!owner) return
  try {
    localStorage.setItem('popq:recent:' + owner, JSON.stringify(rows))
  } catch {
    // 브라우저 저장소를 사용할 수 없는 경우
  }
}

export function rememberPopup(owner, popup) {
  if (!owner || !popup?.id) return
  const { id, title, category, location, image, startDate, endDate } = popup
  const row = { id, title, category, location, poster: image, period: [startDate, endDate].filter(Boolean).join(' ~ ') }
  const previous = readRecentPopups(owner).filter(item => String(item.id) !== String(id))
  writeRecentPopups(owner, [row, ...previous].slice(0, 20))
}
