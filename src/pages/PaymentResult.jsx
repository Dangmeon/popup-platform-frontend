import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmPayment, getApiError } from '../api/orderApi.js'
import '../styles/PaymentResult.css'

const won = n => `₩${Math.round(Number(n)).toLocaleString()}`

function formatDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('ko-KR')
}

// 토스가 failUrl 로 넘기는 오류 코드를 쉬운 말로
const FAIL_MESSAGES = {
  PAY_PROCESS_CANCELED: '결제를 취소했어요. 다시 시도하려면 장바구니에서 주문해 주세요.',
  PAY_PROCESS_ABORTED: '결제 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했어요. 다른 카드로 시도해 주세요.',
}

// 결제 성공: 토스가 주소창에 붙여 준 paymentKey, orderId, amount 로 서버에 결제 승인을 요청한다
export function PaymentSuccess() {
  const [params] = useSearchParams()
  const paymentKey = params.get('paymentKey')
  const orderId = params.get('orderId')
  const amount = Number(params.get('amount'))

  const [state, setState] = useState('loading') // loading | done | error
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const called = useRef(false) // 승인 요청이 두 번 가지 않게

  useEffect(() => {
    if (called.current) return
    called.current = true

    if (!paymentKey || !orderId || !amount) {
      setMessage('결제 정보가 올바르지 않아요.')
      setState('error')
      return
    }

    // 결제창을 열기 전에 저장해 둔 주문 정보와 금액이 같은지 확인
    let pending = null
    try {
      pending = JSON.parse(sessionStorage.getItem('popq_pending_order') || 'null')
    } catch {
      pending = null
    }
    if (pending && (pending.tossOrderId !== orderId || Number(pending.totalPrice) !== amount)) {
      setMessage('결제 금액이 주문 금액과 달라서 승인을 중단했어요.')
      setState('error')
      return
    }

    confirmPayment({ paymentKey, orderId, amount })
      .then(res => {
        if (res?.paymentStatus && res.paymentStatus !== 'PAID') {
          setMessage(`결제 상태가 완료가 아니에요. (${res.paymentStatus})`)
          setState('error')
          return
        }
        sessionStorage.removeItem('popq_pending_order')
        setResult(res)
        setState('done')
      })
      .catch(err => {
        setMessage(getApiError(err, '결제 승인에 실패했어요. 잠시 후 다시 시도해 주세요.'))
        setState('error')
      })
  }, [paymentKey, orderId, amount])

  if (state === 'loading') {
    return (
      <div className="pr-page">
        <div className="pr-card">
          <div className="pr-spinner" />
          <h1 className="pr-title">결제를 확인하는 중이에요</h1>
          <p className="pr-desc">창을 닫지 말고 잠시만 기다려 주세요.</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="pr-page">
        <div className="pr-card">
          <div className="pr-icon pr-icon-fail">!</div>
          <h1 className="pr-title">결제를 완료하지 못했어요</h1>
          <p className="pr-desc">{message}</p>
          <div className="pr-actions">
            <Link to="/cart" className="pr-btn pr-btn-primary">장바구니로</Link>
            <Link to="/" className="pr-btn">홈으로</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pr-page">
      <div className="pr-card">
        <div className="pr-icon pr-icon-ok">✓</div>
        <h1 className="pr-title">결제가 완료됐어요</h1>
        <p className="pr-desc">주문이 정상적으로 접수됐어요.</p>
        <dl className="pr-rows">
          <div className="pr-row"><dt>주문 번호</dt><dd>{result?.orderId ?? '-'}</dd></div>
          <div className="pr-row"><dt>결제 금액</dt><dd>{won(result?.amount ?? amount)}</dd></div>
          {result?.paidAt && (
            <div className="pr-row"><dt>결제 일시</dt><dd>{formatDateTime(result.paidAt)}</dd></div>
          )}
        </dl>
        <div className="pr-actions">
          <Link to="/mypage" className="pr-btn pr-btn-primary">마이페이지</Link>
          <Link to="/" className="pr-btn">홈으로</Link>
        </div>
      </div>
    </div>
  )
}

// 결제 실패: 토스가 주소창에 붙여 준 code, message 를 보여 준다
export function PaymentFail() {
  const [params] = useSearchParams()
  const code = params.get('code')
  const message = FAIL_MESSAGES[code] || params.get('message') || '결제에 실패했어요. 잠시 후 다시 시도해 주세요.'

  return (
    <div className="pr-page">
      <div className="pr-card">
        <div className="pr-icon pr-icon-fail">!</div>
        <h1 className="pr-title">결제에 실패했어요</h1>
        <p className="pr-desc">{message}</p>
        {code && <p className="pr-code">오류 코드: {code}</p>}
        <div className="pr-actions">
          <Link to="/cart" className="pr-btn pr-btn-primary">장바구니로</Link>
          <Link to="/" className="pr-btn">홈으로</Link>
        </div>
      </div>
    </div>
  )
}