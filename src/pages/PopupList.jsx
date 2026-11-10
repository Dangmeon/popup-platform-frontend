import React, { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PopupCard from '../components/common/PopupCard.jsx'
import { usePopups } from '../hooks/usePopups'
import { featuredPopups } from '../data/featuredPopups.js'

// 대소문자 구분 없이 포함 여부 확인
function has(value, kw){
  return String(value ?? '').toLowerCase().includes(kw)
}

export default function PopupList(){
  // 서버에서 팝업 목록 조회 (GET /api/popups)
  const { data, loading, error } = usePopups({})
  const popups = Array.isArray(data) ? data : []

  // 헤더 검색창에서 넘어온 검색어 (/popups?q=검색어)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [category, setCategory] = useState('전체')
  const [keyword, setKeyword] = useState(q)

  // 헤더에서 새로 검색할 때마다 입력창을 검색어로 맞춘다
  useEffect(() => {
    setKeyword(q)
  }, [q, location.key])

  const kw = keyword.trim().toLowerCase()

  // 서버 데이터에 있는 카테고리만 탭으로 만든다
  const categories = useMemo(() => {
    const set = new Set(popups.map(p => p.category).filter(Boolean))
    return ['전체', ...Array.from(set)]
  }, [popups])

  const filtered = popups.filter(p => {
    const matchCategory = category === '전체' || p.category === category
    const matchKeyword = !kw || has(p.title, kw) || has(p.location, kw)
    return matchCategory && matchKeyword
  })

  // 포스터 팝업(루피, 치이카와, GAL): 검색어가 있을 때만 결과에 포함
  const featuredMatches = useMemo(() => {
    if (!kw || category !== '전체') return []
    return featuredPopups.filter(f =>
      has(f.title, kw) || has(f.tag, kw) || has(f.location, kw)
    )
  }, [kw, category])

  const totalCount = filtered.length + featuredMatches.length

  return (
    <div className="container">
      <div className="page-title">팝업 탐색</div>

      <input
        placeholder="팝업명, 지역으로 검색"
        value={keyword}
        onChange={e=>setKeyword(e.target.value)}
        style={{ width:'100%', maxWidth:420, padding:'12px 18px', borderRadius:999, border:'1px solid var(--border)', marginBottom:20, outline:'none' }}
      />

      {kw && !loading && !error && (
        <p className="card-sub" style={{ marginBottom:12 }}>
          '{keyword.trim()}' 검색 결과 {totalCount}개
        </p>
      )}

      <div className="tabs" style={{ flexWrap:'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            className={'tab-btn'+(category===c?' active':'')}
            onClick={()=>setCategory(c)}
          >{c}</button>
        ))}
      </div>

      {/* 포스터 팝업 검색 결과 */}
      {featuredMatches.length > 0 && (
        <>
          <div className="section-title">✨ 추천 팝업</div>
          <div className="grid-4">
            {featuredMatches.map(f => (
              <Link
                key={f.id}
                to={`/popups/${f.id}`}
                style={{ display:'block', background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', boxShadow:'var(--shadow)' }}
              >
                <img
                  src={f.poster}
                  alt={f.title}
                  style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }}
                />
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ fontWeight:700 }}>{f.title}</div>
                  <div className="card-sub">{f.location}</div>
                  <div className="card-sub">{f.period}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <div className="empty-state">팝업 목록을 불러오는 중이에요</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : totalCount === 0 ? (
        <div className="empty-state">
          {kw ? '검색 결과가 없어요. 다른 단어로 검색해 보세요.' : '조건에 맞는 팝업이 없어요.'}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {featuredMatches.length > 0 && <div className="section-title">팝업 목록</div>}
          <div className="grid-4">
            {filtered.map(p => <PopupCard key={p.id} popup={p} />)}
          </div>
        </>
      ) : null}
    </div>
  )
}