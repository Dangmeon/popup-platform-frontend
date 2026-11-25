import { useEffect, useRef, useState } from 'react'
import http from '../../api/axiosInstance.js'
import { errorText, rows } from '../../api/admin/liveUtils.js'
import './PopupSlotManager.css'

const slotFields = [
  ['slotNum', '회차 번호', 'number'], ['slotDate', '운영 날짜', 'date'],
  ['startTime', '시작 시간', 'time'], ['endTime', '종료 시간', 'time'],
  ['capacity', '정원', 'number'],
]
const generateFields = [
  ['startDate', '시작일', 'date'], ['endDate', '종료일', 'date'],
  ['startTime', '시작 시간', 'time'], ['endTime', '종료 시간', 'time'],
  ['intervalMinutes', '회차 간격(분)', 'number', 30], ['breakMinutes', '휴식 시간(분)', 'number', 0],
  ['lunchStart', '점심 시작', 'time'], ['lunchEnd', '점심 종료', 'time'], ['capacity', '정원', 'number'],
]
const blankSlot = { slotNum: 1, slotDate: '', startTime: '', endTime: '', capacity: '' }

// 취소·만료 예약을 포함한 회차 이력 확인
function hasSlotHistory(slot) {
  return slot.hasReservationHistory === true || slot.reservedCount > 0
}

