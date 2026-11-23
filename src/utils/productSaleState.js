const states = {
  ON_SALE: {canPurchase:true, badge:null, buttonLabel:null, statusText:null, isSoldOut:false},
  UPCOMING: {canPurchase:false, badge:'판매예정', buttonLabel:'판매예정', statusText:'판매예정', isSoldOut:false},
  ENDED: {canPurchase:false, badge:'판매종료', buttonLabel:'판매종료', statusText:'판매종료', isSoldOut:false},
  SOLD_OUT: {canPurchase:false, badge:'품절', buttonLabel:'품절', statusText:'품절', isSoldOut:true},
}

// 판매 일정과 재고를 종합한 서버 판정을 모든 상품 화면에서 사용합니다.
export function getProductSaleInfo(product) {
  return states[product?.saleStatus] || {
    canPurchase:false, badge:'판매 정보 확인 필요', buttonLabel:'구매 불가', statusText:'구매 불가', isSoldOut:false,
  }
}
