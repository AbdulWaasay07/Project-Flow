# ProjectFlow

> **A full-stack Project Management System** built with React + Spring Boot — enabling teams to plan, track, and collaborate on work across role-based dashboards, Kanban boards, file attachments, and real-time activity logs.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white&style=for-the-badge" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Repository Structure](#-repository-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Role-Based Access Control](#-role-based-access-control)
- [API Overview](#-api-overview)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**ProjectFlow** is a production-grade project management platform designed for organizations to manage projects, track tasks, assign team members, upload files, and maintain full audit trails — all secured behind JWT-based role-based access control.

The system comprises two independently runnable services:

| Service | Tech | Default Port |
|---|---|---|
| **Frontend** (`/frontend`) | React 19 + Vite | `5173` |
| **Backend** (`/SpringOne`) | Spring Boot 3.5 + Java 21 | `8080` |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based login and registration
- Role-based route guards (Admin / Manager / Team Member)
- Session expiration handling with automatic logout

### 📁 Project Management
- Create, update, and delete projects
- Assign project managers and team members
- Track project status (`ACTIVE`, `ON_HOLD`, `COMPLETED`)
- Progress visualization with completion metrics

### ✅ Task Management
- Full CRUD for tasks within projects
- Kanban board with HTML5 drag-and-drop status changes
- List view with sortable columns
- Priority levels: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Status pipeline: `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`
- Task status history tracking

### 👥 Team Collaboration
- Task comments (add / delete)
- File attachments (upload / download / delete) with JWT-secured streaming
- Assignee management per task
- @mention and notification system

### 📊 Analytics & Reporting
- Admin dashboard: global KPIs, overdue tasks, team workload
- Manager dashboard: project-scoped metrics
- Team member dashboard: personal assigned tasks and history
- Reports page with chart visualizations (Recharts)

### 🔔 Notifications
- In-app notification feed per user
- Triggered on task assignment, status change, project membership changes

### 🗂️ Activity Logs
- Full audit trail for all create/update/delete/assign operations
- Filterable by project, task, or user
- Paginated timeline view

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Browser (React)                     │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│   │  Auth Pages  │  │   Dashboard  │  │ Tasks / Kanban │  │
│   └──────────────┘  └──────────────┘  └────────────────┘  │
│              ↕  REST/JSON over HTTP (JWT Bearer)           │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│              Spring Boot REST API (:8080)                  │
│   ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│   │ Controllers│ │ Services  │ │  Repos   │ │ Security │  │
│   └────────────┘ └───────────┘ └──────────┘ └──────────┘  │
│                            ↓  JPA/JDBC                     │
│              ┌─────────────────────────┐                   │
│              │    MySQL 8 Database     │                   │
│              └─────────────────────────┘                   │
└────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
Project-Flow/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── api/            # API client & endpoint modules
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context & provider
│   │   ├── hooks/          # Custom hooks (auth file streaming)
│   │   ├── pages/          # Feature pages (dashboard, projects, tasks…)
│   │   └── index.css       # Global design system & styles
│   ├── package.json
│   └── README.md           # Frontend-specific documentation
│
├── SpringOne/              # Spring Boot REST API
│   ├── src/main/java/com/example/projectflow/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic
│   │   ├── entity/         # JPA entities
│   │   ├── dto/            # Request/Response DTOs
│   │   ├── repository/     # Spring Data JPA repositories
│   │   └── security/       # JWT + Spring Security config
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── build.gradle
│   └── README.md           # Backend-specific documentation
│
└── README.md               # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| Java JDK | 21 |
| MySQL | 8.0 |
| Gradle Wrapper | included (`./gradlew`) |

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulWaasay07/Project-Flow.git
cd Project-Flow
```

### 2. Start the Backend

```powershell
cd SpringOne
.\gradlew bootRun
```

> The API will be live at `http://localhost:8080`  
> Swagger UI: `http://localhost:8080/swagger-ui.html`

### 3. Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

> The app will be available at `http://localhost:5173`

### 4. First Login

Register an Admin account via the registration page or directly via the API:

```bash
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "fullName": "Admin User",
  "email": "admin@projectflow.com",
  "password": "Admin@123",
  "role": "ADMIN"
}
```

---

## 🔧 Environment Variables

### Frontend (`.env.local` inside `/frontend`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | Base URL of the Spring Boot API |

### Backend (`application.properties` inside `/SpringOne/src/main/resources`)

| Property | Default | Description |
|---|---|---|
| `server.port` | `8080` | Server port |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/projectflow_db` | MySQL connection URL |
| `spring.datasource.username` | `root` | MySQL username |
| `spring.datasource.password` | `root` | MySQL password |
| `jwt.secret` | (see file) | HS256 signing key — **change in production** |
| `jwt.expiration` | `86400000` | Token expiry in ms (24 hours) |
| `file.upload-dir` | `./uploads` | Local directory for file attachments |
| `spring.servlet.multipart.max-file-size` | `10MB` | Max single file size |

---

## 🛡️ Role-Based Access Control

| Role | Capabilities |
|---|---|
| **ADMIN** | Full system access: manage users, all projects, all tasks, global analytics, activity logs |
| **MANAGER** | Manage own projects & team, create/assign/delete tasks, view team analytics |
| **TEAM_MEMBER** | View assigned projects, update task status, add comments, upload files, delete tasks |

---

## 📡 API Overview

| Resource | Base Path |
|---|---|
| Authentication | `/api/auth` |
| Users | `/api/users` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Task Comments | `/api/comments` |
| Attachments | `/api/attachments` |
| Notifications | `/api/notifications` |
| Activity Logs | `/api/activity-logs` |
| Dashboard | `/api/dashboard` |

Full interactive API documentation: **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add feature name'`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed for educational and portfolio use.  
© 2026 ProjectFlow — All rights reserved.
