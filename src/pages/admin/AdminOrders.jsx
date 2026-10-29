import { useState } from 'react'
import './AdminOrders.css'

// 주문 상태
const orderStatuses = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
  EXPIRED: '결제 만료',
}

// 주문 항목 상태
const itemStatuses = {
  INCLUDED: '주문 포함',
  EXCLUDED: '주문 제외',
}

// 임시 주문 데이터
const demoOrders = [
  {
    id: 1,
    number: 'DEMO-ORD-000001',
    memberName: '김팝큐',
    createdAt: '2026-10-28T13:00:00+09:00',
    paymentExpiresAt: '2026-10-28T13:10:00+09:00',
    paidAt: null,
    cancelledAt: null,
    status: 'PENDING_PAYMENT',
    items: [
      {
        id: 11,
        name: 'POPQ 에코백',
        unitPrice: 18000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
      {
        id: 12,
        name: 'POPQ 스티커 세트',
        unitPrice: 8000,
        quantity: 2,
        status: 'INCLUDED',
        exclusionReason: '',
      },
      {
        id: 13,
        name: '한정판 키링',
        unitPrice: 12000,
        quantity: 1,
        status: 'EXCLUDED',
        exclusionReason: '결제 전 사용자 요청으로 제외',
      },
    ],
  },
  {
    id: 2,
    number: 'DEMO-ORD-000002',
    memberName: '이하늘',
    createdAt: '2026-10-28T11:00:00+09:00',
    paymentExpiresAt: '2026-10-28T11:10:00+09:00',
    paidAt: '2026-10-28T11:05:00+09:00',
    cancelledAt: null,
    status: 'PAID',
    items: [
      {
        id: 21,
        name: '캐릭터 인형',
        unitPrice: 25000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
  {
    id: 3,
    number: 'DEMO-ORD-000003',
    memberName: '박봄',
    createdAt: '2026-10-28T10:00:00+09:00',
    paymentExpiresAt: '2026-10-28T10:10:00+09:00',
    paidAt: null,
    cancelledAt: '2026-10-28T10:03:00+09:00',
    status: 'CANCELLED',
    items: [
      {
        id: 31,
        name: 'POPQ 에코백',
        unitPrice: 18000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
  {
    id: 4,
    number: 'DEMO-ORD-000004',
    memberName: '최여름',
    createdAt: '2026-10-28T09:00:00+09:00',
    paymentExpiresAt: '2026-10-28T09:10:00+09:00',
    paidAt: null,
    cancelledAt: null,
    status: 'EXPIRED',
    items: [
      {
        id: 41,
        name: 'POPQ 스티커 세트',
        unitPrice: 8000,
        quantity: 1,
        status: 'INCLUDED',
        exclusionReason: '',
      },
    ],
  },
]

// 금액 표시
function formatPrice(amount) {
  return `${amount.toLocaleString('ko-KR')}원`
}

// 날짜 표시
function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

// 주문 금액 계산
function calculateAmounts(items) {
  const originalAmount = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  )

  const excludedAmount = items
    .filter((item) => item.status === 'EXCLUDED')
    .reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    )

  return {
    originalAmount,
    excludedAmount,
    finalAmount: originalAmount - excludedAmount,
  }
}

function AdminOrders() {
  // 검색 및 필터
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 상세 정보
  const [selectedId, setSelectedId] = useState(null)

  const searchKeyword = keyword.trim().toLowerCase()

  const filteredOrders = demoOrders.filter((order) => {
    const matchesKeyword =
      order.number.toLowerCase().includes(searchKeyword) ||
      order.memberName.toLowerCase().includes(searchKeyword)

    const matchesStatus = !status || order.status === status

    return matchesKeyword && matchesStatus
  })

  const selectedOrder = demoOrders.find(
    (order) => order.id === selectedId
  )

  const selectedAmounts = selectedOrder
    ? calculateAmounts(selectedOrder.items)
    : null

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

        <span className="admin-demo-badge">DEMO DATA</span>
      </div>

      {/* 데모 안내 */}
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
      <section className="admin-panel order-admin-list">
        <div className="admin-panel-header">
          <h3>주문 목록</h3>
          <span>
            검색 {filteredOrders.length}건 / 전체 {demoOrders.length}건
          </span>
        </div>

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
              {filteredOrders.map((order) => {
                const amounts = calculateAmounts(order.items)

                return (
                  <tr key={order.id}>
                    <td>{order.number}</td>
                    <td>{order.memberName}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>{formatPrice(amounts.finalAmount)}</td>
                    <td>
                      <span
                        className={`order-admin-status ${order.status.toLowerCase()}`}
                      >
                        {orderStatuses[order.status]}
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
                )
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="order-admin-empty">
                    검색 조건에 맞는 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 주문 상세 */}
      <div id="order-admin-detail">
        {selectedOrder && (
          <section
            className="admin-panel order-admin-detail"
            aria-labelledby="order-admin-detail-title"
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
                <dd>{orderStatuses[selectedOrder.status]}</dd>
              </div>
              <div>
                <dt>주문 생성일시</dt>
                <dd>{formatDateTime(selectedOrder.createdAt)}</dd>
              </div>
              <div>
                <dt>결제 만료시각</dt>
                <dd>
                  {formatDateTime(selectedOrder.paymentExpiresAt)}
                  {' '}(생성 후 10분)
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
                          {itemStatuses[item.status]}
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
                <dd>{formatPrice(selectedAmounts.originalAmount)}</dd>
              </div>
              <div>
                <dt>제외 상품 금액</dt>
                <dd>−{formatPrice(selectedAmounts.excludedAmount)}</dd>
              </div>
              <div className="order-admin-total">
                <dt>최종 주문 금액</dt>
                <dd>{formatPrice(selectedAmounts.finalAmount)}</dd>
              </div>
              <div>
                <dt>결제 완료 금액</dt>
                <dd>
                  {formatPrice(
                    selectedOrder.status === 'PAID'
                      ? selectedAmounts.finalAmount
                      : 0
                  )}
                </dd>
              </div>
            </dl>

            <p className="order-admin-help">
              배송비·할인이 없는 상품 금액 예시입니다.
              실제 API 연동 후에는 서버가 계산한 최종 금액과 결제 결과를
              표시합니다.
            </p>

            {selectedAmounts.excludedAmount > 0 && (
              <p className="order-admin-demo">
                한정판 키링만 제외된 예시입니다.
                나머지 상품 34,000원의 결제 대기 상태는 유지됩니다.
                재고 복구와 대기열 접근 권한 처리는 백엔드 연동 대상입니다.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default AdminOrders