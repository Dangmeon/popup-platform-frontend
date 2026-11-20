import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../api/authToken.js'
import { connectTopics } from '../utils/stompConnection.js'

export function useRealtimeTopics(destinations, enabled, onChange) {
  const callback = useRef(onChange)
  useEffect(() => { callback.current = onChange }, [onChange])
  const key = [...new Set(destinations)].sort().join('|')
  const [connection, setConnection] = useState('offline')
  useEffect(() => {
    if (!enabled || !key) return
    const base = import.meta.env.VITE_API_BASE_URL
    if (!base) return
    let url
    try { url = new URL('/ws', base); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:' } catch { return }
    return connectTopics({url:url.href, destinations:key.split('|'), getToken:getAccessToken,
      onState:setConnection, onMessage:() => callback.current?.(), onConnected:() => callback.current?.()})
  }, [key, enabled])
  return enabled && key ? connection : 'offline'
}
