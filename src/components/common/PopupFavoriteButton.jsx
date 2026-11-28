import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { setPopupFavorite } from '../../api/popupApi.js'
import PopqIcon from './PopqIcon.jsx'
import './PopupFavoriteButton.css'

const favoriteChanged = 'popq:favorite-changed'

// 팝업 포스터 찜 버튼
export default function PopupFavoriteButton({ popup }) {
  const { currentUser, isAuthenticated } = useApp()
  const key = JSON.stringify([currentUser?.username ?? currentUser?.email, popup.id])
  const [change, setChange] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const favorite = change?.key === key ? change.favorite : popup.isFavorite

  useEffect(() => {
    const sync = ({ detail }) => { if (detail.key === key) setChange(detail) }
    addEventListener(favoriteChanged, sync)
    return () => removeEventListener(favoriteChanged, sync)
  }, [key])

  if (!isAuthenticated) return <Link to="/login" className="pq-poster-favorite" aria-label="로그인하고 팝업 찜하기">
    <PopqIcon name="heart" size={19} />
  </Link>

  async function toggle() {
    setBusy(true)
    setError(false)
    try {
      const next = await setPopupFavorite(popup.id, !favorite)
      window.dispatchEvent(new CustomEvent(favoriteChanged, { detail: { key, favorite: next } }))
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <button type="button" className="pq-poster-favorite"
      aria-label={favorite ? '팝업 찜 해제' : '팝업 찜하기'}
      aria-pressed={favorite === true} disabled={busy || typeof favorite !== 'boolean'} onClick={toggle}>
      <PopqIcon name="heart" size={19} />
    </button>
    {error && <small className="pq-poster-favorite-error" role="alert">찜 상태를 변경하지 못했습니다.</small>}
  </>
}
