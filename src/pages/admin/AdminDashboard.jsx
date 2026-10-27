
import { useState } from 'react'

// 대시보드 상단 통계 데이터 (임시)
const stats = [
  { title: '오늘 예약', value: '128', unit: '건', icon: '📅', change: '+12%' },
  { title: '현재 웨이팅', value: '24', unit: '명', icon: '👥', change: '혼잡 시 운영' },
  { title: '결제 완료', value: '46', unit: '건', icon: '🛍️', change: '+8%' },
  { title: '재고 부족 상품', value: '3', unit: '개', icon: '📦', change: '확인 필요' },
]

// 최근 7일 예약 및 입장 데이터 (임시)
const weeklyReservations = [
  { day: '월', reserved: 75, entered: 62 },
  { day: '화', reserved: 95, entered: 80 },
  { day: '수', reserved: 82, entered: 70 },
  { day: '목', reserved: 115, entered: 92 },
  { day: '금', reserved: 105, entered: 88 },
  { day: '토', reserved: 145, entered: 128 },
  { day: '일', reserved: 128, entered: 110 },
]

// 팝업스토어 혼잡도 데이터 (임시)
const popupCrowding = [
  { id: 1, name: '성수 POPQ 팝업', percent: 85, waiting: 18 },
  { id: 2, name: '홍대 캐릭터 팝업', percent: 60, waiting: 6 },
  { id: 3, name: '강남 굿즈 팝업', percent: 32, waiting: 0 },
]

// 최근 주문 내역 (임시)
const recentOrders = [
  { id: 'ORD-1001', product: 'POPQ 한정 키링', price: 12000, status: 'PAID' },
  { id: 'ORD-1002', product: '캐릭터 인형', price: 25000, status: 'PAID' },
  { id: 'ORD-1003', product: '한정 스티커 세트', price: 8000, status: 'EXPIRED' },
  { id: 'ORD-1004', product: 'POPQ 에코백', price: 18000, status: 'CANCELLED' },
]

// 재고 부족 상품 (임시)
const lowStockProducts = [
  { id: 1, name: 'POPQ 한정 키링', stock: 2 },
  { id: 2, name: '캐릭터 인형', stock: 1 },
  { id: 3, name: 'POPQ 에코백', stock: 0 },
]

// 인기 팝업 순위 (임시)
const popularPopups = [
  { id: 1, name: '성수 POPQ 팝업', reservations: 320 },
  { id: 2, name: '홍대 캐릭터 팝업', reservations: 245 },
  { id: 3, name: '강남 굿즈 팝업', reservations: 180 },
]

// 주문 상태를 한글로 변환
function getOrderStatus(status) {
  switch (status) {
    case 'PAID':
      return '결제 완료'
    case 'EXPIRED':
      return '결제 만료'
    case 'CANCELLED':
      return '주문 취소'
    default:
      return status
  }
}

// 혼잡도에 따른 상태 표시
function getCrowdingStatus(percent) {
  if (percent >= 80) return '혼잡'
  if (percent >= 50) return '보통'
  return '여유'
}

