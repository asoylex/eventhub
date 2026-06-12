import {z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Mínimo 1'),
  eventDate: z.string().datetime('Invalid date format'),
})

export  const updateEventSchema = z.object({
    name: z.string().min(1, 'Event name is required').optional(),
    date: z.string().datetime('Invalid date format').optional(),
    description: z.string().optional(),
    capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
    confirmedCount: z.number().int().nonnegative('Confirmed count must be a non-negative integer').optional(),
    eventDate: z.string().datetime('Invalid date format').optional(),
    isActive: z.boolean().optional(),
})



export type CreateEventInput = z.infer<typeof createEventSchema>

export type UpdateEventInput = z.infer<typeof updateEventSchema>

