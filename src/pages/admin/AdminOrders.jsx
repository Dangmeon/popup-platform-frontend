import { useEffect, useState } from 'react'
import http from '../../api/axiosInstance.js'
import { rows, errorText } from '../../api/admin/liveUtils.js'
import AdminDetailModal from '../../components/admin/AdminDetailModal.jsx'

const statuses = { PENDING: '결제 대기', PAID: '결제 완료', CANCELLED: '주문 취소', EXPIRED: '기한 만료' }
const money = value => Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : '—'
const date = value => value ? value.replace('T', ' ').slice(0, 19) : '—'
export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const result = rows((await http.get('/api/admin/orders')).data)
        if (active) { setOrders(result); setSelected(previous => previous ? result.find(row => row.orderId === previous.orderId) || null : null) }
      } catch (e) { if (active) { setError(errorText(e)); setOrders(null) } }
      finally { if (active) setLoading(false) }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [retry])
  const filtered = (orders || []).filter(row => !status || row.status === status)
  return <section>
    <div className="admin-page-heading"><div><h2>주문 관리</h2><p>전체 회원의 주문과 결제 상태를 확인하세요.</p></div><button className="admin-chart-select" disabled={loading} onClick={() => setRetry(v => v + 1)}>새로고침</button></div>
    <div className="admin-panel"><label>주문 상태 <select value={status} onChange={e => setStatus(e.target.value)}><option value="">전체</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <div className="admin-panel" aria-busy={loading}>
      {error ? <p role="alert">{error}</p> : orders === null ? <p role="status">주문을 불러오고 있어요.</p> : <div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th><th>주문 일시</th><th>관리</th></tr></thead><tbody>{filtered.map(row => <tr key={row.orderId}><td>{row.orderId}</td><td>{row.userName}<br />{row.userEmail}</td><td>{money(row.totalPrice)}</td><td>{statuses[row.status] || row.status}</td><td>{date(row.orderedAt)}</td><td><button className="admin-chart-select" aria-haspopup="dialog" onClick={() => setSelected(row)}>상세 보기</button></td></tr>)}{!filtered.length && <tr><td colSpan={6}>조건에 맞는 주문이 없습니다.</td></tr>}</tbody></table></div>}
    </div>
    {selected && <AdminDetailModal title="주문 상세" onClose={() => setSelected(null)}><dl>{[['주문번호', selected.orderId], ['결제 주문번호', selected.tossOrderId], ['주문자', selected.userName], ['이메일', selected.userEmail], ['주문 금액', money(selected.totalPrice)], ['주문 상태', statuses[selected.status] || selected.status], ['주문 일시', date(selected.orderedAt)], ['결제 일시', date(selected.paymentAt)], ['결제 기한', date(selected.expiresAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl></AdminDetailModal>}
  </section>
}
