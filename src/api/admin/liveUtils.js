export function rows(data) {
  if(Array.isArray(data))return data
  if(Array.isArray(data?.content))return data.content
  throw new Error('서버의 목록 응답을 확인하지 못했습니다.')
}
export function id(value) {
  const number=Number(value)
  if(!Number.isSafeInteger(number)||number<1)throw new Error('조회 번호를 확인해 주세요.')
  return number
}
export function filterRows(items, predicate) {
  const filtered=items.filter(predicate)
  return {items:filtered,total:filtered.length,totalAll:items.length}
}
export function errorText(error) {
  if(error.response?.status===401)return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if(error.response?.status===403)return '조회하거나 처리할 권한이 없습니다.'
  return error.response?.data?.message || '서버 요청을 처리하지 못했습니다. 다시 시도해 주세요.'
}
