import React, { useCallback, useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance.js'
import { getProduct } from '../api/popupApi.js'
import '../styles/MyOrders.css'

const won = (n) => `₩${Math.round(Number(n) || 0).toLocaleString()}`

const STATUS_LABELS = {
  PENDING: '결제 대기',
  EXPIRED: '결제 시간 만료',
  PAID: '결제 완료',
  PREPARE: '배송 준비',
  PREPARING: '배송 준비',
  SHIPPED: '배송 중',
  DELIVERED: '배송 완료',
  CANCELED: '주문 취소',
  CANCELLED: '주문 취소',
}

async function requestApi(url, options = {}) {
  try {
    const response = await axiosInstance.request({ url, method: options.method || 'GET' })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || '주문 요청을 처리하지 못했습니다.')
  }
}

function normalizeOrder(raw = {}) {
  const source = raw.order && typeof raw.order === 'object' ? raw.order : raw
  const orderId =
    source.orderId ?? source.id ?? source.orderNumber ?? ''
  const rawStatus = String(
    source.status ?? source.orderStatus ?? source.paymentStatus ?? 'PAID'
  ).toUpperCase()

  const rawItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.orderItems)
      ? source.orderItems
      : source.item
        ? [source.item]
        : []

  const normalizedItems = rawItems.map((it, idx) => ({
    id: it.orderItemId ?? it.id ?? `${orderId}-${idx}`,
    name: it.productName ?? it.itemName ?? it.name ?? '상품',
    option:
      it.optionName ??
      it.option ??
      (it.quantity ? `수량 ${it.quantity}개` : ''),
    quantity: Number(it.quantity ?? 1),
    price: Number(it.price ?? it.unitPrice ?? it.amount ?? 0),
    image: it.imageUrl ?? it.thumbnailUrl ?? it.image ?? '',
  }))

  const primaryItem = normalizedItems[0] || {
    name: source.productName ?? source.title ?? '주문 상품',
    option: '',
    quantity: 1,
    price: Number(source.totalPrice ?? source.totalAmount ?? source.amount ?? 0),
    image: source.imageUrl ?? source.image ?? '',
  }

  const extraCount = normalizedItems.length > 1 ? ` 외 ${normalizedItems.length - 1}건` : ''
  const totalAmount = Number(
    source.totalPrice ??
      source.totalAmount ??
      source.amount ??
      normalizedItems.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0)
  )

  return {
    id: orderId,
    orderNumber: source.orderNumber ?? orderId,
    date: source.orderedAt ?? source.createdAt ?? source.date ?? '',
    status: rawStatus,
    statusLabel: source.statusLabel ?? STATUS_LABELS[rawStatus] ?? rawStatus,
    totalAmount,
    items: normalizedItems,
    item: {
      ...primaryItem,
      name: `${primaryItem.name}${extraCount}`,
    },
    raw: source,
  }
}

