# AGENTS.md — IDS IT Helpdesk

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Zod + react-hook-form, Axios, Recharts
- **Backend:** ASP.NET Core 10 Web API (C#), EF Core + Npgsql, JWT Bearer auth, AutoMapper, BCrypt, Swagger
- **Database:** PostgreSQL (EF Core migrations in `backend/Migrations/`)

## Role system

4 roles seeded by `DbSeeder` (invoked at startup in `Program.cs:178`): Admin, Agent, Manager, Employee.
Self-registration disabled — Super Admin creates all accounts via `AdminController`.

Lookup data (categories, priorities, statuses) seeded in `AppDbContext.OnModelCreating`.

## Backend key facts

- Loads `.env` via DotNetEnv in `Program.cs:15-19` — **do not commit it**
- Port: `http://localhost:5055` (see `Properties/launchSettings.json`)
- Runner command: `dotnet run` (from `backend/`)
- Watch mode: `dotnet watch run`
- Migrations: `dotnet ef database update` (after `dotnet tool restore`)
- Auth policies: `AdminOnly`, `AgentOrAbove`, `ManagerOrAbove`, `AllAuthenticated`
- Rate limiting: 10 req/min on auth endpoints
- SMTP set via env vars (Brevo relay)
- SDK: .NET 10.0.301, target framework `net10.0`

## Frontend key facts

- Port: `http://localhost:3000`
- Runner: `npm run dev` (from `frontend/`)
- Build: `npm run build`
- Lint: `npm run lint` (uses eslint-config-next)
- Env: `NEXT_PUBLIC_API_URL=http://localhost:5055` in `frontend/.env.local`
- Auth token stored in cookie named `token` (js-cookie), auto-refreshed via Axios interceptor (`src/lib/api.ts`)
- Route protection via `src/proxy.ts` (Next.js 16 native proxy middleware)
- shadcn/ui components in `src/components/ui/` (see `components.json` for aliases)
- Dark mode support via `src/lib/theme-provider.tsx` with toggle in sidebar
- Settings stored in `SystemSettings` table (key-value); email templates in `EmailTemplate` table

## Project state (Current)

All 13 non-AI features from `next_features.md` implemented (advanced filters/pagination, category/priority/status CRUD, auto-assignment, mentions, activity logs, maintenance actions, report export PDF/Excel, SLA reports, system monitoring, escalation rules, SignalR real-time notifications). Backend builds cleanly (7 pre-existing nullable warnings). Frontend builds and type-checks successfully — 16 routes compiled. xUnit test project with 3 tests passes. Pre-existing ESLint warnings (24) and `set-state-in-effect` lint errors (9) from React 19 plugin — not introduced by feature work.

## Test project

- Project: `backend/tests/HelpdeskApi.Tests.csproj` (xUnit, Moq, EF Core InMemory)
- Build: `dotnet build tests\HelpdeskApi.Tests.csproj` (from `backend/`)
- Run: `dotnet test tests\HelpdeskApi.Tests.csproj` (from `backend/`)
- NuGet: xunit 2.9.2, Moq 4.20.72, Microsoft.EntityFrameworkCore.InMemory 10.0.9, Microsoft.NET.Test.Sdk 17.12.0
- Tests: `AutoAssignmentServiceTests` (3 tests — returns null when no agents, returns least-loaded agent, placeholder UnitTest1)
- **Important:** The test project lives under `backend/tests/`. The backend `.csproj` has `<Compile Remove="tests\**" />` to prevent the SDK's default glob from pulling test files into the main backend compilation. The project runs on .NET 10 SDK targeting `net10.0` — if you encounter duplicate assembly attribute errors, clean all `obj/` and `bin/` directories before rebuilding.

## Directory layout

```
/frontend/         — Next.js app
  src/app/(auth)/   — login, forgot-password, reset-password
  src/app/(dashboard)/ — dashboard, tickets (CRUD), profile, users, reports, settings, notifications
  src/components/   — shared UI and layout components
  src/lib/          — API client, auth helpers, JWT utils
  src/types/        — TypeScript interfaces
/backend/          — ASP.NET Core API
  Controllers/     — REST endpoints
  Models/          — EF Core entities
  Data/            — AppDbContext, DbSeeder, entity configs
  DTOs/            — request/response types
  Services/        — business logic
  Helpers/         — JWT, password hashing, SMTP settings
  Migrations/      — EF Core migrations
/docs/             — schema SQL, wireframes, diagrams
```

## Constraints

- All users created by Admin/Super Admin only
- JWT secret must be >= 32 chars (`Program.cs:48-51`)
- Backend `.env` contains secrets (DB password, JWT secret, SMTP creds) — never commit
- Use `dotnet ef migrations add <Name>` from `backend/` for schema changes

## Documentation Maintenance Protocol

- Whenever we finalize a significant architectural change or adopt a new coding convention, explicitly summarize these changes.
- If I ask you to "update context," update the relevant section of this AGENTS.md file to reflect the current state of the project.
- Always provide a brief summary of what you are about to change in the file before applying the edit.
