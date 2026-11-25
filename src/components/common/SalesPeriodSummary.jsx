import { useEffect, useState } from 'react'
import { getMonthlySalesForecast, getSalesSummary, getSalesTrend } from '../../api/admin/salesApi.js'
import PopqIcon from './PopqIcon.jsx'
import './SalesPeriodSummary.css'

const metrics = [
  ['매출', 'totalSales', '원', 'chart'],
  ['결제 완료 주문', 'totalOrderCount', '건', 'ticket'],
  ['판매 수량', 'totalQuantity', '개', 'bag'],
]

function todayInSeoul() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

// 주간 집계 기간 계산
function weekLabel(value) {
  const monday = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(monday.getTime())) return ''
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(sunday.getUTCDate() + 6)
  return [monday, sunday].map(date => date.toISOString().slice(0, 10)).join(' ~ ')
}

function salesMonthAfter(month) {
  const date = new Date(month + '-01T00:00:00Z')
  date.setUTCMonth(date.getUTCMonth() + 1)
  return date.toISOString().slice(0, 7)
}

// 주별·월별 매출 비교 그래프
function PeriodSalesChart({ rows, weekly }) {
  const title = weekly ? '주간 매출 추이' : '월간 매출 추이'
  if (!rows) {
    return <div className="pq-sales-chart"><h3>{title}</h3><p role="status">매출 추이를 불러오고 있어요.</p></div>
  }
  if (!rows.length) {
    return <div className="pq-sales-chart"><h3>{title}</h3><p role="alert">매출 추이를 불러오지 못했습니다.</p></div>
  }

  const max = Math.max(0, ...rows.map(row => row.sales ?? 0))
  const format = value => value.toLocaleString('ko-KR')
  const amount = value => value == null ? '—' : format(value) + '원'
  return <section className="pq-sales-chart" aria-label={title}>
    <header><h3>{title}</h3><span>단위 원</span></header>

      <div className="pq-sales-chart-body">
        <div className="pq-sales-axis" aria-hidden="true"><span>{max > 0 ? format(max) : ''}</span><span>0</span></div>
        <div className="pq-sales-columns" style={{ '--sales-days': rows.length }}>
          {rows.map(({ date, sales, label, range, forecast, pending }) => (
            <div className="pq-sales-column" key={date}>
              <div className="pq-sales-bar-track" tabIndex={0} role="img"
                aria-label={range + ' · ' + (pending ? '조회 중' : sales == null ? '금액 없음' : amount(sales))}>
                <div className="pq-sales-tooltip" aria-hidden="true">
                  <span>{range}</span>
                  <strong>{pending ? '조회 중' : sales == null ? '금액 없음' : amount(sales)}</strong>
                </div>
                {sales > 0 ? <div className={forecast ? 'pq-sales-bar pq-sales-bar-forecast' : 'pq-sales-bar'} style={{ height: (sales / max * 100) + '%' }} /> :
                  forecast && <span className="pq-sales-forecast">{pending ? '조회 중' : amount(sales)}</span>}
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    <details className="pq-sales-breakdown">
      <summary>기간별 금액 보기</summary>
      <table><thead><tr><th scope="col">기간</th><th scope="col">매출</th></tr></thead>
        <tbody>{rows.map(({ date, sales, range }) => <tr key={date}><td>{range}</td><td>{amount(sales)}</td></tr>)}</tbody>
      </table>
    </details>
  </section>
}

export default function SalesPeriodSummary({ popId, refresh, children, filterError, dashboard = false }) {
  const [weekDate, setWeekDate] = useState(todayInSeoul)
  const [retry, setRetry] = useState(0)
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState(null)
  const [forecast, setForecast] = useState(null)
  const weekly = Boolean(popId)
  const summaryKey = JSON.stringify([popId, refresh, retry])
  const requestKey = JSON.stringify([summaryKey, weekly ? weekDate : 'monthly'])
  const current = summary?.key === summaryKey ? summary : null
  const history = trend?.key === requestKey ? trend : null
  const nextMonth = weekly ? '' : salesMonthAfter(todayInSeoul().slice(0, 7))

  // 누적 매출과 기간별 그래프를 독립적으로 조회
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    getSalesSummary({ popId, signal })
      .then(data => { if (!signal.aborted) setSummary({ key: summaryKey, data }) })
      .catch(() => { if (!signal.aborted) setSummary({ key: summaryKey, error: true }) })
    return () => controller.abort()
  }, [popId, summaryKey])

  useEffect(() => {
    if (weekly && !weekDate) return
    const controller = new AbortController()
    const { signal } = controller
    getSalesTrend({ popId, date: weekDate, signal })
      .then(data => {
        if (signal.aborted) return
        const rows = data.map(row => weekly ? {
          date: row.weekStart, label: row.weekStart.slice(5).replace('-', '.'),
          range: row.weekStart + ' ~ ' + row.weekEnd, sales: row.totalSales,
        } : {
          date: row.month, label: Number(row.month.slice(5)) + '월',
          range: row.month, sales: row.totalSales,
        })
        setTrend({ key: requestKey, rows })
      })
      .catch(() => { if (!signal.aborted) setTrend({ key: requestKey, rows: [] }) })
    return () => controller.abort()
  }, [popId, requestKey, weekDate, weekly])

  // 다음 달 예상 매출은 별도 API로 조회
  useEffect(() => {
    if (!nextMonth) return
    const controller = new AbortController()
    const { signal } = controller
    getMonthlySalesForecast(nextMonth, signal)
      .then(sales => { if (!signal.aborted) setForecast({ key: requestKey, sales }) })
      .catch(() => { if (!signal.aborted) setForecast({ key: requestKey }) })
    return () => controller.abort()
  }, [nextMonth, requestKey])

  function moveWeek(direction) {
    const date = new Date((weekDate || todayInSeoul()) + 'T00:00:00Z')
    date.setUTCDate(date.getUTCDate() + direction * 7)
    setWeekDate(date.toISOString().slice(0, 10))
  }

  // 매출 요약과 최근 기간 그래프
  const prediction = forecast?.key === requestKey ? forecast : null
  const chartRows = nextMonth && history?.rows.length ? [...history.rows, {
    date: nextMonth, range: nextMonth + ' 예상', label: Number(nextMonth.slice(5)) + '월 예상',
    forecast: true, sales: prediction?.sales, pending: !prediction,
  }] : history?.rows
  const range = weekDate ? weekLabel(weekDate).replaceAll('-', '.').replace(' ~ ', ' – ') : ''
  return <section className="pq-sales-summary" aria-label={weekly ? '팝업 매출' : '전체 매출'} aria-busy={!current}>
    {(!dashboard || weekly) && <div className="pq-sales-toolbar">
      {children}
      {weekly && <div className="pq-sales-field">
        <span>조회 주간</span>
        <div className="pq-sales-period">
          <button type="button" aria-label="이전 주" onClick={() => moveWeek(-1)}>‹</button>
          <label className="pq-sales-date">
            <PopqIcon name="calendar" size={16} />
            <strong>{range || '기간 선택'}</strong>
            <input type="date" value={weekDate} aria-label="조회할 주의 날짜"
              onClick={event => event.currentTarget.showPicker?.()}
              onChange={event => setWeekDate(event.target.value)} />
          </label>
          <button type="button" aria-label="다음 주" onClick={() => moveWeek(1)}>›</button>
        </div>
      </div>}
      {filterError && <p className="pq-sales-filter-error" role="alert">{filterError}</p>}
    </div>}

    {current?.error ? <p className="pq-sales-feedback" role="alert">누적 매출을 불러오지 못했습니다.</p> :
      <div className="pq-sales-metrics">
        {metrics.map(([label, field, unit, icon]) => <article className="pq-sales-metric" key={field}>
          <div className="pq-sales-metric-label">
            <span>{'누적 ' + label}</span>
            <span className="pq-sales-metric-icon"><PopqIcon name={icon} size={19} /></span>
          </div>
          <strong>{current?.data ? current.data[field].toLocaleString('ko-KR') : '—'}{current?.data && <small>{unit}</small>}</strong>
        </article>)}
      </div>}
    {weekly && !weekDate ? <p role="status">조회할 날짜를 선택해 주세요.</p> :
      <PeriodSalesChart weekly={weekly} rows={chartRows} />}
    {(current?.error || history?.rows.length === 0) && <div className="pq-sales-feedback">
      <button type="button" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button>
    </div>}
  </section>
}
