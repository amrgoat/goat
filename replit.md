# Royal Gaming Zone

A gaming center management system with a customer portal and admin/staff panel.

## What It Does

- **Customer Portal** — Phone-based registration, wallet management, and session booking
- **Admin/Staff Panel** — Account management, role assignments (`owner`, `admin`, `staff`, `player`), balance adjustments, and booking oversight

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query, Framer Motion |
| Backend | Node.js 24, Express 5, Drizzle ORM |
| Database | PostgreSQL (Replit built-in) |
| Monorepo | pnpm workspaces |

## How to Run

Both services are configured as managed workflows:

| Service | Workflow name | Port |
|---|---|---|
| Frontend | `artifacts/royal-gaming-zone: web` | 26077 |
| API Server | `artifacts/api-server: API Server` | 8080 |

They start automatically. To restart manually, use the Workflows panel.

## Environment Variables

| Variable | Source |
|---|---|
| `DATABASE_URL` | Auto-provisioned by Replit (do not set manually) |
| `SESSION_SECRET` | Set as a Replit Secret |
| `PORT` | Injected by the workflow runner |
| `BASE_PATH` | Injected by the workflow runner |

## Database

Schema is managed with Drizzle ORM. To push schema changes to the dev database:

```bash
pnpm --filter @workspace/db run push
```

## Generated Packages (stub placeholders)

`lib/api-client-react` and `lib/api-zod` are stub packages that satisfy TypeScript project references. They are intended to be populated by an OpenAPI codegen step (orval) when an OpenAPI spec is added to `lib/api-spec/`. Until then, neither package exports any real types or hooks.

## Setup Status

Imported project set up on Replit: dependencies installed, dev DB schema pushed via `pnpm --filter @workspace/db run push`, both workflows verified running.

## User Preferences

- Keep the existing project structure — do not restructure or migrate to a different stack
