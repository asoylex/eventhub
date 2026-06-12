# EventHub

Plataforma web para la confirmación de asistencia a la Feria de Promociones Anual. Los clientes ingresan sus datos, eligen los servicios y productos de su interés, y reciben un descuento personalizado según su selección. El equipo de ventas recibe una notificación por cada confirmación para preparar el portafolio antes del evento.

**Producción:** https://eventhub.duopps.com

---

## Decisiones de diseño

El sistema separa claramente dos tipos de usuario: el cliente que confirma asistencia y el equipo interno (ventas y administración) que gestiona el evento. El cliente pasa por un formulario de dos pasos con validación en tiempo real de descuentos. El equipo interno accede a un dashboard protegido por sesión donde puede ver todas las confirmaciones, gestionar el evento y recibir notificaciones en vivo cuando alguien confirma.

El cupo del evento se controla con una transacción atómica en PostgreSQL, lo que garantiza que no se acepten más confirmaciones de las permitidas incluso si muchos usuarios envían el formulario al mismo tiempo.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | Next.js | 15 |
| Estilos | Tailwind CSS | v4 |
| Estado | Zustand | 5.x |
| Backend | Node.js + Express | 22 / 4.x |
| Lenguaje | TypeScript | 5.x |
| ORM | Prisma | 7.8 |
| Base de datos | PostgreSQL | 16 |
| Contenedores | Docker + Docker Compose | 27.x |
| Servidor | DigitalOcean (Ubuntu 24.04) | — |
| Proxy | Nginx + Cloudflare | — |

---

## Estructura del repositorio

```
eventhub/
├── backend/                  API REST con Express
│   ├── src/
│   │   ├── config/           Configuración de entorno y base de datos
│   │   ├── middlewares/      Autenticación, autorización, validación, errores
│   │   ├── modules/
│   │   │   ├── auth/         Registro, login, refresh token, logout
│   │   │   ├── catalog/      Servicios y productos
│   │   │   ├── events/       Gestión del evento y cupo
│   │   │   ├── notifications/ Cola en memoria y SSE
│   │   │   └── registrations/ Confirmaciones de asistencia
│   │   └── utils/            JWT, descuentos, logger, respuestas
│   ├── prisma/
│   │   ├── schema.prisma     Definición de modelos
│   │   └── seed.ts           Datos iniciales
│   ├── prisma.config.ts      Configuración de Prisma 7
│   ├── entrypoint.sh         Script de arranque en Docker
│   └── Dockerfile
├── frontend/                 Aplicación Next.js
│   ├── app/
│   │   ├── (auth)/login/     Página de login
│   │   ├── (auth)/register/  Página de registro
│   │   ├── (public)/confirm/ Formulario de confirmación
│   │   └── (dashboard)/      Panel de ventas y administración
│   ├── components/
│   │   ├── ui/               Componentes base (Button, Input)
│   │   ├── confirm/          Pasos del formulario y badges de descuento
│   │   └── dashboard/        Tabla de registros y editor de eventos
│   ├── hooks/                useSSE para notificaciones en tiempo real
│   ├── lib/                  Cliente HTTP, auth helpers, utils
│   ├── store/                Zustand stores (auth, confirm)
│   └── Dockerfile
├── docker-compose.yml
├── DECISIONS.md
└── README.md
```

---

## Base de datos

El schema tiene 7 tablas principales:

```
users              Clientes, ventas y admins con roles
events             El evento (nombre, cupo, fecha, estado)
catalog_items      Servicios y productos con precio y tipo
registrations      Una por usuario, con descuentos calculados
registration_items Items elegidos por cada confirmación
notification_logs  Registro de notificaciones enviadas a ventas
refresh_tokens     Tokens de refresco para rotación de sesión
```

---

## Roles

| Rol | Acceso |
|---|---|
| `CLIENT` | Registro, login, formulario de confirmación |
| `SALES` | Dashboard con todas las confirmaciones |
| `ADMIN` | Todo lo anterior + gestión del evento |

---

## Reglas de descuento

