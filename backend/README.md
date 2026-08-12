# Backend — Historias Incompletas

API en Node/Express (TypeScript) que sirve el mazo de historias "actualizado"
y lo regenera una vez al día llamando a la API de Gemini.

## Endpoints

- `GET /api/health` — chequeo de salud.
- `GET /api/stories` — último lote de historias generado. `204` si todavía
  no se generó ninguno (el cliente debe usar su set default en ese caso).
- `POST /api/admin/generate` — dispara una generación manual con Gemini.
  Requiere header `x-admin-token` igual a `ADMIN_TOKEN`.

## Desarrollo

```bash
npm install
cp .env.example .env   # completa GEMINI_API_KEY y ADMIN_TOKEN
npm run dev             # http://localhost:8787
npm run generate        # genera un lote nuevo a mano (llama a Gemini de verdad)
```

## Producción

```bash
npm run build
npm start                 # corre dist/index.js
npm run generate:built    # corre dist/scripts/generateDaily.js (lo usa el systemd timer)
```

Ver [`../docs/DEPLOY.md`](../docs/DEPLOY.md) para el setup completo con
systemd + nginx en un LXC de Debian.

## Almacenamiento

Las historias generadas se guardan como JSON plano en `data/` (configurable
con `DATA_DIR`): un archivo por día (`YYYY-MM-DD.json`) y `latest.json`, que
es lo que sirve `GET /api/stories`. No hay base de datos — a este volumen
(5 historias/día) un archivo JSON con escritura atómica alcanza y sobra.
