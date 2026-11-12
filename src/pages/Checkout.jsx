import React, { useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { createOrder, getApiError } from '../api/orderApi.js'
import { requestTossPayment } from '../api/tossPayments.js'
import '../styles/Checkout.css'

// 장바구니에서 넘어온 상품이 없을 때 보여줄 임시 상품 (결제는 막아 둔다)
const SAMPLE_ITEMS = [
  { id: 's1', name: 'KINETIC 러닝화', option: '270', price: 129000, qty: 1, image: '/kinetic/kinetic-shoe.png' },
  { id: 's2', name: 'KINETIC 볼캡', option: '차콜', price: 39000, qty: 1, image: '/kinetic/kinetic-cap.png' },
]

const MEMOS = [
  '배송 메모를 선택해 주세요',
  '문 앞에 놓아주세요.',
  '경비실에 맡겨 주세요.',
  '배송 전에 연락 주세요.',
  '직접 받을게요.',
]

const won = n => `₩${Math.round(n).toLocaleString()}`

// 휴대폰 번호에 하이픈 자동으로 넣기
function formatPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

// 다음 우편번호 스크립트는 주소 검색을 처음 눌렀을 때 불러온다
function loadPostcode() {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) return resolve()
    const s = document.createElement('script')
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('주소 검색을 불러오지 못했어요.'))
    document.head.appendChild(s)
  })
}

