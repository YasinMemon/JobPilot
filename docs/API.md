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
