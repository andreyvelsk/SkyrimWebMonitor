# Развёртывание SkyrimWebMonitor на Linux (Docker)

Решает проблему **mixed content**: браузер отказывается подключаться
по `ws://` со страницы, открытой по `https://`.

## Архитектура

```
Браузер ──wss://LINUX_IP/ws──▶ nginx (Docker) ──ws://──▶ Skyrim PC (Windows :8765)
                                      │
                               раздаёт Vue.js SPA
```

## Быстрый старт

### 1. Требования на Linux-машине

- Docker Engine ≥ 24
- Docker Compose v2

### 2. Настройка

```bash
cd deploy/
cp .env.example .env
# Отредактируйте .env: укажите IP/hostname PC с запущенным Skyrim
nano .env
```

### 3. Генерация SSL сертификата

```bash
# Аргумент — IP или hostname вашей Linux-машины (тот, с которого откроют браузер)
bash gen-ssl.sh 192.168.1.200
```

Сертификат попадёт в `deploy/ssl/`. После этого **один раз** добавьте
`ssl/cert.pem` как доверенный в браузере или ОС (инструкция выводится скриптом).

### 4. Сборка и запуск

```bash
docker compose up -d --build
```

Приложение будет доступно по адресу: `https://192.168.1.200`

### 5. Открыть в браузере

При первом открытии браузер покажет предупреждение о сертификате.
Добавьте исключение или предварительно импортируйте `cert.pem` как trusted CA.

---

## Обновление

```bash
docker compose up -d --build
```

## Остановка

```bash
docker compose down
```

## Переменные окружения (`.env`)

| Переменная      | По умолчанию    | Описание                              |
|-----------------|-----------------|---------------------------------------|
| `SKYRIM_HOST`   | `192.168.1.100` | IP/hostname PC с запущенным Skyrim    |
| `SKYRIM_WS_PORT`| `8765`          | Порт WebSocket сервера Skyrim-мода    |

## Альтернатива без Docker: nginx напрямую

Если Docker не нужен, установите nginx и:
1. Разместите `nginx/nginx.conf` в `/etc/nginx/conf.d/skyrim.conf`
2. Укажите в нём реальные значения вместо `${SKYRIM_HOST}` и `${SKYRIM_WS_PORT}`
3. Скопируйте `dist/` в `/usr/share/nginx/html`
4. `sudo nginx -t && sudo systemctl reload nginx`
