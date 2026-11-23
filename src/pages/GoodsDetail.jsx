import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPopups, getPopupProducts } from '../api/popupApi.js'
import { useApp } from '../context/AppContext.jsx'
import { addCartItem } from '../api/cartApi'

const RESCENE_DETAILS = {
  '리센느 5인 레미니(REMINI) 룸 스프레이 5종 세트': {
    tagline: 'FIVE MOODS IN ONE COLLECTION',
    summary:
      '리센느 멤버 다섯 명의 무드를 담은 레미니(REMINI) 룸 스프레이 5종 세트입니다. 공간과 기분에 따라 각기 다른 향을 즐길 수 있도록 구성했으며, 데스크·침실·드레스룸 등 일상 공간에 은은한 잔향을 남깁니다.',
    spec: '5종 세트 구성(각 향별 개별 용기) · 분사 전 흔들어 사용 · 직사 분사 거리 유지 및 가죽·실크 등 민감 소재 주의',
    highlights: [
      {
        title: '멤버별 5가지 시그니처 향 구성',
        desc: '다섯 멤버의 개성을 담은 5종 개별 용기로 날마다 다른 공간 분위기를 연출할 수 있습니다.',
      },
      {
        title: '전용 패키지 박스 포함',
        desc: '보관과 선물 모두에 어울리는 전용 박스에 담겨 소장 가치를 높였습니다.',
      },
      {
        title: '데일리 공간 케어 활용',
        desc: '패브릭 커튼, 침실, 작업 공간 등 원하는 곳에 가볍게 분사해 잔향을 즐길 수 있습니다.',
      },
    ],
  },
  '리트와메트 오리지널 보더 스트라이프 셔츠 2종 세트': {
    tagline: 'CLASSIC BORDER STRIPE COLLABORATION',
    summary:
      '리트와메트 협업 오리지널 보더 스트라이프 셔츠 2종 세트입니다. 단정하면서도 캐주얼하게 매치하기 좋은 스트라이프 패턴을 적용해 단독 착용은 물론 이너·레이어드 룩으로도 활용도가 높습니다.',
    spec: '2종 세트 구성 · 실측 사이즈 확인 권장 · 단독 손세탁 또는 세탁망 권장, 건조기 사용 자제 및 색 이염 주의',
    highlights: [
      {
        title: '컬러 배색이 돋보이는 2종 세트',
        desc: '아이보리·네이비와 그린·네이비 두 가지 컬러 구성으로 다양한 스타일링이 가능합니다.',
      },
      {
        title: '포인트 자수 와펜 디테일',
        desc: '가슴 포켓 라인의 협업 아트웍 자수로 완성도를 높였습니다.',
      },
      {
        title: '사계절 레이어드 활용도',
        desc: '단독 착용은 물론 아우터 이너로도 자연스럽게 어우러지는 여유 있는 핏입니다.',
      },
    ],
  },
  "미나미 'GAL SUNSET' 핑크 레오파드 선크림": {
    tagline: 'PINK LEOPARD EDITION SUN CARE',
    summary:
      "팝업 무드를 담은 핑크 레오파드 패키지 디자인의 'GAL SUNSET' 선크림입니다. 야외 활동이나 팝업 방문 시 간편하게 휴대하며 바르기 좋도록 소장 가치와 실용성을 함께 담았습니다.",
    spec: '외출 전 기초 케어 마지막 단계에서 적당량 도포 · 피부 이상 반응 시 사용 중단 · 개봉 후 권장 기한 내 사용',
    highlights: [
      {
        title: '리미티드 아트워크 패키지',
        desc: '핑크 레오파드 일러스트 패키지와 키링 디테일로 파우치 속 포인트 아이템이 됩니다.',
      },
      {
        title: '가볍고 산뜻한 데일리 텍스처',
        desc: '백탁이나 끈적임 부담을 줄여 외출 전후 수시로 덧바르기 좋습니다.',
      },
      {
        title: '휴대하기 좋은 튜브 타입',
        desc: '미니 백이나 파우치에 쏙 들어가는 사이즈로 야외 일정에도 간편하게 챙길 수 있습니다.',
      },
    ],
  },
  '신라공주 자개 이중 진공 보냉병': {
    tagline: 'TRADITIONAL MOTHER-OF-PEARL EDITION',
    summary:
      '한국적인 자개 감성과 모던한 보냉병 형태를 결합한 이중 진공 보냉병입니다. 이중 벽 구조로 음료의 온도를 오래 유지해 주며, 데일리 휴대용 텀블러로 활용하기 좋습니다.',
    spec: '이중 진공 보냉 구조 · 뚜껑 밀폐 확인 후 휴대 · 연마제/철수세미, 식기세척기, 전자레인지 사용 금지',
    highlights: [
      {
        title: '자개 그래픽 & 매트 블랙 바디',
        desc: '전통 자개 문양을 모던하게 재해석한 그래픽이 차분하고 고급스러운 무드를 전합니다.',
      },
      {
        title: '이중 진공 보온·보냉 설계',
        desc: '외부 결로를 줄이고 음료의 온도를 오랫동안 안정적으로 유지합니다.',
      },
      {
        title: '전용 패키지 박스 제공',
        desc: '고급 하드 케이스가 함께 구성되어 기념품 및 선물용으로도 손색없습니다.',
      },
    ],
  },
}

