import axiosInstance from './axiosInstance.js'

// 서버 오류 메시지 꺼내기 (에러 응답 형식: { code, message })
export function getApiError(err, fallback = '요청에 실패했어요. 잠시 후 다시 시도해 주세요.') {
  const status = err?.response?.status
  if (status === 401 || status === 403) return '로그인이 필요해요. 로그인 후 다시 시도해 주세요.'
  return err?.response?.data?.message || err?.message || fallback
}

// 화면에서 쓰는 값 → API 요청 필드로 바꾸는 곳
// 명세: items[].prdId (Long, 필수), items[].quantity (Integer, 1 이상)
// 배송 정보 및 쿠폰 정보는 OrderCreateRequest 필드명에 맞춰 전달합니다.
function toOrderRequest(o) {
  const deliveryAddress =
    o.deliveryAddress?.trim() || o.receiverAddress?.trim() || ''
  const deliveryAddressDetail =
    o.deliveryAddressDetail?.trim() || o.receiverAddressDetail?.trim() || ''
  const parsedUserCouponId =
    o.userCouponId !== undefined && o.userCouponId !== null && o.userCouponId !== ''
      ? Number(o.userCouponId)
      : null

  return {
    items: (o.items || []).map((it) => ({
      prdId: Number(it.prdId),
      quantity: Number(it.quantity),
    })),
    receiverName: o.receiverName?.trim() || '',
    receiverPhone: o.receiverPhone?.trim() || '',
    deliveryAddress,
    deliveryAddressDetail,
    deliveryMemo: o.deliveryMemo?.trim() || '',
    userCouponId: Number.isFinite(parsedUserCouponId) ? parsedUserCouponId : null,
  }
}

// 주문 생성: POST /api/orders
// 재고 즉시 차감, PENDING 상태로 생성, 결제 만료 시각(생성 후 10분) 설정
// 응답(명세): { orderId, tossOrderId, totalPrice, orderStatus, orderedAt, expiresAt }
export async function createOrder(order) {
  const res = await axiosInstance.post('/api/orders', toOrderRequest(order))
  return res.data?.data ?? res.data
}

// 최근 배송지 불러오기: GET /api/orders/recent-delivery
// 응답: { receiverName, receiverPhone, deliveryAddress, deliveryAddressDetail, deliveryMemo }
export async function getRecentDelivery() {
  const res = await axiosInstance.get('/api/orders/recent-delivery')
  return res.data?.data ?? res.data
}

// 결제 승인: POST /api/payments/confirm
// 요청(명세): paymentKey (String), orderId (String, tossOrderId), amount (Integer, 원 단위)
// 응답(명세): { paymentId, orderId(내부 주문 ID), paymentKey, amount, paymentStatus, paidAt, canceledAt }
export async function confirmPayment({ paymentKey, orderId, amount }) {
  const res = await axiosInstance.post('/api/payments/confirm', {
    paymentKey,
    orderId,
    amount: Number(amount),
  })
  return res.data?.data ?? res.data
}

// 주문 취소: PATCH /api/orders/{orderId}/cancel (orderId 는 tossOrderId 가 아니라 주문 생성 응답의 orderId)
export async function cancelOrder(orderId) {
  const res = await axiosInstance.patch(`/api/orders/${orderId}/cancel`)
  return res.data?.data ?? res.data
}