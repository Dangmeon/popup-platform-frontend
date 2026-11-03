import React, { useState, useMemo } from 'react'
import PopupCard from '../components/common/PopupCard.jsx'
import { usePopups } from '../hooks/usePopups'

export default function PopupList(){
  // 서버에서 팝업 목록 조회 (GET /api/popups)
  const { data, loading, error } = usePopups({})
  const popups = Array.isArray(data) ? data : []

  const [category, setCategory] = useState('전체')
  const [keyword, setKeyword] = useState('')

  // 서버 데이터에 있는 카테고리만 탭으로 만든다
  const categories = useMemo(() => {
    const set = new Set(popups.map(p => p.category).filter(Boolean))
    return ['전체', ...Array.from(set)]
  }, [popups])

  const filtered = popups.filter(p => {
    const matchCategory = category === '전체' || p.category === category
    const matchKeyword =
      !keyword ||
      (p.title ?? '').includes(keyword) ||
      (p.location ?? '').includes(keyword)
    return matchCategory && matchKeyword
  })

  return (
    <div className="container">
      <div className="page-title">팝업 탐색</div>

      <input
        placeholder="팝업명, 지역으로 검색"
        value={keyword}
        onChange={e=>setKeyword(e.target.value)}
        style={{ width:'100%', maxWidth:420, padding:'12px 18px', borderRadius:999, border:'1px solid var(--border)', marginBottom:20, outline:'none' }}
      />

      <div className="tabs" style={{ flexWrap:'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            className={'tab-btn'+(category===c?' active':'')}
            onClick={()=>setCategory(c)}
          >{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">팝업 목록을 불러오는 중이에요</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">조건에 맞는 팝업이 없어요.</div>
      ) : (
        <div className="grid-4">
          {filtered.map(p => <PopupCard key={p.id} popup={p} />)}
        </div>
      )}
    </div>
  )
}