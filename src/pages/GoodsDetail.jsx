import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPopups, getPopupProducts } from '../api/popupApi.js'
import { useApp } from '../context/AppContext.jsx'
import { addCartItem } from '../api/cartApi'

const RESCENE_DETAILS = {
  '리센느 5인 레미니(REMINI) 룸 스프레이 5종 세트': {
    summary:
      '리센느 멤버 다섯 명의 무드를 담은 레미니(REMINI) 룸 스프레이 5종 세트입니다. 공간과 기분에 따라 각기 다른 향을 즐길 수 있도록 구성했으며, 데스크·침실·드레스룸 등 일상 공간에 은은한 잔향을 남깁니다.',
    spec: '5종 세트 구성(각 향별 개별 용기) · 분사 전 흔들어 사용 · 직사 분사 거리 유지 및 가죽·실크 등 민감 소재 주의',
  },
  '리트와메트 오리지널 보더 스트라이프 셔츠 2종 세트': {
    summary:
      '리트와메트 협업 오리지널 보더 스트라이프 셔츠 2종 세트입니다. 단정하면서도 캐주얼하게 매치하기 좋은 스트라이프 패턴을 적용해 단독 착용은 물론 이너·레이어드 룩으로도 활용도가 높습니다.',
    spec: '2종 세트 구성 · 실측 사이즈 확인 권장 · 단독 손세탁 또는 세탁망 권장, 건조기 사용 자제 및 색 이염 주의',
  },
  "미나미 'GAL SUNSET' 핑크 레오파드 선크림": {
    summary:
      "팝업 무드를 담은 핑크 레오파드 패키지 디자인의 'GAL SUNSET' 선크림입니다. 야외 활동이나 팝업 방문 시 간편하게 휴대하며 바르기 좋도록 소장 가치와 실용성을 함께 담았습니다.",
    spec: '외출 전 기초 케어 마지막 단계에서 적당량 도포 · 피부 이상 반응 시 사용 중단 · 개봉 후 권장 기한 내 사용',
  },
  '신라공주 자개 이중 진공 보냉병': {
    summary:
      '한국적인 자개 감성과 모던한 보냉병 형태를 결합한 이중 진공 보냉병입니다. 이중 벽 구조로 음료의 온도를 오래 유지해 주며, 데일리 휴대용 텀블러로 활용하기 좋습니다.',
    spec: '이중 진공 보냉 구조 · 뚜껑 밀폐 확인 후 휴대 · 연마제/철수세미, 식기세척기, 전자레인지 사용 금지',
  },
}

function formatPrice(price) {
  return price > 0 ? `${price.toLocaleString()}원` : '가격 미정'
}

function resolveDbPrdId(g) {
  const candidate = g?.prdId ?? g?.serverId ?? g?.productId ?? g?.id
  if (candidate === undefined || candidate === null || candidate === '') return null
  const num = typeof candidate === 'number' ? candidate : Number(candidate)
  return Number.isSafeInteger(num) && num >= 1 ? num : null
}

function parseSaleDateMs(value, isEnd = false) {
  if (!value) return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  if (value instanceof Date) {
    const ms = value.getTime()
    return Number.isFinite(ms) ? ms : NaN
  }

  const str = String(value).trim()
  if (!str) return NaN

  const isoMatch = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  )
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const hasTime = isoMatch[4] !== undefined
    const hour = hasTime ? Number(isoMatch[4]) : isEnd ? 23 : 0
    const min = hasTime ? Number(isoMatch[5]) : isEnd ? 59 : 0
    const sec = hasTime ? Number(isoMatch[6]) : isEnd ? 59 : 0
    const ms = hasTime ? 0 : isEnd ? 999 : 0

    if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(str)) {
      const tzMs = new Date(str).getTime()
      return Number.isFinite(tzMs) ? tzMs : NaN
    }
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  const yyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/)
  if (yyMatch) {
    const year = 2000 + Number(yyMatch[1])
    const month = Number(yyMatch[2]) - 1
    const day = Number(yyMatch[3])
    const hasTime = yyMatch[4] !== undefined
    const hour = hasTime ? Number(yyMatch[4]) : isEnd ? 23 : 0
    const min = hasTime ? Number(yyMatch[5]) : isEnd ? 59 : 0
    const sec = hasTime ? Number(yyMatch[6]) : isEnd ? 59 : 0
    const ms = hasTime ? 0 : isEnd ? 999 : 0
    return new Date(year, month, day, hour, min, sec, ms).getTime()
  }

  const fallback = new Date(str).getTime()
  return Number.isFinite(fallback) ? fallback : NaN
}

