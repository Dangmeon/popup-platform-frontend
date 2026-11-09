import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/FeaturedPopupDetail.css'
import '../styles/FeaturedPopupDetailTabs.css'

export default function FeaturedPopupDetail({ popup }) {
  const p = popup
  const [tab, setTab] = useState('about')

  const goods = Array.isArray(p.goods) ? p.goods : []
  const hasGoods = goods.length > 0 || Boolean(p.goodsGuide)

  // 소개 문구: featuredPopups.js에 about(또는 description)이 있으면 그것을, 없으면 기본 문장
  const aboutText =
    p.about ||
    p.description ||
    `${p.location}에서 ${p.period} 동안 열리는 ${p.tag}예요. 포토존과 굿즈샵 등 다양한 공간을 만나 보세요.`

  const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(p.location || p.title || '')}`

  const tabs = [
    { key: 'about', label: '소개' },
    { key: 'goods', label: goods.length > 0 ? `굿즈 ${goods.length}` : '굿즈' },
    { key: 'guide', label: '방문 안내' },
    { key: 'map', label: '위치' },
  ]

  return (
    <div className="container fpd">
      <div className="fpd-top">
        <div className="fpd-poster">
          <img src={p.poster} alt={p.title} />
        </div>

        <div className="fpd-info">
          <span className="fpd-tag">{p.tag}</span>
          <h1 className="fpd-title">{p.title}</h1>

          <dl className="fpd-meta">
            <div><dt>일정</dt><dd>{p.period}</dd></div>
            <div><dt>시간</dt><dd>{p.time}</dd></div>
            <div><dt>장소</dt><dd>{p.location}</dd></div>
          </dl>

          <div className="fpd-zones">
            {p.zones.map((z) => <span key={z} className="fpd-zone">{z}</span>)}
          </div>

         
          <Link to={`/popups/${p.id}/reserve`} className="btn btn-primary btn-block fpd-reserve">
            예약하기
          </Link>
        </div>
      </div>

      {/* 탭 */}
      <div className="fpd-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={'fpd-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="fpd-panel">
        {/* 소개 */}
        {tab === 'about' && (
          <div className="fpd-about">
            <div className="fpd-eyebrow">ABOUT</div>
            <h2 className="fpd-headline">{p.title}</h2>
            <p className="fpd-desc">{aboutText}</p>

            <div className="fpd-notice">
              <h3>방문 전 꼭 확인해 주세요</h3>
              <p>운영 시간은 {p.time}이에요. 마감 전에 입장해 주세요.</p>
              <p>예약은 회차 7일 전 10:00에 열리고, 전날까지 할 수 있어요.</p>
              <p>예약을 선점한 뒤 10분 안에 확정하지 않으면 자리가 풀려요.</p>
            </div>
          </div>
        )}

        {/* 굿즈 */}
        {tab === 'goods' && (
          hasGoods ? (
            <>
              {p.goodsGuide && (
                <>
                  <div className="section-title">🎁 굿즈 안내</div>
                  <img className="fpd-guide" src={p.goodsGuide} alt={`${p.title} 굿즈 안내`} />
                </>
              )}

              {goods.length > 0 && (
                <>
                  <div className="section-title">🛍️ 이 팝업의 굿즈</div>
                  <div className="fpd-goods">
                    {goods.map((g, i) => (
                      <div key={g.id} className="fpd-good">
                        <div className="fpd-good-img">
                          <span className="fpd-good-no">{i + 1}</span>
                          {g.limited && <span className="fpd-good-badge">한정판</span>}
                          <img src={g.image} alt={g.name} style={p.imageFit ? { objectFit: p.imageFit } : undefined} />
                        </div>
                        <div className="fpd-good-body">
                          <div className="fpd-good-name">{g.name}</div>
                          <div className="fpd-good-price">{g.price > 0 ? `${g.price.toLocaleString()}원` : '가격 미정'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="fpd-empty">아직 등록된 굿즈가 없어요</div>
          )
        )}

        {/* 방문 안내 */}
        {tab === 'guide' && (
          <div className="fpd-guide-list">
            <div className="fpd-guide-row">
              <strong>운영 기간</strong>
              <span>{p.period}</span>
            </div>
            <div className="fpd-guide-row">
              <strong>운영 시간</strong>
              <span>{p.time}</span>
            </div>
            <div className="fpd-guide-row">
              <strong>장소</strong>
              <span>{p.location}</span>
            </div>
            <div className="fpd-guide-row">
              <strong>예약 방법</strong>
              <span>예약하기 버튼에서 날짜와 회차를 고르고, 선점한 뒤 10분 안에 확정해요.</span>
            </div>
          </div>
        )}

        {/* 위치 */}
        {tab === 'map' && (
          <div className="fpd-map">
            <p className="fpd-map-place">📍 {p.location}</p>
            <a className="btn btn-outline" href={mapUrl} target="_blank" rel="noreferrer">
              네이버 지도에서 보기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}