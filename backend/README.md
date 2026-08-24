# Backend — Sí, no, o indiferente

Node/Express (TypeScript) API that serves the "updated" story deck and
regenerates it once a day by calling the Gemini API.

## Endpoints

- `GET /api/health` — health check.
- `GET /api/stories` — latest generated story batch. `204` if none has been
  generated yet (the client should fall back to its default set in that
  case).
- `POST /api/admin/generate` — triggers a manual generation with Gemini.
  Requires an `x-admin-token` header matching `ADMIN_TOKEN`.
- `POST /api/stories/:id/ratings` — records a player's voluntary 1-5
  difficulty rating for a story (`{ "rating": 1-5 }` body). Open endpoint,
  no auth required. Works for any story id, including ones from the
  frontend's embedded default set.

## Development

```bash
npm install
cp .env.example .env   # fill in GEMINI_API_KEY and ADMIN_TOKEN
npm run dev             # http://localhost:8787
npm run generate        # generates a new batch by hand (calls Gemini for real)
npm run reclassify      # reclassifies difficulty from collected ratings by hand
```

## Production

```bash
npm run build
npm start                   # runs dist/index.js
npm run generate:built      # runs dist/scripts/generateDaily.js (used by the systemd timer)
npm run reclassify:built    # runs dist/scripts/reclassifyDifficulty.js (used by the systemd timer)
```

See the example unit files in `../deploy/` for the systemd + nginx setup.

## Storage

Generated stories are stored as plain JSON files in `data/` (configurable
via `DATA_DIR`): one file per day (`YYYY-MM-DD.json`) plus `latest.json`,
which is what `GET /api/stories` serves. There's no database — at this
volume (5 stories/day) a JSON file with atomic writes is more than enough.

Player difficulty ratings are appended to `data/ratings.json` as they come
in. The `reclassifyDifficulty` script (run periodically via
`story-reclassify.timer`) averages the ratings for each story and, once a
story has at least `MIN_RATINGS_FOR_RECLASSIFICATION` votes, updates its
difficulty band in `latest.json` if the average points to a different one.
