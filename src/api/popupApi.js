import axiosInstance from './axiosInstance'

// ─────────────────────────────────────────────
// 팝업 / 굿즈 조회 API (src/api/popupApi.js)
// 응답 필드명은 추측이라 pick()으로 후보 이름을 여러 개 둠
// ─────────────────────────────────────────────

function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k]
  }
  return fallback
}

function toDate(v) {
  return typeof v === 'string' ? v.slice(0, 10) : ''
}

function toList(data) {
  if (Array.isArray(data)) return data
  return data?.content ?? data?.data ?? []
}

// 서버 팝업 → 화면에서 쓰는 모양
function toPopup(raw) {
  return {
    id: pick(raw, ['popId', 'id']),
    title: pick(raw, ['title', 'name', 'popName', 'popupName']),
    category: pick(raw, ['category', 'categoryName']),
    location: pick(raw, ['location', 'address', 'place']),
    startDate: toDate(pick(raw, ['startDate', 'startAt', 'openDate'])),
    endDate: toDate(pick(raw, ['endDate', 'endAt', 'closeDate'])),
    image: pick(raw, ['image', 'imageUrl', 'thumbnailUrl', 'posterUrl']),
    description: pick(raw, ['description', 'content', 'detail']),
    reserved: Number(pick(raw, ['reserved', 'reservedCount'], 0)),
    capacity: Number(pick(raw, ['capacity', 'maxCapacity'], 0)),
    status: pick(raw, ['status', 'popupStatus']),
    waitingStatus: pick(raw, ['waitingStatus']),
  }
}

// 서버 굿즈 → 화면에서 쓰는 모양
function toProduct(raw) {
  const name = pick(raw, ['name', 'prdName', 'productName', 'title'])
  return {
    id: pick(raw, ['prdId', 'id']),
    popupId: pick(raw, ['popId', 'popupId']),
    name,
    title: name,
    price: Number(pick(raw, ['price', 'prdPrice'], 0)),
    image: pick(raw, ['image', 'imageUrl', 'thumbnailUrl']),
    stock: Number(pick(raw, ['stock', 'stockQuantity'], 0)),
    saleStatus: pick(raw, ['saleStatus']),
  }
}

// 팝업 목록: getPopups({ status: 'ONGOING', category: '...' })
export async function getPopups(params = {}) {
  const query = {}
  if (params.status) query.status = params.status
  if (params.category) query.category = params.category
  const res = await axiosInstance.get('/api/popups', { params: query })
  return toList(res.data).map(toPopup)
}

// 팝업 상세
export async function getPopup(popId) {
  const res = await axiosInstance.get(`/api/popups/${popId}`)
  return toPopup(res.data?.data ?? res.data)
}

// 팝업별 굿즈 목록
export async function getPopupProducts(popId) {
  const res = await axiosInstance.get(`/api/popups/${popId}/products`)
  return toList(res.data).map(toProduct)
}

// 굿즈 상세
export async function getProduct(prdId) {
  const res = await axiosInstance.get(`/api/products/${prdId}`)
  return toProduct(res.data?.data ?? res.data)
}