# Multi-stage Dockerfile for LAN Backup Gateway

# Stage 1: Build Frontend (React + TS + Tailwind)
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Build Backend (Node.js + Express + TS)
FROM node:22-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install tzdata for accurate local timestamps
RUN apk add --no-cache tzdata

ENV NODE_ENV=production
ENV PORT=5000
ENV STORAGE_DIR=/app/storage

# Setup server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend dist
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend dist
COPY --from=client-builder /app/client/dist ./client-dist

# Create storage volume directory
RUN mkdir -p /app/storage

# Expose port
EXPOSE 5000

# Volume for persistent backups
VOLUME ["/app/storage"]

CMD ["node", "dist/index.js"]
