# Многостадийная сборка с serve
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Финальный образ
FROM node:18-alpine

WORKDIR /app

# Устанавливаем только serve (можно без фиксированной версии)
RUN npm install -g serve

# Копируем только собранные файлы
COPY --from=builder /app/dist ./dist

# Безопасность: непривилегированный пользователь
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app/dist

USER nextjs

# Health check для мониторинга
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

# Исправленная команда запуска
CMD ["serve", "-s", "dist", "-l", "3000"]