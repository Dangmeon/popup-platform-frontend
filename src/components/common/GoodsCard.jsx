import React from 'react'
import ShopGoodsCard from './ShopGoodsCard.jsx'

// 기존 GoodsCard 를 새 디자인 카드(ShopGoodsCard)로 교체
// - PopupDetail 등에서 <GoodsCard item={...} /> 로 쓰던 방식은 그대로 둔다
// - 담기는 서버 장바구니(POST /api/cart/items)로 간다 (기존 app.addToCart 는 브라우저 안에서만 동작했음)
// - 찜 하트는 찜 기능 제외로 뺐다
export default function GoodsCard({ item, to }) {
  // 상품이 속한 팝업 상세로 보낸다. popupId 가 없으면 링크 없이 보여준다
  const link = to ?? (item?.popupId ? `/popups/${item.popupId}` : undefined)
  return <ShopGoodsCard goods={item} to={link} />
}