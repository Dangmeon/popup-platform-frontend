import { useEffect, useState } from 'react'
import {
  useParams,
  Link,
  useNavigate,
} from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PopupFavoriteButton from '../components/common/PopupFavoriteButton.jsx'
import GoodsCard from '../components/common/GoodsCard.jsx'
import { usePopup, usePopupProducts } from '../hooks/usePopups'
import { rememberPopup } from '../utils/recentPopups.js'
import './PopupDetail.css'
import PopupLifecycleBadge from '../components/common/PopupLifecycleBadge.jsx'
import PopupReservationPanel from '../components/reservation/PopupReservationPanel.jsx'
import '../components/reservation/PopupReservationPanel.css'

const TABS = [
  { key: 'about', label: '소개' },
  { key: 'goods', label: '굿즈' },
  { key: 'guide', label: '방문 안내' },
  { key: 'map', label: '위치' },
]

function resolveGoodsDetailId(item) {
  const candidate = item?.prdId ?? item?.serverId ?? item?.productId ?? item?.id
  if (candidate === undefined || candidate === null || candidate === '') return null
  const num = typeof candidate === 'number' ? candidate : Number(candidate)
  if (Number.isSafeInteger(num) && num >= 1) return num
  return String(candidate)
}

function BasicPopupDetail({ onCreateHold }) {
  const { popupId } = useParams()
  const navigate = useNavigate()
  const app = useApp()

  // 서버 팝업 및 굿즈
  const { data: popup, loading, error } = usePopup(popupId)
  const {
    data: productsData,
    loading: goodsLoading,
    error: goodsError,
  } = usePopupProducts(popupId)

  const popupGoods = Array.isArray(productsData)
    ? productsData
    : []

  const [tab, setTab] = useState('about')
  const owner = app.currentUser?.username || app.currentUser?.email

  // 최근 본 팝업 기록
  useEffect(() => {
    if (String(popup?.id) === String(popupId)) rememberPopup(owner, popup)
  }, [owner, popup, popupId])

  const handleSelectGoods = (item) => {
    const targetId = resolveGoodsDetailId(item)
    if (!targetId) return

    navigate(`/goods/${targetId}`, {
      state: {
        goods: {
          ...item,
          popupId: item.popupId ?? String(popup?.id ?? popupId),
          popupName: item.popupName ?? popup?.title ?? popup?.name ?? '팝업스토어',
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="container empty-state" role="status">
        팝업 정보를 불러오는 중입니다.
      </div>
    )
  }

  if (error || !popup) {
    return (
      <div className="container empty-state">
        <p role="alert">
          {error || '존재하지 않는 팝업입니다.'}
        </p>
        <Link to="/popups">목록으로</Link>
      </div>
    )
  }

  // 이미지: 여러 장(images)이 오면 갤러리로, 한 장이면 큰 이미지 하나로
  const images = (Array.isArray(popup.images) && popup.images.length > 0
    ? popup.images
    : [popup.image]
  ).filter(Boolean)
  const galleryClass = images.length >= 3 ? '' : images.length === 2 ? ' is-double' : ' is-single'

  const description =
    popup.description ||
    popup.content ||
    `${popup.location || '지정된 장소'}에서 ${popup.startDate} ~ ${popup.endDate} 동안 열리는 팝업스토어예요.`

  return (
    <div className="container bpd pd-server">
      {/* 경로 */}
      <nav className="bpd-crumb" aria-label="현재 위치">
        <Link to="/">홈</Link>
        <span>›</span>
        <Link to="/popups">팝업 탐색</Link>
        <span>›</span>
        <span className="bpd-crumb-now">{popup.title}</span>
      </nav>

      <div className="bpd-layout">
        {/* 왼쪽: 정보 */}
        <div className="bpd-main">
          {/* 이미지 */}
          <div className="bpd-favorite-gallery">
            {images.length > 0 ? (
              <div className={'bpd-gallery' + galleryClass}>
                {images.slice(0, 3).map((src, i) => (
                  <img
                    key={src + i}
                    src={src}
                    alt={i === 0 ? popup.title : `${popup.title} ${i + 1}`}
                    className={i === 0 ? 'bpd-gallery-main' : 'bpd-gallery-sub'}
                  />
                ))}
              </div>
            ) : (
              <div className="bpd-gallery-empty">이미지 준비 중이에요</div>
            )}
            <PopupFavoriteButton key={popup.id} popup={popup} />
          </div>

          {/* 제목 영역 */}
          <div className="bpd-head">
            <div className="bpd-badges">
              {popup.category && <span className="badge">{popup.category}</span>}
              <PopupLifecycleBadge popup={popup} />
            </div>
            <h1 className="bpd-title">{popup.title}</h1>
            <ul className="bpd-meta">
              <li>{popup.location}</li>
              <li>🗓 {popup.startDate} ~ {popup.endDate}</li>
            </ul>
          </div>

          {/* 탭 */}
          <div className="bpd-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={'bpd-tab' + (tab === t.key ? ' active' : '')}
                onClick={() => setTab(t.key)}
              >
                {t.label}{t.key === 'goods' && popupGoods.length > 0 ? ` ${popupGoods.length}` : ''}
              </button>
            ))}
          </div>

          <div className="bpd-panel">
            {tab === 'about' && (
              <div className="bpd-about">
                <div className="bpd-eyebrow">ABOUT</div>
                <h2 className="bpd-headline">{popup.title}</h2>
                <p className="bpd-desc">{description}</p>

                <div className="bpd-notice">
                  <h3>방문 전 꼭 확인해 주세요</h3>
                  <p>예약은 회차 7일 전 10:00에 열리고, 전날까지 할 수 있어요.</p>
                  <p>최종 확정 시 잔여석을 다시 확인해요. 처리 결과가 불확실하면 기존 예약부터 확인해 주세요.</p>
                  <p>현장 대기는 휴대폰 번호로 등록하고, 받은 체크인 코드로 입장해요.</p>
                </div>
              </div>
            )}

            {tab === 'goods' && (
              goodsLoading ? (
                <p role="status">굿즈 정보를 불러오는 중입니다.</p>
              ) : goodsError ? (
                <p className="form-error" role="alert">{goodsError}</p>
              ) : popupGoods.length > 0 ? (
                <div className="bpd-goods">
                  {popupGoods.map(g => (
                    <GoodsCard
                      key={g.id}
                      item={g}
                      goods={g}
                      onSelect={() => handleSelectGoods(g)}
                      onCardClick={() => handleSelectGoods(g)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bpd-empty">아직 등록된 굿즈가 없어요</div>
              )
            )}

            {tab === 'guide' && (
              <div className="bpd-guide">
                <div className="bpd-guide-row">
                  <strong>운영 기간</strong>
                  <span>{popup.startDate} ~ {popup.endDate}</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>장소</strong>
                  <span>{popup.location}</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>예약 방법</strong>
                  <span>이 페이지에서 날짜·회차·인원을 선택하고 확인 창에서 예약을 확정해요.</span>
                </div>
                <div className="bpd-guide-row">
                  <strong>현장 대기</strong>
                  <span>휴대폰 번호를 입력해 등록하면 순번과 체크인 코드를 받아요.</span>
                </div>
              </div>
            )}

            {tab === 'map' && (
              <div className="bpd-map">
                <p className="bpd-map-place">{popup.location}</p>
                <Link className="btn btn-outline" to={`/nearby?popup=${encodeURIComponent(popup.id)}`}>
                  POPQ 지도에서 보기
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 예약·대기 */}
        <aside className="bpd-aside"><PopupReservationPanel popup={popup} onCreateHold={onCreateHold} /></aside>
      </div>
    </div>
  )
}

export default function PopupDetail({ onCreateHold }) {
  const { popupId } = useParams()
  const app = useApp()

  return <BasicPopupDetail
    onCreateHold={onCreateHold}
    key={`${popupId}:${app.currentUser?.username || app.currentUser?.email || 'guest'}`}
  />
}
