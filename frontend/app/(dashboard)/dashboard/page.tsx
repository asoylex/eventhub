'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'


interface RegistrationSummary {
    id: string
    attendanceDate: string
    serviceDiscount: number
    productDiscount: number
    totalServices: number
    totalProducts: number
    status: string
    createdAt: string
    user: { firstName: string; lastName: string; email: string }
    items: Array<{ catalogItem: { name: string; type: string; price: number } }>
    event: { name: string }
}

export default function DashboardPage() {
    const router = useRouter()
    const { user, logout, initialize } = useAuthStore()
    const [registrations, setRegistrations] = useState<RegistrationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [eventInfo, setEventInfo] = useState<any>(null)
    const { notifications: liveNotifications, connected } = useSSE(true)


    useEffect(() => {
        initialize()
    }, [])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [regRes, eventRes] = await Promise.all([
                api.get('/registrations'),
                api.get('/events/active'),
            ])
            setRegistrations(regRes.data.data)
            setEventInfo(eventRes.data.data)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-lg">EventHub</h1>
                    <p className="text-gray-400 text-xs">Panel de Ventas</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-300">{user?.firstName} {user?.lastName}</span>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
                        Cerrar sesión
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-400">
                        {connected ? 'En vivo' : 'Desconectado'}
                    </span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">
                {liveNotifications.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <h2 className="font-semibold text-gray-900">Notificaciones en vivo</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {liveNotifications.map((notif, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            🔔 {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400">{notif.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {notif.serviceDiscount > 0 && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                Servicios {notif.serviceDiscount}%
                                            </span>
                                        )}
                                        {notif.productDiscount > 0 && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                Productos {notif.productDiscount}%
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(notif.timestamp).toLocaleTimeString('es-GT')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Stats */}
                {eventInfo && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Confirmados" value={eventInfo.confirmedCount} color="indigo" />
                        <StatCard label="Cupo disponible" value={eventInfo.spotsAvailable} color="green" />
                        <StatCard
                            label="Capacidad total"
                            value={eventInfo.capacity}
                            color="gray"
                            badge={eventInfo.isFull ? 'LLENO' : undefined}
                        />
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Confirmaciones de asistencia</h2>
                        <button
                            onClick={fetchData}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            Actualizar
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Cargando...</div>
                    ) : registrations.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No hay confirmaciones aún</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Cliente</th>
                                        <th className="px-6 py-3 text-left">Items</th>
                                        <th className="px-6 py-3 text-left">Descuentos</th>
                                        <th className="px-6 py-3 text-left">Totales</th>
                                        <th className="px-6 py-3 text-left">Fecha confirmación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {registrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {reg.user.firstName} {reg.user.lastName}
                                                </p>
                                                <p className="text-gray-400 text-xs">{reg.user.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {reg.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.catalogItem.type === 'SERVICE'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                                }`}>
                                                                {item.catalogItem.type === 'SERVICE' ? 'S' : 'P'}
                                                            </span>
                                                            <span className="text-gray-700 text-xs">{item.catalogItem.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {Number(reg.serviceDiscount) > 0 && (
                                                        <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                            Servicios: {reg.serviceDiscount}%
                                                        </span>
                                                    )}
                                                    {Number(reg.productDiscount) > 0 && (
                                                        <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                            Productos: {reg.productDiscount}%
                                                        </span>
                                                    )}
                                                    {Number(reg.serviceDiscount) === 0 && Number(reg.productDiscount) === 0 && (
                                                        <span className="text-gray-400 text-xs">Sin descuento</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {Number(reg.totalServices) > 0 && (
                                                    <p className="text-xs text-gray-600">Servicios: {formatCurrency(Number(reg.totalServices))}</p>
                                                )}
                                                {Number(reg.totalProducts) > 0 && (
                                                    <p className="text-xs text-gray-600">Productos: {formatCurrency(Number(reg.totalProducts))}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {new Date(reg.createdAt).toLocaleDateString('es-GT', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function StatCard({ label, value, color, badge }: {
    label: string; value: number; color: string; badge?: string
}) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-700',
        green: 'bg-green-50 text-green-700',
        gray: 'bg-gray-50 text-gray-700',
    }

    return (
        <div className={`rounded-2xl p-6 ${colors[color]}`}>
            <p className="text-sm font-medium opacity-75">{label}</p>
            <div className="flex items-end gap-2 mt-1">
                <p className="text-3xl font-bold">{value}</p>
                {badge && (
                    <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded mb-1">
                        {badge}
                    </span>
                )}
            </div>
        </div>
    )
}