# Multi-stage production Dockerfile for Railway deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl
RUN mkdir -p /app/data

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data ./data

EXPOSE 5000

# Run resilient startup script and start server
CMD ["node", "scripts/start.js"]