export default function PopupSlotManager({ popId, refresh = 0, onBusyChange }) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState(null)
  const [listError, setListError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState(null)
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const popupPath = '/api/admin/popups/' + popId + '/slots'

  // 날짜별 회차 목록 조회
  useEffect(() => {
    const controller = new AbortController()
    setSlots(null)
    setListError('')
    http.get('/api/popups/' + popId + '/slots', {
      params: { date: date || undefined }, signal: controller.signal,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setSlots(rows(data))
    }).catch(error => {
      if (!controller.signal.aborted) setListError(errorText(error))
    })
    return () => controller.abort()
  }, [date, popId, refresh, retry])

  // 회차 조회 및 저장 요청
  async function run(action) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (error) {
      setError(errorText(error))
    } finally {
      lock.current = false
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  function viewSlot(id) {
    run(async () => {
      const { data } = await http.get('/api/slots/' + id)
      setEditor({ type: 'edit', id, values: data })
    })
  }

  function save(event) {
    event.preventDefault()
    const generate = editor.type === 'generate'
    const fields = generate ? generateFields : slotFields
    const payload = Object.fromEntries(fields.flatMap(([key, , type]) => {
      const value = editor.values[key]
      if (value == null || value === '') return []
      return [[key, type === 'number' ? Number(value) : type === 'time' ? value.slice(0, 5) : value]]
    }))
    run(async () => {
      if (generate) {
        const { data } = await http.post(popupPath + '/generate', payload)
        setNotice(data.createdCount + '개 회차를 생성했습니다.')
      } else if (editor.type === 'edit') {
        await http.put('/api/admin/slots/' + editor.id, payload)
        setNotice('회차를 수정했습니다.')
      } else {
        await http.post(popupPath, payload)
        setNotice('회차를 등록했습니다.')
      }
      setEditor(null)
      setRetry(value => value + 1)
    })
  }

  function remove(slot, cancel) {
    const message = cancel ? '회차를 취소하면 연결된 예약도 취소됩니다. 계속하시겠습니까?' : '이 회차를 삭제하시겠습니까?'
    if (!window.confirm(message)) return
    run(async () => {
      const path = '/api/admin/slots/' + slot.timeSlotId
      if (cancel) await http.patch(path + '/cancel')
      else await http.delete(path)
      setNotice(cancel ? '회차를 취소했습니다.' : '회차를 삭제했습니다.')
      setEditor(null)
      setRetry(value => value + 1)
    })
  }

  // 같은 운영일의 회차를 시간순으로 표시
  const groups = new Map()
  const orderedSlots = [...(slots ?? [])].sort((a, b) =>
    a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime)
  )
  for (const slot of orderedSlots) {
    if (!groups.has(slot.slotDate)) groups.set(slot.slotDate, [])
    groups.get(slot.slotDate).push(slot)
  }

  // 회차 목록과 입력 폼
  const buttonClass = 'pq-slot-button'
  return <section className="pq-slot-manager" aria-busy={busy || (!slots && !listError)}>
    <div className="pq-slot-toolbar">
      <label>조회 날짜 <input type="date" value={date} disabled={busy} onChange={event => setDate(event.target.value)} /></label>
      <div className="pq-slot-actions">
        {date && <button className={buttonClass} type="button" disabled={busy} onClick={() => setDate('')}>전체 날짜</button>}
        <button className={buttonClass + ' pq-slot-primary'} type="button" disabled={busy || Boolean(editor)} onClick={() => setEditor({ type: 'create', values: { ...blankSlot, slotDate: date } })}>회차 등록</button>
      <button className={buttonClass} type="button" disabled={busy || Boolean(editor)} onClick={() => setEditor({ type: 'generate', values: {} })}>자동 생성</button>
      </div>
    </div>
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {editor && <form onSubmit={save}>
      <h4>{editor.type === 'generate' ? '회차 자동 생성' : editor.type === 'edit' ? '회차 상세·수정' : '회차 등록'}</h4>
      {editor.type === 'generate' && <p>비워 둔 항목은 팝업 설정을 사용합니다.</p>}
      {editor.type === 'edit' && <p>예약 {editor.values.reservedCount} / {editor.values.capacity}명 · {editor.values.slotStatus === 'CANCELLED' ? '취소' : '운영'}</p>}
      {editor.type === 'edit' && hasSlotHistory(editor.values) && <p>예약 이력이 있어 정원만 수정할 수 있습니다.</p>}
      <div className="pq-slot-fields">
        {(editor.type === 'generate' ? generateFields : slotFields).map(([key, label, type, min = 1]) => {
          const value = editor.values[key] ?? ''
          const history = editor.type === 'edit' && hasSlotHistory(editor.values)
          return <label key={key}>{label}<input type={type} min={type === 'number' ? (key === 'capacity' && history ? Math.max(min, editor.values.reservedCount ?? 0) : min) : undefined}
            required={editor.type !== 'generate'} readOnly={history && key !== 'capacity'}
            value={type === 'time' ? value.slice(0, 5) : value} disabled={busy}
            onChange={event => setEditor(previous => ({ ...previous, values: { ...previous.values, [key]: event.target.value } }))} /></label>
        })}
      </div>
      <div className="pq-slot-actions">
        <button className={buttonClass + ' pq-slot-primary'} type="submit" disabled={busy || editor.values.slotStatus === 'CANCELLED'}>저장</button>
        <button className={buttonClass} type="button" disabled={busy} onClick={() => setEditor(null)}>닫기</button>
      </div>
    </form>}
    {listError ? <p role="alert">{listError} <button className={buttonClass} type="button" onClick={() => setRetry(value => value + 1)}>다시 조회</button></p>
      : !slots ? <p role="status">회차를 불러오고 있어요.</p> : !slots.length ? <p>등록된 회차가 없습니다.</p>
      : <div className="pq-slot-agenda">
        {[...groups].map(([day, daySlots]) => <section className="pq-slot-day" key={day} aria-label={day + ' 회차'}>
          <header><h4><time dateTime={day}>{day.replaceAll('-', '. ')}</time></h4><span>{daySlots.length}개 회차</span></header>
          <ul className="pq-slot-list">{daySlots.map(slot => (
            <li key={slot.timeSlotId} className="pq-slot-row">
              <div className="pq-slot-time">
                <span>{slot.slotNum}회차</span>
                <strong>{slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}</strong>
              </div>
              <div className="pq-slot-capacity">
                <span>예약 <strong>{slot.reservedCount}/{slot.capacity}명</strong></span>
                <span className="pq-slot-status" data-cancelled={slot.slotStatus === 'CANCELLED'}>
                  {slot.slotStatus === 'CANCELLED' ? '취소됨' : slot.slotStatus === 'OPEN' ? '운영' : '—'}
                </span>
              </div>
              <div className="pq-slot-actions">
                <button className={buttonClass} type="button" disabled={busy || Boolean(editor)} onClick={() => viewSlot(slot.timeSlotId)}>상세 보기</button>
                <button className={buttonClass + ' pq-slot-danger'} type="button" disabled={busy || Boolean(editor) || hasSlotHistory(slot)}
                  title={hasSlotHistory(slot) ? '예약 이력이 있는 회차는 삭제할 수 없습니다.' : undefined} onClick={() => remove(slot, false)}>삭제</button>
                <button className={buttonClass + ' pq-slot-danger'} type="button" disabled={busy || Boolean(editor) || slot.slotStatus === 'CANCELLED'} onClick={() => remove(slot, true)}>회차 취소</button>
              </div>
            </li>
          ))}</ul>
        </section>)}
      </div>}
  </section>
}
