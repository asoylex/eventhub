import { logger } from '../../utils/logger'
import prisma from '../../config/database'

interface NotificationPayload {
  registrationId: string
  userId: string
  userEmail: string
  userName: string
  eventName: string
  attendanceDate: Date
  items: Array<{
    name: string
    type: string
    price: number
  }>
  serviceDiscount: number
  productDiscount: number
  totalServices: number
  totalProducts: number
}

// Cola en memoria — simula un sistema de notificaciones
const queue: NotificationPayload[] = []
let isProcessing = false

export const enqueueNotification = (payload: NotificationPayload) => {
  queue.push(payload)
  logger.info(
    { registrationId: payload.registrationId },
    '📬 Notification enqueued'
  )
  processQueue()
}

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return
  isProcessing = true

  while (queue.length > 0) {
    const payload = queue.shift()!
    await sendNotification(payload)
  }

  isProcessing = false
}

const sendNotification = async (payload: NotificationPayload) => {
  try {
    // Simula latencia de envío
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Log estructurado — representa lo que se enviaría al equipo de ventas
    logger.info(
      {
        type: 'SALES_NOTIFICATION',
        registration: {
          id: payload.registrationId,
          client: `${payload.userName} <${payload.userEmail}>`,
          event: payload.eventName,
          attendanceDate: payload.attendanceDate,
          selectedItems: payload.items,
          discounts: {
            services: `${payload.serviceDiscount}%`,
            products: `${payload.productDiscount}%`,
          },
          totals: {
            services: `Q.${payload.totalServices.toFixed(2)}`,
            products: `Q.${payload.totalProducts.toFixed(2)}`,
          },
        },
      },
      '✅ Sales team notified'
    )

    // Marca como enviado en DB
    await prisma.notificationLog.updateMany({
      where: { registrationId: payload.registrationId, status: 'PENDING' },
      data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 } },
    })
  } catch (error) {
    logger.error(
      { error, registrationId: payload.registrationId },
      '❌ Notification failed'
    )

    await prisma.notificationLog.updateMany({
      where: { registrationId: payload.registrationId, status: 'PENDING' },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}