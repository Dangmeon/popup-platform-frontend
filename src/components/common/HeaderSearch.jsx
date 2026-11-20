import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPopups } from '../../api/popupApi.js'
import PopqIcon from './PopqIcon.jsx'
import './HeaderSearch.css'

export default function HeaderSearch({ authenticated }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [popups, setPopups] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query = keyword.trim().toLowerCase()
  const shouldLoad = authenticated && open && popups === null

  useEffect(() => {
    setOpen(false)
  }, [location.key])

  useEffect(() => {
    if (!shouldLoad) return
    let active = true
    setLoading(true)
    setError('')
    getPopups().then(rows => {
      if (active) setPopups(rows)
    }).catch(() => {
      if (active) setError('추천 팝업을 불러오지 못했어요.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [shouldLoad])

  const suggestions = []
  if (open && Array.isArray(popups)) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
    const candidates = query ? popups : popups
      .filter(popup => popup.endDate >= today && !['PAUSED', 'CANCELLED'].includes(popup.opStatus))
      .toSorted((a, b) => Number(a.startDate > today) - Number(b.startDate > today))
    const seen = new Set()
    for (const popup of candidates) {
      const title = popup.title?.trim()
      if (!title || seen.has(title)) continue
      if (query && !title.toLowerCase().includes(query) && !String(popup.location ?? '').toLowerCase().includes(query)) continue
      seen.add(title)
      suggestions.push(popup)
      if (suggestions.length === (query ? 6 : 3)) break
    }
  }

  function search(value) {
    const term = value.trim()
    setKeyword(term)
    setOpen(false)
    navigate(term ? '/popups?q=' + encodeURIComponent(term) : '/popups')
  }

  return <form className="pq-header-search" role="search"
    onSubmit={event => { event.preventDefault(); search(keyword) }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    <input type="search" aria-label="팝업스토어 검색" placeholder="어떤 팝업을 찾으세요?"
      value={keyword} onFocus={() => setOpen(true)}
      onChange={event => { setKeyword(event.target.value); setOpen(true) }} />
    <button type="submit" aria-label="검색" title="검색"><PopqIcon name="search" size={18} /></button>
    {open && authenticated && (suggestions.length > 0 || loading || error) && (
      <div className="pq-search-suggestions">
        {loading && !popups ? <p className="pq-search-message" role="status">팝업을 불러오고 있어요.</p>
          : error ? <p className="pq-search-message" role="status">{error}</p> : <>
            {!query && <p className="pq-search-heading">추천 팝업</p>}
            <ul aria-label={query ? '추천 검색어' : '추천 팝업'}>
              {suggestions.map(popup => <li key={popup.id}>
                <button type="button" className={!query ? 'pq-search-popup' : undefined}
                  onClick={() => {
                    if (query) return search(popup.title)
                    setOpen(false)
                    navigate('/popups/' + encodeURIComponent(popup.id))
                  }}>
                  {!query && popup.image && <img src={popup.image} alt="" />}
                  <span><strong>{popup.title}</strong>
                    {popup.location && <small>{popup.location}</small>}
                  </span>
                </button>
              </li>)}
            </ul>
          </>}
      </div>
    )}
  </form>
}
