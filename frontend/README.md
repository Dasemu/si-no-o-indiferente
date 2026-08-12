# Frontend — Historias Incompletas

App React + Vite. Se empaqueta como sitio web y, con Capacitor, como APK
Android.

## Desarrollo

```bash
npm install
cp .env.example .env   # VITE_API_URL apuntando a tu backend
npm run dev
```

## Build web

```bash
npm run build   # genera dist/
```

## APK (Capacitor)

Ver instrucciones completas en el [README raíz](../README.md#frontend-apk-con-capacitor).
Resumen: `npm run cap:sync` (build + `cap sync android`) y después
`npm run android:open` o `cd android && ./gradlew assembleDebug` con Android
SDK/JDK instalados.

## Estructura relevante

- `src/api.ts` — obtiene el mazo de historias del backend, con fallback a
  cache local y al set default embebido.
- `src/data/defaultStories.json` — historias por defecto (contenido
  original).
- `src/screens/` — Home, selector de historia y vista del narrador.
- `capacitor.config.ts` — config de la app nativa.
