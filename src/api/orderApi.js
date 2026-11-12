import axiosInstance from './axiosInstance.js'

// 서버 오류 메시지 꺼내기 (에러 응답 형식: { code, message })
export function getApiError(err, fallback = '요청에 실패했어요. 잠시 후 다시 시도해 주세요.') {
  const status = err?.response?.status
  if (status === 401 || status === 403) return '로그인이 필요해요. 로그인 후 다시 시도해 주세요.'
  return err?.response?.data?.message || err?.message || fallback
}

// 화면에서 쓰는 값 → API 요청 필드로 바꾸는 곳
// 명세: items[].productId (Long, 필수), items[].quantity (Integer, 1 이상)
// 배송 정보(받는 사람·주소·메모)는 명세에 없어서 보내지 않는다.
// TODO: 서버가 배송 정보를 받게 되면 이 함수에 필드를 추가한다
function toOrderRequest(o) {
  return {
    items: (o.items || []).map(it => ({
      productId: Number(it.productId),
      quantity: Number(it.quantity),
    })),
  }
}

// 주문 생성: POST /api/orders
// 재고 즉시 차감, PENDING 상태로 생성, 결제 만료 시각(생성 후 10분) 설정
// 응답(명세): { orderId, tossOrderId, totalPrice, orderStatus, orderedAt, expiresAt }
export async function createOrder(order) {
  const res = await axiosInstance.post('/api/orders', toOrderRequest(order))
  return res.data?.data ?? res.data
}

// 결제 승인: POST /api/payments/confirm
// 요청(명세): paymentKey (String), orderId (String, tossOrderId), amount (Integer, 원 단위)
// 응답(명세): { paymentId, orderId(내부 주문 ID), paymentKey, amount, paymentStatus, paidAt, canceledAt }
// 토스가 주소창으로 넘기는 amount 는 문자열이라 숫자로 바꿔서 보낸다
export async function confirmPayment({ paymentKey, orderId, amount }) {
  const res = await axiosInstance.post('/api/payments/confirm', {
    paymentKey,
    orderId,
    amount: Number(amount),
  })
  return res.data?.data ?? res.data
}

// 주문 취소: PATCH /api/orders/{orderId}/cancel (orderId 는 tossOrderId 가 아니라 주문 생성 응답의 orderId)
// TODO: 아직 어디서도 호출하지 않는다. 나중에 결제창 닫기·취소 처리에 붙인다
export async function cancelOrder(orderId) {
  const res = await axiosInstance.patch(`/api/orders/${orderId}/cancel`)
  return res.data?.data ?? res.data
}