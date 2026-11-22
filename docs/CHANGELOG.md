# Changelog

## Current

### Added
- Next.js 14 App Router foundation.
- Better-Auth integration with MongoDB.
- Gmail API integration for application parsing.
- AI Assistant features via Groq SDK.
- User profile schemas and UI.

### Added - Smart Follow-ups
- Tracks emails sent via JobPilot, detects recipient replies through Gmail threads, reminds after 10 days (daily cron), AI-drafts a follow-up and sends only after explicit approval. See `docs/SMART_FOLLOW_UPS.md`.
- Requires new env var `CRON_SECRET` and the `vercel.json` cron registration.
