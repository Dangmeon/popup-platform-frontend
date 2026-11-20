import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { featuredPopups } from '../data/featuredPopups.js'
import { usePopups } from '../hooks/usePopups.js'
import { findAddress, loadNaverMaps, streetAddress } from '../utils/naverPopupMap.js'
import '../styles/NearbyPopups.css'

const areas = [
  ['전체', null],
  ['성수', /성동구|성수/],
  ['잠실', /송파구|잠실/],
  ['여의도', /여의도|여의대로/],
  ['홍대', /마포구|홍대/],
  ['강남', /강남구|압구정/],
]
const empty = []
const sdkKey = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim()

function PopupMap({ items, selected, onSelect }) {
  const host = useRef(null)
  const mapState = useRef(null)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!sdkKey) return

    let active = true
    let observer
    let map
    const markers = []
    const container = host.current
    setReady(false)
    setMessage('지도와 팝업 위치를 불러오는 중이에요.')

    async function showMap() {
      try {
        const maps = await loadNaverMaps(sdkKey)
        if (!active) return
        map = new maps.Map(container, {
          center: new maps.LatLng(37.5665, 126.978),
          zoom: 11,
          zoomControl: true,
          scrollwheel: false,
        })
        observer = new ResizeObserver(() => map.autoResize())
        observer.observe(container)
        const locations = new Map()
        const addresses = [...new Set(items.map(item => streetAddress(item.location)).filter(Boolean))]
        const coordinates = new Map()
        for (let i = 0; active && i < addresses.length; i += 5) {
          const results = await Promise.all(addresses.slice(i, i + 5).map(async address =>
            [address, await findAddress(maps, address)]
          ))
          for (const [address, point] of results) if (point) coordinates.set(address, point)
        }
        if (!active) return

        for (const item of items) {
          const point = coordinates.get(streetAddress(item.location))
          if (!point) continue
          locations.set(String(item.id), point)
        }
        for (const [address, point] of coordinates) {
          const atAddress = items.filter(item => streetAddress(item.location) === address)
          const marker = new maps.Marker({ map, position: point, title: atAddress.map(item => item.title).join(' · '), clickable: true })
          const select = () => onSelect(String(atAddress[0].id))
          const listener = maps.Event.addListener(marker, 'click', select)
          markers.push(() => {
            maps.Event.removeListener(listener)
            marker.setMap(null)
          })
        }
        if (coordinates.size > 1) map.fitBounds([...coordinates.values()], { top: 42, right: 42, bottom: 42, left: 42, maxZoom: 16 })
        if (coordinates.size === 1) {
          map.setCenter(coordinates.values().next().value)
          map.setZoom(16)
        }
        mapState.current = { map, locations }
        setReady(true)
        setMessage(locations.size === 0 ? '지도에서 찾은 팝업 위치가 없어요. 목록에서 주소를 확인해 주세요.' : locations.size === items.length ? '' : '일부 팝업의 위치를 찾지 못했어요. 목록에서 주소를 확인해 주세요.')
      } catch {
        if (active) setMessage('지도를 불러오지 못했어요.')
      }
    }
    showMap()
    return () => {
      active = false
      observer?.disconnect()
      markers.forEach(remove => remove())
      mapState.current = null
      map?.destroy()
    }
  }, [items, onSelect, retry])

  useEffect(() => {
    const state = mapState.current
    const point = state?.locations.get(selected)
    if (!ready || !point) return
    state.map.setZoom(16)
    state.map.panTo(point)
  }, [ready, selected])

  if (!sdkKey) return <div className="pq-map-empty">지도를 이용할 수 없어요. 목록에서 팝업 주소를 확인해 주세요.</div>

  return <div className="pq-map-panel">
    <div ref={host} className="pq-map" role="region" aria-label="팝업 위치 지도" />
    {message && <p className="pq-map-message" role="status">
      {message}
      {!ready && message === '지도를 불러오지 못했어요.' && <button type="button" onClick={() => setRetry(value => value + 1)}>다시 시도</button>}
    </p>}
  </div>
}

export default function NearbyPopups() {
  const [params, setParams] = useSearchParams()
  const requestedId = params.get('popup')
  const area = areas.some(([name]) => name === params.get('area')) ? params.get('area') : '전체'
  const [activeId, setActiveId] = useState(null)
  const { data = empty, loading, error } = usePopups()
  const items = useMemo(() => {
    const rule = areas.find(([name]) => name === area)?.[1]
    const rows = Array.isArray(data) ? data : empty
    const featured = featuredPopups.find(popup =>
      String(popup.id) === requestedId && !popup.isPromoDemo && popup.location)
    const known = featured && !rows.some(popup => String(popup.id) === requestedId)
      ? [featured, ...rows] : rows
    return known.filter(popup =>
      popup.location && (String(popup.id) === requestedId || !rule || rule.test(popup.location))
    )
  }, [area, data, requestedId])
  const selected = activeId ?? requestedId

  function selectArea(name) {
    setActiveId(null)
    setParams(name === '전체' ? {} : { area: name })
  }

  return <main className="container pq-nearby">
    <h1>주변 팝업</h1>
    <div className="pq-map-tabs" aria-label="팝업 지역">
      {areas.map(([name]) => <button key={name} type="button" aria-pressed={area === name} onClick={() => selectArea(name)}>{name}</button>)}
    </div>
    {loading ? <p role="status">팝업을 불러오는 중이에요.</p> : error && items.length === 0 ? <p role="alert">팝업 목록을 불러오지 못했어요.</p> : items.length === 0 ? <p>이 지역에서 표시할 팝업이 없어요.</p> : (
      <div className="pq-map-layout">
        <PopupMap items={items} selected={selected} onSelect={setActiveId} />
        <aside className="pq-map-list" aria-label="팝업 목록">
          {items.map(item => <article key={item.id} className={selected === String(item.id) ? 'pq-map-card selected' : 'pq-map-card'}>
            <button type="button" aria-pressed={selected === String(item.id)} onClick={() => setActiveId(String(item.id))}>
              <strong>{item.title}</strong>
              <span>{item.location}</span>
            </button>
            <Link to={'/popups/' + encodeURIComponent(item.id)}>팝업 상세 보기 →</Link>
          </article>)}
        </aside>
      </div>
    )}
  </main>
}