function getProductSaleInfo(g) {
  if (!g) return { canPurchase: false, badge: null, buttonLabel: '구매 불가' }
  const now = Date.now()
  const rawStart = g.saleStart ?? g.sale_start ?? g.startDate ?? g.start_date
  const rawEnd = g.saleEnd ?? g.sale_end ?? g.endDate ?? g.end_date
  const status = String(g.saleStatus ?? g.status ?? '').trim().toUpperCase()

  const startMs = parseSaleDateMs(rawStart, false)
  const endMs = parseSaleDateMs(rawEnd, true)

  const isSoldOut =
    g.soldOut === true ||
    (typeof g.stock === 'number' && g.stock <= 0)

  if (isSoldOut) {
    return { canPurchase: false, badge: '품절', buttonLabel: '품절' }
  }

  if (
    Number.isFinite(startMs)
      ? now < startMs
      : ['UPCOMING', 'SCHEDULED', 'BEFORE_SALE', '판매예정'].includes(status)
  ) {
    return { canPurchase: false, badge: '판매예정', buttonLabel: '판매예정' }
  }

  if (
    Number.isFinite(endMs)
      ? now > endMs
      : ['ENDED', 'CLOSED', '판매종료'].includes(status)
  ) {
    return { canPurchase: false, badge: '판매종료', buttonLabel: '판매종료' }
  }

  return { canPurchase: true, badge: null, buttonLabel: null }
}

function getDetailContent(g) {
  if (!g) return { summary: '', spec: '' }
  const matched = RESCENE_DETAILS[g.name]
  return {
    summary:
      g.description ||
      g.productDesc ||
      matched?.summary ||
      `${g.popupName || '팝업스토어'}에서 만나볼 수 있는 공식 굿즈입니다. 소장용 및 데일리 아이템으로 활용하기 좋습니다.`,
    spec:
      g.specNote ||
      matched?.spec ||
      '재고 소진 시 조기 품절될 수 있으며, 구매 전 상품 상태와 수량을 확인해 주세요.',
  }
}

function getAddCartErrorMessage(error) {
  const data = error?.response?.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    const fieldMsgs = Object.values(data).filter((v) => typeof v === 'string' && v.trim())
    if (fieldMsgs.length > 0) return fieldMsgs.join('\n')
  }
  return error?.message || '장바구니에 담지 못했습니다. 다시 시도해 주세요.'
}