const FAQ_ITEMS = [
  {
    q: '팝업스토어가 종료된 뒤에도 온라인 구매가 가능한가요?',
    a: '네, 온라인 굿즈샵에 등록된 판매중 상품은 오프라인 팝업 일정과 무관하게 재고 소진 시까지 온라인으로 주문하실 수 있습니다.',
  },
  {
    q: '한 번에 구매할 수 있는 수량 제한이 있나요?',
    a: '한정판 및 인기 굿즈의 경우 공정한 구매를 위해 1회 최대 구매 수량이 제한될 수 있으며, 상품 상단 재고 영역에서 확인하실 수 있습니다.',
  },
  {
    q: '장바구니에 담은 후 결제를 완료해야 재고가 확보되나요?',
    a: '네, 장바구니 담기 단계에서는 재고가 차감되지 않으며 주문 및 결제 완료 시점을 기준으로 재고가 확정됩니다.',
  },
  {
    q: '단순 변심 교환·환불은 어떻게 신청하나요?',
    a: '상품 수령일로부터 7일 이내 미개봉·미사용 상태일 때 가능하며, 마이페이지 주문 내역 또는 고객센터를 통해 접수하실 수 있습니다.',
  },
]

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
  if (!g) return { canPurchase: false, badge: null, buttonLabel: '구매 불가', statusText: '확인 필요' }
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
    return { canPurchase: false, badge: '품절', buttonLabel: '품절', statusText: '품절' }
  }

  if (
    Number.isFinite(startMs)
      ? now < startMs
      : ['UPCOMING', 'SCHEDULED', 'BEFORE_SALE', '판매예정'].includes(status)
  ) {
    return { canPurchase: false, badge: '판매예정', buttonLabel: '판매예정', statusText: '판매예정' }
  }

  if (
    Number.isFinite(endMs)
      ? now > endMs
      : ['ENDED', 'CLOSED', '판매종료'].includes(status)
  ) {
    return { canPurchase: false, badge: '판매종료', buttonLabel: '판매종료', statusText: '판매종료' }
  }

  return { canPurchase: true, badge: null, buttonLabel: null, statusText: '판매중' }
}

