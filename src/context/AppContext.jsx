import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  popups as initialPopups,
  products as initialProducts,
} from '../data/sampleData.js'
import { loginRequest } from '../api/authApi'
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from '../api/authToken'

const AppContext = createContext(null)

export const useApp = () => useContext(AppContext)

// 임시 데이터 조회
function loadLS(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  // 상품 및 팝업
  const [popupsData] = useState(initialPopups)
  const [productsData] = useState(initialProducts)

  // 사용자 표시 정보
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = loadLS('popQ_user', null)

    if (savedUser?.authMode === 'jwt' && !getAccessToken()) {
      return null
    }

    return savedUser
  })

  // 임시 사용자 데이터
  const [likedPopups, setLikedPopups] = useState(() =>
    loadLS('popQ_liked_popups', [])
  )
  const [likedProducts, setLikedProducts] = useState(() =>
    loadLS('popQ_liked_products', [])
  )
  const [cart, setCart] = useState(() =>
    loadLS('popQ_cart', [])
  )
  const [reservations, setReservations] = useState(() =>
    loadLS('popQ_reservations', [])
  )
  const [waitings, setWaitings] = useState(() =>
    loadLS('popQ_waitings', [])
  )

  // 화면 알림
  const [toasts, setToasts] = useState([])
  const [mascotVisible, setMascotVisible] = useState(false)

  // 실제 인증 여부
  const isAuthenticated =
    currentUser?.authMode === 'jwt' &&
    Boolean(getAccessToken())

  // 사용자 표시 정보 저장
  useEffect(() => {
    localStorage.setItem('popQ_user', JSON.stringify(currentUser))
  }, [currentUser])

  // 임시 데이터 저장
  useEffect(() => {
    localStorage.setItem(
      'popQ_liked_popups',
      JSON.stringify(likedPopups)
    )
  }, [likedPopups])

  useEffect(() => {
    localStorage.setItem(
      'popQ_liked_products',
      JSON.stringify(likedProducts)
    )
  }, [likedProducts])

  useEffect(() => {
    localStorage.setItem('popQ_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(
      'popQ_reservations',
      JSON.stringify(reservations)
    )
  }, [reservations])

  useEffect(() => {
    localStorage.setItem('popQ_waitings', JSON.stringify(waitings))
  }, [waitings])

  // 알림
  function showToast(msg) {
    const id = crypto.randomUUID()

    setToasts((previous) => [...previous, { id, msg }])

    setTimeout(() => {
      setToasts((previous) =>
        previous.filter((toast) => toast.id !== id)
      )
    }, 2500)
  }

  // 데모 회원가입
  function signup({ email, name, phone, type }) {
    clearAccessToken()

    const user = {
      email,
      name,
      phone,
      type: type || 'user',
      authMode: 'demo',
    }

    setCurrentUser(user)
    showToast('데모 회원가입이 완료되었습니다')

    return user
  }

  // 데모 로그인
  function login({ email }) {
    clearAccessToken()

    const user = {
      email,
      name: email.split('@')[0],
      type: email.includes('brand') ? 'brand' : 'user',
      authMode: 'demo',
    }

    setCurrentUser(user)
    showToast('데모 로그인되었습니다')

    return user
  }

  // 실제 로그인
  async function loginWithApi({ username, password }) {
    clearAccessToken()
    setCurrentUser(null)

    const token = await loginRequest({ username, password })

    setAccessToken(token)

    // 나중에 바꿀 부분: 회원 정보 조회 응답으로 표시 정보 설정
    const user = {
      username: username.trim(),
      name: username.trim(),
      authMode: 'jwt',
    }

    setCurrentUser(user)
    showToast('로그인되었습니다')

    return user
  }

  // 로그아웃
  function logout() {
    clearAccessToken()
    setCurrentUser(null)
    showToast('로그아웃되었습니다')
  }

  // 팝업 찜
  function toggleLikePopup(id) {
    setLikedPopups((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }

  // 상품 찜
  function toggleLikeProduct(id) {
    setLikedProducts((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }

  // 장바구니 추가
  function addToCart(product, quantity = 1) {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.productId === product.id
      )

      if (existing) {
        return previous.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [
        ...previous,
        { productId: product.id, quantity },
      ]
    })

    setMascotVisible(true)
    showToast('장바구니에 담았어요')
  }

  // 장바구니 수량
  function updateCartQty(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((previous) =>
      previous.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  // 장바구니 삭제
  function removeFromCart(productId) {
    setCart((previous) =>
      previous.filter((item) => item.productId !== productId)
    )
  }

  function clearCart() {
    setCart([])
  }

  // 기존 데모 예약
  function createReservation(popupId, timeSlot, peopleCount) {
    const id = 'R' + Date.now()
    const expiresAt = Date.now() + 10 * 60 * 1000

    setReservations((previous) => [
      ...previous,
      {
        id,
        popupId,
        timeSlot,
        peopleCount,
        status: 'HOLD',
        expiresAt,
      },
    ])

    return id
  }

  function confirmReservation(id) {
    setReservations((previous) =>
      previous.map((reservation) =>
        reservation.id === id
          ? { ...reservation, status: 'CONFIRMED' }
          : reservation
      )
    )

    showToast('데모 예약이 확정되었습니다')
  }

  function cancelReservation(id) {
    setReservations((previous) =>
      previous.map((reservation) =>
        reservation.id === id
          ? { ...reservation, status: 'CANCELLED' }
          : reservation
      )
    )

    showToast('데모 예약이 취소되었습니다')
  }

  // 나중에 바꿀 부분: 실제 예약 API 응답으로 내역 갱신
  function addDemoReservation({
    id,
    popupId,
    visitDate,
    timeSlot,
    peopleCount,
  }) {
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.')
    }

    if (currentUser.authMode === 'jwt') {
      throw new Error(
        '실제 로그인 상태의 예약은 예약 API 연결 후 이용할 수 있습니다.'
      )
    }

    if (
      !id ||
      !popupId ||
      !visitDate ||
      !timeSlot ||
      !Number.isSafeInteger(peopleCount) ||
      peopleCount < 1
    ) {
      throw new Error('예약 정보를 확인해 주세요.')
    }

    const reservation = {
      id,
      number: id,
      popupId,
      visitDate,
      timeSlot,
      peopleCount,
      memberEmail: currentUser.email,
      status: 'CONFIRMED',
      isDemo: true,
    }

    setReservations((previous) => {
      const alreadyExists = previous.some(
        (item) => item.id === id
      )

      return alreadyExists
        ? previous
        : [...previous, reservation]
    })

    return reservation
  }

  // 데모 현장 대기
  function registerWaiting(popupId, peopleCount) {
    const id = 'W' + Date.now()
    const queueNumber = Math.floor(Math.random() * 20) + 1

    setWaitings((previous) => [
      ...previous,
      {
        id,
        popupId,
        peopleCount,
        queueNumber,
        status: 'WAITING',
        checkinCode: Math.floor(1000 + Math.random() * 9000),
      },
    ])

    return id
  }

  function cancelWaiting(id) {
    setWaitings((previous) =>
      previous.map((waiting) =>
        waiting.id === id
          ? { ...waiting, status: 'CANCELLED' }
          : waiting
      )
    )
  }

  const value = {
    popups: popupsData,
    products: productsData,
    currentUser,
    isAuthenticated,
    login,
    loginWithApi,
    logout,
    signup,
    likedPopups,
    likedProducts,
    toggleLikePopup,
    toggleLikeProduct,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    reservations,
    createReservation,
    confirmReservation,
    cancelReservation,
    addDemoReservation,
    waitings,
    registerWaiting,
    cancelWaiting,
    toasts,
    showToast,
    mascotVisible,
    setMascotVisible,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}