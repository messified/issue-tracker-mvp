# issue-tracker-api

This project uses Quarkus, the Supersonic Subatomic Java Framework.

If you want to learn more about Quarkus, please visit its website: <https://quarkus.io/>.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./mvnw quarkus:dev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./mvnw package
```

It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./mvnw package -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar target/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script
./mvnw package -Dnative
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/issue-tracker-api-1.0.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Provided Code

### REST

Easily start your REST Web Services

[Related guide section...](https://quarkus.io/guides/getting-started-reactive#reactive-jax-rs-resources)

## Database Setup

### Using Docker Compose

Start PostgreSQL database:

```shell script
docker-compose up -d
```

### Database Indexing Strategy

For optimal performance, the following indexes are recommended (Hibernate will create them automatically based on entity relationships):

1. **Users table:**
   - `email` (unique index) - for fast user lookup during authentication

2. **Projects table:**
   - `owner_id` - for filtering projects by owner
   - `created_at` - for sorting projects by creation date

3. **Issues table:**
   - `project_id` - for filtering issues by project (most common query)
   - `status` - for filtering by status
   - `priority` - for filtering by priority
   - `assignee_id` - for filtering by assignee
   - `reporter_id` - for filtering by reporter
   - `created_at` - for sorting by creation date
   - Composite index on `(project_id, status)` - for common filtered queries

4. **Issue Comments table:**
   - `issue_id` - for loading comments for an issue
   - `created_at` - for sorting comments chronologically

5. **Issue Activities table:**
   - `issue_id` - for loading activity log for an issue
   - `created_at` - for sorting activities chronologically

6. **Project Members table:**
   - `project_id` - for loading project members
   - `user_id` - for finding user's projects
   - Composite unique index on `(project_id, user_id)` - ensures one membership per user per project

These indexes are automatically created by Hibernate based on `@ManyToOne` relationships and `@Column(unique = true)` annotations.

## Health Checks

The application provides health check endpoints:

- **Liveness:** `GET /health/live` - Indicates if the application is running
- **Readiness:** `GET /health/ready` - Indicates if the application is ready to serve traffic (checks database connectivity)

## WebSocket Real-time Updates

The application provides WebSocket endpoint at `/ws` for real-time updates:

- Connect with token: `ws://localhost:8080/ws?token=<jwt_token>`
- Broadcasts events for: issue created/updated/deleted, comments added/updated, projects created/updated

## Demo Data

The application automatically seeds demo data on first startup:
- 3 demo users (admin, developer, tester)
- 2 demo projects
- 4 demo issues with various statuses and priorities

To reset the database, set `quarkus.hibernate-orm.database.generation=drop-and-create` in `application.properties`.
