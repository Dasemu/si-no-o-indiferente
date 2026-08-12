# Deploy en un LXC de Debian (sin Docker, sin proveedor externo)

Esta guia asume un contenedor LXC Debian 12 con acceso root, sin Docker, y
que vas a exponer la app en tu propio dominio con nginx + Let's Encrypt.

## 1. Preparar el sistema

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx

# Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v   # deberia mostrar v22.x
```

Crea un usuario de sistema dedicado (sin login) para correr la app:

```bash
useradd --system --create-home --home-dir /opt/historias --shell /usr/sbin/nologin historias
```

## 2. Clonar y preparar el proyecto

```bash
cd /opt/historias
git clone <url-de-tu-repo> app
cd app

# Backend
cd backend
npm ci
cp .env.example .env
# Editar .env: GEMINI_API_KEY, ADMIN_TOKEN, CORS_ORIGIN=https://tu-dominio.com
npm run build

# Frontend
cd ../frontend
npm ci
cp .env.example .env
# Editar .env: VITE_API_URL=https://tu-dominio.com
npm run build   # genera frontend/dist, servido por nginx

chown -R historias:historias /opt/historias
```

> Los paths de los ejemplos en `deploy/*.service` asumen que el repo termina
> viviendo en `/opt/historias/backend` y `/opt/historias/frontend`. Si tu
> checkout usa otra carpeta (por ejemplo `/opt/historias/app/backend`),
> ajusta `WorkingDirectory` y `ExecStart` en los archivos `.service` antes de
> instalarlos.

## 3. Servicio de la API (systemd)

```bash
cp deploy/story-api.service /etc/systemd/system/story-api.service
systemctl daemon-reload
systemctl enable --now story-api
systemctl status story-api
curl http://127.0.0.1:8787/api/health   # {"ok":true}
```

## 4. Generacion diaria de historias (systemd timer)

```bash
cp deploy/story-generate.service /etc/systemd/system/story-generate.service
cp deploy/story-generate.timer /etc/systemd/system/story-generate.timer
systemctl daemon-reload
systemctl enable --now story-generate.timer

# Probar la generacion manualmente una vez (usa tu GEMINI_API_KEY real):
systemctl start story-generate.service
journalctl -u story-generate.service -n 50 --no-pager
```

El timer corre todos los dias a las 06:00 (hora del sistema del LXC) con
hasta 10 minutos de retraso aleatorio. Ajusta `OnCalendar` en el `.timer` si
preferis otro horario.

## 5. nginx + TLS

```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/historias
# Editar server_name y la ruta de "root" si corresponde
ln -s /etc/nginx/sites-available/historias /etc/nginx/sites-enabled/historias
nginx -t && systemctl reload nginx

certbot --nginx -d tu-dominio.com
```

## 6. Actualizar la app despues de un cambio

```bash
cd /opt/historias/app
git pull
cd backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
systemctl restart story-api
```

## Notas

- Las historias generadas se guardan en `backend/data/*.json` (no se versionan
  en git). Hace backup de esa carpeta si te importa el historial generado.
- Si Gemini falla un dia (cuota, red, etc.), `story-generate.service` termina
  con error y `latest.json` simplemente no se actualiza: la API sigue
  sirviendo el ultimo lote bueno, y si nunca hubo ninguno, el cliente cae a
  las historias default embebidas en la app.
- `ADMIN_TOKEN` protege `POST /api/admin/generate`, util para forzar una
  generacion manual sin esperar al timer:
  `curl -X POST https://tu-dominio.com/api/admin/generate -H "x-admin-token: <token>"`
- Revisa logs con `journalctl -u story-api -f` y `journalctl -u story-generate -f`.
