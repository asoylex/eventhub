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
}

interface Props {
    onCreated: () => void
    onClose: () => void
}

export default function CreateEventModal({ onCreated, onClose }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            capacity: '50',
        },
    })

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        setError('')
        try {
            await api.post('/events', {
                name: data.name,
                description: data.description,
                capacity: parseInt(data.capacity, 10),
                eventDate: new Date(data.eventDate).toISOString(),
            })
            onCreated()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear evento')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Crear nuevo evento</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <Input
                        id="name"
                        label="Nombre del evento"
                        placeholder="Feria de Promociones 2026"
                        error={errors.name?.message}
                        {...register('name', { required: 'Nombre requerido' })}
                    />

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                            Descripción <span className="text-gray-400">(opcional)</span>
                        </label>
                        <textarea
                            {...register('description')}
                            rows={2}
                            placeholder="Descripción del evento..."
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

                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                        Al crear un nuevo evento el evento actual se desactivará automáticamente.
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="flex-1"
                        >
                            Crear evento
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}