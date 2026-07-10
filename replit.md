# Royal Gaming Zone

A management system for a gaming café/esports center (Padampur). Includes a customer-facing landing page, booking portal, and admin dashboard.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Framer Motion + Wouter + TanStack Query
- **Backend**: Node.js + Express 5 + Drizzle ORM
- **Database**: PostgreSQL (Replit-managed)
- **Shared libs**: `lib/db` (schema + client), `lib/api-zod` (validation), `lib/api-client-react` (React hooks)
- **Integrations**: Telegram Bot (configured via admin UI, not env vars)

## Running the app

Two services run in parallel:

| Service | Workflow | Port |
|---|---|---|
| React frontend | `artifacts/royal-gaming-zone: web` | 26077 (auto) |
| API server | `artifacts/api-server: API Server` | 8080 (auto) |

Start both workflows from the Replit workflow panel.

## Database

The Replit-managed PostgreSQL database is used automatically via `DATABASE_URL` (runtime-managed). To push schema changes:

```bash
cd lib/db && pnpm run push
```

## Seeding owner/admin accounts

Set these secrets in Replit before starting the API server:

- `OWNER_1_PHONE` — 10-digit phone number
- `OWNER_1_PASSWORD` — password (min 8 chars)
- `OWNER_1_NAME` — display name (optional)
- `OWNER_2_PHONE` / `OWNER_2_PASSWORD` / `OWNER_2_NAME` — optional second owner

The server seeds these on startup and skips them gracefully if not set.

## Telegram notifications

Configure the Telegram bot token and chat IDs via the admin dashboard UI (Settings → Telegram). No env vars required.

## Session secret

`SESSION_SECRET` is already set as a Replit secret.

## User preferences
