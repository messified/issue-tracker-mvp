# Issue Tracker MVP

A full-stack Issue Tracker MVP built with Angular (standalone + Material) on the frontend and Quarkus (Java 17) on the backend.

This repository is being developed incrementally with an emphasis on:
- explicit architecture
- strict typing
- clear separation of concerns
- avoiding premature abstractions

---

## Features

### Authentication
- User sign up and login (email + password)
- JWT token-based authentication
- Password hashing with BCrypt
- Protected routes with AuthGuard
- Automatic token attachment via HTTP interceptor
- Token stored in localStorage

### Projects
- Create, read, update, and delete projects
- Project list with pagination and sorting
- Project detail view
- Project member management (Owner, Maintainer, Reporter roles)
- Role-based access control (RBAC)

### Issues
- Full CRUD operations for issues
- Advanced filtering (by project, status, priority, assignee, tag, text search)
- Server-side pagination and sorting
- Issue detail view with inline editing
- Optimistic concurrency control (version field)
- Issue comments (thread support)
- Activity log tracking
- Tag management

### Real-time Updates
- WebSocket support for live updates
- Broadcasts events for issue/project changes
- Comment notifications

### Additional Features
- Health check endpoints (liveness and readiness)
- Structured logging
- Database seeding with demo data
- CORS configuration
- Input validation and error handling

---

## Technology Stack

### Frontend
- **Angular 20+** - Standalone components and APIs
- **Angular Material** - UI component library
- **TypeScript** - Strict typing
- **RxJS** - Reactive programming
- **Reactive Forms** - Form handling

### Backend
- **Java 17** - Programming language
- **Quarkus** - Supersonic Subatomic Java framework
- **Hibernate ORM with Panache** - Database persistence
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **WebSockets** - Real-time communication
- **BCrypt** - Password hashing
- **SmallRye Health** - Health checks

### Infrastructure
- **Docker Compose** - PostgreSQL database container
- **Maven** - Build tool

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17** or higher
- **Node.js 18+** and npm
- **Docker** and Docker Compose (for database)
- **Maven** (or use the included `mvnw` wrapper)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd issue-tracker-mvp
```

### 2. Start the Database

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

This will:
- Start PostgreSQL 15 in a container
- Create database `issue_tracker`
- Expose port `5432`
- Persist data in a Docker volume

Verify the database is running:

```bash
docker ps
```

### 3. Configure Backend (Optional)

The backend is pre-configured with default settings in `issue-tracker-api/src/main/resources/application.properties`:

- Database: `localhost:5432`
- Database name: `issue_tracker`
- Username: `postgres`
- Password: `postgres`

If you need to change these, edit `application.properties`.

### 4. Start the Backend

```bash
cd issue-tracker-api
./mvnw quarkus:dev
```

The backend will:
- Start on `http://localhost:8080`
- Auto-reload on code changes (dev mode)
- Create database schema automatically
- Seed demo data on first startup

**API Base URL:** `http://localhost:8080/api`

**Health Checks:**
- Liveness: `http://localhost:8080/health/live`
- Readiness: `http://localhost:8080/health/ready`

### 5. Start the Frontend

In a new terminal:

```bash
cd issue-tracker-web
npm install
ng serve
```

The frontend will:
- Start on `http://localhost:4200`
- Auto-reload on code changes
- Connect to backend at `http://localhost:8080/api`

---

## Demo Data

On first startup, the backend automatically seeds the database with:

**Users:**
- `admin@example.com` / `admin123` (Admin User)
- `dev@example.com` / `dev123` (Developer)
- `tester@example.com` / `test123` (Tester)

**Projects:**
- 2 demo projects with various members

**Issues:**
- 4 demo issues with different statuses, priorities, and tags

To reset the database and re-seed:
1. Stop the backend
2. Set `quarkus.hibernate-orm.database.generation=drop-and-create` in `application.properties`
3. Restart the backend

---

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Projects

