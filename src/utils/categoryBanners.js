const categories = [
  ['ENT', '엔터테인먼트'], ['FOOD', '푸드'],
  ['CHAR', '캐릭터'], ['FASHION', '패션'],
]
export function selectCategoryBanners(popups, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}).format(now)
  const eligible = popups.filter(p => p.image && p.startDate && p.endDate && p.endDate >= today && !['CANCELLED','PAUSED'].includes(p.opStatus))
  return categories.flatMap(([category, label]) => {
    const candidates = eligible.filter(p => String(p.category).toUpperCase() === category)
    candidates.sort((a,b) => {
      const aFuture = a.startDate > today, bFuture = b.startDate > today
      return Number(aFuture)-Number(bFuture) || a.startDate.localeCompare(b.startDate) || Number(a.id)-Number(b.id)
    })
    return candidates.length ? [{...candidates[0], bannerCategory:label}] : []
  })
}
