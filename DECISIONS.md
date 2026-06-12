# DECISIONS.md

## Decisiones técnicas

---

### Decisión 1 — Express vs NestJS

**Problema o disyuntiva enfrentada:**
El problema que encontre fue que nest js no era tan ligero como express.



**Opciones consideradas:**
Express, Nest.JS y Laravel

**Qué elegí y por qué:**
Lo elegí porque me iba a ser mas ligero en cuanto a despliegue, desarrollo e instalación.

**Trade-offs que acepto:**
Al Elegir Express pierdo la estructura robusta de NestJS para proyectos con equipos grandes ya que la mayoria se rige por un mismo patron.

---

### Decisión 2 — Prisma vs TypeORM

**Problema o disyuntiva enfrentada:**
Necesitaba un ORM para manejar la base de datos con TypeScript.


**Opciones consideradas:**
Prisma, TypeORM, Drizzle-orm


**Qué elegí y por qué:**
Prisma tiene un schema declarativo en un solo archivo (schema.prisma), adicional tiene Prisma studio una especie de workbench o phpmyadmin.

**Trade-offs que acepto:**
Prisma no soporta queries complejas tan fácilmente como TypeORM para operaciones muy específicas hay que recurrir a $queryRaw.



---

### Decisión 3 — DigitalOcean con servidor propio vs deploys rápidos (Railway/Render)

**Problema o disyuntiva enfrentada:**
Necesitaba desplegar tres servicios (frontend, backend, base de datos)
de forma confiable, con SSL y dominio propio.

**Opciones consideradas:**
Railway, Render, DigitalOcean Droplet con Docker

**Qué elegí y por qué:**
Con un Droplet tengo control total sobre nginx, puertos, SSL y configuración del servidor Railway abstrae demasiado esa capa.
Costo Fijo, adicional me da opcion de administrar mejor la conectividad con cloudflare para el tema de seguridad.

**Trade-offs que acepto:**
Requiere configuración manual de nginx, firewall y SSL cosa que Railway o Render lo dan resuelto.
---

## Situación 1 — Cupo limitado bajo concurrencia

**¿Cómo garantizas que no se exceda el cupo?**
Con una transacción atómica usando $executeRaw en PostgreSQL:



**¿Qué pasaría si tu solución recibiera 10x más tráfico del esperado?**
PostgreSQL manejaría bien hasta cierto punto, pero con miles de requests simultáneos las transacciones empezarían a hacer cola y los tiempos de respuesta subirían.

---

## Situación 2 — Notificación al equipo de ventas

**¿Qué mecanismo elegiste para la simulación y por qué?**
Una cola en memoria procesada de forma asíncrona, combinada con Server-Sent Events (SSE) para notificaciones en tiempo real.


**¿Cómo migrarías esta solución a un entorno productivo real?**
Para el envío real se integraría un proveedor de email transaccional como SendGrid o Resend.


**¿Qué pasa si la notificación falla?**
La notificación queda en notification_logs con status FAILED y el número de intentos.


**¿Qué pasa si el cliente modifica su selección después de confirmar?**
Actualmente no está implementada la modificación post-confirmación.
Si se implementara, habría que invalidar la notificación anterior, enviar una notificación de actualización al equipo de ventas. 

---

## Limitaciones conocidas y siguientes pasos

**¿Qué partes de tu solución no escalarían de 100 a 100,000 clientes en una ventana corta?**
La cola de notificaciones en memoria se pierde si el servidor se reinicia y no sigue el patron si hay múltiples instancias.
El contador de cupo en PostgreSQL con muchas peticiones las transacciones harían cola y los tiempos de respuesta subiran.
Al tener todo en un solo servidor todos empezaran a depender de una unica memoria y cpu.



**¿Qué cambiarías?**
Separar los proyectos, para que exista un mejor desempeño e implementar la solucion de una unica responsabilidad.
Para las notificaciones usar Redis y workers.
