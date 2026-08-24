# Frontend — Sí, no, o indiferente

React + Vite app. Packaged as a website and, with Capacitor, as an Android
APK.

## Development

```bash
npm install
cp .env.example .env   # VITE_API_URL pointing to your backend
npm run dev
```

## Web build

```bash
npm run build   # generates dist/
```

## APK (Capacitor)

See the full instructions in the
[root README](../README.md#frontend-apk-with-capacitor).
Summary: `npm run cap:sync` (build + `cap sync android`) and then
`npm run android:open`, or `cd android && ./gradlew assembleDebug` with the
Android SDK/JDK installed.

## Relevant structure

- `src/api.ts` — fetches the story deck from the backend, with fallback to
  the local cache and the embedded default set.
- `src/data/defaultStories.json` — default stories (original content).
- `src/screens/` — Home, story picker, and narrator view.
- `capacitor.config.ts` — native app config.
