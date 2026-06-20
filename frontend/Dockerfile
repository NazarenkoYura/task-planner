# Этап 1: Сборка статических файлов React
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./

# Настройка стабильного зеркала для обхода блокировок npm-репозитория
RUN npm config set registry https://registry.npmmirror.com

RUN npm install
COPY . .
RUN npm run build

# Этап 2: Раздача статики через легковесный сервер Nginx
FROM nginx:alpine
# Копируем кастомный конфиг Nginx для поддержки SPA-роутинга
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]