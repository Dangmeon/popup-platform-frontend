import React from 'react'
import ShopGoodsCard from './ShopGoodsCard.jsx'

function resolveGoodsDetailId(item) {
  const candidate = item?.prdId ?? item?.serverId ?? item?.productId ?? item?.id
  if (candidate === undefined || candidate === null || candidate === '') return null
  const num = typeof candidate === 'number' ? candidate : Number(candidate)
  if (Number.isSafeInteger(num) && num >= 1) return num
  return String(candidate)
}

// 기존 GoodsCard 를 새 디자인 카드(ShopGoodsCard)로 교체
// - PopupDetail 등에서 <GoodsCard item={...} /> 로 쓰던 방식은 그대로 둔다
// - 담기는 서버 장바구니(POST /api/cart/items)로 간다 (기존 app.addToCart 는 브라우저 안에서만 동작했음)
// - 찜 하트는 찜 기능 제외로 뺐다
export default function GoodsCard({ item, to }) {
  const detailId = resolveGoodsDetailId(item)
  const defaultLink = detailId
    ? `/goods/${detailId}`
    : item?.popupId
      ? `/popups/${item.popupId}`
      : undefined
  const link = to ?? defaultLink

  return <ShopGoodsCard goods={item} to={link} state={{ goods: item }} />
}