// 모든 항목은 시연용입니다. 주문·쿠폰·문의 API 연결 시 이 모듈 대신 서버 응답을 사용합니다.
export const myPageMenus = [
  {path:'/mypage/orders',title:'내 주문·배송',description:'구매한 굿즈와 배송 현황 확인',icon:'bag'},
  {path:'/mypage/coupons',title:'쿠폰함',description:'내 쿠폰 확인',icon:'ticket'},
  {path:'/mypage/favorites',title:'찜 목록',description:'찜한 팝업 확인',icon:'heart'},
  {path:'/mypage/recent',title:'최근 본 목록',description:'눈여겨본 팝업 다시 살펴보기',icon:'clock'},
  {path:'/mypage/faq',title:'FAQ',description:'자주 묻는 질문을 빠르게 확인',icon:'search'},
  {path:'/mypage/inquiries',title:'내 문의',description:'문의 내용과 답변 확인',icon:'user'},
]
export const demoOrders = [
  {id:'DEMO-ORDER-002',date:'2026.11.16',name:'POPQ 데일리 토트백',quantity:1,price:24000,status:'배송 중',step:2,image:'/promo/rescene.png'},
  {id:'DEMO-ORDER-001',date:'2026.11.12',name:'POPQ 아크릴 키링',quantity:2,price:16000,status:'배송 완료',step:3,image:'/promo/chimchakman.png'},
]
export const demoInquiries = [
  {id:'demo-inquiry-1',category:'주문·배송',title:'배송 상태는 어디에서 확인하나요?',date:'2026.11.16',answered:true,body:'주문한 굿즈의 배송 현황을 확인하고 싶어요.',answer:'내 주문·배송에서 주문별 배송 상태를 확인해 주세요.'},
  {id:'demo-inquiry-2',category:'쿠폰',title:'생일 쿠폰 연장 방법이 궁금해요.',date:'2026.11.17',answered:false,body:'만료 전에 쿠폰 유효기간을 연장할 수 있나요?',answer:null},
]
export const faqItems = [
  {category:'예약·웨이팅',question:'예약과 현장 웨이팅은 어떻게 다른가요?',answer:'방문 예약은 날짜·회차·인원을 미리 선택하는 방식이고, 현장 웨이팅은 전화번호와 인원을 입력해 대기번호를 받는 방식입니다.'},
  {category:'예약·웨이팅',question:'현장 웨이팅은 언제 열리나요?',answer:'현장 웨이팅은 오후 3시부터 접수할 수 있어요. 현장 상황에 따라 접수가 마감되거나 일시 중단될 수 있습니다.'},
  {category:'주문·배송',question:'장바구니에 담으면 재고가 확보되나요?',answer:'장바구니에 담는 것만으로 재고를 확보하거나 차감하지 않습니다. 주문 시점에 판매 상태와 재고를 다시 확인해야 합니다.'},
]
