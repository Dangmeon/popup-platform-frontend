import {
  getMockProducts,
  getMockProduct,
  createMockProduct,
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

// 상품 등록
export async function createProduct(data) {
  // 나중에 바꿀 부분: 실제 상품 등록 API의 요청 DTO로 변환
  const request = {
    popId: data.popId,
    productName: data.productName,
    price: data.price,
    stock: data.stock,
    maxQty: data.maxQty,
    saleStart: data.saleStart,
    saleEnd: data.saleEnd,
    description: data.description,
  }

  // 나중에 바꿀 부분: POST /api/admin/popups/{popId}/products 호출
  const response = await createMockProduct(request)

  // 나중에 바꿀 부분: 서버 응답을 화면의 상품 필드로 변환
  return response
}