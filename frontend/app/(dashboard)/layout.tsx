'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (user === null) return
    if (!['SALES', 'ADMIN'].includes(user.role)) {
      router.push('/confirm')
    }
  }, [user])

  return <>{children}</>
}