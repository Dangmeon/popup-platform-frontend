import { useEffect, useState } from 'react'
import { getSalesSummary } from '../../api/admin/salesApi.js'
import { getPopups } from '../../api/admin/popupApi.js'
import { errorText } from '../../api/admin/liveUtils.js'

export default function AdminSales() {
  const [popups, setPopups] = useState([])
  const [popupError, setPopupError] = useState('')
  const [popId, setPopId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setPopupError('')
    getPopups().then(result => { if (active) setPopups(result.items) }).catch(e => { if (active) setPopupError(errorText(e)) })
    return () => { active = false }
  }, [retry])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setData(null); setError('')
    getSalesSummary({popId, signal:controller.signal}).then(result => {
      if (!controller.signal.aborted) setData(result)
    }).catch(e => {
      if (!controller.signal.aborted) setError(e.response ? errorText(e) : e.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [popId, retry])
  const cards = [['누적 매출', 'totalSales', '원'], ['결제 완료 주문', 'totalOrderCount', '건'], ['판매 수량', 'totalQuantity', '개']]
  return <section aria-busy={loading}>
    <div className="admin-page-heading"><div><h2>매출 관리</h2><p>결제 완료 주문의 누적 매출과 판매 현황을 확인하세요.</p></div><button className="admin-chart-select" disabled={loading} onClick={() => setRetry(value => value + 1)}>새로고침</button></div>
    <div className="admin-panel"><label>조회할 팝업 <select className="admin-chart-select" value={popId} onChange={event => setPopId(event.target.value)}><option value="">전체 팝업</option>{popups.map(popup => <option key={popup.popId} value={popup.popId}>{popup.title}</option>)}</select></label>{popupError && <p role="alert">팝업 목록을 불러오지 못했습니다. {popupError}</p>}</div>
    {error ? <div className="admin-panel" role="alert">{error}<button className="admin-chart-select" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button></div> : <div className="admin-stat-grid">{cards.map(([label, key, unit]) => <div className="admin-stat-card" key={key}><div className="admin-stat-top"><span>{label}</span></div><strong>{loading ? '…' : data ? data[key].toLocaleString('ko-KR') : '—'}<small>{unit}</small></strong></div>)}</div>}
  </section>
}
