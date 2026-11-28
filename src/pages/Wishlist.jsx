import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PopupCard from '../components/common/PopupCard.jsx'
import { getPopups } from '../api/popupApi.js'

// 찜 목록 화면
export default function Wishlist() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    getPopups()
      .then(popups => {
        if (popups.some(popup => typeof popup.isFavorite !== 'boolean')) throw new Error('찜 여부 조회 실패')
        if (active) setResult({ status: 'ready', rows: popups.filter(popup => popup.isFavorite) })
      })
      .catch(() => { if (active) setResult({ status: 'error' }) })
    return () => { active = false }
  }, [attempt])

  if (result.status === 'loading') return <p role="status">찜 목록을 불러오는 중입니다.</p>
  if (result.status === 'error') return <div>
    <p role="alert">찜 목록을 불러오지 못했습니다.</p>
    <button type="button" className="ms-action" onClick={() => {
      setResult({ status: 'loading' })
      setAttempt(previous => previous + 1)
    }}>다시 불러오기</button>
  </div>
  if (!result.rows.length) return <div className="ms-empty">
    <p>찜한 팝업이 없습니다.</p>
    <Link to="/popups">팝업 둘러보기</Link>
  </div>

  return <div className="ms-favorites">
    {result.rows.map(popup => <PopupCard key={popup.id} popup={popup} />)}
  </div>
}
