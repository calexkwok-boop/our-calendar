# fetch-ics-url

Server-side helper for importing Apple/shared `.ics` URLs, fetching public text/HTML feeds without browser CORS failures, and proxying Alpha Vantage earnings without exposing API keys in the browser.

## What it does

- Accepts `POST { url?, mode?, horizon?, symbols? }`
- Supports `webcal://` (auto-converted to `https://`)
- In `mode: "ics"` (default): validates `BEGIN:VCALENDAR` and returns `icsText`
- In `mode: "text"`: returns raw `text` for public HTML/plain feeds
- In `mode: "alpha_earnings"`: fetches Alpha Vantage `EARNINGS_CALENDAR` via server secret `ALPHA_VANTAGE_API_KEY` and returns CSV `text`

## Deploy

```bash
supabase functions deploy fetch-ics-url
```
