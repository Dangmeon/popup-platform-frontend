import { useEffect, useState } from 'react'
import {
  getOrders,
  getOrder,
} from '../../api/admin/orderApi'
import './AdminOrders.css'

// 나중에 확인할 부분: 서버의 주문 상태를 API 파일에서 화면 상태로 변환
const orderStatuses = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
  EXPIRED: '결제 만료',
}

// 나중에 확인할 부분: 서버의 주문 항목 상태와 일치시키기
const itemStatuses = {
  INCLUDED: '주문 포함',
  EXCLUDED: '주문 제외',
}

// 금액 표시
function formatPrice(amount) {
  return `${amount.toLocaleString('ko-KR')}원`
}

// 날짜 표시
function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function AdminOrders() {
  // 주문 목록
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 주문 상세
  const [selectedId, setSelectedId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // 재조회
  const [listRetryKey, setListRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)

  // 주문 목록 조회
  useEffect(() => {
    let active = true

    async function loadOrders() {
      setListLoading(true)
      setListError('')

      try {
        const response = await getOrders({
          keyword,
          status,
        })

        if (!active) return

        setOrders(response.items)
        setTotal(response.total)
        setTotalAll(response.totalAll)
      } catch (error) {
        if (!active) return

        setOrders([])
        setTotal(0)
        setTotalAll(0)
        setListError(
          error.message || '주문 목록을 불러오지 못했습니다.'
        )
      } finally {
        if (active) setListLoading(false)
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [keyword, status, listRetryKey])

  // 주문 상세 조회
  useEffect(() => {
    let active = true

    async function loadOrder() {
      setSelectedOrder(null)
      setDetailError('')

      if (selectedId === null) {
        setDetailLoading(false)
        return
      }

      setDetailLoading(true)

      try {
        const response = await getOrder(selectedId)

        if (active) setSelectedOrder(response)
      } catch (error) {
        if (active) {
          setDetailError(
            error.message || '주문 상세 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    }

    loadOrder()

    return () => {
      active = false
    }
  }, [selectedId, detailRetryKey])

  // 필터 초기화
  function handleReset() {
    setKeyword('')
    setStatus('')
  }

  return (
    <div className="admin-orders">
      {/* 화면 제목 */}
      <div className="admin-page-heading">
        <div>
          <h2>주문 관리</h2>
          <p>주문 상품과 결제 상태를 확인하세요.</p>
        </div>

        {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 표시 제거 */}
        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 나중에 바꿀 부분: 실제 API 연결 후 데모 안내 제거 */}
      <p className="order-admin-demo">
        고정된 가상 주문을 사용하는 조회 화면입니다.
        현재 시각과 관계없이 예시 상태를 표시하며, 실제 결제·취소·재고
        복구·자동 만료는 실행하지 않습니다.
      </p>

      {/* 검색 및 필터 */}
      <section className="admin-panel" aria-label="주문 검색">
        <div className="order-admin-filters">
          <label>
            주문번호 / 주문자
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="주문번호 또는 주문자 이름 입력"
            />
          </label>

          <label>
            주문 상태
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(orderStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="order-admin-button"
            onClick={handleReset}
          >
            초기화
          </button>
        </div>
      </section>

      {/* 주문 목록 */}
      <section
        className="admin-panel order-admin-list"
        aria-busy={listLoading}
      >
        <div className="admin-panel-header">
          <h3>주문 목록</h3>
          {!listLoading && !listError && (
            <span>
              검색 {total}건 / 전체 {totalAll}건
            </span>
          )}
        </div>

        {listLoading && (
          <p role="status">주문 목록을 불러오는 중입니다.</p>
        )}

        {listError && (
          <div>
            <p role="alert">{listError}</p>
            <button
              type="button"
              className="order-admin-button"
              onClick={() =>
                setListRetryKey((previous) => previous + 1)
              }
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!listLoading && !listError && (
          <div className="admin-table-wrapper">
            <table className="admin-table order-admin-table">
              <caption className="order-admin-sr-only">
                주문 검색 결과
              </caption>

              <thead>
                <tr>
                  <th scope="col">주문번호</th>
                  <th scope="col">주문자</th>
                  <th scope="col">주문 생성일시</th>
                  <th scope="col">최종 주문 금액</th>
                  <th scope="col">상태</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.number}</td>
                    <td>{order.memberName}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>{formatPrice(order.amounts.finalAmount)}</td>
                    <td>
                      <span
                        className={`order-admin-status ${order.status.toLowerCase()}`}
                      >
                        {orderStatuses[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="order-admin-button"
                        aria-label={`${order.number} 상세 보기`}
                        aria-expanded={selectedId === order.id}
                        aria-controls="order-admin-detail"
                        onClick={() => setSelectedId(order.id)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="order-admin-empty">
                      검색 조건에 맞는 주문이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 주문 상세 */}
      <div id="order-admin-detail">
        {selectedId !== null && (
          <section
            className="admin-panel order-admin-detail"
            aria-labelledby="order-admin-detail-title"
            aria-busy={detailLoading}
          >
            <div className="admin-panel-header">
              <h3 id="order-admin-detail-title">주문 상세</h3>
              <button
                type="button"
                className="order-admin-button"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
            </div>

            {detailLoading && (
              <p role="status">주문 정보를 불러오는 중입니다.</p>
            )}

            {detailError && (
              <div>
                <p role="alert">{detailError}</p>
                <button
                  type="button"
                  className="order-admin-button"
                  onClick={() =>
                    setDetailRetryKey((previous) => previous + 1)
                  }
                >
                  다시 불러오기
                </button>
              </div>
            )}

            {!detailLoading && !detailError && selectedOrder && (
              <>
                <dl className="order-admin-info">
                  <div>
                    <dt>주문번호</dt>
                    <dd>{selectedOrder.number}</dd>
                  </div>
                  <div>
                    <dt>주문자</dt>
                    <dd>{selectedOrder.memberName}</dd>
                  </div>
                  <div>
                    <dt>주문 상태</dt>
                    <dd>
                      {orderStatuses[selectedOrder.status] ||
                        selectedOrder.status}
                    </dd>
                  </div>
                  <div>
                    <dt>주문 생성일시</dt>
                    <dd>{formatDateTime(selectedOrder.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>결제 만료시각</dt>
                    <dd>
                      {formatDateTime(selectedOrder.paymentExpiresAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>결제 완료일시</dt>
                    <dd>{formatDateTime(selectedOrder.paidAt)}</dd>
                  </div>
                  <div>
                    <dt>주문 취소일시</dt>
                    <dd>{formatDateTime(selectedOrder.cancelledAt)}</dd>
                  </div>
                </dl>

                {/* 주문 상품 */}
                <h4>주문 상품</h4>

                <p className="order-admin-help">
                  ‘주문 포함’은 주문에 기록된 항목입니다.
                  주문 전체의 결제·취소·만료 상태와 함께 확인해 주세요.
                </p>

                <div className="admin-table-wrapper">
                  <table className="admin-table order-admin-table">
                    <caption className="order-admin-sr-only">
                      선택한 주문의 상품 내역
                    </caption>

                    <thead>
                      <tr>
                        <th scope="col">상품명</th>
                        <th scope="col">단가</th>
                        <th scope="col">수량</th>
                        <th scope="col">상품 금액</th>
                        <th scope="col">항목 상태</th>
                        <th scope="col">제외 사유</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{formatPrice(item.unitPrice)}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {formatPrice(item.unitPrice * item.quantity)}
                          </td>
                          <td>
                            <span
                              className={`order-admin-status ${item.status.toLowerCase()}`}
                            >
                              {itemStatuses[item.status] || item.status}
                            </span>
                          </td>
                          <td>{item.exclusionReason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 주문 금액 */}
                <dl className="order-admin-amounts">
                  <div>
                    <dt>제외 전 상품 합계</dt>
                    <dd>
                      {formatPrice(selectedOrder.amounts.originalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt>제외 상품 금액</dt>
                    <dd>
                      −{formatPrice(selectedOrder.amounts.excludedAmount)}
                    </dd>
                  </div>
                  <div className="order-admin-total">
                    <dt>최종 주문 금액</dt>
                    <dd>
                      {formatPrice(selectedOrder.amounts.finalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt>결제 완료 금액</dt>
                    <dd>
                      {formatPrice(selectedOrder.amounts.paidAmount)}
                    </dd>
                  </div>
                </dl>

                <p className="order-admin-help">
                  금액과 결제 만료시각은 조회 응답을 기준으로 표시합니다.
                  현재는 배송비·할인이 없는 더미 데이터입니다.
                </p>

                {selectedOrder.amounts.excludedAmount > 0 && (
                  <p className="order-admin-help">
                    제외된 상품은 최종 주문 금액에 포함되지 않습니다.
                    나머지 상품의 진행 상태는 위 주문 상태에서 확인해 주세요.
                  </p>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminOrders