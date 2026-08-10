
# IT Help Desk & Ticketing Management System

A modern, full-stack web-based IT Help Desk and Ticketing system built as part of a Full Stack Web Development Internship. The system allows employees to submit support tickets, IT agents to manage and resolve them, and admins to oversee the full workflow — all through a clean, responsive SaaS-style interface.

---

## Tech Stack

| Layer       | Technology                                                                     |
|-------------|--------------------------------------------------------------------------------|
| Frontend    | Next.js 16.2.6 (App Router), TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix) |
| Auth        | Zod 4, react-hook-form, js-cookie                                             |
| Data/API    | Axios, @tanstack/react-query 5, @microsoft/signalr 10                         |
| UI/Charts   | sonner (toast), lucide-react, Recharts, tw-animate-css, dom-to-image-more     |
| Backend     | ASP.NET Core net10.0 Web API, EF Core 10.0.9 + Npgsql 10.0.2                 |
| Auth (BE)   | JWT Bearer (token versioning for revocation), Otp.NET (2FA via TOTP)          |
| Libs (BE)   | AutoMapper 16, BCrypt.Net-Next 4.0.3, Swashbuckle 6.6.2, DotNetEnv 3.2.0     |
| Reporting   | QuestPDF (PDF), ClosedXML 0.104.2 (Excel)                                     |
| Real-time   | SignalR 10 (hub: `/hubs/notifications`)                                       |
| AI          | Groq API (auto-categorization, priority suggestions, suggested replies, attachment scanning, conversational chat with persistent sessions) |
| Database    | PostgreSQL (EF Core migrations in `backend/Migrations/`)                      |

---

## System Roles

The codebase has **4 roles** (seeded idempotently by `DbSeeder`). No "Super Admin" role exists.

| Role     | Description                                                          |
|----------|----------------------------------------------------------------------|
| Admin    | Full system access. Can create users, manage settings, view logs.    |
| Agent    | Handles, resolves, and comments on assigned tickets.                 |
| Manager  | Monitors team tickets, views reports and agent performance.          |
| Employee | Creates and tracks their own support tickets.                       |

> **Note:** User self-registration is disabled. All accounts are created exclusively by Admin users via `POST /api/users` (`UsersController`, `AdminOnly` policy).

---

## Features

All listed modules are implemented unless marked otherwise.

* **Authentication & User Management** — JWT login, forgot/reset/change password, 2FA (TOTP via Otp.NET), account lockout after failed attempts, role-based access, token versioning for instant revocation
* **Ticket Management** — Full CRUD with search, filter, sort, pagination; categories (6), priorities (4), statuses (6); auto-generated reference numbers
* **Assignment & Workflow** — Assign/unassign tickets, role-based permissions, auto-assignment service, full status and assignment history tracking, SLA deadline/breach tracking, escalation engine (background hosted service via configurable rules)
* **Notifications** — Real-time in-app notifications (SignalR hub), email alerts via `EmailTemplate` placeholders (`{Name}`, `{ReferenceNumber}`, `{TicketUrl}`, `{NewStatus}`)
* **Dashboard & Analytics** — Role-specific dashboards with ticket stats, priority breakdowns, agent performance metrics, tickets-over-time charts (Recharts)
* **File Attachments** — Upload/download with MIME validation, AI-powered scanning for issue detection
* **Admin Panel** — User CRUD, role updates, toggle active/deactivate, unlock accounts, category/priority/status CRUD, system settings (key-value), maintenance mode toggle
* **Reports** — PDF export (QuestPDF) and Excel export (ClosedXML), SLA compliance reports
* **AI Features** — Auto-categorization, priority suggestions, suggested replies, attachment analysis via **Groq API** (endpoints under `AiController`)
* **AI Chat** — Conversational AI assistant (HELIX) with persistent sessions, SSE streaming, and tool-calling support (`POST /api/ai/chat`, session CRUD at `/api/ai/sessions/*`)
* **Knowledge Base** *— Not implemented*

---

## Ticket Reference

**Categories:** Hardware · Software · Network · Email · Access Request · Other

**Priorities:** Low · Medium · High · Critical

**Statuses:** Open · In Progress · Resolved · Closed · Cancelled · Pending

Tickets are auto-assigned a reference number on creation (e.g. `TKT-20260703-1001`).

---

## Repository Structure

```
/
├── frontend/               # Next.js 16 (TypeScript) application
├── backend/                # ASP.NET Core net10.0 Web API (C#)
│   ├── backups/            # Database backup snapshots
│   ├── wwwroot/            # Static assets served by the API
│   └── tests/              # xUnit test project (excluded from main build)
├── docs/
│   ├── diagrams/           # System architecture, ERD, workflow diagrams (.png)
│   ├── wireframes/         # UI mockup screenshots (.png) by feature
│   └── schema/             # ERD diagram and SQL schema
│       ├── erd.png
│       └── schema.sql
├── AGENTS.md               # OpenCode instruction file
└── README.md
```

---

## Branching Strategy

| Branch          | Purpose                                                          |
| --------------- | ---------------------------------------------------------------- |
| `main`        | Stable, production-ready code only                               |
| `develop`     | Active development — all feature branches merge here first      |
| `feat/<name>` | Individual feature branches (e.g.`feat/auth`,`feat/tickets`) |

All work is done on feature branches and merged into `develop` via pull request. `main` is only updated at stable milestones.

---

## Diagrams & Wireframes

Available in the `docs/` directory:

