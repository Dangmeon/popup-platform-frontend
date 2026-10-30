import { useEffect, useState } from 'react'
import { getDashboard } from '../../api/admin/dashboardApi'

// 주문 상태 표시
function getOrderStatus(status) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return '결제 대기'
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

// 나중에 확인할 부분: 실제 혼잡도 산정 기준과 상태 구간 적용
function getCrowdingStatus(percent) {
  if (percent >= 80) return '혼잡'
  if (percent >= 50) return '보통'
  return '여유'
}

function AdminDashboard() {
  // 대시보드 데이터
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  // 그래프 표시 기준
  const [chartType, setChartType] = useState('all')

  // 대시보드 조회
  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const response = await getDashboard()

        if (active) setDashboard(response)
      } catch (requestError) {
        if (active) {
          setDashboard(null)
          setError(
            requestError.message ||
              '대시보드 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [retryKey])

  const stats = dashboard?.stats ?? []
  const weeklyReservations = dashboard?.weeklyReservations ?? []
  const popupCrowding = dashboard?.popupCrowding ?? []
  const recentOrders = dashboard?.recentOrders ?? []
  const lowStockProducts = dashboard?.lowStockProducts ?? []
  const popularPopups = dashboard?.popularPopups ?? []

  // 그래프 최대값
  const maxReservation = Math.max(
    1,
    ...weeklyReservations.map((item) =>
      Math.max(item.reserved, item.entered)
    )
  )

  return (
    <div className="admin-dashboard" aria-busy={loading}>
      {/* 대시보드 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>운영 대시보드</h2>
          <p>POPQ 서비스의 주요 운영 현황을 한눈에 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 조회 상태 */}
      {loading && (
        <p role="status">대시보드 정보를 불러오는 중입니다.</p>
      )}

      {error && (
        <section className="admin-panel">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="admin-chart-select"
            onClick={() => setRetryKey((previous) => previous + 1)}
          >
            다시 불러오기
          </button>
        </section>
      )}

      {!loading && !error && !dashboard && (
        <p role="status">표시할 대시보드 정보가 없습니다.</p>
      )}

      {!loading && !error && dashboard && (
        <>
          {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
          <p>
            통계는 고정된 예시이며 다른 관리 화면의 데이터와
            실시간으로 연동되지 않습니다.
          </p>

          {/* 상단 통계 카드 */}
          <div className="admin-stat-grid">
            {stats.map((stat) => (
              <div className="admin-stat-card" key={stat.title}>
                <div className="admin-stat-top">
                  <span>{stat.title}</span>
                  <span className="admin-stat-icon" aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>

                <strong>
                  {stat.value}
                  <small>{stat.unit}</small>
                </strong>

                <span className="admin-stat-change">
                  {stat.change}
                </span>
              </div>
            ))}
          </div>

          {stats.length === 0 && (
            <p>표시할 통계가 없습니다.</p>
          )}

          {/* 예약 그래프와 혼잡도 */}
          <div className="admin-dashboard-main-grid">
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>예약 및 입장 추이</h3>
                  <p>최근 7일간 예약 및 입장 현황</p>
                </div>

                <select
                  className="admin-chart-select"
                  value={chartType}
                  onChange={(event) => setChartType(event.target.value)}
                  aria-label="그래프 표시 기준"
                >
                  <option value="all">전체 보기</option>
                  <option value="reserved">예약만 보기</option>
                  <option value="entered">입장만 보기</option>
                </select>
              </div>

              <div className="admin-chart-legend">
                {(chartType === 'all' || chartType === 'reserved') && (
                  <span>
                    <i className="legend-reserved" /> 예약
                  </span>
                )}
                {(chartType === 'all' || chartType === 'entered') && (
                  <span>
                    <i className="legend-entered" /> 입장
                  </span>
                )}
              </div>

              {weeklyReservations.length === 0 ? (
                <p>표시할 예약 및 입장 데이터가 없습니다.</p>
              ) : (
                <div className="admin-bar-chart">
                  {weeklyReservations.map((item) => (
                    <div className="admin-chart-column" key={item.day}>
                      <div className="admin-chart-bars">
                        {(chartType === 'all' ||
                          chartType === 'reserved') && (
                          <div
                            className="admin-chart-bar reserved"
                            style={{
                              height: `${(item.reserved / maxReservation) * 100}%`,
                            }}
                            role="img"
                            aria-label={`${item.day}요일 예약 ${item.reserved}건`}
                            title={`${item.day}요일 예약 ${item.reserved}건`}
                          />
                        )}

                        {(chartType === 'all' ||
                          chartType === 'entered') && (
                          <div
                            className="admin-chart-bar entered"
                            style={{
                              height: `${(item.entered / maxReservation) * 100}%`,
                            }}
                            role="img"
                            aria-label={`${item.day}요일 입장 ${item.entered}명`}
                            title={`${item.day}요일 입장 ${item.entered}명`}
                          />
                        )}
                      </div>
                      <span>{item.day}</span>
                    </div>
                  ))}
                </div>
              )}
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

                    <div
                      className="admin-progress-track"
                      role="meter"
                      aria-label={`${popup.name} 혼잡도`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={popup.percent}
                    >
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

              {popupCrowding.length === 0 && (
                <p>표시할 혼잡도 정보가 없습니다.</p>
              )}
            </section>
          </div>

          {/* 최근 주문 및 재고 부족 */}
          <div className="admin-dashboard-bottom-grid">
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
                      <th scope="col">주문번호</th>
                      <th scope="col">상품명</th>
                      <th scope="col">금액</th>
                      <th scope="col">상태</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.product}</td>
                        <td>
                          {order.price.toLocaleString('ko-KR')}원
                        </td>
                        <td>
                          <span
                            className={`admin-status ${order.status.toLowerCase()}`}
                          >
                            {getOrderStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          표시할 최근 주문이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 온라인 재고 부족 */}
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>재고 부족 알림</h3>
                  <p>온라인 굿즈 재고 현황</p>
                </div>
              </div>

              <div className="admin-low-stock-list">
                {lowStockProducts.map((product) => (
                  <div
                    className="admin-low-stock-item"
                    key={product.id}
                  >
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

              {lowStockProducts.length === 0 && (
                <p>재고 부족 상품이 없습니다.</p>
              )}
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
                  <span className="admin-popular-rank">
                    {index + 1}
                  </span>
                  <strong>{popup.name}</strong>
                  <span>{popup.reservations}건</span>
                </div>
              ))}
            </div>

            {popularPopups.length === 0 && (
              <p>표시할 인기 팝업이 없습니다.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default AdminDashboard