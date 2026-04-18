# ProjectFlow — Backend (SpringOne)

> Production-grade **Spring Boot REST API** powering the ProjectFlow project management platform. Implements JWT-secured role-based access control, full CRUD for projects and tasks, file attachment management, real-time notifications, and a comprehensive audit activity log — all backed by MySQL.

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Spring%20Security-JWT-6DB33F?logo=springsecurity&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Gradle-8-02303A?logo=gradle&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203-85EA2D?logo=swagger&logoColor=black&style=for-the-badge" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Security & Authentication](#-security--authentication)
- [Database Schema](#-database-schema)
- [Role-Based Access Control](#-role-based-access-control)
- [File Storage](#-file-storage)
- [Testing the API](#-testing-the-api)
- [Build & Deployment](#-build--deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌐 Overview

The **SpringOne** module is the complete RESTful backend for ProjectFlow. It handles:

- **Authentication** — Register/login with HS256 JWT tokens
- **Project Management** — Full CRUD, member assignment, manager delegation  
- **Task Management** — Tasks scoped to projects, assignee management, Kanban status pipeline
- **File Attachments** — Secure multipart upload, authenticated file serving, per-task and per-project scoping
- **Comments** — Thread-style task comments
- **Notifications** — Per-user in-app notification queue
- **Activity Logs** — Immutable audit trail for every state-changing operation
- **Dashboard Analytics** — Role-scoped KPI aggregations
- **Scheduler** — Periodic overdue task detection

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|---|---|---|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.5.x |
| Security | Spring Security + JJWT | 0.12.5 |
| Persistence | Spring Data JPA + Hibernate | (via Boot) |
| Database | MySQL | 8.0 |
| Build Tool | Gradle (wrapper included) | 8.x |
| Code Reduction | Lombok | (via Boot) |
| API Docs | SpringDoc OpenAPI / Swagger UI | 2.8.5 |
| Validation | Jakarta Bean Validation | (via Boot) |
| Dev Tools | Spring Boot DevTools | (via Boot) |
| Test DB | H2 (test scope only) | (via Boot) |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  HTTP Request Layer                  │
│           (React Frontend / Swagger / Postman)        │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              Spring Security Filter Chain             │
│         JWT Validation → Authentication Context       │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               REST Controllers (Layer 1)              │
│  /api/auth  /api/projects  /api/tasks  /api/users    │
│  /api/attachments  /api/comments  /api/dashboard     │
│  /api/notifications  /api/activity-logs              │
└──────────────────────┬───────────────────────────────┘
                       │ DTOs (Request / Response)
┌──────────────────────▼───────────────────────────────┐
│               Service Layer (Layer 2)                 │
│   Business rules, validation, orchestration,          │
│   notification dispatch, activity log writes          │
└──────────────────────┬───────────────────────────────┘
                       │ JPA Entities
┌──────────────────────▼───────────────────────────────┐
│         Repository Layer (Layer 3) — Spring Data JPA  │
└──────────────────────┬───────────────────────────────┘
                       │ JDBC
┌──────────────────────▼───────────────────────────────┐
│                   MySQL 8 Database                   │
└──────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
SpringOne/
├── src/
│   ├── main/
│   │   ├── java/com/example/projectflow/
│   │   │   │
│   │   │   ├── ProjectFlowApplication.java     # Entry point (@SpringBootApplication)
│   │   │   │
│   │   │   ├── config/                         # Global configuration beans
│   │   │   │   ├── SecurityConfig.java         # Spring Security + CORS + filter chain
│   │   │   │   └── AppConfig.java              # PasswordEncoder, other beans
│   │   │   │
│   │   │   ├── controller/                     # REST endpoint handlers
│   │   │   │   ├── AuthController.java         # POST /api/auth/register, /login
│   │   │   │   ├── ProjectController.java      # /api/projects
│   │   │   │   ├── TaskController.java         # /api/tasks
│   │   │   │   ├── UserController.java         # /api/users
│   │   │   │   ├── AttachmentController.java   # /api/attachments
│   │   │   │   ├── TaskCommentController.java  # /api/comments
│   │   │   │   ├── NotificationController.java # /api/notifications
│   │   │   │   ├── ActivityLogController.java  # /api/activity-logs
│   │   │   │   └── DashboardController.java    # /api/dashboard
│   │   │   │
│   │   │   ├── service/                        # Service interfaces
│   │   │   │   └── impl/                       # Service implementations
│   │   │   │       ├── AuthServiceImpl.java
│   │   │   │       ├── ProjectServiceImpl.java
│   │   │   │       ├── TaskServiceImpl.java
│   │   │   │       ├── UserServiceImpl.java
│   │   │   │       ├── AttachmentServiceImpl.java
│   │   │   │       ├── TaskCommentServiceImpl.java
│   │   │   │       ├── NotificationServiceImpl.java
│   │   │   │       ├── ActivityLogServiceImpl.java
│   │   │   │       ├── TaskStatusHistoryServiceImpl.java
│   │   │   │       └── DashboardServiceImpl.java
│   │   │   │
│   │   │   ├── entity/                         # JPA entity classes (DB tables)
│   │   │   │   ├── User.java
│   │   │   │   ├── Role.java
│   │   │   │   ├── Project.java
│   │   │   │   ├── ProjectMember.java
│   │   │   │   ├── Task.java
│   │   │   │   ├── TaskAssignee.java
│   │   │   │   ├── TaskComment.java
│   │   │   │   ├── TaskStatusHistory.java
│   │   │   │   ├── Attachment.java
│   │   │   │   ├── Notification.java
│   │   │   │   └── ActivityLog.java
│   │   │   │
│   │   │   ├── dto/                            # Request & Response DTOs
│   │   │   │   ├── auth/
│   │   │   │   ├── project/
│   │   │   │   ├── task/
│   │   │   │   ├── user/
│   │   │   │   ├── attachment/
│   │   │   │   ├── activity/
│   │   │   │   └── ApiResponse.java            # Standard envelope {success, message, data}
│   │   │   │
│   │   │   ├── repository/                     # Spring Data JPA interfaces
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ProjectRepository.java
│   │   │   │   ├── ProjectMemberRepository.java
│   │   │   │   ├── TaskRepository.java
│   │   │   │   ├── TaskAssigneeRepository.java
│   │   │   │   ├── AttachmentRepository.java
│   │   │   │   ├── NotificationRepository.java
│   │   │   │   └── ActivityLogRepository.java
│   │   │   │
│   │   │   ├── security/                       # JWT + Spring Security
│   │   │   │   ├── JwtUtil.java                # Token generation & validation
│   │   │   │   ├── JwtAuthFilter.java          # OncePerRequestFilter
│   │   │   │   └── UserDetailsServiceImpl.java # Load user by email for auth
│   │   │   │
│   │   │   ├── scheduler/                      # Scheduled tasks
│   │   │   │   └── OverdueTaskScheduler.java   # Marks overdue tasks periodically
│   │   │   │
│   │   │   ├── exception/                      # Custom exceptions & global handler
│   │   │   │   ├── CustomException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │
│   │   │   └── util/
│   │   │       ├── AppConstants.java           # Role names, action strings, status values
│   │   │       └── FileStorageUtil.java        # Store & delete physical files
│   │   │
│   │   └── resources/
│   │       └── application.properties          # All runtime configuration
│   │
│   └── test/                                   # JUnit 5 tests (H2 in-memory)
│       └── java/com/example/projectflow/
│           └── ProjectFlowApplicationTests.java
│
├── uploads/                                    # Runtime file storage (gitignored)
├── build.gradle                                # Gradle build script
├── settings.gradle                             # Project name
├── gradlew / gradlew.bat                       # Gradle wrapper scripts
└── README.md                                   # ← You are here
```

---

## ✅ Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| **Java JDK** | 21 | OpenJDK or Oracle JDK |
| **MySQL** | 8.0 | Must be running before startup |
| **Gradle** | — | Wrapper (`gradlew`) is included — no separate install needed |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulWaasay07/Project-Flow.git
cd Project-Flow/SpringOne
```

### 2. Set Up MySQL

Start MySQL and ensure a user with the credentials in `application.properties` exists. The database will be auto-created on first run:

```sql
-- Run in MySQL shell if needed
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON projectflow_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Application Properties

Edit `src/main/resources/application.properties` (see [Configuration](#-configuration) below).

### 4. Build & Run

```powershell
# Windows
.\gradlew bootRun

# Mac / Linux
./gradlew bootRun
```

### 5. Verify Startup

Once the console prints `Started ProjectFlowApplication in X seconds`, the server is live:

| Resource | URL |
|---|---|
| Base API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

---

## 🔧 Configuration

All configuration lives in `src/main/resources/application.properties`:

```properties
# ── Server ──────────────────────────────────────────
server.port=8080

# ── Database (MySQL) ────────────────────────────────
spring.datasource.url=jdbc:mysql://localhost:3306/projectflow_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# ── JWT ─────────────────────────────────────────────
jwt.secret=<your-256-bit-hex-secret>   # ⚠️ CHANGE IN PRODUCTION
jwt.expiration=86400000                # 24 hours in milliseconds

# ── File Storage ────────────────────────────────────
file.upload-dir=./uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# ── Swagger / OpenAPI ───────────────────────────────
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

### Key Configuration Notes

| Property | Production Recommendation |
|---|---|
| `jwt.secret` | Generate a cryptographically random 256-bit key; store in environment variable or secrets manager |
| `spring.jpa.hibernate.ddl-auto` | Change to `validate` or `none` in production (use Flyway/Liquibase for migrations) |
| `spring.jpa.show-sql` | Set to `false` in production |
| `file.upload-dir` | Use an absolute path pointing to persistent storage (e.g., mounted volume) |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api`. Full interactive reference: **[Swagger UI](http://localhost:8080/swagger-ui.html)**

### 🔐 Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login, returns JWT token |

### 👤 Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin, Manager | List all users |
| `GET` | `/{id}` | Admin, Manager | Get user by ID |
| `PUT` | `/{id}` | Admin | Update user details |
| `GET` | `/profile` | Any | Get own profile |
| `PUT` | `/profile` | Any | Update own profile |
| `PATCH` | `/{id}/block` | Admin | Block a user |
| `PATCH` | `/{id}/unblock` | Admin | Unblock a user |
| `PATCH` | `/{id}/role` | Admin | Change user role |

### 📁 Projects — `/api/projects`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Admin, Manager | Create project |
| `GET` | `/` | Any | List projects (scoped by role) |
| `GET` | `/{id}` | Any | Get project details + members |
| `PUT` | `/{id}` | Admin, Manager | Update project |
| `DELETE` | `/{id}` | Admin | Delete project |
| `PATCH` | `/{id}/assign-manager/{userId}` | Admin | Assign project manager |
| `POST` | `/{id}/members/{userId}` | Admin, Manager | Add member |
| `DELETE` | `/{id}/members/{userId}` | Admin, Manager | Remove member |
| `GET` | `/{id}/members` | Any | List project members |

### ✅ Tasks — `/api/tasks`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Admin, Manager | Create task |
| `GET` | `/` | Admin, Manager | List all tasks |
| `GET` | `/{id}` | Any | Get task by ID |
| `PUT` | `/{id}` | Admin, Manager | Update task |
| `DELETE` | `/{id}` | Any (authenticated) | Delete task |
| `PATCH` | `/{id}/status` | Any | Change task status |
| `POST` | `/{id}/assign` | Admin, Manager | Assign users to task |
| `DELETE` | `/{id}/assign/{userId}` | Admin, Manager | Unassign user from task |
| `GET` | `/project/{projectId}` | Any | Get tasks by project |
| `GET` | `/overdue` | Admin, Manager | Get overdue tasks |

### 💬 Comments — `/api/comments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/task/{taskId}` | Any | Add comment |
| `GET` | `/task/{taskId}` | Any | List comments for task |
| `DELETE` | `/{id}` | Any | Delete comment |

### 📎 Attachments — `/api/attachments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Any | Upload file (multipart, `file` + `taskId` / `projectId`) |
| `GET` | `/task/{taskId}` | Any | Get task attachments |
| `GET` | `/project/{projectId}` | Any | Get project attachments |
| `DELETE` | `/{id}` | Any (owner or Admin) | Delete attachment |
| `GET` | `/files/{filename}` | Any | Serve file bytes (authenticated) |

### 🔔 Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Any | Get own notifications |
| `PATCH` | `/{id}/read` | Any | Mark notification as read |
| `PATCH` | `/read-all` | Any | Mark all as read |

### 📊 Dashboard — `/api/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin` | Admin | Global system KPIs |
| `GET` | `/manager` | Manager | Team + project KPIs |
| `GET` | `/member` | Team Member | Personal task summary |

### 🗂️ Activity Logs — `/api/activity-logs`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin, Manager | All logs (paginated) |
| `GET` | `/project/{id}` | Admin, Manager | Logs by project |
| `GET` | `/task/{id}` | Admin, Manager | Logs by task |
| `GET` | `/user/{id}` | Admin | Logs by user |

---

## 🔒 Security & Authentication

### JWT Flow

```
Client                          Server
  │                               │
  │── POST /api/auth/login ───────►│
  │                               │ Validates credentials
  │◄─ { token: "eyJ..." } ────────│ Returns signed JWT
  │                               │
  │── GET /api/tasks              │
  │   Authorization: Bearer eyJ..►│
  │                               │ JwtAuthFilter validates
  │                               │ Sets SecurityContext
  │◄─ 200 { data: [...] } ────────│ Returns secured data
```

### Token Details

| Property | Value |
|---|---|
| Algorithm | HS256 (HMAC-SHA256) |
| Expiry | 24 hours (configurable via `jwt.expiration`) |
| Storage (client) | `localStorage` |
| Header format | `Authorization: Bearer <token>` |

### CORS

Configured in `SecurityConfig.java` to allow requests from `http://localhost:5173` (Vite dev server). Update `allowedOrigins` for production deployments.

---

## 🗄️ Database Schema

The schema is auto-generated by Hibernate (`ddl-auto=update`). Key entities and their relationships:

```
users ──┐
        ├── project_members ──► projects
        ├── task_assignees  ──► tasks ──► projects
        ├── task_comments   ──► tasks
        ├── attachments     ──► tasks / projects
        ├── notifications
        ├── activity_logs   ──► projects / tasks
        └── task_status_history ──► tasks
```

### Key Entities

| Entity | Table | Purpose |
|---|---|---|
| `User` | `users` | System users with role reference |
| `Role` | `roles` | `ADMIN`, `MANAGER`, `TEAM_MEMBER` |
| `Project` | `projects` | Projects with owner, status, dates |
| `ProjectMember` | `project_members` | Project ↔ User join with project-role |
| `Task` | `tasks` | Task with status, priority, due date |
| `TaskAssignee` | `task_assignees` | Task ↔ User assignment |
| `TaskComment` | `task_comments` | Comments on tasks |
| `TaskStatusHistory` | `task_status_history` | Immutable status change log |
| `Attachment` | `attachments` | File metadata (path, type, uploader) |
| `Notification` | `notifications` | In-app notification queue |
| `ActivityLog` | `activity_logs` | Full audit trail |

---

## 🛡️ Role-Based Access Control

| Role | `@PreAuthorize` value | Typical access |
|---|---|---|
| **ADMIN** | `hasRole('ADMIN')` | All resources, user management, global analytics |
| **MANAGER** | `hasRole('MANAGER')` | Own projects, team members, project analytics |
| **TEAM_MEMBER** | `isAuthenticated()` | Assigned tasks, own profile, comments, files |

Roles are seeded into the `roles` table via a `CommandLineRunner` on first startup.

---

## 📂 File Storage

Uploaded files are stored on the local filesystem under the `file.upload-dir` path (default: `./uploads/`).

- Files are renamed with a UUID prefix to prevent collisions
- The original filename is preserved in the `Attachment` entity
- Files are served via `GET /api/attachments/files/{filename}` with JWT authentication
- Maximum file size: **10 MB** per file, **10 MB** per request (configurable)

> **Production Note:** For production, replace local disk storage with cloud object storage (e.g., AWS S3, Google Cloud Storage) by updating `FileStorageUtil.java`.

---

## 🧪 Testing the API

### Option 1 — Swagger UI (Recommended)

1. Start the server: `.\gradlew bootRun`
2. Open [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
3. Register: `POST /api/auth/register`
4. Login: `POST /api/auth/login` → copy the token
5. Click **Authorize** → enter `Bearer <your_token>`
6. Explore all endpoints interactively

### Option 2 — Quick cURL

```bash
# 1. Register Admin
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin","email":"admin@flow.com","password":"Admin@123","role":"ADMIN"}'

# 2. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flow.com","password":"Admin@123"}'
# → Copy the token from the response

# 3. Create a project (replace <TOKEN>)
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","description":"First project"}'

# 4. View admin dashboard
curl http://localhost:8080/api/dashboard/admin \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📦 Build & Deployment

### Run Tests

```bash
.\gradlew test
```

Test results are in `build/reports/tests/test/index.html`.

### Build a Production JAR

```bash
.\gradlew bootJar
```

The executable JAR will be at `build/libs/projectflow-0.0.1-SNAPSHOT.jar`.

### Run the JAR

```bash
java -jar build/libs/projectflow-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:mysql://prod-host:3306/projectflow_db \
  --spring.datasource.username=dbuser \
  --spring.datasource.password=dbpassword \
  --jwt.secret=<production-secret>
```

### Environment Variables (Production)

It is best practice to externalize secrets via environment variables rather than hardcoding in `application.properties`:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://prod-host:3306/projectflow_db
export SPRING_DATASOURCE_USERNAME=dbuser
export SPRING_DATASOURCE_PASSWORD=dbpassword
export JWT_SECRET=<256-bit-random-hex>
```

---

## ❓ Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Access denied for user 'root'@'localhost'` | Wrong MySQL credentials | Update `spring.datasource.username/password` |
| `Communications link failure` | MySQL not running | Start MySQL service |
| `TransientObjectException` on task delete | ActivityLog FK reference | Already fixed in current version |
| Port `8080` already in use | Another process | Change `server.port` or kill the conflicting process |
| `No 'Access-Control-Allow-Origin'` error | CORS misconfiguration | Add frontend origin to `allowedOrigins` in `SecurityConfig` |
| Files not serving | Incorrect `file.upload-dir` path | Use an absolute path that exists and is writable |
| JWT `SignatureException` | Mismatched secret | Ensure `jwt.secret` is identical across restarts |

---

## 🔗 Related

| Resource | Path |
|---|---|
| Frontend (React) | [`../frontend`](../frontend/README.md) |
| Project Root | [`../`](../README.md) |
| Swagger UI (live) | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) |

---

## 📄 License

This project is licensed for educational and portfolio use.  
© 2026 ProjectFlow — All rights reserved.
