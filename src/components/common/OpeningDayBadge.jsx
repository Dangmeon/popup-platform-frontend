// 프로토타입용 행사 일정 원형 표시
export default function OpeningDayBadge({ startDate, endDate, today }) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (start === null || !Number.isFinite(today)) return null

  const daysLeft = Math.round((start - today) / 86400000)
  let label = '진행 중'
  if (daysLeft > 0) label = `D-${daysLeft}`
  else if (daysLeft === 0) label = 'Today'
  else if (end !== null && today > end) label = '종료'

  return (
    <span
      className="opening-day-badge"
      aria-label={daysLeft > 0 ? `팝업 오픈까지 ${daysLeft}일` : label}
    >
      {label}
    </span>
  )
}

function parseDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return date.getTime()
}