**Servicios:**
- 2 o más servicios → 3%
- 2 o más servicios con total mayor a Q.1,500 → 5%

**Productos:**
- 3 o más productos → 3%
- 5 o más productos → 5%

Los descuentos de servicios y productos son independientes y se aplican por separado.

---

## API

La colección de Postman está en la raíz del repositorio (`EventHub.postman_collection.json`). Importarla en Postman y configurar la variable `baseUrl`.

**Base URL local:** `http://localhost:4000`
**Base URL producción:** `https://eventhub.duopps.com`

### Endpoints principales

```
GET  /health                          Estado del servidor

POST /api/auth/register               Registro de usuario
POST /api/auth/login                  Login
POST /api/auth/refresh                Renovar tokens
POST /api/auth/logout                 Logout

GET  /api/catalog                     Todos los items
GET  /api/catalog?type=SERVICE        Solo servicios
GET  /api/catalog?type=PRODUCT        Solo productos
GET  /api/catalog?search=texto        Búsqueda por nombre

GET  /api/events/active               Evento activo con cupo
GET  /api/events                      Todos los eventos (ADMIN)
POST /api/events                      Crear evento (ADMIN)
PATCH /api/events/:id                 Editar evento (ADMIN)
POST /api/events/:id/reset            Resetear contador (ADMIN)

POST /api/registrations               Confirmar asistencia (CLIENT)
GET  /api/registrations/me            Mi confirmación (CLIENT)
GET  /api/registrations               Todas las confirmaciones (SALES/ADMIN)

GET  /api/notifications               Log de notificaciones (SALES/ADMIN)
GET  /api/notifications/stream        Stream SSE en tiempo real (SALES/ADMIN)
```

### Autenticación

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <accessToken>
```

El access token dura 15 minutos. Usar `/api/auth/refresh` con el refresh token para renovarlo sin volver a hacer login.

---

## Usuarios del seed

| Email | Password | Rol |
|---|---|---|
| admin@eventhub.com | Admin123! | ADMIN |
| ventas@eventhub.com | Sales123! | SALES |

Los clientes se registran desde `/register`.

---

## Levantar el proyecto localmente

**Requisitos:** Node.js 22, Docker Desktop, npm

```bash
# Clonar el repositorio
git clone https://github.com/asoylex/eventhub.git
cd eventhub

# Levantar PostgreSQL
docker compose up -d postgres

# Configurar el backend
cd backend
cp .env.example .env
# Completar las variables en .env

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
# API disponible en http://localhost:4000

# Configurar el frontend (nueva terminal)
cd ../frontend
cp .env.example .env.local
# Completar NEXT_PUBLIC_API_URL=http://localhost:4000/api

npm install
npm run dev
# App disponible en http://localhost:3000
```

---

## Levantar con Docker Compose completo

```bash
# Desde la raíz del repositorio
cp .env.example .env
# Completar todas las variables

docker compose up -d --build

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend
```

Servicios disponibles:
```
http://localhost:3000  Frontend
http://localhost:4000  Backend
http://localhost:5432  PostgreSQL
```

---

## Variables de entorno

**Backend (`backend/.env`):**

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/eventhub_db
JWT_SECRET=secret_de_al_menos_64_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otro_secret_de_al_menos_64_caracteres
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
EVENT_CAPACITY=50
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Para generar secrets seguros:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Infraestructura en producción

```
Usuario
  └── HTTPS → Cloudflare (SSL + DDoS)
                └── HTTP → Nginx (DigitalOcean Droplet)
                            ├── localhost:3000 → Frontend (Docker)
                            └── localhost:4000 → Backend (Docker)
                                                    └── localhost:5432 → PostgreSQL (Docker)
```

El servidor es un Droplet de DigitalOcean con Ubuntu 24.04. Nginx actúa como reverse proxy y Cloudflare maneja el SSL y la protección del dominio. Los tres servicios corren como contenedores Docker orquestados con Docker Compose.


## ARCHIVOS 

**POSTMAN**
EventHub API.postman_collection.json

**DIAGRAMA ER**
EVENT HUB ER.png