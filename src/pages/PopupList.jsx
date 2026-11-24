import { useEffect, useMemo, useState } from 'react'
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

function resolvePopupStage(popup, now) {
  const rawStatus = String(
    popup?.stage ?? popup?.status ?? popup?.popupStatus ?? popup?.state ?? ''
  )
    .trim()
    .toUpperCase()

  if (['ONGOING', 'OPEN', 'ACTIVE', 'RUNNING', '진행 중', '진행중'].includes(rawStatus)) {
    return 'ONGOING'
  }
  if (['UPCOMING', 'SCHEDULED', 'READY', '진행 예정', '진행예정'].includes(rawStatus)) {
    return 'UPCOMING'
  }
  if (['ENDED', 'CLOSED', 'FINISHED', '종료', '종료된 팝업'].includes(rawStatus)) {
    return 'ENDED'
  }

  const fromUtil = getPopupStage(popup, now)
  if (fromUtil === 'ONGOING' || fromUtil === 'UPCOMING' || fromUtil === 'ENDED') {
    return fromUtil
  }

  return 'ONGOING'
}

function resolveCategoryKey(popup) {
  const raw = String(
    popup?.category ?? popup?.categoryName ?? popup?.categoryCode ?? popup?.genre ?? ''
  ).trim()
  if (!raw) return ''

  const upper = raw.toUpperCase()
  if (CATEGORY_LABELS[upper]) return upper

  const matchedEntry = Object.entries(CATEGORY_LABELS).find(([, label]) => label === raw)
  if (matchedEntry) return matchedEntry[0]

  return raw
}

export default function PopupList() {
  const { data, loading, error } = usePopups({})
  const location = useLocation()
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [keyword, setKeyword] = useState(q)
  const [category, setCategory] = useState('전체')
  const [stage, setStage] = useState('ALL')
  const [now, setNow] = useState(Date.now)

  useEffect(() => setKeyword(q), [q, location.key])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const popups = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const categories = useMemo(() => {
    const extraCategories = [
      ...new Set(popups.map((p) => resolveCategoryKey(p)).filter(Boolean)),
    ].filter(
      (c) => !DEFAULT_CATEGORIES.includes(c) && !Object.values(CATEGORY_LABELS).includes(c)
    )
    return [...DEFAULT_CATEGORIES, ...extraCategories]
  }, [popups])

  const matches = useMemo(() => {
    const word = keyword.trim().toLowerCase()
    const selectedCatKey = category === '전체' ? '전체' : resolveCategoryKey({ category })

    return popups.filter((p) => {
      const itemCatKey = resolveCategoryKey(p)
      const matchCat =
        category === '전체' ||
        itemCatKey === selectedCatKey ||
        String(p.category || '').trim() === category

      const matchWord =
        !word || `${p.title || ''} ${p.location || ''}`.toLowerCase().includes(word)

      const matchStage = stage === 'ALL' || resolvePopupStage(p, now) === stage

      return matchCat && matchWord && matchStage
    })
  }, [popups, category, keyword, stage, now])

  const resetFilters = () => {
    setKeyword('')
    setCategory('전체')
    setStage('ALL')
  }

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
            border: '1px solid #cfd6c9',
            backgroundColor: '#fafbf9',
            color: '#293323',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* 상단 필터 바: [ 전체 상태 ▾ ] + 밑줄 카테고리 탭 (#68754B / #293323 통일) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          flexWrap: 'wrap',
          minHeight: '48px',
          marginBottom: '24px',
          boxShadow: 'inset 0 -1px 0 #e5e8eb',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            height: '48px',
            flexShrink: 0,
          }}
        >
          <select
            aria-label="팝업 진행 상태"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              height: '38px',
              padding: '0 32px 0 14px',
              borderRadius: '10px',
              border: '1.5px solid #68754B',
              backgroundColor: '#eef2ea',
              color: '#293323',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: '35px',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="ALL">전체 상태</option>
            <option value="ONGOING">진행 중</option>
            <option value="UPCOMING">진행 예정</option>
            <option value="ENDED">종료된 팝업</option>
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#293323',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: 1,
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
            height: '48px',
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
                  background: isActive ? '#eef2ea' : 'none',
                  border: 'none',
                  height: '48px',
                  padding: '0 10px',
                  borderRadius: '8px 8px 0 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '15px',
                  lineHeight: 1,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#293323' : '#6b7280',
                  cursor: 'pointer',
                  boxShadow: isActive ? 'inset 0 -2.5px 0 #68754B' : 'none',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {!loading && !error && (
        <p className="card-sub" style={{ marginBottom: 14, color: '#4b5563' }}>
          조회 결과 <strong style={{ color: '#293323' }}>{matches.length}</strong>개
        </p>
      )}

      {loading ? (
        <div className="empty-state" style={{ color: '#293323' }}>
          팝업 목록을 불러오는 중이에요.
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          {error}
        </div>
      ) : !matches.length ? (
        <div className="empty-state" style={{ color: '#4b5563' }}>
          조건에 맞는 팝업이 없어요.
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #68754B',
                backgroundColor: '#68754B',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              필터 초기화
            </button>
          </div>
        </div>
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