- `GET /api/projects` - List projects (with pagination)
  - Query params: `page`, `pageSize`, `sortBy`, `sortOrder`
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/projects/{id}/members` - Get project members
- `POST /api/projects/{id}/members` - Add project member
- `DELETE /api/projects/{id}/members/{memberId}` - Remove member
- `PUT /api/projects/{id}/members/{memberId}/role` - Update member role

### Issues

- `GET /api/issues` - List issues (with filtering and pagination)
  - Query params: `projectId`, `status`, `priority`, `assigneeId`, `tag`, `search`, `page`, `pageSize`, `sortBy`, `sortOrder`
- `GET /api/issues/{id}` - Get issue details
- `POST /api/issues` - Create issue
- `PUT /api/issues/{id}` - Update issue
- `DELETE /api/issues/{id}` - Delete issue
- `GET /api/issues/{id}/comments` - Get issue comments
- `POST /api/issues/{id}/comments` - Add comment
- `PUT /api/issues/{id}/comments/{commentId}` - Update comment
- `DELETE /api/issues/{id}/comments/{commentId}` - Delete comment
- `GET /api/issues/{id}/activity` - Get activity log
- `POST /api/issues/{id}/assign` - Assign issue to user
- `DELETE /api/issues/{id}/assign` - Unassign issue
- `PUT /api/issues/{id}/status` - Update issue status
- `PUT /api/issues/{id}/priority` - Update issue priority
- `POST /api/issues/{id}/tags` - Add tags
- `DELETE /api/issues/{id}/tags/{tag}` - Remove tag

### Health Checks

- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe (checks database)

### WebSocket

- `ws://localhost:8080/ws?token=<jwt_token>` - Real-time updates

---

## Authentication

The application uses JWT token-based authentication:

1. **Sign Up or Login** via `/api/auth/signup` or `/api/auth/login`
2. **Receive Token** in response:
   ```json
   {
     "user": {
       "id": "uuid",
       "email": "user@example.com",
       "name": "User Name",
       "createdAt": "2024-01-01T00:00:00Z"
     },
     "token": "jwt-token-string"
   }
   ```
3. **Include Token** in subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
4. **Frontend** automatically attaches token via `AuthInterceptor`

---

## Real-time Updates (WebSocket)

The application supports real-time updates via WebSocket:

**Connection:**
```
ws://localhost:8080/ws?token=<jwt_token>
```

**Events Broadcast:**
- Issue created/updated/deleted
- Comment added/updated
- Project created/updated

**Frontend Integration:**
The `WebSocketService` handles connection and event subscription. Components can subscribe to specific events for live updates.

---

## Project Structure

```
issue-tracker-mvp/
├── README.md
├── docker-compose.yml          # PostgreSQL database setup
├── issue-tracker-api/          # Quarkus backend
│   ├── README.md
│   ├── pom.xml
│   ├── mvnw                     # Maven wrapper
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/qmg/
│   │   │   │   ├── api/         # REST resources
│   │   │   │   │   ├── AuthResource.java
│   │   │   │   │   ├── IssueResource.java
│   │   │   │   │   ├── ProjectResource.java
│   │   │   │   │   ├── HealthResource.java
│   │   │   │   │   ├── WebSocketEndpoint.java
│   │   │   │   │   ├── WebSocketService.java
│   │   │   │   │   ├── CorsFilter.java
│   │   │   │   │   └── DataSeeder.java
│   │   │   │   ├── domain/      # Entity models
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Project.java
│   │   │   │   │   ├── Issue.java
│   │   │   │   │   ├── IssueComment.java
│   │   │   │   │   ├── IssueActivity.java
│   │   │   │   │   ├── ProjectMember.java
│   │   │   │   │   └── enums/
│   │   │   │   └── dto/         # Data transfer objects
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/com/qmg/api/
│   └── target/
└── issue-tracker-web/          # Angular frontend
    ├── package.json
    ├── angular.json
    ├── src/
    │   ├── app/
    │   │   ├── components/      # UI components
    │   │   │   ├── login/
    │   │   │   ├── layout/
    │   │   │   ├── project/
    │   │   │   ├── issue/
    │   │   │   ├── issue-detail/
    │   │   │   ├── create-project-dialog/
    │   │   │   └── create-issue-dialog/
    │   │   ├── services/        # Business logic
    │   │   │   ├── auth.service.ts
    │   │   │   ├── project.service.ts
    │   │   │   ├── issue.service.ts
    │   │   │   └── websocket.service.ts
    │   │   ├── models/          # TypeScript models
    │   │   ├── guards/          # Route guards
    │   │   ├── interceptors/    # HTTP interceptors
    │   │   ├── app.component.ts
    │   │   ├── app.config.ts
    │   │   └── app.routes.ts
    │   ├── environments/
    │   │   └── environment.ts
    │   └── index.html
    └── node_modules/
```

