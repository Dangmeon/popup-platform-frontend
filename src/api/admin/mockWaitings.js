// 나중에 제거할 부분: 실제 웨이팅 API 연결 후 사용하지 않는 더미 데이터

// 임시 현장 대기 데이터
const waitings = [
  {
    waitingId: 1,
    popId: 1,
    popupName: '성수 POPQ 팝업',
    queueNumber: 101,
    phone: '010-0000-0001',
    peopleCount: 2,
    status: 'WAITING',
    joinedAt: '2026-10-29T13:00:00+09:00',
    calledAt: null,
    expiresAt: null,
  },
  {
    waitingId: 2,
    popId: 1,
    popupName: '성수 POPQ 팝업',
    queueNumber: 102,
    phone: '010-0000-0002',
    peopleCount: 1,
    status: 'CALLED',
    joinedAt: '2026-10-29T12:50:00+09:00',
    calledAt: '2026-10-29T13:00:00+09:00',
    expiresAt: '2026-10-29T13:10:00+09:00',
  },
  {
    waitingId: 3,
    popId: 1,
    popupName: '성수 POPQ 팝업',
    queueNumber: 103,
    phone: '010-0000-0003',
    peopleCount: 3,
    status: 'ENTERED',
    joinedAt: '2026-10-29T12:00:00+09:00',
    calledAt: '2026-10-29T12:10:00+09:00',
    expiresAt: '2026-10-29T12:20:00+09:00',
  },
  {
    waitingId: 4,
    popId: 1,
    popupName: '성수 POPQ 팝업',
    queueNumber: 104,
    phone: '010-0000-0004',
    peopleCount: 1,
    status: 'CANCELLED',
    joinedAt: '2026-10-29T12:30:00+09:00',
    calledAt: null,
    expiresAt: null,
  },
  {
    waitingId: 5,
    popId: 2,
    popupName: '홍대 캐릭터 팝업',
    queueNumber: 201,
    phone: '010-0000-0005',
    peopleCount: 2,
    status: 'WAITING',
    joinedAt: '2026-10-29T13:00:00+09:00',
    calledAt: null,
    expiresAt: null,
  },
  {
    waitingId: 6,
    popId: 2,
    popupName: '홍대 캐릭터 팝업',
    queueNumber: 202,
    phone: '010-0000-0006',
    peopleCount: 1,
    status: 'EXPIRED',
    joinedAt: '2026-10-29T11:00:00+09:00',
    calledAt: '2026-10-29T11:10:00+09:00',
    expiresAt: '2026-10-29T11:20:00+09:00',
  },
]

// 현장 대기 목록 조회
export async function getMockWaitings({
  popId,
  keyword = '',
  status = '',
} = {}) {
  if (popId === undefined || popId === null || popId === '') {
    const error = new Error('팝업을 선택해 주세요.')
    error.status = 400
    error.code = 'POPUP_REQUIRED'
    throw error
  }

  const popupWaitings = waitings.filter(
    (waiting) => String(waiting.popId) === String(popId)
  )

  const searchKeyword = keyword.trim().toLowerCase()

  const filteredWaitings = popupWaitings.filter((waiting) => {
    const matchesKeyword =
      String(waiting.queueNumber).includes(searchKeyword) ||
      waiting.phone.includes(searchKeyword)

    const matchesStatus = !status || waiting.status === status

    return matchesKeyword && matchesStatus
  })

  return {
    items: filteredWaitings.map((waiting) => ({ ...waiting })),
    total: filteredWaitings.length,
    totalAll: popupWaitings.length,
  }
}

// 현장 대기 상세 조회
export async function getMockWaiting(waitingId) {
  const waiting = waitings.find(
    (item) => String(item.waitingId) === String(waitingId)
  )

  if (!waiting) {
    const error = new Error('웨이팅 정보를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'WAITING_NOT_FOUND'
    throw error
  }

  return { ...waiting }
}