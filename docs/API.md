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
