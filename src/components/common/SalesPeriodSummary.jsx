import { useEffect, useState } from 'react'
import { getMonthlySalesForecast, getSalesSummary } from '../../api/admin/salesApi.js'
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

// 비교할 매출 기간 계산
function salesPeriods(period, weekly) {
  const count = 4
  return Array.from({ length: count }, (_, index) => {
    const offset = index - count + 1
    const day = new Date((weekly ? period : period + '-01') + 'T00:00:00Z')
    if (weekly) {
      day.setUTCDate(day.getUTCDate() + offset * 7 - (day.getUTCDay() + 6) % 7)
    } else {
      day.setUTCMonth(day.getUTCMonth() + offset)
    }
    const date = day.toISOString().slice(0, weekly ? 10 : 7)
    const label = weekly ? date.slice(5).replace('-', '.') : Number(date.slice(5)) + '월'
    return { date, label, range: weekly ? weekLabel(date) : date }
  })
}

function salesMonthAfter(month) {
  const date = new Date(month + '-01T00:00:00Z')
  date.setUTCMonth(date.getUTCMonth() + 1)
  return date.toISOString().slice(0, 7)
}

// 주별·월별 매출 비교 그래프
function PeriodSalesChart({ rows, weekly, status }) {
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
  const hasForecast = rows.some(row => row.forecast)
  return <section className="pq-sales-chart" aria-label={title}>
    <header><h3>{title}</h3><span>단위 원</span></header>
    {status && <p role="status">{status}</p>}
    {max === 0 && !hasForecast ? <p className="pq-sales-chart-empty">선택한 기간에 매출이 없습니다.</p> :
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
      </div>}
    {(max > 0 || hasForecast) && <details className="pq-sales-breakdown">
      <summary>기간별 금액 보기</summary>
      <table><thead><tr><th scope="col">기간</th><th scope="col">매출</th></tr></thead>
        <tbody>{rows.map(({ date, sales, range }) => <tr key={date}><td>{range}</td><td>{amount(sales)}</td></tr>)}</tbody>
      </table>
    </details>}
  </section>
}

