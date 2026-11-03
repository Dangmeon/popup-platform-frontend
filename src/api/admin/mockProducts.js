import { getMockPopup } from './mockPopups'

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

// 등록 오류
function createProductError(message, code) {
  const error = new Error(message)
  error.status = 400
  error.code = code

  return error
}

// 상품 등록
export async function createMockProduct(data = {}) {
  const productName =
    typeof data.productName === 'string'
      ? data.productName.trim()
      : ''

  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : ''

  const maxQty = data.maxQty ?? 1

  if (!productName) {
    throw createProductError(
      '상품명을 입력해 주세요.',
      'PRODUCT_NAME_REQUIRED'
    )
  }

  if (!Number.isSafeInteger(data.popId) || data.popId < 1) {
    throw createProductError(
      '소속 팝업을 선택해 주세요.',
      'INVALID_POPUP_ID'
    )
  }

  if (!Number.isSafeInteger(data.price) || data.price < 0) {
    throw createProductError(
      '가격은 0 이상의 정수로 입력해 주세요.',
      'INVALID_PRICE'
    )
  }

  if (!Number.isSafeInteger(data.stock) || data.stock < 0) {
    throw createProductError(
      '초기 재고는 0 이상의 정수로 입력해 주세요.',
      'INVALID_STOCK'
    )
  }

  if (!Number.isSafeInteger(maxQty) || maxQty < 1) {
    throw createProductError(
      '회원 누적 구매 제한은 1 이상의 정수로 입력해 주세요.',
      'INVALID_MAX_QUANTITY'
    )
  }

  // 판매기간 확인
  const saleStart = new Date(data.saleStart)
  const saleEnd = new Date(data.saleEnd)

  if (
    !data.saleStart ||
    !data.saleEnd ||
    Number.isNaN(saleStart.getTime()) ||
    Number.isNaN(saleEnd.getTime())
  ) {
    throw createProductError(
      '판매 시작일시와 종료일시를 입력해 주세요.',
      'INVALID_SALE_PERIOD'
    )
  }

  if (saleStart.getTime() >= saleEnd.getTime()) {
    throw createProductError(
      '판매 종료일시는 시작일시보다 늦어야 합니다.',
      'INVALID_SALE_PERIOD'
    )
  }

  // 소속 팝업 확인
  const popup = await getMockPopup(data.popId)

  // 나중에 바꿀 부분: 판매 상태는 실제 서버 응답 사용
  const now = Date.now()
  let saleStatus = 'ON_SALE'

  if (now >= saleEnd.getTime()) {
    saleStatus = 'ENDED'
  } else if (now < saleStart.getTime()) {
    saleStatus = 'UPCOMING'
  } else if (data.stock === 0) {
    saleStatus = 'SOLD_OUT'
  }

  // 임시 상품번호 생성
  const prdId =
    Math.max(0, ...products.map((product) => product.prdId)) + 1

  const product = {
    prdId,
    popId: popup.popId,
    popupName: popup.title,
    productName,
    price: data.price,
    stock: data.stock,
    maxQty,
    saleStatus,
    saleStart: saleStart.toISOString(),
    saleEnd: saleEnd.toISOString(),
    description,
  }

  products.push(product)

  return { ...product }
}