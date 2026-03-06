## send-immediate-push

Edge Function to send immediate web push notifications when users add events or list items.

### Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:you@example.com`)

### Deploy

```bash
supabase functions deploy send-immediate-push --no-verify-jwt
```

### Expected request body

```json
{
  "type": "event",
  "title": "Calendar Update",
  "body": "Alex added \"Dentist\".",
  "data": { "url": "/" },
  "actorUserId": "<uuid>",
  "actorEmail": "user@example.com",
  "layerId": "<layer-id-or-null>",
  "subCalendarId": "<sub-cal-id-or-null>"
}
```

### Notes

- Sends to the actor and shared collaborators with enabled `push_subscriptions`.
- Invalid subscriptions (404/410) are auto-disabled.
