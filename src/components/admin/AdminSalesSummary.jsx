import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSalesSummary } from '../../api/admin/salesApi'
import AdminSalesChart from './AdminSalesChart'
import './AdminSalesSummary.css'

const amountFormat = new Intl.NumberFormat('ko-KR')
const percentFormat = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const periods = [
  { key: 'previousMonth', label: '지난달 전체 매출' },
  { key: 'currentMonth', label: '이번 달 누적 매출' },
  { key: 'nextMonthForecast', label: '다음 달 예상 매출' },
]

export default function AdminSalesSummary({ compact = false }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadSales() {
      try {
        const data = await getSalesSummary()
        if (active) setSummary(data)
      } catch {
        if (active) setError(true)
      }
    }

    loadSales()

    return () => {
      active = false
    }
  }, [retryKey])

  function retry() {
    setError(false)
    setRetryKey((previous) => previous + 1)
  }

  const visiblePeriods = compact ? [periods[1]] : periods
  const previousAmount = summary?.previousMonth.amount ?? 0
  const currentAmount = summary?.currentMonth.amount ?? 0
  const difference = currentAmount - previousAmount
  const changeRate = previousAmount > 0
    ? percentFormat.format(Math.abs(difference) / previousAmount)
    : null

  let comparison = '지난달 매출 0원 · 증감률 산정 불가'
  if (changeRate !== null) {
    if (difference === 0) {
      comparison = '지난달 전체 매출과 동일'
    } else {
      const direction = difference > 0 ? '증가' : '감소'
      comparison = `지난달 전체 매출 대비 ${changeRate} ${direction}`
    }
  }

  return (
    <section className="admin-panel admin-sales-summary" aria-label="매출 요약">
      <div className="admin-panel-header">
        <h3>{compact ? '이번 달 매출 요약' : '월별 매출'}</h3>
        {summary?.isDemo && (
          <span className="admin-demo-badge">예시 데이터</span>
        )}
      </div>

      {error ? (
        <>
          <p role="alert">매출 정보를 불러오지 못했습니다.</p>
          <button type="button" className="admin-chart-select" onClick={retry}>
            다시 불러오기
          </button>
        </>
      ) : summary ? (
        <>
          <dl className="admin-sales-periods">
            {visiblePeriods.map(({ key, label }) => {
              const { month, amount } = summary[key]

              return (
                <div
                  key={key}
                  className={
                    key === 'nextMonthForecast' ? 'admin-sales-forecast' : undefined
                  }
                >
                  <dt>{label} · {month}월</dt>
                  <dd>{amountFormat.format(amount)}원</dd>
                  {key === 'currentMonth' && (
                    <dd
                      style={{
                        fontSize: 14,
                        color: changeRate === null || difference === 0
                          ? '#695950'
                          : difference > 0 ? '#28764a' : '#a5402c',
                      }}
                    >
                      {comparison}
                    </dd>
                  )}
                </div>
              )
            })}
          </dl>

          {compact ? (
            <>
              <Link className="admin-sales-link" to="/admin/sales">
                매출 관리 보기 →
              </Link>
            </>
          ) : (
            <>
              <AdminSalesChart summary={summary} />
              <p className="admin-sales-note">
                {summary.isDemo
                  ? '표시된 매출과 예상 금액은 예시입니다.'
                  : '다음 달 예상 매출은 추정치입니다.'}
              </p>
            </>
          )}
        </>
      ) : (
        <p role="status">매출 정보를 불러오는 중입니다.</p>
      )}
    </section>
  )
}
