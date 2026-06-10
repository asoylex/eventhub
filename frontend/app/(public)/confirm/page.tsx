'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConfirmStore } from '@/store/confirmStore'
import { useAuthStore } from '@/store/authStore'
import StepPersonalInfo from '@/components/confirm/StepPersonalInfo'
import StepSelectItems from '@/components/confirm/StepSelectItems'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

export default function ConfirmPage() {
  const router = useRouter()
  const { currentStep, selectedItems, attendanceDate, reset, serviceDiscount, productDiscount, totalServices, totalProducts } = useConfirmStore()
  const { initialize, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [confirmData, setConfirmData] = useState<any>(null)

useEffect(() => {
  initialize()
  // Si no hay token, redirige al login
  const token = localStorage.getItem('accessToken')
  if (!token) {
    router.push('/login')
  }
}, [])
  const handleConfirm = async () => {
    if (selectedItems.length === 0) return
    setIsLoading(true)
    setError('')

    try {
      const { data } = await api.post('/registrations', {
        attendanceDate: new Date(attendanceDate).toISOString(),
        itemIds: selectedItems.map((i) => i.id),
      })
      setConfirmData(data.data)
      setConfirmed(true)
      reset()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al confirmar asistencia'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (confirmed && confirmData) {
    return <SuccessScreen data={confirmData} onLogout={async () => { await logout(); router.push('/login') }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EventHub</h1>
          <p className="text-gray-400 text-xs">Feria de Promociones 2025</p>
        </div>
        <button
          onClick={async () => { await logout(); router.push('/login') }}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          <StepIndicator number={1} label="Ingresa tu información" active={currentStep === 1} done={currentStep === 2} />
          <div className="flex-1 h-px bg-gray-200" />
          <StepIndicator number={2} label="Seleccione Servicios y Productos" active={currentStep === 2} done={false} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {currentStep === 1 && <StepPersonalInfo />}
          {currentStep === 2 && <StepSelectItems onSubmit={handleConfirm} isLoading={isLoading} />}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-6">
        Atención al cliente: 2223-2425
      </footer>
    </div>
  )
}

function StepIndicator({ number, label, active, done }: {
  number: number; label: string; active: boolean; done: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        done ? 'bg-green-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {done ? '✓' : number}
      </div>
      <span className={`text-sm font-medium hidden sm:block ${active ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}

function SuccessScreen({ data, onLogout }: { data: any; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Asistencia confirmada!</h2>
        <p className="text-gray-500 mb-6">Te esperamos en el evento</p>

        <div className="text-left space-y-3 mb-6">
          {data.serviceDiscount > 0 && (
            <div className="flex justify-between items-center rounded-lg bg-blue-50 px-4 py-3">
              <span className="text-sm text-blue-700 font-medium">Descuento en Servicios</span>
              <span className="font-bold text-blue-700">{data.serviceDiscount}%</span>
            </div>
          )}
          {data.productDiscount > 0 && (
            <div className="flex justify-between items-center rounded-lg bg-green-50 px-4 py-3">
              <span className="text-sm text-green-700 font-medium">Descuento en Productos</span>
              <span className="font-bold text-green-700">{data.productDiscount}%</span>
            </div>
          )}
          <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items seleccionados</p>
            {data.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-gray-500">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Finalizar
        </button>
      </div>
    </div>
  )
}