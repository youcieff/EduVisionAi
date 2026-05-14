# ================================================
# EduVisionAI — Multi-stage Docker Build
# Stage 1: Build React frontend
# Stage 2: Production Node.js backend + static frontend
# ================================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine

# Install ffmpeg for video/audio processing
RUN apk add --no-cache ffmpeg python3

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev --silent

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend's static directory
COPY --from=frontend-builder /app/frontend/build ./public

# Create uploads directory
RUN mkdir -p uploads

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
