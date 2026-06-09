import prisma from '../../config/database'
import { AppError } from '../../middlewares/errorHandler'
import { calculateDiscounts } from '../../utils/discount'
import { enqueueNotification } from '../notifications/notification.queue'
import { CreateRegistrationInput } from './registration.schema'
import { v4 as uuidv4 } from 'uuid'

export const createRegistration = async (
    userId: string,
    input: CreateRegistrationInput
) => {
    // Verifica si ya confirmó
    const existing = await prisma.registration.findUnique({
        where: { userId },
    })
    if (existing) {
        throw new AppError('You have already confirmed your attendance', 409)
    }

    // Obtiene los items seleccionados
    const catalogItems = await prisma.catalogItem.findMany({
        where: { id: { in: input.itemIds }, isActive: true },
    })

    if (catalogItems.length !== input.itemIds.length) {
        throw new AppError('One or more selected items are invalid', 400)
    }

    // Calcula descuentos
    const discountItems = catalogItems.map((item) => ({
        type: item.type as 'SERVICE' | 'PRODUCT',
        price: Number(item.price),
    }))

    const discounts = calculateDiscounts(discountItems)

    // ─── Transacción atómica para el cupo ────────────────────────────────────
    // Usa updateMany con condición — si no hay cupo disponible, no actualiza
    // y el count será 0, permitiendo rechazar la solicitud sin race conditions
    const result = await prisma.$transaction(async (tx) => {
        // Intenta incrementar el contador SOLO si hay cupo
        const updated = await tx.$executeRaw`
                    UPDATE events
                    SET "confirmedCount" = "confirmedCount" + 1
                    WHERE "isActive" = true
                    AND "confirmedCount" < capacity
                    `

        if (updated === 0) {
            throw new AppError('Event is full. No spots available.', 409)
        }

        // Obtiene el evento actualizado
        const event = await tx.event.findFirst({ where: { isActive: true } })
        if (!event) throw new AppError('No active event found', 404)

        // Crea la confirmación
        const registrationId = uuidv4()
        const registration = await tx.registration.create({
            data: {
                id: registrationId,
                userId,
                eventId: event.id,
                attendanceDate: new Date(input.attendanceDate),
                serviceDiscount: discounts.serviceDiscount,
                productDiscount: discounts.productDiscount,
                totalServices: discounts.totalServices,
                totalProducts: discounts.totalProducts,
                items: {
                    create: catalogItems.map((item) => ({
                        id: uuidv4(),
                        catalogItemId: item.id,
                        priceAtTime: item.price,
                    })),
                },
            },
            include: {
                items: { include: { catalogItem: true } },
                event: { select: { name: true } },
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        })

        // Log de notificación pendiente
        await tx.notificationLog.create({
            data: {
                id: uuidv4(),
                registrationId,
                payload: JSON.parse(JSON.stringify({
                    userId,
                    items: catalogItems.map((i) => ({
                        name: i.name,
                        type: i.type,
                        price: Number(i.price),
                    })),
                    discounts: {
                        serviceDiscount: discounts.serviceDiscount,
                        productDiscount: discounts.productDiscount,
                        totalServices: discounts.totalServices,
                        totalProducts: discounts.totalProducts,
                    },
                })),
                status: 'PENDING',
            },
        })

        return registration
    })

    // Encola notificación FUERA de la transacción (no bloquea la respuesta)
    enqueueNotification({
        registrationId: result.id,
        userId,
        userEmail: result.user.email,
        userName: `${result.user.firstName} ${result.user.lastName}`,
        eventName: result.event.name,
        attendanceDate: result.attendanceDate,
        items: catalogItems.map((i) => ({
            name: i.name,
            type: i.type,
            price: Number(i.price),
        })),
        serviceDiscount: discounts.serviceDiscount,
        productDiscount: discounts.productDiscount,
        totalServices: discounts.totalServices,
        totalProducts: discounts.totalProducts,
    })

    return {
        id: result.id,
        attendanceDate: result.attendanceDate,
        serviceDiscount: discounts.serviceDiscount,
        productDiscount: discounts.productDiscount,
        totalServices: discounts.totalServices,
        totalProducts: discounts.totalProducts,
        items: result.items.map((ri) => ({
            id: ri.catalogItem.id,
            name: ri.catalogItem.name,
            type: ri.catalogItem.type,
            price: Number(ri.priceAtTime),
        })),
        event: result.event.name,
    }
}

export const getMyRegistration = async (userId: string) => {
    const registration = await prisma.registration.findUnique({
        where: { userId },
        include: {
            items: { include: { catalogItem: true } },
            event: true,
        },
    })

    if (!registration) throw new AppError('No registration found', 404)
    return registration
}

export const getAllRegistrations = async () => {
    return prisma.registration.findMany({
        include: {
            user: {
                select: { firstName: true, lastName: true, email: true },
            },
            items: { include: { catalogItem: true } },
            event: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}