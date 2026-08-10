# AGENTS.md — IDS IT Helpdesk

## Stack

- **Frontend:** Next.js 16.2.6 (App Router), TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix), Zod 4 + react-hook-form, Axios, Recharts, @tanstack/react-query 5, @microsoft/signalr 10, sonner (toast), js-cookie, lucide-react, tw-animate-css
- **Backend:** ASP.NET Core net10.0 Web API, EF Core 10.0.9 + Npgsql 10.0.2, JWT Bearer auth (token versioning for revocation), AutoMapper 16.1.1, BCrypt.Net-Next 4.0.3, Swashbuckle 6.6.2, QuestPDF, ClosedXML 0.104.2, SignalR, DotNetEnv 3.2.0, Otp.NET (2FA via TOTP)
- **DB:** PostgreSQL (EF Core migrations in `backend/Migrations/`)

## Commands

| Task | Command (from `backend/`) |
|------|--------------------------|
| Dev server | `dotnet run` (port 5055) |
| Watch mode | `dotnet watch run` |
| Migrations | `dotnet ef database update` (after `dotnet tool restore`) |
| New migration | `dotnet ef migrations add <Name>` |
| Test | `dotnet test tests\HelpdeskApi.Tests.csproj` |
| Build test | `dotnet build tests\HelpdeskApi.Tests.csproj` |

| Task | Command (from `frontend/`) |
|------|--------------------------|
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Typecheck | No dedicated script — relies on build-time checking |

## Backend architecture

- **`Program.cs`** wires everything. Loads `backend/.env` via DotNetEnv (never commit — gitignored). Enforces JWT secret >= 32 chars at startup. Invokes `DbSeeder.SeedAsync` in a startup scope, then `SeedTestDataAsync` if `SeedTestData: true` (set in `appsettings.Development.json`).
- **Auth policies:** `AdminOnly`, `AgentOrAbove`, `ManagerOrAbove`, `AllAuthenticated`.
- **Rate limiting:** 10 req/min fixed window on `AuthPolicy` — applied to auth endpoints via `[EnableRateLimiting("AuthPolicy")]`.
- **SignalR hub:** `/hubs/notifications` — tokens accepted via query string (`access_token`) for WebSocket connections. Frontend client in `src/lib/signalr.ts`.
- **Test quirk:** `backend/tests/` excluded from main compilation via `<Compile Remove="tests\**" />`. Uses xUnit + Moq + EF Core InMemory. If you hit duplicate assembly attribute errors, clean all `obj/` and `bin/` dirs.
- **Settings pattern:** `SystemSettings` table (key-value), `EmailTemplate` table with placeholders (`{Name}`, `{ReferenceNumber}`, `{TicketUrl}`, `{NewStatus}`).
- **2FA:** Otp.NET library, endpoints under `/api/auth/2fa/*`. Auth flow supports `requiresTwoFactor` in login response; a separate `twoFactorToken` is used for the second step.
- **Account lockout:** `User.FailedLoginAttempts` and `User.LockedUntil` fields. Admin can unlock via `POST /api/users/{id}/unlock`.
- **Cookie fallback for token:** JWT is also accepted from a cookie named `token` for `/api/tickets/*` endpoints (enables PDF/image export via browser `href`). See `Program.cs:116-123`.
- **Refresh token:** Stored in HTTP-only cookie (`refreshToken`), not in js-cookie. Backend auto-refreshes via Axios 401 interceptor on 401 — `POST /auth/refresh`, then retries the original request.
- **No Repository layer:** The `Repositories/` directory is empty. All data access is done directly in service classes via `AppDbContext`.
- **QuestPDF:** License set to `LicenseType.Community` in `Program.cs`.
- **Escalation:** `EscalationBackgroundService` runs as a hosted service; `EscalationService` checks rules from `EscalationRules` table.
- **AI:** `AiService` integrates with Groq API (`llama-3.3-70b-versatile`, `llama-4-scout-17b`) for auto-categorization, priority suggestions, suggested replies, and attachment scanning. Also includes a conversational AI chat (`POST /api/ai/chat` — SSE streaming) with persistent sessions (`AiChatSession`/`AiChatMessage` tables; CRUD at `/api/ai/sessions/*`). All under `AiController`.

