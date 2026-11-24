import React from 'react'
import { Link } from 'react-router-dom'
import CongestionBar from './CongestionBar.jsx'

const CATEGORY_LABELS = {
  ENTERTAINMENT: 'ENTERTAINMENT',
  FOOD: 'FOOD',
  CHARACTER: 'CHARACTER',
  FASHION: 'FASHION',
}

export default function PopupCard({ popup }) {
  const rawCategory = String(popup.category || '').trim()
  const displayCategory = (CATEGORY_LABELS[rawCategory.toUpperCase()] || rawCategory).toUpperCase()

  return (
    <Link to={`/popups/${popup.id}`} className="card popup-card">
      <div className="popup-card-img-wrap">
        <img src={popup.image} alt={popup.title} />
      </div>
      <div className="card-body">
        {displayCategory && <div className="popup-card-category">{displayCategory}</div>}
        <div className="card-title">{popup.title}</div>
        <div className="card-sub">{popup.location}</div>
        <div className="card-sub popup-card-date">
          {popup.startDate} — {popup.endDate}
        </div>
        <div className="popup-card-footer">
          <CongestionBar reserved={popup.reserved} capacity={popup.capacity} />
        </div>
      </div>
    </Link>
  )
}