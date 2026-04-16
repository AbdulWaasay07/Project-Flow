# ProjectFlow — Frontend

> Modern React application powering the **ProjectFlow** project management platform. Provides role-based dashboards, Kanban task boards, file attachments with JWT-secured streaming, activity timelines, and real-time notifications — all styled with a premium "Tactile Executive" dark design system.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Recharts-2-22B5BF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white&style=for-the-badge" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Features & Pages](#-features--pages)
- [Role-Based Access Control](#-role-based-access-control)
- [API Integration](#-api-integration)
- [Design System](#-design-system)
- [State & Auth Management](#-state--auth-management)
- [Known Considerations](#-known-considerations)

---

## 🌐 Overview

The ProjectFlow frontend is a Single-Page Application (SPA) built with **React 19** and **Vite**. It communicates exclusively with the Spring Boot REST API (`../SpringOne`) via a centralized `apiClient` that automatically injects JWT tokens, unwraps standard API envelopes, and handles session expiry.

The UI implements a strict **"Tactile Executive"** design language — dark mode, tonal layering, glassmorphism surfaces, and micro-animations — delivering a premium experience across all screen sizes.

---

## 🛠️ Tech Stack

| Category | Technology | Notes |
|---|---|---|
| App Framework | **React 19** | Functional components, hooks |
| Build Tool | **Vite 5** | HMR, fast cold starts |
| Routing | **React Router 7** | Client-side routing, protected routes |
| Styling | **Vanilla CSS** | Custom design system via CSS variables |
| Icons | **lucide-react** | Consistent icon set |
| Charts | **Recharts 2** | Analytics & reporting visualizations |
| HTTP Client | Custom `fetch` wrapper | JWT injection, error handling |
| Linting | **ESLint 9** | Code quality |

---

## 📂 Project Structure

```
frontend/
├── public/
│   └── vite.svg                 # App icon
│
├── src/
│   ├── api/                     # API layer
│   │   ├── client.js            # Central fetch wrapper (JWT, error handling)
│   │   ├── config.js            # Base URL & all endpoint constants (ENDPOINTS)
│   │   ├── auth.js              # Register / login / logout
│   │   ├── projects.js          # Projects CRUD + member management
│   │   ├── tasks.js             # Tasks CRUD + assign / status
│   │   ├── comments.js          # Task comments
│   │   ├── attachments.js       # File upload / download / delete
│   │   ├── users.js             # User listing, profile, role management
│   │   ├── dashboard.js         # Dashboard analytics endpoints
│   │   ├── activityLogs.js      # Activity log queries
│   │   ├── notifications.js     # Notification fetch & mark-read
│   │   ├── constants.js         # Shared option arrays (priorities, roles…)
│   │   └── index.js             # Re-exports all API modules
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx      # Collapsible role-aware navigation
│   │   │   ├── Header.jsx       # Top bar (notifications, user menu)
│   │   │   └── DashboardLayout.jsx  # Main shell (sidebar + header + outlet)
│   │   └── ui/
│   │       ├── Modal.jsx        # Accessible overlay modal
│   │       ├── Toast.jsx        # Global toast + ToastProvider
│   │       ├── StatusBadge.jsx  # Color-coded status/priority chips
│   │       ├── LoadingSpinner.jsx
│   │       └── EmptyState.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # Global auth state (user, token, login/logout)
│   │
│   ├── hooks/
│   │   └── useAuthFile.js       # Fetch blobs with JWT for image thumbnails + download
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx    # Role-specific KPIs, charts, overdue tasks
│   │   ├── projects/
│   │   │   ├── ProjectsPage.jsx     # Project list + create/edit modals
│   │   │   └── ProjectDetailPage.jsx # Kanban board, members, attachments, comments
│   │   ├── tasks/
│   │   │   └── TasksPage.jsx        # Global task Kanban + list view
│   │   ├── users/
│   │   │   └── UsersPage.jsx        # Admin user management
│   │   ├── manager/
│   │   │   └── ManagerPage.jsx      # Manager team insights
│   │   ├── activity/
│   │   │   └── ActivityPage.jsx     # Paginated audit log timeline
│   │   ├── reports/
│   │   │   └── ReportsPage.jsx      # Chart-heavy analytics (Admin/Manager)
│   │   └── settings/
│   │       └── SettingsPage.jsx     # Profile, password, preferences
│   │
│   ├── styles/
│   │   └── variables.css        # CSS custom properties: colors, radius, shadows
│   │
│   ├── App.jsx                  # Route tree, ProtectedRoute, role guards
│   ├── main.jsx                 # ReactDOM.createRoot entry point
│   └── index.css                # Global styles, component classes, animations
│
├── index.html                   # Vite HTML template
├── vite.config.js               # Vite configuration
├── package.json
└── eslint.config.js
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | **18.x** |
| npm | **9.x** |
| ProjectFlow Backend | Running on `http://localhost:8080` |

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080/api
```

> This is optional — the app defaults to `http://localhost:8080/api` if the variable is absent.

### 3. Start Development Server

```bash
npm run dev
```

App will be available at **[http://localhost:5173](http://localhost:5173)**

---

## 🔧 Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | No | Base URL for all REST API calls |

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client bundle.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Compile and bundle for production (output: `dist/`) |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Run ESLint across all source files |

---

## 📱 Features & Pages

### 🔐 Authentication
- `LoginPage` — Email + password login, JWT stored in `localStorage`
- `RegisterPage` — Role-selectable registration (Admin / Manager / Team Member)

### 📊 Dashboard (`/dashboard`)
- **ADMIN:** System-wide metrics, overdue tasks, team workload, recent activity
- **MANAGER:** Project progress, team task distribution, upcoming deadlines
- **TEAM_MEMBER:** Personal tasks, assigned projects, recent comments

### 📁 Projects (`/projects`)
- Project list with status filters
- Create project modal with manager assignment and member pre-seeding
- `ProjectDetailPage`: 4-tab layout (Overview / Tasks / Members / Attachments)
  - Kanban board with HTML5 drag-and-drop
  - Inline task creation with file pre-attach
  - Member add/remove management

### ✅ Tasks (`/tasks`)
- Global task view across all user projects
- Kanban columns with drag-and-drop status transitions
- List view with priority/project filters
- Task detail modal: status change, comments, file attachments

### 👤 Users (`/users`) — Admin only
- User table with role, status, created-at columns
- Block / Unblock / Change Role actions
- Edit user profile (name, email, password)

### 📈 Reports (`/reports`) — Admin / Manager
- Bar, line, pie charts powered by Recharts
- Task completion trends, priority breakdown, team contribution analysis

### 🗂️ Activity Log (`/activity`) — Admin / Manager
- Paginated timeline of all system actions
- Color-coded action types (create, update, delete, assign, upload…)

### ⚙️ Settings (`/settings`)
- Update display name
- Change password
- Avatar color/initial preferences

---

## 🛡️ Role-Based Access Control

| Role | Dashboard | Projects | Tasks | Users | Reports | Activity |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ADMIN** | ✅ Global | ✅ All | ✅ All | ✅ Full | ✅ | ✅ |
| **MANAGER** | ✅ Team | ✅ Own | ✅ Own | ❌ | ✅ | ✅ |
| **TEAM_MEMBER** | ✅ Personal | ✅ Assigned | ✅ Assigned | ❌ | ❌ | ❌ |

Route protection is enforced by the `ProtectedRoute` component in `App.jsx`. API endpoints enforce the same rules server-side via Spring Security.

**Assignee Picker Rules:**
- Admins can assign any project member
- Managers cannot assign Admin-role users to tasks
- No user can self-assign

---

## 📡 API Integration

All API calls go through `src/api/client.js` — a thin wrapper around the native `fetch` API:

```js
// Automatic JWT injection
headers['Authorization'] = `Bearer ${token}`;

// Standard API envelope unwrap
if (data.success && data.data) return data.data;

// Session expiry handler
if (response.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
```

**File uploads** use `FormData` (multipart). The client detects `FormData` bodies and omits the `Content-Type` header, letting the browser set the correct `multipart/form-data` boundary automatically.

**Authenticated file streaming** (`useAuthFile` hook) fetches protected file blobs using the JWT token and generates local object URLs for thumbnail rendering — preventing direct unauthenticated access to uploaded files.

---

## 🎨 Design System

The UI is built on a CSS custom property design system defined in `src/styles/variables.css` and `src/index.css`:

| Token Category | Examples |
|---|---|
| **Colors** | `--color-primary`, `--color-surface`, `--color-surface-raised`, `--color-danger` |
| **Typography** | `--font-sans` (Inter / system stack) |
| **Spacing / Radius** | `--radius-sm`, `--radius-md`, `--radius-lg` |
| **Shadows** | `--shadow-sm`, `--shadow-card`, `--shadow-modal` |
| **Animations** | `fadeIn`, `slideUp`, `shimmer` keyframes |

Component classes (`.card`, `.btn`, `.form-input`, `.kanban-card`, `.stat-card`, etc.) are defined globally in `index.css` — no CSS-in-JS or utility framework required.

---

## 🗂️ State & Auth Management

| Concern | Approach |
|---|---|
| Global auth state | React Context (`AuthContext`) |
| Token persistence | `localStorage` (`token`, `user`) |
| Feature data | Direct API calls per component (no Redux/Zustand) |
| Form state | Local `useState` |
| Notifications (toasts) | `ToastProvider` + `useToast` hook |
| Session expiry | Custom DOM event `auth:expired` → auto-logout |

---

## ⚠️ Known Considerations

- **No offline support** — all data requires an active backend connection
- **localStorage tokens** — consider `httpOnly` cookies for production hardening
- **File uploads** are limited to 10 MB per file (enforced by the backend)
- **MySQL is required** for the backend — the app will not function without it running

---

## 🔗 Related

| Resource | Path |
|---|---|
| Backend (Spring Boot) | [`../SpringOne`](../SpringOne/README.md) |
| Project Root | [`../`](../README.md) |
| API Documentation | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |
