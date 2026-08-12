# Deploying SkyrimWebMonitor on Linux (Docker)

Solves the **mixed content** problem: the browser refuses to connect
via `ws://` from a page served over `https://`.

## Architecture

```
Browser ──wss://LINUX_IP/ws──▶ nginx (Docker) ──ws://──▶ Skyrim PC (Windows :8765)
                                      │
                               serves Vue.js SPA
```

## Quick Start

### 1. Requirements on the Linux machine

- Docker Engine ≥ 24
- Docker Compose v2

### 2. Configuration

```bash
cd deploy/
cp .env.example .env
# Edit .env: set the IP/hostname of the PC running Skyrim
nano .env
```

### 3. Generate SSL certificate

```bash
# Argument — IP or hostname of your Linux machine (the one browsers will connect to)
bash gen-ssl.sh 192.168.1.200
```

The certificate will be placed in `deploy/ssl/`. After that, **once** add
`ssl/cert.pem` as trusted in your browser or OS (instructions are printed by the script).

### 4. Build and run

```bash
docker compose up -d --build
```

The application will be available at: `https://192.168.1.200`

### 5. Open in browser

On first open, the browser will show a certificate warning.
Add an exception or pre-import `cert.pem` as a trusted CA.

---

## Updating

```bash
docker compose up -d --build
```

## Stopping

```bash
docker compose down
```

## Environment variables (`.env`)

| Variable        | Default         | Description                                |
|-----------------|-----------------|--------------------------------------------|
| `SKYRIM_HOST`   | `192.168.1.100` | IP/hostname of the PC running Skyrim       |
| `SKYRIM_WS_PORT`| `8765`          | WebSocket port of the Skyrim mod server    |

## Alternative without Docker: nginx directly

If Docker is not needed, install nginx and:
1. Place `nginx/nginx.conf` in `/etc/nginx/conf.d/skyrim.conf`
2. Replace `${SKYRIM_HOST}` and `${SKYRIM_WS_PORT}` with real values
3. Copy `dist/` to `/usr/share/nginx/html`
4. `sudo nginx -t && sudo systemctl reload nginx`
