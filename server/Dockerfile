FROM node:20.11-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

FROM node:20.11-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm ci
RUN npm run build 2>/dev/null || true

FROM node:20.11-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY package*.json ./
COPY . .

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