async function hydrateOrder(raw) {
  let detail = raw
  try { detail = await requestApi(`/api/orders/${encodeURIComponent(raw.orderId ?? raw.id)}`) }
  catch { return {...normalizeOrder(raw), item:{...normalizeOrder(raw).item,name:'상품 정보를 불러오지 못했어요'}} }
  const items = await Promise.all((detail.items || []).map(async item => {
    if (!item.prdId) return item
    try {
      const product = await getProduct(item.prdId)
      return {...item, productName:item.productName || product.name, image:product.image}
    } catch { return item }
  }))
  return normalizeOrder({...detail,items})
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelingId, setCancelingId] = useState(null)

  // GET /api/orders - 로그인한 사용자의 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await requestApi('/api/orders', { method: 'GET' })
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.data)
              ? data.data
              : []

      setOrders(await Promise.all(list.map(hydrateOrder)))
    } catch (err) {
      setError(err.message || '주문 내역을 불러오지 못했습니다.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // GET /api/orders/{orderId} - 주문 상세 조회
  const handleOpenDetail = async (order) => {
    setSelectedOrder(order)
    if (!order?.id) return

    setDetailLoading(true)
    try {
      const detail = await requestApi(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'GET',
      })
      if (detail) {
        setSelectedOrder(await hydrateOrder(detail))
      }
    } catch {
      // 목록 데이터로 우선 표시 유지
    } finally {
      setDetailLoading(false)
    }
  }

  // PATCH /api/orders/{orderId}/cancel - 주문 취소
  const handleCancelOrder = async (orderId) => {
    if (!orderId) return
    if (!window.confirm('정말 주문을 취소하시겠습니까?')) return

    setCancelingId(orderId)
    try {
      await requestApi(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'PATCH',
      })

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: 'CANCELED', statusLabel: STATUS_LABELS.CANCELED }
            : order
        )
      )

      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? { ...prev, status: 'CANCELED', statusLabel: STATUS_LABELS.CANCELED }
          : prev
      )

      alert('주문이 취소되었습니다.')
    } catch (err) {
      alert(err.message || '주문 취소에 실패했습니다.')
    } finally {
      setCancelingId(null)
    }
  }

  const canCancel = (status) =>
    ['PENDING', 'PAID', 'PREPARE', 'PREPARING'].includes(status)

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <div>
          <h2>주문 내역</h2>
          <p>주문한 상품과 결제 상태를 확인하세요.</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchOrders}
          disabled={loading}
        >
          🔄 {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>

      {loading ? (
        <div className="empty-orders" style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
          주문 내역을 불러오는 중입니다...
        </div>
      ) : error ? (
        <div className="empty-orders" style={{ padding: '40px 0', textAlign: 'center', color: '#dc2626' }}>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-orders" style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
          주문 내역이 없습니다.
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, idx) => (
            <div key={order.id || idx} className="order-card">
              <div className="order-card-top">
                <span className="order-date">{String(order.date).slice(0,16).replace('T',' ')}</span>
                <span className="order-number">주문번호 {order.orderNumber}</span>
                <span className={`status-badge status-${order.status}`}>
                  {order.statusLabel}
                </span>
              </div>

              <div className="order-card-body">
                <div className="item-info-area">
                  <div className="item-thumb">
                    {order.item.image && (
                      <img src={order.item.image} alt={order.item.name} />
                    )}
                  </div>
                  <div className="item-details">
                    <strong className="item-name">{order.item.name}</strong>
                    {order.item.option && (
                      <span className="item-option">{order.item.option}</span>
                    )}
                  </div>
                </div>

                <div className="order-price-area">
                  <span className="price-label">결제 금액</span>
                  <strong className="price-value">{won(order.totalAmount)}</strong>
                </div>

                <div className="order-action-area">
                  <button
                    type="button"
                    className="action-btn detail-btn"
                    onClick={() => handleOpenDetail(order)}
                  >
                    주문 상세
                  </button>

                  {canCancel(order.status) ? (
                    <button
                      type="button"
                      className="action-btn cancel-btn"
                      disabled={cancelingId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      {cancelingId === order.id ? '취소 처리 중...' : '취소 요청'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="action-btn repurchase-btn"
                      onClick={() => window.location.assign('/goods')}
                    >
                      굿즈 둘러보기
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>주문 상세 정보</h3>
            {detailLoading ? (
              <p>상세 정보를 불러오는 중입니다...</p>
            ) : (
              <div className="modal-rows">
                <p><strong>주문번호:</strong> {selectedOrder.orderNumber}</p>
                {selectedOrder.date && (
                  <p><strong>주문일시:</strong> {selectedOrder.date}</p>
                )}
                <p><strong>주문상태:</strong> {selectedOrder.statusLabel}</p>
                <hr />
                {selectedOrder.items?.length > 0 ? (
                  selectedOrder.items.map((it) => (
                    <div key={it.id} style={{ marginBottom: '8px' }}>
                      <p><strong>상품명:</strong> {it.name}</p>
                      {it.option && <p><strong>옵션:</strong> {it.option}</p>}
                      <p><strong>수량/금액:</strong> {it.quantity}개 · {won(it.price * (it.quantity || 1))}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <p><strong>상품명:</strong> {selectedOrder.item.name}</p>
                    {selectedOrder.item.option && (
                      <p><strong>옵션:</strong> {selectedOrder.item.option}</p>
                    )}
                  </>
                )}
                <hr />
                <p><strong>총 결제금액:</strong> {won(selectedOrder.totalAmount)}</p>
              </div>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedOrder(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}