| Asset | Location |
|-------|----------|
| System Architecture | `docs/diagrams/architecture.png` |
| Entity Relationship Diagram | `docs/schema/erd.png` |
| Dashboard mockup | `docs/wireframes/dashboard.png` |
| Tickets list mockup | `docs/wireframes/tickets.png` |
| New ticket form mockup | `docs/wireframes/new_ticket.png` |
| Notifications panel | `docs/wireframes/notifications.png` |
| Analytics/Reports | `docs/wireframes/analytics.png` |
| Settings (light mode) | `docs/wireframes/settings.png` |
| Settings (dark mode) | `docs/wireframes/settings_dark_mode.png` |
| User profile | `docs/wireframes/user_profile.png` |

---

## Database Schema

The SQL schema is in `docs/schema/schema.sql`. Seeding is handled by `DbSeeder` (C#) — no SQL seed script is used.

**Tables:**

| Core entities  | Tracking & history             | Configuration          |
|----------------|-------------------------------|------------------------|
| Users          | TicketStatusHistory           | SystemSettings         |
| Roles          | TicketAssignmentHistory       | EmailTemplates         |
| Tickets        | ActivityLogs                  | SlaTargets             |
| Categories     | Notifications                 | EscalationRules        |
| Priorities     | RefreshTokens                 |                        |
| Statuses       | TicketAttachments             |                        |
|                | TicketComments                |                        |
| AiChatSessions |                               |                        |
| AiChatMessages |                               |                        |

---

## Setup Instructions

Full setup instructions updated to reflect current backend and frontend implementations below.

### Prerequisites

- Node.js 18+
- .NET **10** SDK
- PostgreSQL 12+ (15+ recommended)
- Optional: `docker` / `docker-compose` for containerized DB

> The backend uses EF Core migrations (see `backend/Migrations`) and includes seed logic; the frontend expects the API to be reachable via an environment variable.

### Environment variables

**Backend:** create `backend/.env` (already gitignored) with at minimum:

```
JwtSettings__Secret=<at least 32 characters>
ConnectionStrings__DefaultConnection=Host=localhost;Database=helpdesk;Username=postgres;Password=...
```

Additional optional variables:
- `SmtpSettings__Host`, `SmtpSettings__Port`, `SmtpSettings__Username`, `SmtpSettings__Password` — for outgoing email
- `AllowedCorsOrigins` — comma-separated origins (defaults to `http://localhost:3000`)
- `SeedTestData` — set `true` (or configure in `appsettings.Development.json`) to seed demo data

**Frontend:** create `frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:5055
```

### Database (local)

1. Create the database (example using psql):

```bash
createdb helpdesk
```

2. Apply EF Core migrations from the `backend` folder:

```bash
cd backend
dotnet tool restore
dotnet ef database update
```

If you don't have `dotnet-ef` installed, install it globally or run via `dotnet tool install --global dotnet-ef`.

The project includes a `DbSeeder` that populates sample data at startup when `SeedTestData: true` (set in `appsettings.Development.json` or via env var). It creates 15 users, 35 tickets with status/assignment history, comments, attachments, notifications, and more.

Key test logins (all with password `Test@1234`):

| Email | Role |
|-------|------|
| `admin@test.com` | Admin |
| `bob.agent@test.com` | Agent |
| `eve.manager@test.com` | Manager |
| `diana@test.com` | Employee |

### Run the backend

From the repository root or the `backend` folder:

```bash
cd backend
dotnet restore
dotnet run
```

For iterative development use `dotnet watch run` (requires the .NET SDK workload for watch).

Default backend listens on `http://localhost:5055` (or as configured by `launchSettings.json` / environment).

### Run the frontend (development)

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `NEXT_PUBLIC_API_URL` to reach the backend API. Route guard logic exists in `frontend/src/proxy.ts` but is **not active** (no `middleware.ts` registers it — must be wired manually if needed).

### Production build

Frontend:

```bash
cd frontend
npm run build
npm run start
```

Backend (publish):

```bash
cd backend
dotnet publish -c Release -o ./publish
```

### Notes & security

- Do not commit secret environment files. Use the `.gitignore` files provided to exclude local `.env` files, keys, and certificates.
- `backend/appsettings.json` contains defaults only — put real secrets in environment variables or secure stores.
- Migrations are stored in `backend/Migrations` and should be reviewed before merging to `main`.


---

## Weekly Progress

| Week | Focus                                          | Status |
| ---- | ---------------------------------------------- | ------ |
| 1    | Requirements, wireframes, ERD, repo setup      | ✅ Complete |
| 2    | Project scaffolding, JWT auth, user management | ✅ Complete (incl. 2FA, token versioning, lockout) |
| 3    | Ticket CRUD, categories & priorities           | ✅ Complete (search, filter, sort, pagination) |
| 4    | Assignment workflow, comments, statuses        | ✅ Complete (auto-assignment, SLA, escalation) |
| 5    | Notifications, file uploads, dashboard         | ✅ Complete (SignalR real-time, AI scanning) |
| 6    | Reports, charts, export, AI integration        | ✅ Complete (PDF, Excel, Groq AI) |
| 7    | Testing, bug fixing, responsive UI             | ✅ Complete (xUnit + Moq + InMemory) |
| 8    | Deployment, documentation, final demo          | 🔄 In Progress |

---

## Author

**Name:** `<!-- TODO: your name -->`

**Internship Period:** `<!-- TODO: start date – end date -->`

**Supervisor:** `<!-- TODO: supervisor name -->`
