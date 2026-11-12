// 토스페이먼츠 JS SDK v2 - 결제창형(widgets + renderPaymentWindow)
// 문서: https://docs.tosspayments.com/sdk/v2/js/payment-window
//
// 흐름: 금액 설정 → 결제창 열기 → 구매자가 결제하기 누름(paymentRequest) → requestPayment
//       → 성공하면 successUrl(/payments/success)로 이동, 실패하면 failUrl(/payments/fail)로 이동
// 결제창을 그냥 닫으면 USER_CANCEL 오류로 reject 한다.

const SDK_URL = 'https://js.tosspayments.com/v2/standard'

// SDK 스크립트는 결제할 때 처음 불러온다
function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) return resolve()
    const exist = document.querySelector(`script[src="${SDK_URL}"]`)
    const s = exist || document.createElement('script')
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('토스페이먼츠를 불러오지 못했어요.')))
    if (!exist) {
      s.src = SDK_URL
      document.head.appendChild(s)
    }
  })
}

// 결제창은 한 번에 하나만 열 수 있다
let currentWindow = null

async function closeWindow() {
  if (!currentWindow) return
  try {
    await currentWindow.destroy()
  } catch {
    // 이미 닫힌 경우는 무시
  }
  currentWindow = null
}

export async function requestTossPayment({ orderId, orderName, amount, customerName, customerPhone }) {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY
  if (!clientKey) {
    throw new Error('.env 에 VITE_TOSS_CLIENT_KEY 가 없어요. 추가한 뒤 npm run dev 를 다시 실행해 주세요.')
  }

  await loadSdk()
  await closeWindow()

  const tossPayments = window.TossPayments(clientKey)
  // 비회원 결제로 처리한다 (회원 customerKey 는 서버와 협의 후 사용)
  const widgets = tossPayments.widgets({ customerKey: window.TossPayments.ANONYMOUS })

  // 금액은 서버가 내려준 totalPrice 를 그대로 쓴다
  await widgets.setAmount({ currency: 'KRW', value: Number(amount) })

  const name = String(orderName).slice(0, 100)
  const paymentWindow = await widgets.renderPaymentWindow({ orderName: name })
  currentWindow = paymentWindow

  const phone = String(customerPhone || '').replace(/\D/g, '')

  // 성공하면 페이지가 successUrl 로 이동하므로 이 Promise 는 끝나지 않는다.
  // 닫기·오류일 때만 reject 되어 Checkout 의 catch 로 간다.
  return new Promise((resolve, reject) => {
    paymentWindow.on('paymentRequest', async () => {
      try {
        await widgets.requestPayment({
          orderId,
          orderName: name, // renderPaymentWindow 에 준 값과 같아야 한다
          successUrl: `${window.location.origin}/payments/success`,
          failUrl: `${window.location.origin}/payments/fail`,
          customerName: customerName || undefined,
          ...(phone.length >= 8 ? { customerMobilePhone: phone } : {}),
        })
      } catch (err) {
        await closeWindow()
        if (err?.code === 'PAY_PROCESS_CANCELED') err.code = 'USER_CANCEL'
        reject(err)
      }
    })

    paymentWindow.on('cancel', async () => {
      await closeWindow()
      const err = new Error('결제를 취소했어요.')
      err.code = 'USER_CANCEL'
      reject(err)
    })
  })
}