export default function SalesPeriodSummary({ popId, refresh, children, filterError, dashboard = false }) {
  const [month, setMonth] = useState(() => todayInSeoul().slice(0, 7))
  const [weekDate, setWeekDate] = useState(todayInSeoul)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const [trend, setTrend] = useState(null)
  const [forecast, setForecast] = useState(null)
  const weekly = Boolean(popId)
  const period = weekly ? weekDate : month
  const scope = weekly ? '주간' : '월간'
  const requestKey = JSON.stringify([popId, period, refresh, retry])
  const current = result?.key === requestKey ? result : null

  // 기간별 매출 조회
  useEffect(() => {
    if (!period) return
    const controller = new AbortController()
    const params = weekly ? { weekDate: period } : { month: period }
    getSalesSummary({ popId, ...params, signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data })
      })
      .catch(error => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: ['월별 매출 집계가 확인되지 않았습니다.', '주별 매출 집계가 확인되지 않았습니다.'].includes(error.message) ? error.message : '매출을 불러오지 못했습니다.' })
      })
    return () => controller.abort()
  }, [period, popId, requestKey, weekly])

  // 이전 기간의 매출 합계 조회
  const selectedSales = current?.data?.totalSales
  useEffect(() => {
    if (!period || selectedSales == null) return
    const controller = new AbortController()
    const periods = salesPeriods(period, weekly)
    const count = periods.length
    Promise.all(periods.map(async (row, index) => {
      if (index === count - 1) return { ...row, sales: selectedSales }
      const params = weekly ? { weekDate: row.date } : { month: row.date }
      const data = await getSalesSummary({ popId, ...params, signal: controller.signal })
      return { ...row, sales: data.totalSales }
    })).then(rows => {
      if (!controller.signal.aborted) setTrend({ key: requestKey, rows })
    }).catch(() => {
      if (!controller.signal.aborted) setTrend({ key: requestKey, rows: [] })
    })
    return () => controller.abort()
  }, [period, popId, requestKey, selectedSales, weekly])

  // 이전·다음 집계 기간 이동
  function movePeriod(direction) {
    const date = new Date((weekly ? weekDate || todayInSeoul() : (month || todayInSeoul().slice(0, 7)) + '-01') + 'T00:00:00Z')
    if (weekly) {
      date.setUTCDate(date.getUTCDate() + direction * 7)
      setWeekDate(date.toISOString().slice(0, 10))
    } else {
      date.setUTCMonth(date.getUTCMonth() + direction)
      setMonth(date.toISOString().slice(0, 7))
    }
  }

  // 월간 그래프의 마지막 칸은 선택한 달의 다음 달
  const trendRows = trend?.key === requestKey ? trend.rows : null
  const nextMonth = !weekly && period ? salesMonthAfter(period) : ''
  const forecastMonth = nextMonth === salesMonthAfter(todayInSeoul().slice(0, 7)) ? nextMonth : ''

  useEffect(() => {
    if (!forecastMonth) return
    const controller = new AbortController()
    getMonthlySalesForecast(forecastMonth, controller.signal)
      .then(sales => {
        if (!controller.signal.aborted) setForecast({ month: forecastMonth, refresh, sales })
      })
      .catch(() => {
        if (!controller.signal.aborted) setForecast({ month: forecastMonth, refresh })
      })
    return () => controller.abort()
  }, [forecastMonth, refresh])

  let monthlyRows
  if (nextMonth) {
    const actualRows = trendRows?.length ? trendRows : salesPeriods(period, false)
    const prediction = forecast?.month === nextMonth && forecast.refresh === refresh ? forecast : null
    monthlyRows = [...actualRows, {
      date: nextMonth,
      range: nextMonth + ' 예상',
      label: Number(nextMonth.slice(5)) + '월 예상',
      forecast: true,
      sales: prediction?.sales,
      pending: Boolean(forecastMonth && !prediction),
    }]
  }

  // 매출 필터와 요약 카드
  const range = !period ? '' : weekly ? weekLabel(period).replaceAll('-', '.').replace(' ~ ', ' – ') :
    new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(period + '-01T00:00:00Z'))
  return <section className="pq-sales-summary" aria-label={scope + ' 매출'} aria-busy={Boolean(period && !current)}>
    {!dashboard && <div className="pq-sales-toolbar">
      {children}
      <div className="pq-sales-field">
        <span>{weekly ? '조회 주간' : '조회 월'}</span>
        <div className="pq-sales-period">
          <button type="button" aria-label={weekly ? '이전 주' : '이전 달'} onClick={() => movePeriod(-1)}>‹</button>
          <label className="pq-sales-date">
            <PopqIcon name="calendar" size={16} />
            <strong>{range || '기간 선택'}</strong>
            <input type={weekly ? 'date' : 'month'} value={period}
              aria-label={weekly ? '조회할 주의 날짜' : '조회 월'}
              onClick={event => event.currentTarget.showPicker?.()}
              onChange={event => weekly ? setWeekDate(event.target.value) : setMonth(event.target.value)} />
          </label>
          <button type="button" aria-label={weekly ? '다음 주' : '다음 달'} onClick={() => movePeriod(1)}>›</button>
        </div>
      </div>
      {filterError && <p className="pq-sales-filter-error" role="alert">{filterError}</p>}
    </div>}

    {current?.error ? <div className="pq-sales-feedback" role="alert">
      <p>{current.error}</p>
      <button type="button" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button>
    </div> : <>
      {!period || !current ? <p className="pq-sales-feedback" role="status">{period ? '매출을 불러오고 있어요.' : '조회 기간을 선택해 주세요.'}</p> : null}
      <div className="pq-sales-metrics">
        {metrics.map(([label, field, unit, icon]) => <article className="pq-sales-metric" key={field}>
          <div className="pq-sales-metric-label">
            <span>{field === 'totalSales' ? scope + ' ' + label : label}</span>
            <span className="pq-sales-metric-icon"><PopqIcon name={icon} size={19} /></span>
          </div>
          <strong>{current?.data ? current.data[field].toLocaleString('ko-KR') : '—'}{current?.data && <small>{unit}</small>}</strong>
        </article>)}
      </div>
      {weekly && current?.data && <PeriodSalesChart weekly rows={trendRows} />}
    </>}
    {monthlyRows && <PeriodSalesChart
      rows={monthlyRows}
      status={current?.error || trendRows?.length ? '' : trendRows ? '매출 추이를 불러오지 못했습니다.' : '매출 추이를 불러오고 있어요.'}
    />}
  </section>
}