// 관리자 대시보드 화면
function AdminDashboard() {
  // 예약 그래프 표시 기준 선택
  const [chartType, setChartType] = useState('all')

  const maxReservation = Math.max(
    ...weeklyReservations.map((item) =>
      Math.max(item.reserved, item.entered)
    )
  )

  return (
    <div className="admin-dashboard">

      {/* 대시보드 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>운영 대시보드</h2>
          <p>POPQ 서비스의 주요 운영 현황을 한눈에 확인하세요.</p>
        </div>
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 상단 통계 카드 */}
      <div className="admin-stat-grid">
        {stats.map((stat) => (
          <div className="admin-stat-card" key={stat.title}>
            <div className="admin-stat-top">
              <span>{stat.title}</span>
              <span className="admin-stat-icon">{stat.icon}</span>
            </div>

            <strong>
              {stat.value}
              <small>{stat.unit}</small>
            </strong>

            <span className="admin-stat-change">{stat.change}</span>
          </div>
        ))}
      </div>

      {/* 예약 그래프와 팝업 혼잡도 */}
      <div className="admin-dashboard-main-grid">

        {/* 최근 7일 예약 및 입장 그래프 */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>예약 및 입장 추이</h3>
              <p>최근 7일간 예약 및 입장 현황</p>
            </div>

            <select
              className="admin-chart-select"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              aria-label="그래프 표시 기준"
            >
              <option value="all">전체 보기</option>
              <option value="reserved">예약만 보기</option>
              <option value="entered">입장만 보기</option>
            </select>
          </div>

          <div className="admin-chart-legend">
            <span><i className="legend-reserved" /> 예약</span>
            <span><i className="legend-entered" /> 입장</span>
          </div>

          <div className="admin-bar-chart">
            {weeklyReservations.map((item) => (
              <div className="admin-chart-column" key={item.day}>
                <div className="admin-chart-bars">

                  {(chartType === 'all' || chartType === 'reserved') && (
                    <div
                      className="admin-chart-bar reserved"
                      style={{
                        height: `${(item.reserved / maxReservation) * 100}%`,
                      }}
                      title={`${item.day}요일 예약 ${item.reserved}건`}
                    />
                  )}

                  {(chartType === 'all' || chartType === 'entered') && (
                    <div
                      className="admin-chart-bar entered"
                      style={{
                        height: `${(item.entered / maxReservation) * 100}%`,
                      }}
                      title={`${item.day}요일 입장 ${item.entered}명`}
                    />
                  )}
                </div>
                <span>{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 팝업별 혼잡도 */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>팝업별 혼잡도</h3>
              <p>현재 팝업 운영 현황</p>
            </div>
          </div>

          <div className="admin-crowding-list">
            {popupCrowding.map((popup) => (
              <div className="admin-crowding-item" key={popup.id}>
                <div className="admin-crowding-info">
                  <strong>{popup.name}</strong>
                  <span>{getCrowdingStatus(popup.percent)}</span>
                </div>

                <div className="admin-progress-track">
                  <div
                    className={`admin-progress-fill ${
                      popup.percent >= 80 ? 'high' : ''
                    }`}
                    style={{ width: `${popup.percent}%` }}
                  />
                </div>

                <div className="admin-crowding-bottom">
                  <span>혼잡도 {popup.percent}%</span>
                  <span>웨이팅 {popup.waiting}명</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 최근 주문 및 재고 부족 */}
      <div className="admin-dashboard-bottom-grid">

        {/* 최근 주문 목록 */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>최근 주문 내역</h3>
              <p>결제 및 주문 상태 확인</p>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>상품명</th>
                  <th>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.product}</td>
                    <td>{order.price.toLocaleString()}원</td>
                    <td>
                      <span className={`admin-status ${order.status.toLowerCase()}`}>
                        {getOrderStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 온라인 굿즈 재고 부족 알림 */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>재고 부족 알림</h3>
              <p>온라인 굿즈 재고 현황</p>
            </div>
          </div>

          <div className="admin-low-stock-list">
            {lowStockProducts.map((product) => (
              <div className="admin-low-stock-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>남은 재고 {product.stock}개</p>
                </div>

                <span className="admin-stock-warning">
                  {product.stock === 0 ? '품절' : '입고 필요'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 인기 팝업 순위 */}
      <section className="admin-panel admin-popular-panel">
        <div className="admin-panel-header">
          <div>
            <h3>인기 팝업 TOP 3</h3>
            <p>누적 예약 수 기준</p>
          </div>
        </div>

        <div className="admin-popular-list">
          {popularPopups.map((popup, index) => (
            <div className="admin-popular-item" key={popup.id}>
              <span className="admin-popular-rank">{index + 1}</span>
              <strong>{popup.name}</strong>
              <span>{popup.reservations}건</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