---

## Database Schema

### Core Entities

- **User** - User accounts (id, email, name, passwordHash)
- **Project** - Projects (id, name, description, ownerId)
- **Issue** - Issues (id, projectId, title, description, status, priority, assigneeId, reporterId, tags, version)
- **IssueComment** - Comments on issues
- **IssueActivity** - Activity log entries
- **ProjectMember** - Project membership with roles (Owner, Maintainer, Reporter)

### Relationships

- Project → User (owner)
- Issue → Project (many-to-one)
- Issue → User (assignee, reporter)
- IssueComment → Issue (many-to-one)
- IssueActivity → Issue (many-to-one)
- ProjectMember → Project (many-to-one)
- ProjectMember → User (many-to-one)

### Indexing Strategy

See `issue-tracker-api/README.md` for detailed indexing strategy. Hibernate automatically creates indexes based on entity relationships and annotations.

---

## Development

### Backend Development

**Run in dev mode:**
```bash
cd issue-tracker-api
./mvnw quarkus:dev
```

**Run tests:**
```bash
./mvnw test
```

**Build for production:**
```bash
./mvnw package
```

**Quarkus Dev UI:**
Available at `http://localhost:8080/q/dev/` when running in dev mode.

### Frontend Development

**Run in dev mode:**
```bash
cd issue-tracker-web
ng serve
```

**Run tests:**
```bash
ng test
```

**Build for production:**
```bash
ng build --configuration production
```

### Environment Configuration

**Frontend:** Edit `issue-tracker-web/src/environments/environment.ts`

**Backend:** Edit `issue-tracker-api/src/main/resources/application.properties`

---

## Testing

### Backend Tests

Located in `issue-tracker-api/src/test/java/`:
- `AuthResourceTest.java` - Authentication endpoint tests
- `HealthResourceTest.java` - Health check tests

Run with:
```bash
cd issue-tracker-api
./mvnw test
```

### Frontend Tests

Located in `issue-tracker-web/src/app/`:
- Component spec files (`.spec.ts`)
- Service spec files

Run with:
```bash
cd issue-tracker-web
ng test
```

---

## Troubleshooting

### Database Connection Issues

1. Verify Docker container is running:
   ```bash
   docker ps
   ```

2. Check database logs:
   ```bash
   docker logs issue-tracker-db
   ```

3. Verify connection settings in `application.properties`

### Backend Won't Start

1. Check Java version (must be 17+):
   ```bash
   java -version
   ```

2. Check if port 8080 is available:
   ```bash
   lsof -i :8080
   ```

3. Review backend logs for errors

### Frontend Can't Connect to Backend

1. Verify backend is running on `http://localhost:8080`
2. Check CORS configuration in backend
3. Verify `environment.apiUrl` in frontend
4. Check browser console for errors

### WebSocket Connection Issues

1. Verify backend WebSocket endpoint is accessible
2. Check token is valid and included in query string
3. Review browser console for WebSocket errors
4. Verify `environment.wsUrl` in frontend

---

## Design Notes

This project intentionally avoids:

- Magic-heavy ORMs
- Hidden framework behavior
- Premature state management solutions
- Large abstractions early in development

The goal is to keep the system understandable and evolvable as requirements become clearer.

---

## Status

✅ **Fully Implemented:**
- Authentication (signup/login)
- Project CRUD with member management
- Issue CRUD with filtering, pagination, sorting
- Comments and activity logs
- Real-time updates via WebSocket
- Health checks
- Database persistence
- Demo data seeding

🚧 **Future Enhancements:**
- Enhanced error handling
- Token expiration handling
- Advanced RBAC features
- File attachments
- Email notifications
- Search improvements

---

## License

[Add your license here]

---

## Contributing

[Add contributing guidelines here]
