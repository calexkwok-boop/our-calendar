# fetch-ics-url

Server-side helper for importing Apple/shared `.ics` URLs without browser CORS failures.

## What it does

- Accepts `POST { url }`
- Supports `webcal://` (auto-converted to `https://`)
- Fetches ICS server-side
- Returns JSON with `icsText` when successful

## Deploy

```bash
supabase functions deploy fetch-ics-url
```

