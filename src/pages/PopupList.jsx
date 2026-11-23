import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import PopupCard from '../components/common/PopupCard.jsx'
import { usePopups } from '../hooks/usePopups'
import { getPopupStage } from '../utils/popupLifecycle.js'

const CATEGORY_LABELS = {
  ENTERTAINMENT: '엔터테인먼트',
  FOOD: '푸드',
  CHARACTER: '캐릭터',
  FASHION: '패션',
}

const DEFAULT_CATEGORIES = ['전체', 'ENTERTAINMENT', 'FOOD', 'CHARACTER', 'FASHION']

export default function PopupList() {
  const { data, loading, error } = usePopups({})
  const location = useLocation()
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [keyword, setKeyword] = useState(q)
  const [category, setCategory] = useState('전체')
  const [stage, setStage] = useState('ONGOING')
  const [now, setNow] = useState(Date.now)

  useEffect(() => setKeyword(q), [q, location.key])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const popups = Array.isArray(data) ? data : []
  const extraCategories = [...new Set(popups.map((p) => p.category).filter(Boolean))].filter(
    (c) => !DEFAULT_CATEGORIES.includes(c) && !Object.values(CATEGORY_LABELS).includes(c)
  )
  const categories = [...DEFAULT_CATEGORIES, ...extraCategories]

  const word = keyword.trim().toLowerCase()
  const matches = popups.filter((p) => {
    const normalizedCat = CATEGORY_LABELS[p.category] || p.category
    const targetCat = CATEGORY_LABELS[category] || category
    const matchCat = category === '전체' || p.category === category || normalizedCat === targetCat
    const matchWord = !word || `${p.title} ${p.location}`.toLowerCase().includes(word)
    const matchStage = getPopupStage(p, now) === stage
    return matchCat && matchWord && matchStage
  })

  return (
    <div className="container" style={{ paddingTop: '8px', paddingBottom: '48px' }}>
      <div className="page-title" style={{ color: '#293323', marginBottom: '18px' }}>
        팝업 탐색
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          aria-label="팝업명, 지역으로 검색"
          placeholder="팝업명, 지역으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '12px 18px',
            borderRadius: 999,
            border: '1px solid #d6dcd2',
            backgroundColor: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* 상단 필터 바: [ 진행 중 ▾ ] + 밑줄 카테고리 탭 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #e5e8eb',
          marginBottom: '24px',
          paddingBottom: '2px',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', paddingBottom: '10px' }}>
          <select
            aria-label="팝업 진행 상태"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              padding: '8px 34px 8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #68754B',
              backgroundColor: '#f5f7f3',
              color: '#293323',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ONGOING">진행 중</option>
            <option value="UPCOMING">진행 예정</option>
            <option value="ENDED">종료된 팝업</option>
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '12px',
              pointerEvents: 'none',
              color: '#293323',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            ▾
          </span>
        </div>

        <div
          role="tablist"
          aria-label="팝업 카테고리"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {categories.map((value) => {
            const isActive = category === value
            const label = CATEGORY_LABELS[value] || value
            return (
              <button
                type="button"
                role="tab"
                key={value}
                aria-selected={isActive}
                onClick={() => setCategory(value)}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  padding: '10px 4px 12px',
                  fontSize: '15px',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#293323' : '#6b7280',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2.5px solid #68754B' : '2.5px solid transparent',
                  marginBottom: '-3px',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {word && !loading && !error && (
        <p className="card-sub" style={{ marginBottom: 12, color: '#4b5563' }}>
          검색 결과 <strong style={{ color: '#293323' }}>{matches.length}</strong>개
        </p>
      )}

      {loading ? (
        <div className="empty-state">팝업 목록을 불러오는 중이에요.</div>
      ) : error ? (
        <div className="empty-state" role="alert">
          {error}
        </div>
      ) : !matches.length ? (
        <div className="empty-state">조건에 맞는 팝업이 없어요.</div>
      ) : (
        <div className="grid-4">
          {matches.map((p) => (
            <PopupCard key={p.id} popup={p} />
          ))}
        </div>
      )}
    </div>
  )
}