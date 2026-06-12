'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

interface FormData {
    name: string
    description: string
    capacity: string
    eventDate: string
    isActive: boolean
}

interface Event {
    id: string
    name: string
    description: string | null
    capacity: number
    confirmedCount: number
    eventDate: string
    isActive: boolean
}

interface Props {
    event: Event
    onUpdated: () => void
}

export default function EventEditor({ event, onUpdated }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            name: event.name,
            description: event.description || '',
            capacity: String(event.capacity),
            eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
            isActive: event.isActive,
        },
    })

    const onSubmit = async (data: FormData) => {
        const capacity = parseInt(data.capacity, 10)
        if (isNaN(capacity) || capacity < 1) {
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            await api.patch(`/events/${event.id}`, {
                name: data.name,
                description: data.description,
                capacity,
                eventDate: new Date(data.eventDate).toISOString(),
                isActive: data.isActive,
            })
            setSuccess('Evento actualizado correctamente')
            onUpdated()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = async () => {
        if (!confirm('¿Resetear el contador de confirmados?')) return
        setIsResetting(true)
        try {
            await api.post(`/events/${event.id}/reset`)
            setSuccess('Contador reseteado correctamente')
            onUpdated()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al resetear')
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h2 className="font-semibold text-gray-900">Configuración del Evento</h2>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${event.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {event.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <Input
                    id="name"
                    label="Nombre del evento"
                    error={errors.name?.message}
                    {...register('name', { required: 'Nombre requerido' })}
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-black font-medium text-gray-700">Descripción</label>
                    <textarea
                        {...register('description')}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 opacity-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        id="capacity"
                        label="Capacidad máxima"
                        type="number"
                        error={errors.capacity?.message}
                        {...register('capacity', {
                            required: 'Requerido',
                            min: { value: 1, message: 'Mínimo 1' },
                        })}
                    />
                    <Input
                        id="eventDate"
                        label="Fecha del evento"
                        type="datetime-local"
                        error={errors.eventDate?.message}
                        {...register('eventDate', { required: 'Fecha requerida' })}
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Evento activo</p>
                        <p className="text-xs text-gray-500">
                            Si está inactivo no se aceptan nuevas confirmaciones
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" {...register('isActive')} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                </div>

                {success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                        Guardar cambios
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        isLoading={isResetting}
                        onClick={handleReset}
                    >
                        Resetear contador
                    </Button>
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500 space-y-1">
                    <p>Confirmados actuales: <span className="font-semibold text-gray-700">{event.confirmedCount}</span></p>
                    <p>Cupo disponible: <span className="font-semibold text-gray-700">{event.capacity - event.confirmedCount}</span></p>
                    <p className="text-xs text-amber-600">
                        Resetear el contador solo actualiza el número, no elimina las confirmaciones registradas.
                    </p>
                </div>
            </form>
        </div>
    )
}