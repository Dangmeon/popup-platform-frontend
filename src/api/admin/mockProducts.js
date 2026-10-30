// 나중에 제거할 부분: 실제 상품 API 연결 후 사용하지 않는 더미 데이터

// 임시 상품 데이터
const products = [
  {
    prdId: 1,
    productName: 'POPQ 에코백',
    popupName: '성수 POPQ 팝업',
    price: 18000,
    stock: 12,
    maxQty: 2,
    saleStatus: 'ON_SALE',
    saleStart: '2026-10-01T10:00:00+09:00',
    saleEnd: '2026-11-30T18:00:00+09:00',
    description: 'POPQ 로고가 들어간 한정 판매 에코백입니다.',
  },
  {
    prdId: 2,
    productName: 'POPQ 스티커 세트',
    popupName: '성수 POPQ 팝업',
    price: 8000,
    stock: 2,
    maxQty: 3,
    saleStatus: 'ON_SALE',
    saleStart: '2026-10-01T10:00:00+09:00',
    saleEnd: '2026-11-30T18:00:00+09:00',
    description: '다양한 디자인으로 구성한 한정 판매 스티커 세트입니다.',
  },
  {
    prdId: 3,
    productName: '한정판 키링',
    popupName: '홍대 캐릭터 팝업',
    price: 12000,
    stock: 0,
    maxQty: 1,
    saleStatus: 'SOLD_OUT',
    saleStart: '2026-10-01T10:00:00+09:00',
    saleEnd: '2026-11-30T18:00:00+09:00',
    description: '준비된 수량이 모두 소진된 키링입니다.',
  },
  {
    prdId: 4,
    productName: '캐릭터 인형',
    popupName: '강남 굿즈 팝업',
    price: 25000,
    stock: 5,
    maxQty: 1,
    saleStatus: 'ENDED',
    saleStart: '2026-09-01T10:00:00+09:00',
    saleEnd: '2026-09-30T18:00:00+09:00',
    description: '판매기간이 종료된 캐릭터 인형입니다.',
  },
]

// 상품 목록 조회
export async function getMockProducts({
  keyword = '',
  saleStatus = '',
} = {}) {
  const searchKeyword = keyword.trim().toLowerCase()

  const filteredProducts = products.filter((product) => {
    const matchesKeyword =
      product.productName.toLowerCase().includes(searchKeyword) ||
      product.popupName.toLowerCase().includes(searchKeyword)

    const matchesStatus =
      !saleStatus || product.saleStatus === saleStatus

    return matchesKeyword && matchesStatus
  })

  return {
    items: filteredProducts.map((product) => ({ ...product })),
    total: filteredProducts.length,
    totalAll: products.length,
  }
}

// 상품 상세 조회
export async function getMockProduct(prdId) {
  const product = products.find(
    (item) => String(item.prdId) === String(prdId)
  )

  if (!product) {
    const error = new Error('상품 정보를 찾을 수 없습니다.')
    error.status = 404
    error.code = 'PRODUCT_NOT_FOUND'
    throw error
  }

  return { ...product }
}