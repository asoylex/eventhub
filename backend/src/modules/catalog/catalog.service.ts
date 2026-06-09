import prisma from '../../config/database'

export const getCatalogItems = async (search?: string, type?: string) => {
  return prisma.catalogItem.findMany({
    where: {
      isActive: true,
      ...(type && { type: type as 'SERVICE' | 'PRODUCT' }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    },
    orderBy: { name: 'asc' },
  })
}

export const getCatalogItemsByIds = async (ids: string[]) => {
  return prisma.catalogItem.findMany({
    where: { id: { in: ids }, isActive: true },
  })
}