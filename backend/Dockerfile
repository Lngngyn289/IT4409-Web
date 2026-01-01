# =========================
# Stage 1: Builder
# =========================
FROM node:22-alpine AS builder

# Thư mục làm việc
WORKDIR /usr/src/backend

# Copy package.json + package-lock.json và Prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Cài dependencies
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build dự án (NestJS => dist)
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:22-alpine AS production

# Thiết lập môi trường production
ENV NODE_ENV=production
WORKDIR /usr/src/backend

# Copy package.json & prisma từ builder
COPY package*.json ./
COPY --from=builder /usr/src/backend/prisma ./prisma

# Cài dependencies production
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy dist từ builder và set quyền cho user node
COPY --from=builder /usr/src/backend/dist ./dist
RUN chown -R node:node ./dist ./prisma

# Sử dụng user không phải root
USER node

# Expose port backend
EXPOSE 3000

# CMD: chạy migrate rồi start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
