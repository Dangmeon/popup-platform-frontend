import {
  getMockProducts,
  getMockProduct,
} from './mockProducts'

// 상품 목록 조회
export async function getProducts(params = {}) {
  // 나중에 바꿀 부분: 실제 관리자 상품 목록 API 호출
  const response = await getMockProducts(params)

  // 나중에 바꿀 부분: 서버 응답을 화면의 목록 형식으로 변환
  return {
    items: response.items,
    total: response.total,
    totalAll: response.totalAll,
  }
}

// 상품 상세 조회
export async function getProduct(prdId) {
  // 나중에 바꿀 부분: 실제 상품 상세 API 호출
  const response = await getMockProduct(prdId)

  // 나중에 바꿀 부분: ProductResponse를 화면의 상품 필드로 변환
  return response
}