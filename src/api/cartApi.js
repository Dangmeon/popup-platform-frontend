import axiosInstance from './axiosInstance'

// 장바구니 조회
export async function getCart() {
  const response = await axiosInstance.get('/api/cart')

  if (!Array.isArray(response.data)) {
    throw new Error('장바구니 응답 형식을 확인해 주세요.')
  }

  return response.data
}

// 장바구니 상품 삭제
export async function deleteCartItem(cartId) {
  if (!Number.isSafeInteger(cartId) || cartId < 1) {
    throw new Error('장바구니 번호가 올바르지 않습니다.')
  }

  await axiosInstance.delete(`/api/cart/items/${cartId}`)
}
// 장바구니 수량 변경 (PATCH /api/cart/items/{cartItemId})
export async function updateCartItem(cartId, quantity) {
  if (!Number.isSafeInteger(cartId) || cartId < 1) {
    throw new Error('장바구니 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error('수량이 올바르지 않습니다.')
  }

  const response = await axiosInstance.patch(`/api/cart/items/${cartId}`, {
    quantity,
  })

  return response.data
}
