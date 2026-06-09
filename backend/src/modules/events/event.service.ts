import prisma from '../../config/database'
import { AppError } from '../../middlewares/errorHandler'

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