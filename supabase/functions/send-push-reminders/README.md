## send-push-reminders

Edge Function that sends web push reminders for upcoming events.

### Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:you@example.com`)

### Deploy

```bash
supabase functions deploy send-push-reminders --no-verify-jwt
```

### Schedule (every minute)

Use Supabase Scheduled Functions (or external cron) to call:

`POST https://<project-ref>.functions.supabase.co/send-push-reminders`

with headers:

- `Authorization: Bearer <service_role_key>`
- `Content-Type: application/json`

### Notes

- Function dedupes sends via `public.push_notification_log`.
- Expired push subscriptions are auto-disabled.
