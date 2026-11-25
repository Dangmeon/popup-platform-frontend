import SearchablePopupSelect from '../../components/admin/SearchablePopupSelect.jsx'
import { useEffect, useState } from 'react'
import SalesPeriodSummary from '../../components/common/SalesPeriodSummary.jsx'
import { getPopups } from '../../api/admin/popupApi.js'
import { errorText } from '../../api/admin/liveUtils.js'

export default function AdminSales() {
  const [popups, setPopups] = useState([])
  const [popupError, setPopupError] = useState('')
  const [popId, setPopId] = useState('')
  const [retry, setRetry] = useState(0)
  // 조회 대상 팝업 목록
  useEffect(() => {
    let active = true
    setPopupError('')
    getPopups().then(result => { if (active) setPopups(result.items) }).catch(e => { if (active) setPopupError(errorText(e)) })
    return () => { active = false }
  }, [retry])
  // 관리자 매출 화면
  return <section>
    <div className="admin-page-heading"><div><h2>매출 관리</h2><p>결제 완료 주문을 기준으로 집계합니다.</p></div><button className="admin-chart-select" onClick={() => setRetry(value => value + 1)}>새로고침</button></div>
    <SalesPeriodSummary popId={popId} refresh={retry} filterError={popupError && '팝업 목록을 불러오지 못했습니다.'}>
      <SearchablePopupSelect label="팝업" popups={popups} value={popId} onChange={setPopId} allowEmpty emptyLabel="전체 팝업" />
    </SalesPeriodSummary>
  </section>
}
