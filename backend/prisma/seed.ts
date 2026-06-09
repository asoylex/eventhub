import 'dotenv/config'
import { PrismaClient, ItemType, Role } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Evento principal
  const event = await prisma.event.upsert({
    where: { id: 'event-main-001' },
    update: {},
    create: {
      id: 'event-main-001',
      name: 'Feria de Promociones Anual 2025',
      description: 'Evento anual de promociones de servicios y productos.',
      capacity: 50,
      confirmedCount: 0,
      eventDate: new Date('2025-09-15T09:00:00.000Z'),
      isActive: true,
    },
  })

  // Servicios
  const services = [
    { name: 'Consultoría Empresarial', description: 'Asesoría estratégica para su negocio', price: 850.00 },
    { name: 'Auditoría Financiera', description: 'Revisión completa de sus finanzas', price: 950.00 },
    { name: 'Soporte Técnico Premium', description: 'Soporte 24/7 para sus sistemas', price: 450.00 },
    { name: 'Capacitación Corporativa', description: 'Entrenamiento para su equipo', price: 600.00 },
    { name: 'Gestión de Proyectos', description: 'Administración integral de proyectos', price: 750.00 },
  ]

  for (const service of services) {
    await prisma.catalogItem.upsert({
      where: { id: `service-${service.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `service-${service.name.toLowerCase().replace(/\s/g, '-')}`,
        ...service,
        price: service.price,
        type: ItemType.SERVICE,
        isActive: true,
      },
    })
  }

  // Productos
  const products = [
    { name: 'Software ERP Básico', description: 'Sistema de gestión empresarial', price: 1200.00 },
    { name: 'Licencia CRM Anual', description: 'Gestión de relaciones con clientes', price: 800.00 },
    { name: 'Pack Seguridad Digital', description: 'Suite completa de ciberseguridad', price: 350.00 },
    { name: 'Plataforma E-commerce', description: 'Tienda en línea lista para usar', price: 950.00 },
    { name: 'Dashboard Analítico', description: 'Visualización de datos en tiempo real', price: 450.00 },
    { name: 'App Móvil Corporativa', description: 'Aplicación móvil para su empresa', price: 1500.00 },
    { name: 'Almacenamiento Cloud 1TB', description: 'Almacenamiento seguro en la nube', price: 200.00 },
    { name: 'Backup Automatizado', description: 'Respaldo automático de datos', price: 180.00 },
  ]

  for (const product of products) {
    await prisma.catalogItem.upsert({
      where: { id: `product-${product.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `product-${product.name.toLowerCase().replace(/\s/g, '-')}`,
        ...product,
        price: product.price,
        type: ItemType.PRODUCT,
        isActive: true,
      },
    })
  }

  // Usuario admin
  const hashedPassword = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@eventhub.com' },
    update: {},
    create: {
      email: 'admin@eventhub.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'EventHub',
      role: Role.ADMIN,
    },
  })

  // Usuario de ventas
  const salesPassword = await bcrypt.hash('Sales123!', 12)
  await prisma.user.upsert({
    where: { email: 'ventas@eventhub.com' },
    update: {},
    create: {
      email: 'ventas@eventhub.com',
      password: salesPassword,
      firstName: 'Equipo',
      lastName: 'Ventas',
      role: Role.SALES,
    },
  })

  console.log('✅ Seed completado')
  console.log(`📅 Evento: ${event.name} (cupo: ${event.capacity})`)
  console.log(`🛠  Servicios: ${services.length}`)
  console.log(`📦 Productos: ${products.length}`)
  console.log(`👤 Admin: admin@eventhub.com / Admin123!`)
  console.log(`👤 Ventas: ventas@eventhub.com / Sales123!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })