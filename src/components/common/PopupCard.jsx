import React from 'react'
import { Link } from 'react-router-dom'
import CongestionBar from './CongestionBar.jsx'

export default function PopupCard({ popup }){
  return (
    <Link to={`/popups/${popup.id}`} className="card popup-card">
      <div className="popup-card-img-wrap">
        <img src={popup.image} alt={popup.title} />
        <span className="card-category-badge">{popup.category}</span>
      </div>
      <div className="card-body">
        <div className="card-title">{popup.title}</div>
        <div className="card-sub">{popup.location}</div>
        <div className="card-sub">{popup.startDate} ~ {popup.endDate}</div>
        <CongestionBar reserved={popup.reserved} capacity={popup.capacity} />
      </div>
    </Link>
  )
}
