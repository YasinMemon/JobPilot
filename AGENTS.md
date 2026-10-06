<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JobPilot Agent Guidelines

Welcome to the JobPilot project! When working on this project, please adhere to the following rules and guidelines.

## Project Identity
**JobPilot** is a modern job application and career management platform integrated with AI and email parsing capabilities. Target users are job seekers looking to manage, track, and optimize their job applications.
Major features include:
- Gmail integration to automatically parse and track job applications.
- AI-powered career assistant (using Groq SDK).
- Dashboard for application tracking.
- Resume management and candidate profile generation.

**Technology Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Ant Design, Shadcn UI
- **Database:** MongoDB / Mongoose
- **Authentication:** Better-Auth (with MongoDB adapter)
- **AI Integrations:** Groq SDK
- **Email:** Nodemailer, Google APIs

## Architecture
- **Frontend Architecture:** Next.js Server & Client Components in `app/` router. Pages are grouped by route groups like `(admin)`, `(auth)`, `(client)`.
- **Backend/API Architecture:** Next.js API Routes in `app/api/` routing to server actions and Mongoose services in `services/`.
- **Database Architecture:** MongoDB accessed via Mongoose models in `models/`.
- **Authentication:** Better-Auth handles sessions and OAuth (Google).
- **External Services:** Cloudinary (uploads), Google APIs (Gmail fetching).

## Directory Structure
- `app/`: Next.js App Router structure, including API routes (`api/`) and route groups.
- `components/`: Reusable UI components.
- `lib/`: Core utility configurations (Auth, DB, Cloudinary, Gmail client).
- `hooks/`: Custom React hooks.
- `services/`: Backend logic and business services (AI, Email, Applications).
- `models/`: Mongoose schemas (`User`, `Application`, `AIActivity`, etc).
- `types/`: TypeScript type definitions.

## Development Rules
- Prefer existing patterns over introducing new patterns.
- Reuse existing components (Ant Design / Shadcn).
- Reuse existing hooks/services.
- Avoid duplicate API logic.
- Keep TypeScript strict.
- Do not introduce breaking changes without explaining them.

## React / Next.js Rules
- Use Server Components by default. Add `'use client'` only when interactivity is needed.
- API Routes should use Next.js App Router conventions (Route Handlers).
- Use proper data fetching states and Next.js caching where applicable.

## Database Rules
- **Technology:** Mongoose & MongoDB.
- AI agents must inspect existing models before creating new ones.
- Ensure strict typing with interfaces.

## Authentication Rules
- **System:** Better-Auth.
- Includes email/password and Google authentication.
- Never modify authentication behavior without explicitly explaining the impact.

## Security Rules
- Never expose secrets or API keys to the frontend.
- Protect API routes using Better-Auth session verification.
- Safely handle user file uploads (Cloudinary).
- Never log secrets or tokens.

## AI Agent Workflow
1. Understand the request
2. Inspect relevant existing code
3. Identify existing patterns
4. Create a short implementation plan
5. Implement the smallest correct change
6. Run relevant checks
7. Review the diff
8. Report what changed

# Rules for AI Agents
### Before coding
- Read AGENTS.md.
- Inspect the existing implementation.
- Check related API/database models.

### During coding
- Make the smallest reasonable change.
- Follow existing architecture.
- Don't change public APIs unnecessarily.
- Don't change database schemas unless required.
- Don't change authentication without explicit need.

### After coding
- Run lint and build checks.
- Inspect git diff.
- Summarize changes.
