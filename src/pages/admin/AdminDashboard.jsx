import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import http from '../../api/axiosInstance.js'
import { rows } from '../../api/admin/liveUtils.js'
import SalesPeriodSummary from '../../components/common/SalesPeriodSummary.jsx'
import PopqIcon from '../../components/common/PopqIcon.jsx'
import './AdminDashboard.css'

const cards = [
  ['오늘 예약', 'todayReservationCount', '건', 'calendar', '/admin/visits?tab=reservations'],
  ['현재 웨이팅', 'currentWaitingCount', '팀', 'user', '/admin/visits?tab=waiting'],
  ['오늘 결제 완료 주문', 'todayPaidOrderCount', '건', 'ticket', '/admin/orders'],
  ['재고 부족 상품', 'lowStockCount', '개', 'bag', '/admin/products?stock=low'],
]
const listFields = ['weeklyReservations', 'popupCrowding', 'recentOrders', 'lowStockProducts']
const orderStatusLabels = {
  PENDING: '결제 대기', PENDING_PAYMENT: '결제 대기', PAID: '결제 완료',
  EXPIRED: '결제 만료', CANCELLED: '주문 취소',
}
const getOrderStatus = status => orderStatusLabels[status] || status || '—'
const getCrowdingStatus = percent => percent >= 80 ? '혼잡' : percent >= 50 ? '보통' : '여유'

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')
  const [rankingError, setRankingError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [chartType, setChartType] = useState('all')

  // 운영 지표와 예약 인기 순위 조회
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setLoading(true)
    setError('')
    setRankingError('')
    http.get('/api/admin/dashboard', { signal }).then(({ data }) => {
      if (cards.some(([, field]) => !Number.isSafeInteger(data?.[field])) ||
          listFields.some(field => !Array.isArray(data?.[field]))) {
        throw new Error('운영 현황 응답을 확인하지 못했습니다.')
      }
      if (!signal.aborted) setDashboard(data)
    }).catch(() => { if (!signal.aborted) setError('운영 현황을 불러오지 못했습니다.') })
      .finally(() => { if (!signal.aborted) setLoading(false) })
    http.get('/api/admin/popups/ranking', { signal, params: { days: 7, limit: 3 } })
      .then(({ data }) => { if (!signal.aborted) setRanking(rows(data)) })
      .catch(() => { if (!signal.aborted) setRankingError('팝업 순위를 불러오지 못했습니다.') })
    return () => controller.abort()
  }, [retry])

  const { weeklyReservations = [], popupCrowding = [], recentOrders = [], lowStockProducts = [] } = dashboard ?? {}
  const maxReservation = Math.max(1, ...weeklyReservations.map(row => Math.max(row.reserved, row.entered)))
  const popularPopups = ranking?.filter(popup => popup.reservedPeople > 0) ?? []

  // 관리자 운영 대시보드
  return <div className="admin-dashboard" aria-busy={loading}>
    <div className="admin-page-heading"><h2>운영 대시보드</h2><button className="admin-chart-select" onClick={() => setRetry(value => value + 1)}>새로고침</button></div>
    {error ? <p role="alert">{error}</p> : <div className="admin-stat-grid">
      {cards.map(([title, field, unit, icon, link]) => <Link className="admin-stat-card" to={link} key={field}>
        <div className="admin-stat-top"><span>{title}</span><PopqIcon name={icon} size={20} /></div>
        <strong>{loading ? '…' : dashboard?.[field].toLocaleString('ko-KR')}<small>{unit}</small></strong>
      </Link>)}
    </div>}
    <section className="pq-dashboard-sales">
      <div className="pq-dashboard-sales-heading"><h3>전체 매출</h3><Link to="/admin/sales">매출 관리 →</Link></div>
      <SalesPeriodSummary refresh={retry} dashboard />
    </section>
    {!error && dashboard && <>
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
                <div className="admin-chart-column" key={item.date}>
                  <div className="admin-chart-bars" tabIndex={0}
                    aria-label={`${item.date} 예약 ${item.reserved}건, 입장 ${item.entered}건`}
                    title={`${item.date} · 예약 ${item.reserved}건 · 입장 ${item.entered}건`}>
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
                        aria-label={`${item.day}요일 입장 ${item.entered}건`}
                        title={`${item.day}요일 입장 ${item.entered}건`}
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
              <p>오늘 운영 현황</p>
            </div>
          </div>

          <div className="admin-crowding-list" tabIndex={0} aria-label="팝업별 혼잡도 목록">
            {popupCrowding.map((popup) => (
              <div className="admin-crowding-item" key={popup.popId}>
                <div className="admin-crowding-info">
                  <strong>{popup.title}</strong>
                  <span>{getCrowdingStatus(popup.percent)}</span>
                </div>

                <div
                  className="admin-progress-track"
                  role="meter"
                  aria-label={`${popup.title} 혼잡도`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.max(0, popup.percent))}
                >
                  <div
                    className={`admin-progress-fill ${
                      popup.percent >= 80 ? 'high' : ''
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, popup.percent))}%` }}
                  />
                </div>

                <div className="admin-crowding-bottom">
                  <span>혼잡도 {popup.percent}%</span>
                  <span>웨이팅 {popup.waiting}팀</span>
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
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.productName}</td>
                    <td>
                      {Number.isFinite(order.price) ? order.price.toLocaleString('ko-KR') + '원' : '—'}
                    </td>
                    <td>
                      <span
                        className={`admin-status ${String(order.status ?? '').toLowerCase()}`}
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
                key={product.prdId}
              >
                <div>
                  <strong>{product.productName}</strong>
                  <p>{product.popupTitle} · 남은 재고 {product.stock}개</p>
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

    </>}
    <section className="admin-panel admin-popular-panel">
      <div className="admin-panel-header"><div><h3>인기 팝업 TOP 3</h3><p>최근 7일 예약 인원 기준</p></div></div>
      {rankingError ? <p role="alert">{rankingError}</p> : !ranking ? <p role="status">순위를 불러오고 있어요.</p> :
        popularPopups.length ? <ol className="admin-popular-list pq-dashboard-ranking">
          {popularPopups.map((popup, index) => <li className="admin-popular-item" key={popup.popId}>
            <span className="admin-popular-rank">{popup.rank ?? index + 1}</span>
            <strong>{popup.title}</strong><span>{popup.reservedPeople.toLocaleString('ko-KR')}명</span>
          </li>)}
        </ol> : <p>집계된 예약이 없습니다.</p>}
    </section>
  </div>
}
