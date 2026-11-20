import http from '../axiosInstance.js'
import {getPopups,getPopup} from './popupApi.js'
import {filterRows,id,rows} from './liveUtils.js'

function product(raw,popup) {
  return {...raw,popupName:popup.title,description:raw.productDesc || ''}
}
export async function getProducts({keyword='',saleStatus=''} = {}) {
  const popups=await getPopups()
  const batches=await Promise.all(popups.items.map(async popup=>rows((await http.get(`/api/popups/${popup.popId}/products`)).data).map(raw=>product(raw,popup))))
  const word=keyword.trim().toLowerCase()
  return filterRows(batches.flat(),row=>(!word||`${row.productName} ${row.popupName}`.toLowerCase().includes(word))&&(!saleStatus||row.saleStatus===saleStatus))
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
export async function createProduct(data) {
  const payload={productName:data.productName,price:data.price,stock:data.stock,maxQty:data.maxQty,saleStart:localDateTime(data.saleStart),saleEnd:localDateTime(data.saleEnd),productDesc:data.description,category:data.category,productImg:data.productImg}
  return (await http.post(`/api/admin/popups/${id(data.popId)}/products`,payload)).data
}
export async function uploadProductImage(file) {
  const body=new FormData();body.append('file',file)
  const data=(await http.post('/api/admin/images',body)).data
  if(typeof data?.url!=='string'||!data.url)throw new Error('이미지 업로드 결과를 확인하지 못했습니다.')
  return data.url
}
