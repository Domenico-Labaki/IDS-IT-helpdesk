
# IT Help Desk & Ticketing Management System

A modern, full-stack web-based IT Help Desk and Ticketing system built as part of a Full Stack Web Development Internship. The system allows employees to submit support tickets, IT agents to manage and resolve them, and admins to oversee the full workflow — all through a clean, responsive SaaS-style interface.

---

## Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Frontend | Next.js 14+ (TypeScript)  |
| Backend  | ASP.NET Core Web API (C#) |
| Database | PostgreSQL                |
| Auth     | JWT (JSON Web Tokens)     |
| Styling  | Tailwind CSS + Shadcn UI  |

---

## System Roles

| Role                       | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| **Super Admin**      | Full system access. Only role that can create new users and admins. |
| **Admin**            | Manages tickets, users, categories, and system settings.            |
| **IT Support Agent** | Handles, resolves, and comments on assigned tickets.                |
| **Manager**          | Monitors team tickets, views reports and agent performance.         |
| **Employee**         | Creates and tracks their own support tickets.                       |

> **Note:** User self-registration is disabled. All accounts are created exclusively by the Super Admin.

---

## Planned Modules

* **Authentication & User Management** — JWT login, forgot/reset password, role-based access control
* **Ticket Management** — Create, edit, track, and search support tickets with categories and priorities
* **Assignment & Workflow** — Assign tickets to agents, track escalations, internal notes
* **Notifications** — In-app notification center, email alerts on ticket updates
* **Dashboard & Analytics** — Role-specific dashboards, ticket stats, agent performance charts
* **File Attachments** — Upload screenshots and documents to tickets
* **Admin Panel** — User management, category/priority/status configuration
* **Reports** — Monthly summaries, SLA reports, export to PDF/Excel
* **Knowledge Base** *(optional)* — Searchable FAQ and troubleshooting articles
* **AI Features** *(optional/advanced)* — Auto-categorization, priority suggestions, suggested replies

---

## Ticket Reference

**Categories:** Hardware · Software · Network · Email · Access Request · Other

**Priorities:** Low · Medium · High · Critical

**Statuses:** Open · In Progress · Pending · Resolved · Closed

Tickets are auto-assigned a reference number on creation (e.g. `TKT-2025-0001`).

---

## Repository Structure

```
/
├── frontend/               # Next.js (TypeScript) application
├── backend/                # ASP.NET Core Web API (C#)
├── docs/
│   ├── diagrams/           # System architecture, ERD, workflow diagrams (.png + .drawio)
│   ├── wireframes/         # Figma wireframe exports (.png), organized by role
│   │   ├── auth/
│   │   ├── employee/
│   │   ├── agent/
│   │   └── admin/
│   └── schema/             # PostgreSQL schema and seed scripts
│       ├── schema.sql
│       └── seed.sql
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

> These will be populated throughout Week 1.

### System Architecture

<!-- TODO: embed docs/diagrams/architecture.png -->

### Entity Relationship Diagram (ERD)

<!-- TODO: embed docs/diagrams/erd.png -->

### Workflow Diagrams

<!-- TODO: embed auth flow, ticket lifecycle, ticket creation workflow, role-permission matrix -->

### UI Wireframes

> Figma project link: `<!-- TODO: add Figma link -->`

---

## Database Schema

The full schema is located in [`docs/schema/schema.sql`](https://claude.ai/chat/docs/schema/schema.sql).

Sample/seed data is in [`docs/schema/seed.sql`](https://claude.ai/chat/docs/schema/seed.sql).

**Core tables:** `Users`, `Roles`, `Tickets`, `Categories`, `Priorities`, `Statuses`, `TicketComments`, `TicketAttachments`, `TicketStatusHistory`, `TicketAssignmentHistory`, `Notifications`, `ActivityLogs`

---

## Setup Instructions

> Full setup instructions will be added in Week 2 after project scaffolding is complete.

### Prerequisites

* Node.js 18+
* .NET 8 SDK
* PostgreSQL 15+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

### Database

```bash
# Run against your local PostgreSQL instance
psql -U postgres -d helpdesk -f docs/schema/schema.sql
psql -U postgres -d helpdesk -f docs/schema/seed.sql
```

---

## Weekly Progress

| Week | Focus                                          | Status         |
| ---- | ---------------------------------------------- | -------------- |
| 1    | Requirements, wireframes, ERD, repo setup      | 🔄 In Progress |
| 2    | Project scaffolding, JWT auth, user management | ⏳ Upcoming    |
| 3    | Ticket CRUD, categories & priorities           | ⏳ Upcoming    |
| 4    | Assignment workflow, comments, statuses        | ⏳ Upcoming    |
| 5    | Notifications, file uploads, dashboard         | ⏳ Upcoming    |
| 6    | Reports, charts, export, AI integration        | ⏳ Upcoming    |
| 7    | Testing, bug fixing, responsive UI             | ⏳ Upcoming    |
| 8    | Deployment, documentation, final demo          | ⏳ Upcoming    |

---

## Author

**Name:** `<!-- TODO: your name -->`

**Internship Period:** `<!-- TODO: start date – end date -->`

**Supervisor:** `<!-- TODO: supervisor name -->`
