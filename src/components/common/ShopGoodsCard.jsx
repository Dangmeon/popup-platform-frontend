import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance.js'
import { useApp } from '../../context/AppContext.jsx'
import './ShopGoodsCard.css'

// 서버 상품·프론트 임시 굿즈 둘 다 받는다. 필드명이 다르면 이 함수만 고친다
function normalize(g) {
  return {
    id: g.productId ?? g.id,
    name: g.productName ?? g.name ?? '상품',
    price: typeof g.price === 'number' ? g.price : null,
    image: g.productImg ?? g.imageUrl ?? g.image ?? '',
    popupName: g.popupName ?? g.popup ?? '',
    badge: g.badge ?? (g.limited ? 'LIMITED' : ''),
    stock: typeof g.stock === 'number' ? g.stock : null,
    saleStatus: g.saleStatus ?? null,
  }
}

// 판매중으로 보는 값 (서버 값이 다르면 여기에 추가)
const ON_SALE = ['판매중', 'ON_SALE', 'SELLING']

// 장바구니 담기: POST /api/cart/items  (body: { productId, quantity })
async function addCartItem(productId, quantity = 1) {
  const res = await axiosInstance.post('/api/cart/items', {
    productId: Number(productId),
    quantity,
  })
  return res.data?.data ?? res.data
}

export default function ShopGoodsCard({ goods, to }) {
  const app = useApp()
  const nav = useNavigate()
  const [adding, setAdding] = React.useState(false)
  const g = normalize(goods)

  const soldOut = g.stock !== null && g.stock <= 0
  const notOnSale = g.saleStatus !== null && !ON_SALE.includes(g.saleStatus)
  const disabled = adding || soldOut || notOnSale
  const label = soldOut ? '품절' : notOnSale ? g.saleStatus : adding ? '담는 중…' : '담기'

  async function handleAdd() {
    if (!app.isAuthenticated) {
      app.showToast('로그인 후 담을 수 있어요')
      nav('/login')
      return
    }
    // 숫자 ID가 아니면 서버에 없는 임시 상품이다
    if (!Number.isInteger(Number(g.id))) {
      app.showToast('아직 판매 준비 중인 상품이에요')
      return
    }
    setAdding(true)
    try {
      await addCartItem(g.id, 1)
      app.showToast('장바구니에 담았어요')
    } catch (e) {
      const status = e.response?.status
      if (status === 401 || status === 403) {
        app.showToast('로그인이 필요해요')
        nav('/login')
      } else {
        app.showToast(e.response?.data?.message || '장바구니에 담지 못했어요')
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="sg-card">
      <Link to={to || '#'} className="sg-img">
        {g.badge && <span className="sg-badge">{g.badge}</span>}
        {g.image ? <img src={g.image} alt={g.name} /> : <div className="sg-noimg">이미지 없음</div>}
      </Link>

      <div className="sg-body">
        {g.popupName && <div className="sg-popup">{g.popupName}</div>}
        <div className="sg-name">{g.name}</div>
        <div className="sg-price">{g.price !== null ? `${g.price.toLocaleString()}원` : '가격 미정'}</div>
        {g.stock !== null && (
          <div className={`sg-stock${soldOut ? ' is-out' : ''}`}>
            {soldOut ? '품절' : `재고 ${g.stock}개`}
          </div>
        )}

        <div className="sg-actions">
          <Link to={to || '#'} className="sg-btn">상세보기</Link>
          <button type="button" className="sg-btn sg-btn-cart" onClick={handleAdd} disabled={disabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            {label}
          </button>
        </div>
      </div>
    </article>
  )
}