# System Architecture

## High-Level Flow
```text
User
 ↓
Next.js UI (React / Tailwind)
 ↓
Next.js Server Components / API Route Handlers
 ↓
Services (auth.service, ai.service, gmail.service)
 ↓
Database (MongoDB/Mongoose) / External APIs (Groq, Gmail)
```

## Layers
1. **Frontend (app/ & components/):** Handles UI and client state. Uses Shadcn, Antd, Tailwind.
2. **API Layer (app/api/):** Acts as the controller. Validates requests and calls services.
3. **Services (services/):** Contains core business logic (e.g. `ai.service.ts`, `gmail.service.ts`).
4. **Data Access (models/):** Mongoose schemas defining the MongoDB collections.
