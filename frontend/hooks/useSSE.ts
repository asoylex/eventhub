import { useEffect, useState } from 'react'

interface SSENotification {
  type: string
  message: string
  client: string
  email: string
  serviceDiscount: number
  productDiscount: number
  timestamp: string
}

export const useSSE = (enabled: boolean) => {
  const [notifications, setNotifications] = useState<SSENotification[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const url = `${process.env.NEXT_PUBLIC_API_URL}/notifications/stream`
    const eventSource = new EventSource(`${url}?token=${token}`)

    eventSource.addEventListener('notification', (e) => {
      const data = JSON.parse(e.data) as SSENotification
      setNotifications((prev) => [data, ...prev].slice(0, 20))
    })

    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)

    return () => eventSource.close()
  }, [enabled])

  return { notifications, connected }
}