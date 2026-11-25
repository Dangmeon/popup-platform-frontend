import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CongestionBar from './CongestionBar.jsx'
import '../../styles/Home.css'
import '../../styles/HomeRefresh.css'

const CATEGORY_LABELS = {
  ENTERTAINMENT: 'ENTERTAINMENT',
  FOOD: 'FOOD',
  CHARACTER: 'CHARACTER',
  FASHION: 'FASHION',
}

function formatDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''
  return `${match[2]}.${match[3]}`
}

export default function PopupCard({ popup, showCongestion = false }) {
  const [hovered, setHovered] = useState(false)
  const rawCategory = String(popup.category || '').trim()
  const displayCategory = (CATEGORY_LABELS[rawCategory.toUpperCase()] || rawCategory || '팝업스토어').toUpperCase()
  const start = formatDate(popup.startDate)
  const end = formatDate(popup.endDate)

  return (
    <Link
      to={`/popups/${popup.id}`}
      className="hm-card"
      style={{
        width: '100%',
        maxWidth: 'none',
        color: '#293323',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="hm-card-img"
        style={{
          backgroundColor: '#eef2ea',
        }}
      >
        {popup.image ? (
          <img
            src={popup.image}
            alt={popup.title}
            loading="lazy"
            style={{
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div className="hm-card-noimg" style={{ color: '#293323', backgroundColor: '#eef2ea' }}>
            POPQ
          </div>
        )}
      </div>

      <div className="hm-card-body">
        <span
          className="hm-card-cat"
          style={{
            color: hovered ? '#293323' : '#68754B',
            fontWeight: 800,
          }}
        >
          {displayCategory}
        </span>
        <h3
          className="hm-card-title"
          style={{
            color: hovered ? '#68754B' : '#293323',
            transition: 'color 0.15s ease',
          }}
        >
          {popup.title}
        </h3>
        <p className="hm-card-sub" style={{ color: '#525d49' }}>
          {popup.location || '장소 안내 예정'}
        </p>
        {start && end && (
          <p className="hm-card-date" style={{ color: '#6b7280' }}>
            {start} — {end}
          </p>
        )}
        {showCongestion && (
          <div style={{ marginTop: '8px' }}>
            <CongestionBar reserved={popup.reserved} capacity={popup.capacity} />
          </div>
        )}
      </div>
    </Link>
  )
}