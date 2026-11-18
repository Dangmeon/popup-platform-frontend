// 이 서버의 STOMP 1.2 텍스트/JSON 구독 전용 클라이언트.
// 토큰은 URL에 넣지 않고 CONNECT 헤더로 전달합니다.
export function createFrameReader(onFrame) {
  let buffer = new Uint8Array(0)
  const decoder = new TextDecoder()
  return chunk => {
    const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk)
    const merged = new Uint8Array(buffer.length + bytes.length)
    merged.set(buffer); merged.set(bytes, buffer.length); buffer = merged
    if (buffer.length > 1024 * 1024) throw new Error('STOMP frame too large')
    while (buffer.length) {
      // 프레임 사이의 heartbeat를 제거합니다.
      let leading = 0
      while (buffer[leading] === 10 || buffer[leading] === 13) leading++
      buffer = buffer.slice(leading)
      if (!buffer.length) return
      let headerEnd = -1, separatorSize = 2
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 10 && buffer[i + 1] === 10) { headerEnd = i; break }
        if (buffer[i] === 13 && buffer[i + 1] === 10 && buffer[i + 2] === 13 && buffer[i + 3] === 10) { headerEnd = i; separatorSize = 4; break }
      }
      if (headerEnd < 0) return
      const [command, ...lines] = decoder.decode(buffer.slice(0, headerEnd)).split(/\r?\n/)
      const headers = Object.create(null)
      for (const line of lines) {
        const colon = line.indexOf(':')
        if (colon > 0) {
          const key = line.slice(0, colon)
          if (!(key in headers)) headers[key] = line.slice(colon + 1).replace(/\\([nrc\\])/g, (_, c) => ({n:'\n',r:'\r',c:':','\\':'\\'})[c])
        }
      }
      const start = headerEnd + separatorSize
      let end
      if ('content-length' in headers) {
        if (!/^\d+$/.test(headers['content-length'])) throw new Error('Invalid STOMP length')
        const length = Number(headers['content-length'])
        if (!Number.isSafeInteger(length) || length > 1024 * 1024) throw new Error('Invalid STOMP length')
        end = start + length
        if (buffer.length <= end) return
        if (buffer[end] !== 0) throw new Error('Invalid STOMP terminator')
      } else {
        end = buffer.indexOf(0, start)
        if (end < 0) return
      }
      const body = decoder.decode(buffer.slice(start, end))
      buffer = buffer.slice(end + 1)
      onFrame({command, headers, body})
    }
  }
}

export function connectTopics({ url, destinations, getToken, onMessage, onConnected, onState, WebSocketImpl = globalThis.WebSocket, retryMs = 5000 }) {
  let stopped = false, socket, retryTimer, timeout, heartbeat
  const topics = [...new Set(destinations)].filter(value => /^\/topic\/(?:timeSlot|waitings)\/[1-9]\d*$/.test(value))
  const state = value => { if (!stopped) onState?.(value) }
  function clearTimers() { clearTimeout(timeout); clearInterval(heartbeat) }
  function start() {
    if (stopped || !topics.length) return
    const token = getToken()
    if (!token) { state('offline'); return }
    state('connecting')
    try { socket = new WebSocketImpl(url, ['v12.stomp']) }
    catch { state('offline'); retryTimer = setTimeout(start, retryMs); return }
    const current = socket
    current.binaryType = 'arraybuffer'
    let connected = false
    const send = frame => { if (current.readyState === 1) current.send(frame) }
    const read = createFrameReader(frame => {
      if (stopped || socket !== current) return
      if (frame.command === 'CONNECTED' && !connected) {
        connected = true; clearTimeout(timeout)
        topics.forEach((topic, index) => send(`SUBSCRIBE\nid:sub-${index}\ndestination:${topic}\nack:auto\n\n\0`))
        state('live'); onConnected?.()
        heartbeat = setInterval(() => send('\n'), 15000)
      } else if (frame.command === 'MESSAGE' && connected && topics.includes(frame.headers.destination)) {
        // 메시지는 변경 신호로만 사용하고 실제 상태는 인증된 REST로 재조회합니다.
        onMessage?.(frame.headers.destination)
      } else if (frame.command === 'ERROR') current.close()
    })
    timeout = setTimeout(() => current.close(), 10000)
    current.onopen = () => {
      if (stopped) { current.close(); return }
      send(`CONNECT\naccept-version:1.2\nhost:${new URL(url).host}\nheart-beat:0,0\nAuthorization:Bearer ${token}\n\n\0`)
    }
    current.onmessage = event => { try { read(event.data) } catch { current.close() } }
    current.onerror = () => current.close()
    current.onclose = () => {
      clearTimers()
      if (!stopped) { state('offline'); retryTimer = setTimeout(start, retryMs) }
    }
  }
  start()
  return () => { stopped = true; clearTimeout(retryTimer); clearTimers(); socket?.close() }
}
