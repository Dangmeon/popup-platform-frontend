import { Link } from 'react-router-dom'
import '../styles/FeaturedPopupDetail.css'

export default function FeaturedPopupDetail({ popup }) {
  const p = popup

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

          {/* 예약 화면은 김태후 담당. 경로는 /popups/:popupId/reserve 로 협의 */}
          <Link to={`/popups/${p.id}/reserve`} className="btn btn-primary btn-block fpd-reserve">
            예약하기
          </Link>
        </div>
      </div>
      {p.goodsGuide && (
        <>
          <div className="section-title">🎁 굿즈 안내</div>
          <img className="fpd-guide" src={p.goodsGuide} alt={`${p.title} 굿즈 안내`} />
        </>
      )}

      {p.goods.length > 0 && (
        <>
          <div className="section-title">🛍️ 이 팝업의 굿즈</div>
          <div className="fpd-goods">
            {p.goods.map((g, i) => (
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
    </div>
  )
}
