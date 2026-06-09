import { z } from 'zod'

export const createRegistrationSchema = z.object({
  attendanceDate: z.string().datetime('Invalid date format'),
  itemIds: z
    .array(z.string().uuid('Invalid item ID'))
    .min(1, 'Select at least one item'),
})

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>