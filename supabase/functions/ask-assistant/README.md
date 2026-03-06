## ask-assistant

Edge Function that proxies AI assistant requests to OpenAI.

### Required secrets

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default: `gpt-4.1-mini`)

### Deploy

```bash
npx supabase@latest functions deploy ask-assistant --no-verify-jwt
```

### Request body

```json
{
  "messages": [
    { "role": "user", "content": "Plan my week" }
  ],
  "context": {
    "selectedDate": "2026-03-06",
    "calendarView": "month"
  }
}
```
