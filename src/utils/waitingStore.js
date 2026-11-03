const KEY = 'popQ_my_waiting_ids'

export function loadWaitingIds() {
  try {
    const v = localStorage.getItem(KEY)
    return v ? JSON.parse(v) : []
  } catch {
    return []
  }
}

export function addWaitingId(id) {
  const ids = loadWaitingIds()
  if (!ids.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([id, ...ids]))
  }
}