export default function GoodsDetail() {
  const { prdId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const app = useApp()

  const stateGoods = location.state?.goods || null
  const [goods, setGoods] = useState(stateGoods)
  const [loading, setLoading] = useState(!stateGoods)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const lockRef = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [prdId])

  useEffect(() => {
    setQty(1)
    if (stateGoods && String(resolveDbPrdId(stateGoods) ?? stateGoods.id) === String(prdId)) {
      setGoods(stateGoods)
      setLoading(false)
      setError('')
    }
  }, [prdId, stateGoods])

  useEffect(() => {
    let alive = true
    if (goods && String(resolveDbPrdId(goods) ?? goods.id) === String(prdId)) {
      return
    }

    async function loadSingleGoods() {
      setLoading(true)
      setError('')
      try {
        const stores = await getPopups()
        const batches = await Promise.all(
          stores.map(async (store) =>
            (await getPopupProducts(store.id)).map((item) => ({
              ...item,
              popupId: String(store.id),
              popupName: store.title,
            }))
          )
        )
        const found = batches
          .flat()
          .find((item) => String(resolveDbPrdId(item) ?? item.id) === String(prdId))

        if (!alive) return
        if (found) {
          setGoods(found)
        } else {
          setError('상품 정보를 찾을 수 없어요.')
        }
      } catch {
        if (alive) setError('상품 상세 정보를 불러오지 못했어요.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadSingleGoods()
    return () => {
      alive = false
    }
  }, [prdId, goods])

  const saleInfo = useMemo(() => getProductSaleInfo(goods), [goods])
  const detail = useMemo(() => getDetailContent(goods), [goods])

  const maxStock = typeof goods?.stock === 'number' && goods.stock > 0 ? goods.stock : 99
  const maxByRule = typeof goods?.maxQty === 'number' && goods.maxQty > 0 ? goods.maxQty : maxStock
  const maxSelectable = Math.max(1, Math.min(maxStock, maxByRule))

  const handleAddToCart = async () => {
    if (!goods || !saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 담을 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(goods)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    lockRef.current = true
    setAdding(true)
    try {
      await addCartItem(dbPrdId, qty)
      app.showToast?.('장바구니에 담았어요')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        app.showToast?.('로그인 인증을 확인하지 못했습니다. 다시 로그인해 주세요.')
        navigate('/login')
      } else {
        alert(getAddCartErrorMessage(err))
      }
    } finally {
      lockRef.current = false
      setAdding(false)
    }
  }

  const handleBuyNow = () => {
    if (!goods || !saleInfo.canPurchase || lockRef.current) return

    if (!app.isAuthenticated) {
      app.showToast?.('로그인 후 구매할 수 있어요')
      navigate('/login')
      return
    }

    const dbPrdId = resolveDbPrdId(goods)
    if (!dbPrdId) {
      app.showToast?.('아직 판매 준비 중인 상품이에요')
      return
    }

    navigate('/checkout', {
      state: {
        items: [
          {
            prdId: dbPrdId,
            quantity: qty,
            name: goods.name,
            price: goods.price,
            image: goods.image,
          },
        ],
      },
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 16px' }}>
        <div className="empty-state" role="status">상품 상세 정보를 불러오고 있어요.</div>
      </div>
    )
  }

  if (error || !goods) {
    return (
      <div className="container" style={{ padding: '48px 16px' }}>
        <div className="empty-state" role="alert">
          {error || '상품을 찾을 수 없어요.'}
          <div style={{ marginTop: '14px' }}>
            <button type="button" className="gs-reset" onClick={() => navigate('/goods')}>
              굿즈 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const unitPrice = Number(goods.price) || 0
  const totalPrice = unitPrice * qty

  return (
    <div className="container" style={{ padding: '32px 16px 72px', maxWidth: '1080px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← 뒤로 가기
        </button>

        {goods.popupId && (
          <Link
            to={`/popups/${goods.popupId}`}
            style={{ fontSize: '14px', color: '#68754B', fontWeight: 700, textDecoration: 'none' }}
          >
            {goods.popupName || '팝업스토어'} 상세 보기 →
          </Link>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            aspectRatio: '1 / 1',
            borderRadius: '18px',
            overflow: 'hidden',
            backgroundColor: '#f9f5f0',
            position: 'relative',
          }}
        >
          {saleInfo.badge ? (
            <span
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 1,
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                backgroundColor: saleInfo.badge === '판매예정' ? '#4b5563' : '#9ca3af',
                color: '#fff',
              }}
            >
              {saleInfo.badge}
            </span>
          ) : (
            goods.limited && (
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 1,
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  backgroundColor: '#1c1917',
                  color: '#fff',
                }}
              >
                한정판
              </span>
            )
          )}
          <img
            src={goods.image}
            alt={goods.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: goods.imageFit || 'cover',
              display: 'block',
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
            {goods.popupName || '팝업스토어'}
            {goods.category ? ` · ${goods.category}` : ''}
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: '26px', lineHeight: 1.35, color: '#1c1917' }}>
            {goods.name}
          </h1>

          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1c1917', marginBottom: '14px' }}>
            {formatPrice(unitPrice)}
          </div>

          {typeof goods.stock === 'number' && (
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '18px' }}>
              남은 재고: <strong>{goods.stock > 0 ? `${goods.stock}개` : '품절'}</strong>
              {maxSelectable < 99 && saleInfo.canPurchase ? ` · 1회 최대 ${maxSelectable}개` : ''}
            </div>
          )}

          <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.7, color: '#374151' }}>
            {detail.summary}
          </p>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#4b5563',
              marginBottom: '22px',
            }}
          >
            <strong style={{ color: '#1f2937', display: 'block', marginBottom: '4px' }}>
              구성 및 확인 사항
            </strong>
            {detail.spec}
          </div>

          {saleInfo.canPurchase && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                >
                  -
                </button>
                <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxSelectable, q + 1))}
                  disabled={qty >= maxSelectable}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                >
                  +
                </button>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1c1917' }}>
                총 금액: {formatPrice(totalPrice)}
              </div>
            </div>
          )}

          {saleInfo.canPurchase ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={adding}
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                {adding ? '담는 중…' : '장바구니'}
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  height: '44px',
                  backgroundColor: '#68754B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                구매하기
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                height: '44px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'not-allowed',
              }}
            >
              {saleInfo.buttonLabel || '구매 불가'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}