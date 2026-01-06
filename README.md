# Issue Tracker MVP

A full-stack Issue Tracker MVP built with Angular (standalone + Material) on the frontend and Quarkus (Java 17) on the backend.

This repository is being developed incrementally with an emphasis on:
- explicit architecture
- strict typing
- clear separation of concerns
- avoiding premature abstractions

The project is intentionally not complete and not production-ready.

---

## Repository Structure

```
.
├── README.md
├── issue-tracker-api   # Quarkus backend (Java 17)
│   ├── README.md
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── src
│   │   ├── main
│   │   │   ├── docker
│   │   │   ├── java
│   │   │   └── resources
│   │   └── test
│   │       └── java
│   └── target
│       ├── build-metrics.json
│       ├── classes
│       │   ├── application.properties
│       │   └── com
│       ├── generated-sources
│       │   └── annotations
│       ├── generated-test-sources
│       │   └── test-annotations
│       ├── issue-tracker-api-dev.jar
│       ├── maven-status
│       │   └── maven-compiler-plugin
│       ├── quarkus
│       │   └── bootstrap
│       └── test-classes
│           └── com
├── issue-tracker-web # Angular frontend
│   ├── app
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.spec.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── components
│   │   ├── create-issue-dialog
│   │   ├── issue
│   │   ├── issue-detail
│   │   ├── layout
│   │   ├── login
│   │   └── project
│   ├── guards
│   │   ├── auth.guard.spec.ts
│   │   └── auth.guard.ts
│   ├── interceptors
│   │   ├── auth.interceptor.spec.ts
│   │   └── auth.interceptor.ts
│   ├── models
│   │   ├── activity.model.ts
│   │   ├── issue.model.ts
│   │   ├── pagination.model.ts
│   │   ├── project.model.ts
│   │   └── websocket.model.ts
│   └── services
│       ├── auth.service.spec.ts
│       ├── auth.service.ts
│       ├── issue.service.spec.ts
│       ├── issue.service.ts
│       ├── project.service.spec.ts
│       ├── project.service.ts
│       └── websocket.service.ts
├── assets
├── environments
│   └── environment.ts
├── favicon.ico
├── index.html
├── main.ts
└── styles.scss
```

---

## Current State Overview

### Frontend (Angular)

- Angular 20+ using standalone APIs
- Angular Material for UI
- Application layout with:
  - persistent sidebar navigation
  - top toolbar
- Authentication infrastructure:
  - login page
  - AuthService (token-based)
  - AuthGuard protecting application routes
  - HTTP interceptor attaching Bearer token
- Feature areas implemented:
  - Project list
  - Issue list
  - Issue detail view
  - Edit Issue flow (PUT)
- UX behavior:
  - success and error feedback on save
  - client-side activity log entries on issue updates

### Backend (Quarkus)

- Quarkus with Java 17
- REST-oriented architecture
- Domain models defined
- API scaffolding in progress

Backend persistence, filtering, pagination, and real-time features are not yet implemented.

---

## Implemented Functionality

### Authentication
- Login form (email + password)
- Token stored in localStorage
- Protected application routes
- Logout flow
- Auth token automatically attached to API requests

### Projects
- Project list view
- Sorting, filtering, pagination
- Data loaded via ProjectService

### Issues
- Issue list view
- Sorting, filtering, pagination
- Navigation from list to detail
- Issue detail view:
  - read-only mode
  - inline edit mode
  - save (PUT)
  - cancel edits
- Activity log entries created on update
- Success and error feedback on save

---

## Technology Stack

### Frontend
- Angular 20+
- Angular Material
- Standalone components
- Reactive Forms
- RxJS
- Strict TypeScript

### Backend
- Java 17
- Quarkus
- REST (JAX-RS style)
- Planned: relational persistence, WebSockets/SSE

---

## Running the Frontend

```bash
cd issue-tracker-web
npm install
ng serve
````

Application will be available at:

```
http://localhost:4200
```

---

## Running the Backend (when available)

```bash
cd issue-tracker-api
./mvnw quarkus:dev
```

Expected API base path:

```
http://localhost:8080/api
```

---

## API Integration Assumptions

The frontend currently assumes the following endpoints:

* GET /api/projects
* GET /api/issues
* GET /api/issues/{id}
* PUT /api/issues/{id}

Authentication header format:

```
Authorization: Bearer <token>
```

---

## Pending Work

### Backend

* Implement Project and Issue REST endpoints
* Database persistence (relational)
* Server-side pagination and filtering
* Activity log persistence
* Comment threads
* Real-time updates (WebSocket or SSE)

### Frontend

* Environment-based API base URL
* Loading and empty states
* Delete Issue flow
* Comment thread UI
* Persisted activity log
* Real-time issue updates
* Optional optimistic UI updates

### Cross-Cutting

* Centralized API error handling
* Auth token expiration handling
* Role-based access control (future)

---

## Design Notes

This project intentionally avoids:

* magic-heavy ORMs
* hidden framework behavior
* premature state management solutions
* large abstractions early in development

The goal is to keep the system understandable and evolvable as requirements become clearer.

---

## Status

Active development.

Frontend structure and data flow are in place.
Backend implementation and persistence are the next major phase.
