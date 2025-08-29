# Используем официальный Node.js образ для сборки
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Второй этап - nginx
FROM nginx:alpine

# Копируем нашу конфигурацию (создайте файл nginx.conf в корне проекта)
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем собранные файлы
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Используем стандартный entrypoint, но с нашей конфигурацией