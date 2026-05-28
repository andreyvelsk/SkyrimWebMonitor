# Stage 1: build Vue app
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Production build; VITE_WS_URL будет переопределён через nginx proxy (/ws),
# поэтому здесь не важен — приложение использует relative /ws path
RUN npm run build

# Stage 2: nginx serves static files + proxies WebSocket
FROM nginx:1.27-alpine

# Шаблонизация nginx.conf через envsubst (встроен в nginx:alpine)
COPY deploy/nginx/nginx.conf /etc/nginx/templates/default.conf.template

# Скопировать собранную статику
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
