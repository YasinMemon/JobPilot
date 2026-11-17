# Smart Follow-ups

Emails sent through JobPilot are tracked. If the recipient has not replied after
10 days, JobPilot creates a notification and offers to draft a follow-up. The
user reviews, edits and explicitly clicks **Send Email**; nothing is ever sent
automatically.

## Flow

1. `POST /api/send-email` sends via Gmail. **Only after Gmail returns a message id** it calls
   `trackSentEmail()` (failed sends are never tracked; emails sent directly in Gmail are never seen).
   `nextFollowUpAt = real sent time + 10 days`.
2. The scheduler (`GET /api/cron/follow-ups`, daily) claims records whose `nextFollowUpAt` has passed,
   reads the Gmail thread, and either
   - marks the record `replied` (and deletes any pending reminder), or
   - creates one `follow_up_reminder` notification (dedupe key `follow-up:<id>:<cycle>`) and sets `reminder_due`.
3. The notification offers **Draft Follow-up / Remind Me Later / Dismiss** and links to
   `/dashboard/follow-ups?open=<id>`.
4. **Draft Follow-up** → `POST /api/follow-ups/:id/draft` (Groq) stores a draft (`draft_ready`). It never sends.
5. The composer (To / Subject / body / original email / application / AI badge) supports
   Regenerate, Save Draft, Cancel, Send Email.
6. **Send Email** → `POST /api/follow-ups/:id/send` with `confirm: true` → atomic `sending` claim →
   fresh reply check → Gmail send in the original thread (`threadId` + `In-Reply-To`/`References`) →
   history, message id, thread id and timestamps are saved **only after Gmail confirms**.
   On failure the edited draft is kept (`draft_ready`) and the user can retry.

## States

`pending → reminder_due → drafting → draft_ready → sending → follow_up_sent`, plus `replied`, `dismissed`, `cancelled`.
Snooze returns to `pending` with a new `reminderCycle` (so the next reminder is not blocked by the old dedupe key).
`FOLLOW_UP_SCHEDULE_DAYS` (`types/followups/type.ts`) drives the sequence: add `7` to schedule a second
follow-up 7 days after the first; no schema change needed.

## Reply detection (`lib/followups/replyDetection.ts`)

A message in the tracked thread is a reply only if it is not the tracked message, has no `SENT`/`DRAFT`
label, is not from the user, arrived after the send time, is **From one of the original recipients
(To/Cc/Bcc)**, and is not automatic (`Auto-Submitted`, `Precedence: auto_reply/bulk`, `X-Autoreply`,
mailer-daemon/postmaster). Subject matching is not used. Replies from a different address (e.g. a colleague
who answers instead) are not detected; the user can always dismiss.

## Scheduling (important)

Production runs on Vercel (`.vercel/` present). Nothing schedules itself, so `vercel.json` registers:

```json
{ "crons": [{ "path": "/api/cron/follow-ups", "schedule": "0 9 * * *" }] }
```

Required manual setup:

1. Set `CRON_SECRET` (any long random string) in the Vercel project's environment variables. Vercel Cron then
   sends `Authorization: Bearer $CRON_SECRET` automatically. Without it the endpoint returns 401 (fails closed).
2. Redeploy so `vercel.json` takes effect; confirm under *Project → Settings → Cron Jobs*.
3. Daily is the most frequent schedule allowed on Vercel's Hobby plan. A 10-day window does not need more.
   On Pro you may use e.g. `0 */6 * * *` for faster reply detection.
4. Manual trigger / smoke test: `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/follow-ups`.

Scheduler properties: atomic per-record claim (`lockedUntil`) so overlapping runs never double-process;
batch of 25 per run with a time budget; 150 ms throttle between Gmail calls; transient Gmail errors
(429/5xx/rate-limit 403/network) retried with exponential backoff; failures back the record off
(1h, 2h, 4h … max 24h) and record `lastCheckError` shown in the UI; expired access tokens are refreshed
with the stored refresh token and persisted (`lib/gmail/userClient.ts`). If a run's batch is exhausted
the rest is picked up by the next run.

> Note: `/api/cron/interview-reminders` (existing) is documented to run every ~15 minutes but has no
> schedule registered in the repository; it is not part of this feature and was left untouched.

## Environment variables

`CRON_SECRET` (new, required for the scheduler). Existing: `DB_URI`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY`, `BETTER_AUTH_*`, `NEXT_PUBLIC_APP_URL`.

## Tests

- Always run: reply detection, retry/classification, AI prompt/parsing, route auth/ownership/approval,
  cron auth, helpers (`npm test`).
- MongoDB integration suite `services/followup.integration.test.ts` (tracking, scheduler idempotency and
  concurrency, replies, draft, approved send, duplicate-send prevention, failure/retry, snooze, dismiss,
  ownership) runs only with `TEST_DB_URI` pointing at a **disposable** database.

## Known limitations

- Reminders are notifications in the app (no email/push), delivered at the cron cadence.
- Existing emails sent before this release are not tracked (no backfill, by design: only JobPilot sends).
- A `sending` claim older than 10 minutes (crashed worker) can be re-claimed.
- Gmail send is not auto-retried (an ambiguous failure could duplicate a delivered email); the user retries.