export default function Checkout() {
  const location = useLocation()

  // 장바구니에서 navigate('/checkout', { state: { items } }) 로 넘어온 상품
  const passed = location.state?.items
  const isSample = !Array.isArray(passed) || passed.length === 0

  const items = useMemo(() => {
    if (isSample) return SAMPLE_ITEMS
    return passed.map((it, i) => ({
      id: it.productId ?? it.id ?? i,
      name: it.name ?? it.productName ?? '상품',
      option: it.option ?? '',
      price: Number(it.price ?? 0),
      qty: Number(it.qty ?? it.quantity ?? 1),
      image: it.image ?? it.imageUrl ?? '',
    }))
  }, [passed, isSample])

  const [form, setForm] = useState({
    name: '', phone: '', zip: '', address: '', detail: '', memo: MEMOS[0],
  })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [paying, setPaying] = useState(false)
  // 결제창만 닫고 다시 누른 경우 주문을 또 만들지 않도록 만든 주문을 기억해 둔다
  const orderRef = useRef(null)

  // 금액: 상품 금액 합계 = 서버 totalPrice (쿠폰·포인트·배송비 없음)
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const count = items.reduce((sum, it) => sum + it.qty, 0)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  async function searchAddress() {
    try {
      await loadPostcode()
      new window.daum.Postcode({
        oncomplete: data => {
          setForm(f => ({ ...f, zip: data.zonecode, address: data.roadAddress || data.address }))
          setErrors(e => ({ ...e, zip: '', address: '' }))
        },
      }).open()
    } catch (err) {
      setNotice(err.message)
    }
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = '받는 사람을 입력해 주세요.'
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = '휴대폰 번호를 확인해 주세요.'
    if (!form.address) e.address = '주소를 검색해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePay() {
    if (paying) return
    setNotice('')
    if (!validate()) return
    if (isSample) {
      setNotice('장바구니에서 담은 상품이 없어요. 임시 상품은 결제할 수 없어요.')
      return
    }

    setPaying(true)
    try {
      // 1) 주문 생성 → tossOrderId, totalPrice 받기
      // 같은 상품으로 다시 누른 경우 결제 만료 전이면 만든 주문을 다시 쓴다 (재고가 또 줄지 않게)
      const key = JSON.stringify(items.map(it => [it.id, it.qty]))
      let order = orderRef.current?.key === key ? orderRef.current.order : null
      if (order?.expiresAt && new Date(order.expiresAt) <= new Date()) order = null
      if (!order) {
        order = await createOrder({
          items: items.map(it => ({ productId: it.id, quantity: it.qty })),
        })
        orderRef.current = { key, order }
      }
      const { tossOrderId, totalPrice } = order
      if (!tossOrderId || !totalPrice) {
        throw new Error('주문 응답에 tossOrderId / totalPrice가 없어요.')
      }
      if (Number(totalPrice) !== total) {
        console.warn('화면 금액과 서버 금액이 달라요', { 화면: total, 서버: totalPrice })
      }

      // 성공 페이지에서 금액 확인에 쓴다
      sessionStorage.setItem('popq_pending_order', JSON.stringify({ tossOrderId, totalPrice }))

      // 2) 토스페이먼츠 결제창 호출 (성공 시 /payments/success 로 이동, 닫으면 USER_CANCEL)
      const first = items[0].name
      await requestTossPayment({
        orderId: tossOrderId,
        orderName: items.length > 1 ? `${first} 외 ${items.length - 1}건` : first,
        amount: Number(totalPrice),
        customerName: form.name.trim(),
        customerPhone: form.phone,
      })
    } catch (err) {
      if (err?.code === 'USER_CANCEL') {
        // TODO: 주문 취소 API(PATCH /api/orders/{orderId}/cancel)는 아직 연결하지 않음. 같은 상품이면 위에서 만든 주문을 다시 쓴다
        setNotice('결제를 취소했어요. 다시 시도하려면 결제하기를 눌러 주세요.')
      } else {
        setNotice(getApiError(err, '결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'))
      }
      setPaying(false)
    }
  }

  return (
    <div className="co-page">
      <div className="container">
        <div className="co-breadcrumb">
          <Link to="/">홈</Link> › <span>주문/결제</span>
        </div>
        <h1 className="co-title">주문/결제</h1>

        <div className="co-grid">
          <div className="co-main">
            {/* 배송 정보 */}
            <section className="co-card">
              <div className="co-card-head">
                <h2>🚚 배송 정보</h2>
                <span className="co-req">* 필수 입력 항목</span>
              </div>

              <div className="co-row">
                <label>받는 사람 *</label>
                <div className="co-field">
                  <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="이름" />
                  {errors.name && <p className="co-error">{errors.name}</p>}
                </div>
              </div>

              <div className="co-row">
                <label>휴대폰 번호 *</label>
                <div className="co-field">
                  <input
                    value={form.phone}
                    onChange={e => setField('phone', formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                  />
                  {errors.phone && <p className="co-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="co-row">
                <label>배송지 주소 *</label>
                <div className="co-field">
                  <div className="co-zip">
                    <input value={form.zip} readOnly placeholder="우편번호" />
                    <button type="button" className="co-sub-btn" onClick={searchAddress}>주소 검색</button>
                  </div>
                  <input value={form.address} readOnly placeholder="주소 검색을 눌러 주세요" />
                  <input
                    value={form.detail}
                    onChange={e => setField('detail', e.target.value)}
                    placeholder="상세주소를 입력하세요. (예: 1004호)"
                  />
                  {errors.address && <p className="co-error">{errors.address}</p>}
                </div>
              </div>

              <div className="co-row">
                <label>배송 메모</label>
                <div className="co-field">
                  <select value={form.memo} onChange={e => setField('memo', e.target.value)}>
                    {MEMOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 주문 상품 */}
            <section className="co-card">
              <div className="co-card-head">
                <h2>🛍️ 주문 상품</h2>
                <span className="co-req">총 {items.length}개 상품</span>
              </div>
              {isSample && (
                <p className="co-sample">장바구니에서 넘어온 상품이 없어 임시 상품을 보여 주고 있어요.</p>
              )}
              <ul className="co-items">
                {items.map(it => (
                  <li key={it.id} className="co-item">
                    <div className="co-item-img">
                      {it.image && <img src={it.image} alt={it.name} />}
                    </div>
                    <div className="co-item-info">
                      <div className="co-item-name">{it.name}</div>
                      {it.option && <div className="co-item-opt">옵션 {it.option}</div>}
                    </div>
                    <div className="co-item-qty">수량 {it.qty}개</div>
                    <div className="co-item-price">{won(it.price * it.qty)}</div>
                  </li>
                ))}
              </ul>
            </section>

            {/* 결제 수단: 토스 결제창에서 고른다 */}
            <section className="co-card">
              <div className="co-card-head">
                <h2>💳 결제 수단</h2>
              </div>
              <div className="co-toss">
                <strong>Toss Payments</strong>
                <span>결제하기를 누르면 토스페이먼츠 결제창에서 카드·간편결제를 선택할 수 있어요.</span>
              </div>
            </section>
          </div>

          {/* 최종 결제 정보 */}
          <aside className="co-summary">
            <h2>최종 결제 정보</h2>
            <div className="co-sum-row">
              <span>상품 금액 ({count}개)</span>
              <span>{won(total)}</span>
            </div>
            <div className="co-sum-total">
              <span>총 결제 금액</span>
              <strong>{won(total)}</strong>
            </div>

            {notice && <p className="co-notice">{notice}</p>}

            <button type="button" className="co-pay" onClick={handlePay} disabled={paying}>
              {paying ? '결제창 여는 중…' : <>결제하기 &nbsp;›</>}
            </button>
            <p className="co-secure">🛡️ 결제는 토스페이먼츠(Toss Payments)로 안전하게 진행돼요.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}