import prisma from '../../config/database'
import { AppError } from '../../middlewares/errorHandler'
import { UpdateEventInput } from './event.schema'

export const getActiveEvent = async () => {
  const event = await prisma.event.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      capacity: true,
      confirmedCount: true,
      eventDate: true,
    },
  })

  if (!event) throw new AppError('No active event found', 404)

  return {
    ...event,
    spotsAvailable: event.capacity - event.confirmedCount,
    isFull: event.confirmedCount >= event.capacity,
  }

}

// export const createEvent = async (input: {
//   name: string
//   description?: string
//   capacity: number
//   eventDate: string
// }) => {
//   // Desactiva eventos anteriores
//   await prisma.event.updateMany({
//     where: { isActive: true },
//     data: { isActive: false },
//   })

//   return prisma.event.create({
//     data: {
//       name: input.name,
//       description: input.description,
//       capacity: input.capacity,
//       eventDate: new Date(input.eventDate),
//       confirmedCount: 0,
//       isActive: true,
//     },
//   })
// }


export const updateEvent = async (id: string, input: UpdateEventInput) => {
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new AppError('Event not found', 404)

  if (input.capacity && input.capacity < event.confirmedCount) {
    throw new AppError('New capacity cannot be less than confirmed count', 400)
  }

  return await prisma.event.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.capacity ? { capacity: input.capacity } : {}),
      ...(input.eventDate ? { eventDate: new Date(input.eventDate) } : {}),
      ...(typeof input.isActive !== 'undefined' && { isActive: input.isActive }),
    }
  })
}

export const resetConfirmCount = async (id: string) => {
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new AppError('Event not found', 404)

  return await prisma.event.update({
    where: { id },
    data: {
      confirmedCount: 0,
    }
  })
}

export const getAllEvents = async () => {
  return await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { registrations: true } }
    },
  })
}


export const resetConfirmedCount = async (id: string) => {
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) throw new AppError('Event not found', 404)

  return prisma.event.update({
    where: { id },
    data: { confirmedCount: 0 },
  })
}
