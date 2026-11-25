import { toImageUrl } from '../../utils/imageUrl.js'
import { useEffect, useState } from 'react'
import http from '../../api/axiosInstance.js'
import { rows } from '../../api/admin/liveUtils.js'
import AdminDetailModal from '../../components/admin/AdminDetailModal.jsx'
import './AdminOrders.css'

const statuses = { PENDING: '결제 대기', PAID: '결제 완료', CANCELLED: '주문 취소', EXPIRED: '기한 만료' }
const money = value => Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : '—'
const date = value => value ? value.replace('T', ' ').slice(0, 19) : '—'
function ProductImage({ url, name }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = toImageUrl(url)
  return imageUrl && !failed ? <img src={imageUrl} alt={name || '주문 상품'} onError={() => setFailed(true)} /> : <span>이미지 없음</span>
}
export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailRetry, setDetailRetry] = useState(0)
  const selectedId = selected?.orderId
  // 주문 상세 조회
  useEffect(() => {
    if (selectedId == null) return
    const controller = new AbortController()
    setDetail(null); setDetailError(''); setDetailLoading(true)
    http.get(`/api/admin/orders/${selectedId}`, {signal:controller.signal}).then(({data}) => {
      if (controller.signal.aborted) return
      if (data?.orderId !== selectedId || !Array.isArray(data.items)) throw new Error('주문 상세 응답을 확인하지 못했습니다.')
      setDetail(data)
    }).catch(e => {
      if (!controller.signal.aborted) setDetailError('주문 상세를 불러오지 못했습니다.')
    }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
    return () => controller.abort()
  }, [selectedId, detailRetry])
  // 주문 목록 조회
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const result = rows((await http.get('/api/admin/orders')).data)
        if (active) { setOrders(result); setSelected(previous => previous ? result.find(row => row.orderId === previous.orderId) || null : null) }
      } catch { if (active) { setError('주문 목록을 불러오지 못했습니다.'); setOrders(null) } }
      finally { if (active) setLoading(false) }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [retry])
  const filtered = (orders || []).filter(row => !status || row.status === status)
  return <section>
    <div className="admin-page-heading"><div><h2>주문 관리</h2><p>전체 회원의 주문과 결제 상태를 확인하세요.</p></div><button className="admin-chart-select" disabled={loading} onClick={() => setRetry(v => v + 1)}>새로고침</button></div>
    <div className="admin-panel"><div className="order-admin-filters"><label>주문 상태<select value={status} onChange={e => setStatus(e.target.value)}><option value="">전체</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div></div>
    <div className="admin-panel" aria-busy={loading}>
      {error ? <p role="alert">{error}</p> : orders === null ? <p role="status">주문을 불러오고 있어요.</p> : <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th><th>주문 일시</th><th>관리</th></tr></thead><tbody>{filtered.map(row => <tr key={row.orderId}><td>{row.orderId}</td><td>{row.userName}<br />{row.userEmail}</td><td>{money(row.totalPrice)}</td><td>{statuses[row.status] || row.status}</td><td>{date(row.orderedAt)}</td><td><button className="admin-chart-select" aria-haspopup="dialog" onClick={() => setSelected(row)}>상세 보기</button></td></tr>)}{!filtered.length && <tr><td colSpan={6}>조건에 맞는 주문이 없습니다.</td></tr>}</tbody></table></div>}
    </div>
    {selected && <AdminDetailModal title="주문 상세" onClose={() => setSelected(null)}>
      {detailLoading && <p role="status">주문 상세를 불러오고 있어요.</p>}
      {detailError && <div role="alert"><p>{detailError}</p><button className="admin-chart-select" onClick={() => setDetailRetry(v => v + 1)}>다시 불러오기</button></div>}
      {!detailLoading && !detailError && detail?.orderId === selectedId && <>
        <dl>{[['주문번호', detail.orderId], ['결제 주문번호', detail.tossOrderId], ['주문자', detail.userName], ['이메일', detail.userEmail], ['주문 금액', money(detail.totalPrice)], ['주문 상태', statuses[detail.status] || detail.status], ['주문 일시', date(detail.orderedAt)], ['결제 일시', date(detail.paymentAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
        <h4>주문 상품</h4>
        <ul className="order-detail-products">{detail.items.map((item, index) => <li key={`${item.prdId}-${index}`}><div className="order-detail-image"><ProductImage key={item.url} url={item.url} name={item.productName} /></div><div><strong>{item.productName || '상품명 미등록'}</strong><p>수량 {item.quantity ?? '—'}개 · 주문 당시 단가 {item.unitPrice == null ? '기록 없음' : money(item.unitPrice)}</p></div></li>)}</ul>
        {!detail.items.length && <p>등록된 주문 상품이 없습니다.</p>}
        <h4>배송 정보</h4>
        <dl>{[['수령인', detail.receiverName], ['연락처', detail.receiverPhone], ['배송지', detail.deliveryAddress], ...(detail.deliveryAddressDetail?.trim() ? [['상세주소', detail.deliveryAddressDetail]] : []), ['배송 메모', detail.deliveryMemo]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '미등록'}</dd></div>)}</dl>
      </>}
    </AdminDetailModal>}
  </section>
}
