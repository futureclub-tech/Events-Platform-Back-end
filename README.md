# Event Management Platform — Backend

Production-oriented backend built with **NestJS, TypeScript, MongoDB, and Repository Pattern**.

## Architecture

```text
Request
  ↓
Controller
  ↓
Service
  ↓
Domain
  ↓
Repository
  ↓
MongoDB
```

### Rules

* **Controller** — HTTP concerns only.
* **Service** — application/business orchestration.
* **Domain** — entities, types, constants, business rules.
* **Repository** — persistence and MongoDB/Mongoose access.
* Modules must not access another module's repository or database model directly.
* Cross-module operations must use the owning module's **exported service**.
* Avoid unnecessary abstractions and generic repositories.
* Do not add a Use Case layer unless there is a concrete need.

## Folder Structure

```text
src/
├── modules/
│   ├── events/
│   │   ├── controller/
│   │   │   └── event.controller.ts
│   │   ├── service/
│   │   │   └── event.service.ts
│   │   ├── domain/
│   │   │   ├── event.entity.ts
│   │   │   ├── event.types.ts
│   │   │   └── event.constants.ts
│   │   ├── repository/
│   │   │   ├── event.repository.ts
│   │   │   └── mongo-event.repository.ts
│   │   ├── dto/
│   │   │   ├── create-event.dto.ts
│   │   │   └── update-event.dto.ts
│   │   └── event.module.ts
│   │
│   ├── organizations/
│   ├── users/
│   ├── authentication/
│   ├── roles/
│   └── permissions/
│
├── shared/
│   ├── database/
│   ├── exceptions/
│   ├── guards/
│   ├── decorators/
│   ├── pipes/
│   └── utils/
│
├── app.module.ts
└── main.ts
```

Each feature module owns its controller, service, domain, repository, DTOs, and NestJS module.

## Creating Files

Use the **NestJS CLI** for Nest-managed files instead of manually creating boilerplate.

```bash
nest g module modules/events
nest g controller modules/events/controller/event
nest g service modules/events/service/event
```

For files that do not map cleanly to Nest CLI generators, create them manually.

## Module Communication

A module must expose a service when another module needs its functionality.

```text
AdminModule
    ↓
EventService
    ↓
EventRepository
    ↓
MongoDB
```

Export the service from the owning module:

```ts
@Module({
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
```

Then import that module where it is required:

```ts
@Module({
  imports: [EventModule],
})
export class AdminModule {}
```

Now `AdminService` can depend on `EventService`:

```ts
constructor(
  private readonly eventService: EventService,
) {}
```

Do **not** do this:

```text
AdminService
    ↓
MongoEventRepository
    ↓
MongoDB
```

The owning module controls access to its data and business operations.

## Authorization Model

Authorization uses **Role + Scope + Permission**.

### Role — Who are you?

Roles define the user's responsibility within the platform.

```text
SUPER_ADMIN
ORGANIZATION_ADMIN
SUB_ORGANIZATION_ADMIN
USER
```

Custom roles can be created for **organization and sub-organization users**.

### Scope — Where can you operate?

Scopes define the boundary within which a role can operate.

```text
SYSTEM
ORGANIZATION
SUB_ORGANIZATION
PUBLIC
```

### Permission — What can you do?

Permissions represent business capabilities rather than individual API endpoints.

```text
EVENT:READ
EVENT:LIST
EVENT:CREATE
EVENT:UPDATE
EVENT:DELETE
EVENT:PUBLISH
```

### Authorization Flow

```text
Request
  ↓
Authentication
  ↓
Scope Check
  ↓
Permission Check
  ↓
Service / Data Boundary
  ↓
Repository
```

For example:

```text
GET /admin/events
Scope: SYSTEM
Permission: EVENT:READ
```

Only a role with the required **SYSTEM scope** and **EVENT:READ permission** can access this operation.

An `ORGANIZATION_ADMIN` may have:

```text
Scope: ORGANIZATION
Permission: EVENT:READ
```

but cannot access an operation requiring:

```text
Scope: SYSTEM
Permission: EVENT:READ
```

because the role operates within an organization-level boundary.

The core distinction is:

```text
Role       → Who
Scope      → Where
Permission → What
```

Permissions should remain **business-oriented** rather than being tied to individual endpoints.

Prefer:

```text
EVENT:CREATE
EVENT:READ
EVENT:UPDATE
```

instead of:

```text
POST:/events
GET:/events
PATCH:/events/:id
```

This allows the same business permission to be reused across controllers, endpoints, and application workflows.

## Repository

Services depend on the repository contract, not the MongoDB implementation.

```text
EventService
     ↓
EventRepository
     ↑
MongoEventRepository
     ↓
MongoDB
```

MongoDB/Mongoose code must remain inside repository/infrastructure code.

## Validation & Errors

Use DTOs for transport-level validation.

```ts
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
```

Keep business validation in the service/domain layer.

Use meaningful exceptions and never expose database errors, stack traces, secrets, or internal implementation details.

## TypeScript

Use strict TypeScript.

```text
strict
exactOptionalPropertyTypes
noUncheckedIndexedAccess
```

Rules:

* No `any`.
* Avoid unnecessary type assertions.
* Keep classes and functions focused.
* Prefer simple solutions over premature abstractions.

## Testing

Use the appropriate level:

```text
Unit        → Service / Domain
Integration → Repository + MongoDB
E2E         → HTTP → Controller → Service → Repository → DB
```

Test behavior and important failure cases, not implementation details.

## Git Workflow

Create a branch for each feature or fix.

```bash
git switch -c feature/events
git switch -c fix/event-publishing
```

Use **Conventional Commits**:

```text
<type>(<scope>): <description>
```

Common types:

```text
feat
fix
refactor
test
docs
chore
build
ci
perf
```

Examples:

```bash
git commit -m "feat(events): add event creation"
git commit -m "fix(events): prevent publishing archived events"
git commit -m "test(events): add event service tests"
git commit -m "refactor(events): simplify repository logic"
```

Keep commits focused. Avoid messages such as:

```text
update
changes
fixed
final
stuff
```

Use PRs for changes and keep `main` protected from direct pushes.
