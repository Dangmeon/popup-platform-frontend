// 나중에 제거할 부분: 실제 주문 API 연결 후 사용하지 않는 더미 데이터

// 임시 주문 데이터
const orders = [
  {
    id: 1,
    number: 'DEMO-ORD-000001',
    memberName: '김팝큐',
    createdAt: '2026-10-28T13:00:00+09:00',
    paymentExpiresAt: '2026-10-28T13:10:00+09:00',
    paidAt: null,
    cancelledAt: null,
    status: 'PENDING_PAYMENT',
    items: [
      {
        id: 11,
        name: 'POPQ 에코백',
        unitPrice: 18000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
      {
        id: 12,
        name: 'POPQ 스티커 세트',
        unitPrice: 8000,
        quantity: 2,
        status: 'INCLUDED',
        exclusionReason: '',
      },
      {
        id: 13,
        name: '한정판 키링',
        unitPrice: 12000,
        quantity: 1,
        status: 'EXCLUDED',
        exclusionReason: '결제 전 사용자 요청으로 제외',
      },
    ],
  },
  {
    id: 2,
    number: 'DEMO-ORD-000002',
    memberName: '이하늘',
    createdAt: '2026-10-28T11:00:00+09:00',
    paymentExpiresAt: '2026-10-28T11:10:00+09:00',
    paidAt: '2026-10-28T11:05:00+09:00',
    cancelledAt: null,
    status: 'PAID',
    items: [
      {
        id: 21,
        name: '캐릭터 인형',
        unitPrice: 25000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
  {
    id: 3,
    number: 'DEMO-ORD-000003',
    memberName: '박봄',
    createdAt: '2026-10-28T10:00:00+09:00',
    paymentExpiresAt: '2026-10-28T10:10:00+09:00',
    paidAt: null,
    cancelledAt: '2026-10-28T10:03:00+09:00',
    status: 'CANCELLED',
    items: [
      {
        id: 31,
        name: 'POPQ 에코백',
        unitPrice: 18000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
  {
    id: 4,
    number: 'DEMO-ORD-000004',
    memberName: '최여름',
    createdAt: '2026-10-28T09:00:00+09:00',
    paymentExpiresAt: '2026-10-28T09:10:00+09:00',
    paidAt: null,
    cancelledAt: null,
    status: 'EXPIRED',
    items: [
      {
        id: 41,
        name: 'POPQ 스티커 세트',
        unitPrice: 8000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
]

// 임시 주문 금액 계산
function calculateAmounts(order) {
  const originalAmount = order.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  )

  const excludedAmount = order.items
    .filter((item) => item.status === 'EXCLUDED')
    .reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    )

  const finalAmount = originalAmount - excludedAmount

  return {
    originalAmount,
    excludedAmount,
    finalAmount,
    paidAmount: order.status === 'PAID' ? finalAmount : 0,
  }
}

// 주문 응답 생성
function createOrderResponse(order) {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
    amounts: calculateAmounts(order),
  }
}

// 주문 목록 조회
export async function getMockOrders({
  keyword = '',
  status = '',
} = {}) {
  const searchKeyword = keyword.trim().toLowerCase()

  const filteredOrders = orders.filter((order) => {
    const matchesKeyword =
      order.number.toLowerCase().includes(searchKeyword) ||
      order.memberName.toLowerCase().includes(searchKeyword)

    const matchesStatus = !status || order.status === status

    return matchesKeyword && matchesStatus
  })

  return {
    items: filteredOrders.map(createOrderResponse),
    total: filteredOrders.length,
    totalAll: orders.length,
  }
}

// 주문 상세 조회
export async function getMockOrder(id) {
  const order = orders.find(
    (item) => String(item.id) === String(id)
  )

  if (!order) {
    const error = new Error('주문 정보를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'ORDER_NOT_FOUND'
    throw error
  }

  return createOrderResponse(order)
}