## Frontend architecture

- **Auth token** stored in cookie named `token` (js-cookie, sameSite: strict, 1-day expiry). Auto-refreshed via Axios 401 response interceptor (`src/lib/api.ts`) — POST `/auth/refresh`, retries original request.
- **Route protection:** `src/proxy.ts` provides the guard logic but is **not** auto-registered as Next.js middleware (no `middleware.ts` exists — it must be manually wired if used). Matches all routes except `_next/static|_next/image|favicon.ico|api/`. Public paths: `/login`, `/forgot-password`, `/reset-password`. Admin-only: `/admin`, `/users`, `/settings`, `/activity-logs`, `/monitoring`. Reports: Admin + Manager only.
- **API clients:** per-entity modules in `src/lib/api/` (tickets.ts, users.ts, auth.ts, etc.) — use these instead of raw Axios.
- **Env:** `NEXT_PUBLIC_API_URL=http://localhost:5055` in `frontend/.env.local` (fallback to `http://localhost:5055/api` in `api.ts`).
- **shadcn/ui** components in `src/components/ui/`. Aliases per `components.json`: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`.
- **Theme:** dark mode via `src/lib/theme-provider.tsx` (uses `useSyncExternalStore`, persists to `localStorage.theme`, respects `prefers-color-scheme`).
- **Roles (4, no "Super Admin"):** Admin, Agent, Manager, Employee — typed as `Role` in `src/types/index.ts`. **README mentions "Super Admin" but the code does not have one — `DbSeeder` is the source of truth.**
- **Providers:** `ThemeProvider` wraps `Providers` (React Query) in root layout (`src/app/layout.tsx`).
- **Sidebar nav:** Per-role sections defined in `SidebarNav.tsx`. SignalR connection starts on mount for real-time notification badge updates.
- **AI Chat assistant:** Floating chat bubble (`ChatAssistant.tsx`) in the dashboard layout, connects to the SSE streaming chat endpoint. API client at `src/lib/api/ai-chat.ts`.

## Test data

`appsettings.Development.json` sets `SeedTestData: true`, which triggers `SeedTestDataAsync` in `DbSeeder`. Creates 15 users, 35 tickets, comments, attachments, notifications, activity logs, system settings, escalation rules, and refresh tokens. Key login:

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `Test@1234` | Admin |
| `bob.agent@test.com` | `Test@1234` | Agent |
| `eve.manager@test.com` | `Test@1234` | Manager |
| `diana@test.com` | `Test@1234` | Employee |

## Seeded lookup data

### Statuses (IDs used in DB and API)
| ID | Name |
|----|------|
| 1 | Open |
| 2 | In Progress |
| 3 | Resolved |
| 4 | Closed |
| 5 | Cancelled |
| 6 | Pending |

### SLA targets (by priority)
| Priority | Target hours |
|----------|-------------|
| Critical | 4 |
| High | 8 |
| Medium | 24 |
| Low | 72 |

### Priorities (seeded in `AppDbContext.OnModelCreating`)
1=Low, 2=Medium, 3=High, 4=Critical

### Categories (seeded in `AppDbContext.OnModelCreating`)
1=Hardware, 2=Software, 3=Network, 4=Access Request, 5=Other, 6=Email

## Setup

Create `backend/.env` (gitignored) with:
```
JwtSettings__Secret=<at least 32 chars>
ConnectionStrings__DefaultConnection=Host=localhost;Database=helpdesk;Username=postgres;Password=...
```

- 4 roles seeded idempotently by `DbSeeder.SeedAsync`. Self-registration disabled — only Admin can create users via `UsersController` (`POST /api/users`).
- Lookup data (categories, priorities, statuses, email templates, SLA targets) seeded in `AppDbContext.OnModelCreating` via `HasData()`.
