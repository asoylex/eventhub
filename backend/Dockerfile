FROM node:22-alpine AS base
WORKDIR /app

# Instala dependencias
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Producción
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
COPY package*.json ./

RUN chmod +x entrypoint.sh

EXPOSE 4000

CMD ["sh", "entrypoint.sh"]