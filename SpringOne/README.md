# 🚀 ProjectFlow Backend

A comprehensive Spring Boot project management system with real-time tracking, audit logs, and analytics.

## 🛠️ Tech Stack
- **Java 17+** (Developed on OpenJDK 21)
- **Spring Boot 3.4.4**
- **Spring Security** (JWT Authentication)
- **Spring Data JPA** (H2 Database for development)
- **Lombok** (Boilerplate reduction)
- **Swagger UI** (API Documentation)

---

## 🚀 How to Run from Scratch

### 1. Prerequisites
Ensure you have the following installed:
- **Java JDK 17** or higher.
- **Gradle** (The project includes the Gradle wrapper `./gradlew`).

### 2. Configuration
The application is pre-configured to use an **In-Memory H2 Database**.
- No database installation is required (MySQL/PostgreSQL) for local development.
- Data will reset every time the server restarts (Standard behavior for memory DBs).

### 3. Build & Run
Open your terminal in the `SpringOne` directory and run:
```powershell
# Build and Start the application
.\gradlew bootRun
```

### 4. Verification
Once the terminal shows `Started ProjectFlowApplication in X seconds`, the server is alive!
- **Base URL**: `http://localhost:8080`
- **Swagger Documentation**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **H2 Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:projectflow`, User: `sa`, No Password)

---

## 🧪 Quick Test Workflow
Follow these steps to test the full system:

1.  **Register Admin**: `POST /api/auth/register` with `{"fullName": "Admin", "email": "admin@flow.com", "password": "password123", "role": "ADMIN"}`.
2.  **Login**: `POST /api/auth/login` to get your **JWT Token**.
3.  **Authorize**: In Swagger, click **Authorize** at the top and enter `Bearer <your_token>`.
4.  **Create Project**: `POST /api/projects` to start a project.
5.  **Track Activity**: Perform actions (like creating a task) and then call `GET /api/activity-logs` to see the audit trail.
6.  **View Analytics**: Call `GET /api/dashboard/admin` to see global metrics.

---

## 📁 Key Directories
- `controller/`: REST endpoints for API communication.
- `service/`: Core business logic (Project management, analytics).
- `entity/`: Data models (User, Project, Task, ActivityLog).
- `dto/`: Data Transfer Objects for API requests/responses.
- `repository/`: JPA layers for database communication.
- `security/`: JWT and Spring Security configuration.

---

## 🛡️ Identity Features
- **Roles**: `ADMIN`, `MANAGER`, `TEAM_MEMBER`.
- **Authorization**: Some endpoints are restricted based on role (e.g., only Admin can see global dashboard).

---

## 📄 License
This project was developed as a production-grade backend architect demonstration.
