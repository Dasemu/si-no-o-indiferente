# Sí, no, o indiferente

A lateral-thinking story game (in the style of "tell a puzzle, everyone else
guesses the full explanation by asking yes/no questions") for 2 or more
players sharing a single device. Web + APK (Capacitor).

- One player narrates: they pick a story, read the puzzle aloud, and answer
  yes/no questions from the rest of the group until they guess (or give up
  on) the full solution.
- The app ships with a default deck of stories embedded, and also tries to
  download an "updated" deck from its own backend, which generates 5 new
  stories a day using the Gemini API. If there's no connection or the
  backend has nothing available, the default deck is used.

## Repo structure

```
backend/    Node/Express API that serves /api/stories and generates new
            stories with Gemini (backend/README.md)
frontend/   React + Vite app, packageable as an Android APK with Capacitor
            (frontend/README.md)
deploy/     Example systemd units + nginx config for production
```

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY and ADMIN_TOKEN
npm run dev             # http://localhost:8787
```

Generate stories manually (uses your real GEMINI_API_KEY):

```bash
npm run generate
```

### Frontend (web)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8787 in dev
npm run dev             # http://localhost:5173
```

### Frontend (APK with Capacitor)

Requires Android Studio / Android SDK + JDK 17 installed on your development
machine (this can't be generated in this environment). Once installed:

```bash
cd frontend
npm run cap:sync    # builds the web app + copies assets into android/
npm run android:open  # opens the project in Android Studio to build/sign the APK
```

You can also build it from the command line once you have the SDK:

```bash
cd frontend/android
./gradlew assembleDebug
# APK at frontend/android/app/build/outputs/apk/debug/
```

## Default content

`frontend/src/data/defaultStories.json` has 16 original stories written for
this project (not extracted from any third-party commercial game), used as
a fallback when there's no connection to the backend or no batch has been
generated yet.

## Production

Example systemd/nginx configs live in the `deploy/` folder.

## Gemini API key

Get one at https://aistudio.google.com/apikey and put it in `backend/.env`
as `GEMINI_API_KEY`.
