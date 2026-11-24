import { useEffect, useId, useRef, useState } from 'react'
import './SearchablePopupSelect.css'

// 관리자 팝업 검색과 선택
export default function SearchablePopupSelect({
  label = '팝업 선택', popups, value, onChange, emptyLabel = '팝업을 선택하세요', disabled = false, allowEmpty = false,
}) {
  const id = useId()
  const trigger = useRef(null)
  const search = useRef(null)
  const root = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const expanded = open && !disabled
  const selected = popups.find(popup => String(popup.popId) === String(value))
  const term = query.trim().toLocaleLowerCase('ko-KR')
  const matches = popups.filter(popup =>
    [popup.title, popup.location].some(text => String(text ?? '').toLocaleLowerCase('ko-KR').includes(term))
  )

  useEffect(() => {
    if (!expanded) return
    search.current?.focus()
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [expanded])

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function select(nextValue) {
    onChange(nextValue)
    close()
  }

  return <div className="pq-popup-select" ref={root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onKeyDown={event => {
      if (expanded && event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }}>
    <span id={id + '-label'}>{label}</span>
    <button type="button" ref={trigger} disabled={disabled}
      aria-expanded={expanded} aria-controls={expanded ? id + '-options' : undefined}
      aria-labelledby={id + '-label ' + id + '-value'}
      onClick={() => { setQuery(''); setOpen(!expanded) }}>
      <span id={id + '-value'} title={selected?.title}>{selected?.title || emptyLabel}</span><span aria-hidden="true">▾</span>
    </button>
    {expanded && <div className="pq-popup-options" id={id + '-options'}>
      <input ref={search} type="search" aria-label="팝업 이름 또는 장소 검색"
        placeholder="팝업 이름 또는 장소 검색" value={query}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (term && matches.length === 1) select(String(matches[0].popId))
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            event.currentTarget.nextElementSibling?.querySelector('button')?.focus()
          }
        }} />
      <ul aria-label="검색된 팝업">
        {allowEmpty && !term && <li><button type="button" aria-current={!value ? 'true' : undefined} onClick={() => select('')}>{emptyLabel}</button></li>}
        {matches.map(popup => <li key={popup.popId}>
          <button type="button" aria-current={popup === selected ? 'true' : undefined} title={popup.title} onClick={() => select(String(popup.popId))}>{popup.title}</button>
        </li>)}
      </ul>
      {!matches.length && <p role="status">검색 결과가 없습니다.</p>}
    </div>}
  </div>
}
