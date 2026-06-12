'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import EventEditor from '@/components/dashboard/EventEditor'
import CreateEventModal from '@/components/dashboard/CreateEventModal'

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

interface EventInfo {
    id: string
    name: string
    description: string | null
    capacity: number
    confirmedCount: number
    spotsAvailable: number
    isFull: boolean
    eventDate: string
    isActive: boolean
}

// Calcula el total final con descuento aplicado
function calcTotals(reg: RegistrationSummary) {
    const totalServices = Number(reg.totalServices)
    const totalProducts = Number(reg.totalProducts)
    const serviceDiscount = Number(reg.serviceDiscount)
    const productDiscount = Number(reg.productDiscount)

    const discountedServices = totalServices - (totalServices * serviceDiscount) / 100
    const discountedProducts = totalProducts - (totalProducts * productDiscount) / 100
    const totalFinal = discountedServices + discountedProducts
    const totalSaved = (totalServices + totalProducts) - totalFinal

    return { totalServices, totalProducts, serviceDiscount, productDiscount, discountedServices, discountedProducts, totalFinal, totalSaved }
}

export default function DashboardPage() {
    const router = useRouter()
    const { user, logout, initialize } = useAuthStore()
    const [registrations, setRegistrations] = useState<RegistrationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
    const [allEvents, setAllEvents] = useState<EventInfo[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null)
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const { notifications: liveNotifications, connected } = useSSE(true)
    const isAdmin = user?.role === 'ADMIN'

    useEffect(() => {
        initialize()
    }, [])

    useEffect(() => {
        if (user === null) return
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [regRes, eventRes] = await Promise.all([
                api.get('/registrations'),
                api.get('/events/active'),
            ])
            setRegistrations(regRes.data.data)
            setEventInfo(eventRes.data.data)

            try {
                const allEventsRes = await api.get('/events')
                setAllEvents(allEventsRes.data.data)
                setSelectedEvent(eventRes.data.data)
            } catch {
                // No es admin
            }
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
            <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-lg">EventHub</h1>
                    <p className="text-gray-400 text-xs">Panel de Ventas</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-400">
                            {connected ? 'En vivo' : 'Desconectado'}
                        </span>
                    </div>
                    <span className="text-sm text-gray-300">{user?.firstName} {user?.lastName}</span>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">

                {/* ADMIN */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {allEvents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No hay eventos</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {allEvents.map((ev) => (
                                    <div
                                        key={ev.id}
                                        onClick={() => setSelectedEvent(ev)}
                                        className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${selectedEvent?.id === ev.id ? 'bg-indigo-50' : ''
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900">{ev.name}</p>
                                                {ev.isActive && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        Activo
                                                    </span>
                                                )}
                                                {selectedEvent?.id === ev.id && (
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                        Editando
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(ev.eventDate).toLocaleDateString('es-GT', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>{ev.confirmedCount} / {ev.capacity} confirmados</span>
                                            <span className="text-indigo-600 font-medium">Editar</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ADMIN */}
                {isAdmin && selectedEvent && (
                    <EventEditor event={selectedEvent} onUpdated={fetchData} />
                )}

                {/* Notificaciones en vivo */}
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
                                        <p className="text-sm font-medium text-gray-900">{notif.message}</p>
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

                {/* Tabla de registros */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">Confirmaciones de asistencia</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Haz clic en una fila para ver el desglose completo
                            </p>
                        </div>
                        <button onClick={fetchData} className="text-sm text-indigo-600 hover:underline">
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
                                        <th className="px-6 py-3 text-right">Subtotal</th>
                                        <th className="px-6 py-3 text-right">Ahorro</th>
                                        <th className="px-6 py-3 text-right">Total final</th>
                                        <th className="px-6 py-3 text-left">Confirmado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {registrations.map((reg) => {
                                        const t = calcTotals(reg)
                                        const isExpanded = expandedRow === reg.id
                                        const services = reg.items.filter(i => i.catalogItem.type === 'SERVICE')
                                        const products = reg.items.filter(i => i.catalogItem.type === 'PRODUCT')

                                        return (
                                            <>
                                                <tr
                                                    key={reg.id}
                                                    onClick={() => setExpandedRow(isExpanded ? null : reg.id)}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-900">
                                                            {reg.user.firstName} {reg.user.lastName}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">{reg.user.email}</p>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2 flex-wrap">
                                                            {services.length > 0 && (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                    {services.length} servicio{services.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {products.length > 0 && (
                                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                                    {products.length} producto{products.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {reg.items.length} item{reg.items.length > 1 ? 's' : ''} en total
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {t.serviceDiscount > 0 ? (
                                                                <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                                    Servicios -{t.serviceDiscount}%
                                                                </span>
                                                            ) : null}
                                                            {t.productDiscount > 0 ? (
                                                                <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                                                                    Productos -{t.productDiscount}%
                                                                </span>
                                                            ) : null}
                                                            {t.serviceDiscount === 0 && t.productDiscount === 0 && (
                                                                <span className="text-gray-400 text-xs">Sin descuento</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-xs text-gray-500">
                                                            {formatCurrency(t.totalServices + t.totalProducts)}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        {t.totalSaved > 0 ? (
                                                            <p className="text-xs font-medium text-green-600">
                                                                -{formatCurrency(t.totalSaved)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">-</p>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {formatCurrency(t.totalFinal)}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(reg.createdAt).toLocaleDateString('es-GT', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(reg.createdAt).toLocaleTimeString('es-GT', {
                                                                hour: '2-digit', minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr key={`${reg.id}-expanded`} className="bg-gray-50">
                                                        <td colSpan={7} className="px-6 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                                {services.length > 0 && (
                                                                    <div className="rounded-xl border border-blue-100 bg-white overflow-hidden">
                                                                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                                                                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                                                                Servicios
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-4 space-y-2">
                                                                            {services.map((item, i) => (
                                                                                <div key={i} className="flex justify-between text-xs">
                                                                                    <span className="text-gray-700">{item.catalogItem.name}</span>
                                                                                    <span className="text-gray-500 font-medium">
                                                                                        {formatCurrency(Number(item.catalogItem.price))}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500">Subtotal servicios</span>
                                                                                    <span className="text-gray-700">{formatCurrency(t.totalServices)}</span>
                                                                                </div>
                                                                                {t.serviceDiscount > 0 && (
                                                                                    <>
                                                                                        <div className="flex justify-between text-xs">
                                                                                            <span className="text-blue-600">Descuento ({t.serviceDiscount}%)</span>
                                                                                            <span className="text-blue-600">
                                                                                                -{formatCurrency(t.totalServices * t.serviceDiscount / 100)}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-xs font-semibold">
                                                                                            <span className="text-gray-900">Total servicios</span>
                                                                                            <span className="text-gray-900">{formatCurrency(t.discountedServices)}</span>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {products.length > 0 && (
                                                                    <div className="rounded-xl border border-purple-100 bg-white overflow-hidden">
                                                                        <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
                                                                            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                                                                Productos
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-4 space-y-2">
                                                                            {products.map((item, i) => (
                                                                                <div key={i} className="flex justify-between text-xs">
                                                                                    <span className="text-gray-700">{item.catalogItem.name}</span>
                                                                                    <span className="text-gray-500 font-medium">
                                                                                        {formatCurrency(Number(item.catalogItem.price))}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500">Subtotal productos</span>
                                                                                    <span className="text-gray-700">{formatCurrency(t.totalProducts)}</span>
                                                                                </div>
                                                                                {t.productDiscount > 0 && (
                                                                                    <>
                                                                                        <div className="flex justify-between text-xs">
                                                                                            <span className="text-green-600">Descuento ({t.productDiscount}%)</span>
                                                                                            <span className="text-green-600">
                                                                                                -{formatCurrency(t.totalProducts * t.productDiscount / 100)}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-xs font-semibold">
                                                                                            <span className="text-gray-900">Total productos</span>
                                                                                            <span className="text-gray-900">{formatCurrency(t.discountedProducts)}</span>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
                                                                <div className="px-4 py-2 bg-gray-900 border-b border-gray-700">
                                                                    <p className="text-xs font-semibold text-white uppercase tracking-wide">
                                                                        Resumen del portafolio
                                                                    </p>
                                                                </div>
                                                                <div className="p-4 space-y-2">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-gray-500">Subtotal bruto</span>
                                                                        <span className="text-gray-700">
                                                                            {formatCurrency(t.totalServices + t.totalProducts)}
                                                                        </span>
                                                                    </div>
                                                                    {t.totalSaved > 0 && (
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-green-600">Total ahorrado</span>
                                                                            <span className="text-green-600 font-medium">
                                                                                -{formatCurrency(t.totalSaved)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                                                                        <span className="text-sm font-bold text-gray-900">Total a pagar</span>
                                                                        <span className="text-sm font-bold text-indigo-600">
                                                                            {formatCurrency(t.totalFinal)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="pt-1 text-xs text-gray-400">
                                                                        Fecha de asistencia: {new Date(reg.attendanceDate).toLocaleDateString('es-GT', {
                                                                            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showCreateModal && (
                <CreateEventModal
                    onCreated={fetchData}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    )
}

function StatCard({ label, value, color, badge }: {
    label: string
    value: number
    color: string
    badge?: string
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