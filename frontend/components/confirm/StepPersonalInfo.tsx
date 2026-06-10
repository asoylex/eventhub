'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useConfirmStore } from '@/store/confirmStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellidos requeridos'),
  email: z.string().email('Email inválido'),
  attendanceDate: z.string().min(1, 'Selecciona fecha y hora'),
})

type FormData = z.infer<typeof schema>

export default function StepPersonalInfo() {
  const { setPersonalInfo, goToStep, firstName, lastName, email, attendanceDate } =
    useConfirmStore()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName, lastName, email, attendanceDate },
  })

  const onSubmit = (data: FormData) => {
    setPersonalInfo(data)
    goToStep(2)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Información personal</h2>
        <p className="text-sm text-gray-500 mt-1">Ingresa tus datos para confirmar asistencia</p>
      </div>

      <Input
        id="firstName"
        label="Nombre"
        placeholder="Ingresa tu nombre"
        error={errors.firstName?.message}
        {...register('firstName')}
      />
      <Input
        id="lastName"
        label="Apellidos"
        placeholder="Ingresa tus apellidos"
        error={errors.lastName?.message}
        {...register('lastName')}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="Ingresa tu Email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="attendanceDate"
        label="Fecha y Hora de asistencia"
        type="datetime-local"
        error={errors.attendanceDate?.message}
        {...register('attendanceDate')}
      />

      <Button type="submit" className="w-full" size="lg">
        Continuar →
      </Button>
    </form>
  )
}