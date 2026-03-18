import { useRef, useState, useEffect, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws`
const RECONNECT_MS = 2000

export function useWebSocket(onMessage) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    let reconnectTimer = null

    function connect() {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = window.setTimeout(connect, RECONNECT_MS)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (e) => {
        try { onMessageRef.current?.(JSON.parse(e.data)) } catch {}
      }

      wsRef.current = ws
    }

    connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      wsRef.current?.close()
    }
  }, [])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { connected, send }
}
