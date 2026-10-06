# Authentication Flow

## Better-Auth
JobPilot uses **Better-Auth** with the MongoDB adapter.

- **Flows:** Standard Email/Password and Google OAuth.
- **Session:** Cookie-based sessions handled automatically.
- **Middleware:** Next.js middleware is used to protect routes and verify sessions on the server.
- **Database:** Uses Better-Auth's tables embedded in MongoDB (users, sessions, accounts).

## Modifications
Do not modify the core authentication logic in `lib/auth.ts` unless strictly necessary, as Better-Auth manages the heavy lifting.
