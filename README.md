# Historias Incompletas

Juego de historias de pensamiento lateral (estilo "cuenta un enigma, el resto
adivina la explicación completa haciendo preguntas de sí/no") para 2 o más
jugadores compartiendo un mismo dispositivo. Web + APK (Capacitor).

- Un jugador narra: elige una historia, lee en voz alta el enigma, y
  responde preguntas de sí/no del resto del grupo hasta que adivinan (o se
  rinden) la solución completa.
- La app trae un mazo de historias por defecto embebido, y además intenta
  bajar un mazo "actualizado" desde un backend propio que genera 5 historias
  nuevas por día con la API de Gemini. Si no hay conexión o el backend no
  tiene nada disponible, se usa el mazo default.

## Estructura del repo

```
backend/    API en Node/Express que sirve /api/stories y genera historias
            nuevas con Gemini (backend/README.md)
frontend/   App React + Vite, empaquetable como APK con Capacitor
            (frontend/README.md)
deploy/     Unidades systemd + config de nginx de ejemplo para producción
docs/       Guía de deploy paso a paso (docs/DEPLOY.md)
```

## Desarrollo local

### Backend

```bash
cd backend
npm install
cp .env.example .env   # completa GEMINI_API_KEY y ADMIN_TOKEN
npm run dev             # http://localhost:8787
```

Generar historias manualmente (usa tu GEMINI_API_KEY real):

```bash
npm run generate
```

### Frontend (web)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8787 en dev
npm run dev             # http://localhost:5173
```

### Frontend (APK con Capacitor)

Requiere Android Studio / Android SDK + JDK 17 instalados en tu máquina de
desarrollo (esto no se puede generar en este entorno). Una vez instalados:

```bash
cd frontend
npm run cap:sync    # build web + copia assets a android/
npm run android:open  # abre el proyecto en Android Studio para compilar/firmar el APK
```

También podés compilar por línea de comandos una vez que tengas el SDK:

```bash
cd frontend/android
./gradlew assembleDebug
# APK en frontend/android/app/build/outputs/apk/debug/
```

## Contenido por defecto

`frontend/src/data/defaultStories.json` tiene 16 historias originales
escritas para este proyecto (no extraídas de ningún juego comercial de
terceros), usadas como fallback cuando no hay conexión al backend o todavía
no se generó ningún lote.

## Producción

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md) para el paso a paso de deploy en un
LXC de Debian sin Docker, con systemd + nginx + certbot, apuntando a tu
propio dominio.

## API key de Gemini

Conseguila en https://aistudio.google.com/apikey y ponela en
`backend/.env` como `GEMINI_API_KEY`.
