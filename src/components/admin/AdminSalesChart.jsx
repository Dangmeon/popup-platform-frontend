import { useState } from 'react'

const wonFormat = new Intl.NumberFormat('ko-KR')

const width = 680
const height = 280
const left = 100
const right = 650
const top = 32
const bottom = 224

function getAxisStep(range) {
  const target = Math.max(1, range / 5)
  const magnitude = 10 ** Math.floor(Math.log10(target))
  const factor = [1, 2, 2.5, 5, 10].find(
    (value) => value * magnitude >= target
  )

  return Math.max(1, Math.ceil(factor * magnitude))
}

function formatAxis(amount) {
  if (amount === 0) return '0원'

  return amount % 10000 === 0
    ? `${wonFormat.format(amount / 10000)}만 원`
    : `${wonFormat.format(amount)}원`
}

export default function AdminSalesChart({ summary }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)

  const periods = [
    { label: '지난달 전체', ...summary.previousMonth },
    { label: '이번 달 누적', ...summary.currentMonth },
    { label: '다음 달 예상', ...summary.nextMonthForecast },
  ]

  const amounts = periods.map(({ amount }) => amount)
  const average = amounts.reduce((total, amount) => total + amount, 0) / amounts.length
  const distance = Math.max(...amounts.map((amount) => Math.abs(amount - average)))
  const padding = Math.max(distance * 1.1, average * 0.05, 2)
  const lowerBound = Math.max(0, average - padding)
  const upperBound = average + padding
  const step = getAxisStep(upperBound - lowerBound)
  const minAmount = Math.floor(lowerBound / step) * step
  const maxAmount = Math.ceil(upperBound / step) * step
  const tickCount = (maxAmount - minAmount) / step
  const columnWidth = (right - left) / periods.length

  const points = periods.map((period, index) => ({
    ...period,
    x: left + columnWidth * (index + 0.5),
    y: bottom - ((period.amount - minAmount) / (maxAmount - minAmount)) * (bottom - top),
  }))

  const [previous, current, forecast] = points
  const activePoint = points[hoveredIndex ?? focusedIndex]
  const tooltipWidth = 174
  const tooltipHeight = 54
  const tooltipX = activePoint
    ? Math.max(left, Math.min(right - tooltipWidth, activePoint.x - tooltipWidth / 2))
    : 0
  const tooltipY = activePoint
    ? activePoint.y >= top + tooltipHeight + 12
      ? activePoint.y - tooltipHeight - 12
      : activePoint.y + 12
    : 0

  return (
    <figure style={{ margin: '28px 0 0', maxWidth: 820 }}>
      <figcaption style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
        월별 매출 흐름
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="월별 매출 그래프"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {Array.from({ length: tickCount + 1 }, (_, index) => {
          const y = bottom - ((bottom - top) * index) / tickCount

          return (
            <g key={index} aria-hidden="true">
              <line x1={left} x2={right} y1={y} y2={y} stroke="#eedfd0" />
              <text
                x={left - 12}
                y={y + 4}
                textAnchor="end"
                fill="#695950"
                fontSize={14}
              >
                {formatAxis(minAmount + index * step)}
              </text>
            </g>
          )
        })}

        <line
          x1={left}
          x2={left}
          y1={top}
          y2={bottom}
          stroke="#cdbbae"
        />

        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={top}
            y2={bottom}
            stroke="#bca89a"
            strokeDasharray="4 4"
            aria-hidden="true"
          />
        )}

        <line
          x1={previous.x}
          y1={previous.y}
          x2={current.x}
          y2={current.y}
          stroke="#cf5039"
          strokeWidth={3}
        />
        <line
          x1={current.x}
          y1={current.y}
          x2={forecast.x}
          y2={forecast.y}
          stroke="#cf5039"
          strokeWidth={3}
          strokeDasharray="7 6"
        />

        {points.map(({ x, y, month, label, amount }, index) => (
          <g key={label}>
            <circle
              cx={x}
              cy={y}
              r={activePoint === points[index] ? 7 : 5}
              fill={index === 2 ? '#fff' : '#cf5039'}
              stroke="#cf5039"
              strokeWidth={2}
            />
            <text x={x} y={bottom + 22} textAnchor="middle" fill="#302820" fontSize={15}>
              {month}월
            </text>
            <text x={x} y={bottom + 42} textAnchor="middle" fill="#695950" fontSize={13}>
              {label}
            </text>

            <rect
              x={left + columnWidth * index}
              y={top - 12}
              width={columnWidth}
              height={bottom - top + 58}
              fill="transparent"
              tabIndex={0}
              aria-label={`${month}월 ${label} ${wonFormat.format(amount)}원`}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => setHoveredIndex(null)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
            />
          </g>
        ))}

        {activePoint && (
          <g pointerEvents="none" aria-hidden="true">
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx={8}
              fill="#302820"
            />
            <text x={tooltipX + 12} y={tooltipY + 20} fill="#eedfd0" fontSize={13}>
              {activePoint.month}월 · {activePoint.label}
            </text>
            <text
              x={tooltipX + 12}
              y={tooltipY + 41}
              fill="#fff"
              fontSize={16}
              fontWeight={700}
            >
              {wonFormat.format(activePoint.amount)}원
            </text>
          </g>
        )}
      </svg>

      <p className="admin-sales-note">
        이번 달은 현재까지의 누적 매출이며, 점선은 다음 달 예상치예요.
        {minAmount > 0 && <> 세로축은 {formatAxis(minAmount)}부터 표시해요.</>}
      </p>
    </figure>
  )
}