function getDetailContent(g) {
  if (!g) return { tagline: 'OFFICIAL POP-UP EDITION', summary: '', spec: '', highlights: [] }
  const matched = RESCENE_DETAILS[g.name]
  return {
    tagline: matched?.tagline || 'OFFICIAL POP-UP EDITION',
    summary:
      g.description ||
      g.productDesc ||
      matched?.summary ||
      `${g.popupName || '팝업스토어'}에서 만나볼 수 있는 공식 굿즈입니다. 소장용 및 데일리 아이템으로 활용하기 좋습니다.`,
    spec:
      g.specNote ||
      matched?.spec ||
      '재고 소진 시 조기 품절될 수 있으며, 구매 전 상품 상태와 수량을 확인해 주세요.',
    highlights: matched?.highlights || [
      {
        title: `${g.popupName || '팝업스토어'} 공식 라이선스 굿즈`,
        desc: '팝업스토어 콘셉트에 맞춰 제작된 오리지널 에디션 상품입니다.',
      },
      {
        title: '소장과 실용성을 겸비한 구성',
        desc: '일상 속에서도 자연스럽게 활용할 수 있도록 디자인과 마감 디테일을 살렸습니다.',
      },
      {
        title: '온라인 간편 주문 & 안전 배송',
        desc: '현장 방문이 어렵더라도 온라인에서 간편하게 주문하고 받아보실 수 있습니다.',
      },
    ],
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
  const [allGoods, setAllGoods] = useState([])
  const [loading, setLoading] = useState(!stateGoods)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')
  const [imageMode, setImageMode] = useState('full')
  const [zoomHover, setZoomHover] = useState(false)
  const [openFaqIdx, setOpenFaqIdx] = useState(0)
  const lockRef = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [prdId])

  useEffect(() => {
    setQty(1)
    setActiveTab('detail')
    setImageMode('full')
    setZoomHover(false)
    if (stateGoods && String(resolveDbPrdId(stateGoods) ?? stateGoods.id) === String(prdId)) {
      setGoods(stateGoods)
      setLoading(false)
      setError('')
    }
  }, [prdId, stateGoods])

  useEffect(() => {
    let alive = true
    const alreadyHaveCurrent =
      goods && String(resolveDbPrdId(goods) ?? goods.id) === String(prdId)

    async function loadGoodsData() {
      if (!alreadyHaveCurrent) {
        setLoading(true)
        setError('')
      }
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
        const flat = batches.flat()
        if (!alive) return
        setAllGoods(flat)

        if (!alreadyHaveCurrent) {
          const found = flat.find(
            (item) => String(resolveDbPrdId(item) ?? item.id) === String(prdId)
          )
          if (found) {
            setGoods(found)
          } else {
            setError('상품 정보를 찾을 수 없어요.')
          }
        }
      } catch {
        if (!alreadyHaveCurrent && alive) {
          setError('상품 상세 정보를 불러오지 못했어요.')
        }
      } finally {
        if (!alreadyHaveCurrent && alive) {
          setLoading(false)
        }
      }
    }

    loadGoodsData()
    return () => {
      alive = false
    }
  }, [prdId, goods])

  const saleInfo = useMemo(() => getProductSaleInfo(goods), [goods])
  const detail = useMemo(() => getDetailContent(goods), [goods])

  const relatedGoods = useMemo(() => {
    if (!goods || allGoods.length === 0) return []
    const currentKey = String(resolveDbPrdId(goods) ?? goods.id)
    const others = allGoods.filter(
      (item) => String(resolveDbPrdId(item) ?? item.id) !== currentKey
    )
    const samePopup = others.filter((item) => item.popupId && item.popupId === goods.popupId)
    const diffPopup = others.filter((item) => item.popupId !== goods.popupId)
    return [...samePopup, ...diffPopup].slice(0, 4)
  }, [goods, allGoods])

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
  const baseScale = imageMode === 'detail' ? 1.24 : 1
  const currentScale = zoomHover ? baseScale * 1.06 : baseScale

  return (
    <div className="container" style={{ padding: '32px 16px 80px', maxWidth: '1080px' }}>
      {/* 상단 내비게이션 */}
      <div
        style={{
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
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

      {/* 상단 상품 요약 및 구매 영역 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        {/* 왼쪽 이미지 + 멀티 뷰 썸네일 */}
        <div>
          <div
            onMouseEnter={() => setZoomHover(true)}
            onMouseLeave={() => setZoomHover(false)}
            style={{
              aspectRatio: '1 / 1',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#f5f7f3',
              border: '1px solid #e5e8eb',
              position: 'relative',
              cursor: 'zoom-in',
            }}
          >
            {saleInfo.badge ? (
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 2,
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
                    zIndex: 2,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    backgroundColor: '#68754B',
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
                transform: `scale(${currentScale})`,
                transformOrigin: imageMode === 'detail' ? 'center 38%' : 'center center',
                transition: 'transform 0.35s ease',
              }}
            />
          </div>

          {/* 썸네일 뷰 전환 */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {[
              { id: 'full', label: '전체 컷', scale: 1 },
              { id: 'detail', label: '디테일 포커스', scale: 1.3 },
            ].map((view) => {
              const active = imageMode === view.id
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setImageMode(view.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 12px 6px 6px',
                    borderRadius: '12px',
                    border: active ? '2px solid #68754B' : '1px solid #e5e8eb',
                    backgroundColor: active ? '#f5f7f3' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    <img
                      src={goods.image}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${view.scale})`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: active ? 800 : 600,
                      color: active ? '#293323' : '#6b7280',
                    }}
                  >
                    {view.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 오른쪽 구매 정보 패널 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: '#eef2ea',
                color: '#293323',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {goods.popupName || '팝업스토어'}
            </span>
            {goods.category && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {goods.category}
              </span>
            )}
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: '26px', lineHeight: 1.35, color: '#1c1917' }}>
            {goods.name}
          </h1>

          <div style={{ fontSize: '26px', fontWeight: 800, color: '#293323', marginBottom: '12px' }}>
            {formatPrice(unitPrice)}
          </div>

          {typeof goods.stock === 'number' && (
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
              남은 재고: <strong style={{ color: '#293323' }}>{goods.stock > 0 ? `${goods.stock}개` : '품절'}</strong>
              {maxSelectable < 99 && saleInfo.canPurchase ? ` · 1회 최대 ${maxSelectable}개` : ''}
            </div>
          )}

          <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.7, color: '#374151' }}>
            {detail.summary}
          </p>

          {/* 구매 혜택 / 보증 3단 배지 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {[
              { title: '공식 팝업 굿즈', desc: '정품 오리지널 에디션' },
              { title: '안전 포장 출고', desc: '결제 후 순차 발송' },
              { title: '간편 온라인 결제', desc: '토스페이먼츠 지원' },
            ].map((badge) => (
              <div
                key={badge.title}
                style={{
                  padding: '10px 10px',
                  borderRadius: '10px',
                  border: '1px solid #e5e8eb',
                  backgroundColor: '#fafbf9',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#293323', marginBottom: '2px' }}>
                  {badge.title}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{badge.desc}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: '#f5f7f3',
              border: '1px solid #dfe5da',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#374151',
              marginBottom: '20px',
            }}
          >
            <strong style={{ color: '#293323', display: 'block', marginBottom: '4px' }}>
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
                marginBottom: '18px',
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

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#293323' }}>
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
                  height: '46px',
                  backgroundColor: '#ffffff',
                  color: '#293323',
                  border: '1px solid #cfd6c9',
                  borderRadius: '10px',
                  fontWeight: 700,
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
                  height: '46px',
                  backgroundColor: '#68754B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
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
                height: '46px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'not-allowed',
              }}
            >
              {saleInfo.buttonLabel || '구매 불가'}
            </button>
          )}
        </div>
      </div>

      {/* 하단 상세 탭 (에디토리얼 상세 / 배송·환불 / 자주 묻는 질문) */}
      <section
        style={{
          marginTop: '56px',
          backgroundColor: '#fff',
          border: '1px solid #e5e8eb',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <div
          role="tablist"
          aria-label="상품 상세 안내 탭"
          style={{
            display: 'flex',
            borderBottom: '1px solid #e5e8eb',
            backgroundColor: '#fafbf9',
          }}
        >
          {[
            { id: 'detail', label: '상품 상세 정보' },
            { id: 'shipping', label: '배송 · 교환 · 환불' },
            { id: 'faq', label: '자주 묻는 질문' },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  border: 'none',
                  borderBottom: active ? '2.5px solid #68754B' : '2.5px solid transparent',
                  backgroundColor: active ? '#fff' : 'transparent',
                  color: active ? '#293323' : '#6b7280',
                  fontWeight: active ? 800 : 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'detail' && (
          <div style={{ padding: '32px 26px', display: 'grid', gap: '30px' }}>
            {/* 에디토리얼 무드 배너 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                alignItems: 'center',
                padding: '26px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #293323 0%, #445238 100%)',
                color: '#fff',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#d4decb',
                    marginBottom: '8px',
                  }}
                >
                  {detail.tagline}
                </div>
                <h2 style={{ margin: '0 0 12px', fontSize: '22px', lineHeight: 1.35, color: '#fff' }}>
                  {goods.name}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.75, color: '#eef2ea' }}>
                  {detail.summary}
                </p>
              </div>

              <div
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
                }}
              >
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
            </div>

            {/* 01 · 02 · 03 포인트 카드 */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#68754B', marginBottom: '6px' }}>
                KEY HIGHLIGHTS
              </div>
              <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 800, color: '#293323' }}>
                이 굿즈의 핵심 포인트
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                }}
              >
                {detail.highlights.map((item, idx) => (
                  <div
                    key={item.title}
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      backgroundColor: '#fafbf9',
                      border: '1px solid #e5e8eb',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor: '#68754B',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        marginBottom: '10px',
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#293323', marginBottom: '6px' }}>
                      {item.title}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: '#4b5563' }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 연결 팝업스토어 안내 배너 */}
            {goods.popupId && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  padding: '18px 22px',
                  borderRadius: '14px',
                  backgroundColor: '#f5f7f3',
                  border: '1px solid #dfe5da',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#68754B', marginBottom: '4px' }}>
                    POP-UP STORE LINK
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#293323', marginBottom: '2px' }}>
                    {goods.popupName || '팝업스토어'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>
                    팝업스토어 운영 일정, 위치 안내 및 다른 공식 굿즈도 함께 확인해 보세요.
                  </div>
                </div>
                <Link
                  to={`/popups/${goods.popupId}`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#293323',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  팝업 구경하러 가기 →
                </Link>
              </div>
            )}

            {/* 상품 기본 정보 고시 표 */}
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#293323' }}>
                상품 기본 정보
              </h3>
              <div
                style={{
                  border: '1px solid #e5e8eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  fontSize: '13px',
                }}
              >
                {[
                  ['팝업스토어', goods.popupName || '팝업스토어'],
                  ['카테고리', goods.category || '일반 굿즈'],
                  ['판매 상태', saleInfo.statusText],
                  ['구매 가능 수량', saleInfo.canPurchase ? `1회 최대 ${maxSelectable}개` : '구매 불가'],
                  ['취급 유의사항', detail.spec],
                ].map(([label, value], idx, arr) => (
                  <div
                    key={label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr',
                      borderBottom: idx < arr.length - 1 ? '1px solid #e5e8eb' : 'none',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#f9fafb',
                        fontWeight: 700,
                        color: '#4b5563',
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ padding: '12px 14px', color: '#1f2937', lineHeight: 1.55 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div style={{ padding: '28px 24px', display: 'grid', gap: '20px', fontSize: '14px', lineHeight: 1.7, color: '#374151' }}>
            <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#fafbf9', border: '1px solid #e5e8eb' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#293323' }}>
                배송 안내
              </h3>
              <p style={{ margin: 0 }}>
                결제 완료 순으로 순차 출고되며, 택배사 및 물량 상황에 따라 배송 일정이 다소 달라질 수 있습니다. 여러 상품을 함께 주문하신 경우 합포장 또는 개별 발송될 수 있습니다.
              </p>
            </div>
            <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#fafbf9', border: '1px solid #e5e8eb' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#293323' }}>
                교환 및 환불 안내
              </h3>
              <p style={{ margin: 0 }}>
                상품 수령 후 7일 이내 미개봉·미사용 상태에 한해 교환 및 반품 신청이 가능합니다. 단순 변심에 의한 반품 시 왕복 배송비가 발생할 수 있으며, 상품 훼손 또는 구성품 누락 시 교환·환불이 제한될 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div style={{ padding: '28px 24px', display: 'grid', gap: '10px' }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx
              return (
                <div
                  key={item.q}
                  style={{
                    border: '1px solid #e5e8eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? '#fafbf9' : '#fff',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '15px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#293323',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Q. {item.q}</span>
                    <span style={{ color: '#68754B', fontWeight: 800 }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 18px 16px',
                        fontSize: '13px',
                        lineHeight: 1.7,
                        color: '#4b5563',
                        borderTop: '1px solid #eef0f2',
                        paddingTop: '12px',
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 함께 보면 좋은 굿즈 추천 */}
      {relatedGoods.length > 0 && (
        <section style={{ marginTop: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#293323' }}>
              함께 보면 좋은 굿즈
            </h2>
            <Link to="/goods" style={{ fontSize: '13px', fontWeight: 700, color: '#68754B', textDecoration: 'none' }}>
              전체 굿즈 보기 →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            {relatedGoods.map((item) => {
              const targetId = resolveDbPrdId(item) ?? item.id
              return (
                <Link
                  key={targetId}
                  to={`/goods/${targetId}`}
                  state={{ goods: item }}
                  style={{ textDecoration: 'none', color: 'inherit', minWidth: 0, display: 'block' }}
                >
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e8eb',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      height: '100%',
                    }}
                  >
                    <div style={{ aspectRatio: '1 / 1', backgroundColor: '#f9f5f0', overflow: 'hidden' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: item.imageFit || 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.popupName}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#1c1917',
                          marginBottom: '6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#293323' }}>
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}