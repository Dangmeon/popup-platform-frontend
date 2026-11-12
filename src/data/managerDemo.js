// API 교체 지점: 로그인 매니저의 담당 팝업 조회 결과로 교체합니다.
// 실제 manager_id 배정과 접근 권한 검사는 서버에서 반드시 수행해야 합니다.
export const managerDemoPopup = { title: '성수 POPQ 팝업', location: '서울 성수 · 예시 운영 공간' }

export function createManagerDemo() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]))
  const today = `${values.year}-${values.month}-${values.day}`
  return {
    reservations: [
      { id:'R-001', name:'김방문', phone:'010-****-1201', date:today, time:'10:00', people:2, status:'ENTERED' },
      { id:'R-002', name:'이팝업', phone:'010-****-2456', date:today, time:'11:00', people:3, status:'CONFIRMED' },
      { id:'R-003', name:'박예약', phone:'010-****-4578', date:today, time:'13:00', people:1, status:'CONFIRMED' },
      { id:'R-004', name:'최방문', phone:'010-****-6060', date:today, time:'14:00', people:2, status:'CONFIRMED' },
      { id:'R-005', name:'정취소', phone:'010-****-7311', date:today, time:'15:00', people:2, status:'CANCELLED' },
    ],
    waitings: [
      { id:'W-001', number:1, name:'김현장', phone:'010-****-1001', people:2, status:'ENTERED' },
      { id:'W-002', number:2, name:'이대기', phone:'010-****-1002', people:3, status:'CALLED' },
      { id:'W-003', number:3, name:'박현장', phone:'010-****-1003', people:1, status:'WAITING' },
      { id:'W-004', number:4, name:'최대기', phone:'010-****-1004', people:2, status:'WAITING' },
      { id:'W-005', number:5, name:'정대기', phone:'010-****-1005', people:2, status:'WAITING' },
    ],
  }
}
