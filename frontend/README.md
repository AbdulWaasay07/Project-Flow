# ProjectFlow Frontend

Modern React frontend for **ProjectFlow**, focused on role-based project management, task operations, analytics, and collaboration workflows.

## Overview

This application is built with React + Vite and integrates with the Spring Boot backend in `../SpringOne`.  
It includes:

- JWT-based authentication and protected routing
- Role-specific dashboards (**ADMIN**, **MANAGER**, **TEAM_MEMBER**)
- Project and task management with Kanban and list views
- Task comments and file attachments
- Activity log timelines
- Notifications and toast feedback
- Analytics/reports dashboards with charts
- User profile/settings management

## Tech Stack

| Area | Technology |
|---|---|
| App framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 + custom CSS (`src\index.css`) |
| Icons | lucide-react |
| Charts | Recharts |
| Linting | ESLint 9 |

## Backend Integration

- Default API base URL: `http://localhost:8080/api`
- Configurable via Vite env:

```env
VITE_API_URL=http://localhost:8080/api
```

The API client (`src\api\client.js`) automatically:
- injects `Authorization: Bearer <token>`
- unwraps standard API responses
- handles session expiration (`401`) and triggers logout flow

## Role-Based Access

| Role | Primary access |
|---|---|
| ADMIN | Full dashboards, reports, user management, activity logs |
| MANAGER | Team dashboards, team member insights, manager activity |
| TEAM_MEMBER | Personal dashboard, assigned work, collaboration features |

Route guards are handled through `ProtectedRoute` and role checks in `App.jsx`.

## Project Structure

```text
frontend/
├── public/                    # Static assets (favicon, icon symbols)
├── src/
│   ├── api/                   # API client and endpoint modules
│   ├── components/
│   │   ├── layout/            # Sidebar, header, dashboard layout
│   │   └── ui/                # Reusable UI primitives + toast system
│   ├── context/               # Auth context/provider
│   ├── hooks/                 # Authenticated file hook
│   ├── pages/                 # Feature pages (auth, dashboard, projects, tasks, etc.)
│   ├── styles/variables.css   # Design tokens (colors, radius, shadows)
│   ├── App.jsx                # Routes and providers
│   ├── main.jsx               # React bootstrap
│   └── index.css              # Global and feature-level styles
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- npm 9+

### 2. Install dependencies

```powershell
cd frontend
npm install
```

### 3. Configure environment (optional but recommended)

Create `frontend\.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
```

> If your backend runs on another port (for example `8081`), update `VITE_API_URL` accordingly.

### 4. Run development server

```powershell
npm run dev
```

App URL: `http://localhost:5173`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

## UI and State Notes

- Auth/session data uses `localStorage` (`token`, `user`).
- Profile avatar color/image preferences are stored locally.
- Global notifications are provided by `ToastProvider`.
- Most feature data is fetched directly from backend APIs (no global state library).

## Related

- Backend service: `..\SpringOne`
- Repository root: `..\`
