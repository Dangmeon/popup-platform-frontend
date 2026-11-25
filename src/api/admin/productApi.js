import http from '../axiosInstance.js'
import {getPopup} from './popupApi.js'
import {filterRows,id,rows} from './liveUtils.js'

function product(raw,popup) {
  return {...raw,popupName:popup.title,description:raw.productDesc || ''}
}
// 관리자 상품 목록 조회
export async function getProducts({keyword='', saleStatus='', popId} = {}) {
  const {data} = await http.get('/api/admin/products', {params: {keyword: keyword.trim() || undefined, popId: popId || undefined}})
  const items = rows(data).map(raw => ({...raw, popupName: raw.popupTitle, description: raw.productDesc || ''}))
  return filterRows(items, row => !saleStatus || row.saleStatus === saleStatus)
}
export async function getProduct(prdId) {
  const raw=(await http.get(`/api/products/${id(prdId)}`)).data
  return product(raw,await getPopup(raw.popId))
}
export async function addProductStock(prdId, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) {
    throw new Error('입고 수량은 1개 이상의 정수로 입력해 주세요.')
  }
  return (await http.put(`/api/admin/products/${id(prdId)}/stock`, null, {params:{quantity}})).data
}
export function localDateTime(value) {
  const date=new Date(value)
  if(!Number.isFinite(date.getTime()))throw new Error('판매 일시를 확인해 주세요.')
  return new Date(date.getTime()+9*3600000).toISOString().slice(0,19)
}
function productPayload(data) {
  return {productName:data.productName,price:data.price,stock:data.stock,maxQty:data.maxQty,saleStart:localDateTime(data.saleStart),saleEnd:localDateTime(data.saleEnd),productDesc:data.description,category:data.category,productImg:data.productImg}
}
export async function createProduct(data) {
  return (await http.post(`/api/admin/popups/${id(data.popId)}/products`,productPayload(data))).data
}
export async function uploadProductImage(file) {
  const body=new FormData();body.append('file',file)
  const data=(await http.post('/api/admin/images',body)).data
  if(typeof data?.url!=='string'||!data.url)throw new Error('이미지 업로드 결과를 확인하지 못했습니다.')
  return data.url
}

export async function updateProduct(prdId, data) {
  const { stock, ...payload } = productPayload(data)
  return (await http.put(`/api/admin/products/${id(prdId)}`, payload)).data
}

export async function deleteProduct(prdId) {
  await http.delete(`/api/admin/products/${id(prdId)}`)
}
