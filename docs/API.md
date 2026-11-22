# API Routes

Grouped by domains found in `app/api/`:

## Authentication (`app/api/auth/`)
Handled natively via Better-Auth client and server instances.

## AI (`app/api/ai/`)
Endpoints for invoking the Groq SDK and AI services.

## Applications (`app/api/applications/`)
Endpoints for CRUD operations on job applications and triggering Gmail synchronization.

## Email (`app/api/email/`)
Endpoints for managing Gmail integrations and fetching emails.

*Note: All APIs must verify the user session using Better-Auth.*

## Notifications
All require a Better Auth session; the user id always comes from the session.
- `GET /api/notifications?limit&cursor&unreadOnly` - cursor-paginated list
- `GET /api/notifications/unread-count` - badge count
- `PATCH /api/notifications/:id` - mark read; `DELETE /api/notifications/:id` - delete
- `POST /api/notifications/read-all` - mark all read
- `POST /api/admin/announcements` - admin only; broadcast `{title, message, link?, idempotencyKey?}`
- `GET /api/cron/interview-reminders` - scheduler only; requires `Authorization: Bearer $CRON_SECRET` (run every ~15 min)
- `PATCH /api/applications/:id` now also accepts `interviewAt` (ISO string or null)

## Smart Follow-ups
All user endpoints require a Better Auth session; the user id comes from the session and every record is ownership-checked (other users' records return 404). See `docs/SMART_FOLLOW_UPS.md`.
- `GET /api/follow-ups?status&applicationId&limit&skip` - tracked emails + summary counts
- `GET /api/follow-ups/due` - reminders awaiting action
- `GET /api/follow-ups/:id` - details and follow-up history
- `POST /api/follow-ups/:id/draft` - generate/regenerate AI draft (never sends); `PUT` saves edits `{to, subject, body}`
- `POST /api/follow-ups/:id/send` - `{to, subject, body, confirm: true}`; sends the approved follow-up in the original Gmail thread
- `POST /api/follow-ups/:id/snooze` - `{days}` or `{until}`; `POST /api/follow-ups/:id/dismiss`
- `POST /api/follow-ups/:id/check-reply` - live Gmail reply check
- `GET /api/cron/follow-ups` - scheduler only; `Authorization: Bearer $CRON_SECRET` (registered in `vercel.json`, daily)
