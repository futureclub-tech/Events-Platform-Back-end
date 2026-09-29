# AGENTS.md

## Project Overview

This repository is a **Kerala Event Discovery / Event Management Platform** backend.

The backend is a **NestJS modular monolith** built with:

* NestJS
* TypeScript
* MongoDB
* Mongoose
* Repository Pattern
* `class-validator` / `class-transformer`
* JWT-based authentication
* Static role/scope/permission authorization

The goal is to build a maintainable backend without unnecessary architectural complexity.

Do **not** introduce microservices, CQRS, event sourcing, generic frameworks, or excessive DDD abstractions unless a concrete requirement justifies them.

---

# 1. Core Architecture

Use this request flow:

```text
HTTP Request
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

### Controller

Controllers handle HTTP concerns only:

* Route definitions
* Request parameters
* Query parameters
* DTOs
* Authentication/authorization decorators and guards
* Calling application services
* Returning HTTP responses

Controllers must not:

* Access MongoDB directly
* Use Mongoose models directly
* Contain significant business logic
* Access another module's repository
* Perform complex authorization logic manually

### Service

Services contain application/business orchestration.

Services may:

* Validate business rules
* Coordinate domain operations
* Call repositories owned by their module
* Call another module's public service
* Coordinate multiple operations within the module

Services must not:

* Access another module's repository directly
* Access Mongoose models directly
* Become generic utility classes

### Domain

The domain contains business concepts and rules:

* Entities
* Types
* Constants
* Statuses
* Business rules
* Authorization definitions where appropriate

Keep domain code independent of HTTP and Mongoose.

### Repository

Repositories own persistence.

Repositories are responsible for:

* MongoDB queries
* Mongoose models
* Persistence mapping
* Database-specific implementation

Mongoose should remain inside the repository/infrastructure layer.

---

# 2. Module Boundaries

Current modules:

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   └── events/
└── shared/
```

A module owns its domain and persistence.

### Critical rule

> A module must never directly access another module's repository or Mongoose model.

For cross-module operations:

```text
Module A Service
      ↓
Module B Public Service
      ↓
Module B Repository
      ↓
MongoDB
```

Example:

```text
AuthService
    ↓
UsersService
    ↓
UserRepository
```

Do not bypass the owning service.

---

# 3. Module Structure

Prefer:

```text
module/
├── controller/
├── service/
├── domain/
├── repository/
├── dto/
└── module.ts
```

Example:

```text
events/
├── controller/
│   ├── events.controller.ts
│   └── organization-events.controller.ts
├── service/
│   ├── events.service.ts
│   └── event-participants.service.ts
├── domain/
│   ├── event.entity.ts
│   ├── event.types.ts
│   ├── event-status.ts
│   ├── event-rules.ts
│   └── participant.types.ts
├── repository/
│   ├── event.repository.ts
│   ├── mongoose-event.repository.ts
│   ├── event-participant.repository.ts
│   └── mongoose-event-participant.repository.ts
├── dto/
│   ├── create-event.dto.ts
│   ├── update-event.dto.ts
│   └── list-events.dto.ts
└── events.module.ts
```

Do not create folders merely because a conventional architecture has them.

---

# 4. Avoid Over-Engineering

This project intentionally avoids unnecessary abstraction.

Do NOT introduce:

* Generic repositories
* Generic CRUD services
* Generic controllers
* Use-case classes for every operation
* CQRS without a real requirement
* Event sourcing
* Domain event infrastructure without a real requirement
* Separate modules for tiny concepts
* Interfaces that exist only to wrap another interface
* Microservices
* Prisma
* PostgreSQL
* Unnecessary dependency-injection abstractions
* Large utility/helper dumping grounds

Before adding an abstraction, ask:

1. Does it solve a current problem?
2. Is the abstraction used more than once?
3. Does it make the code easier to understand?
4. Does it preserve module boundaries?

If not, keep the implementation simple.

---

# 5. TypeScript Rules

Use strict TypeScript.

Required principles:

* `strict: true`
* `exactOptionalPropertyTypes: true`
* `noUncheckedIndexedAccess: true`
* Never use `any`
* Prefer explicit types at architectural boundaries
* Avoid unnecessary type assertions
* Avoid `as any`
* Avoid `@ts-ignore`

Do not weaken compiler settings to make implementation easier.

---

# 6. MongoDB / Mongoose Rules

MongoDB is the database.

Mongoose must remain inside the repository/infrastructure layer.

Do not import Mongoose models into:

* Controllers
* Services
* Domain files
* DTOs

Preferred:

```text
Service
   ↓
Repository interface
   ↓
Mongoose repository
   ↓
Mongoose model
   ↓
MongoDB
```

The domain must not depend on Mongoose decorators/types.

---

# 7. Validation

Use two levels of validation.

## HTTP Validation

Use:

* `class-validator`
* `class-transformer`

for request DTO validation.

Example:

```ts
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}
```

## Business Validation

Business rules belong in services/domain.

Example:

```text
DTO validation:
"title must be a non-empty string"

Business validation:
"Only an organization admin can publish this event"
```

Do not move all business rules into DTOs.

Do not introduce Zod throughout the project unless there is a concrete shared-schema requirement.

---

# 8. Authentication

Authentication belongs to the `AuthModule`.

There are currently two login entry points:

1. Normal users + super admins
2. Organization users/admins + sub-organization users/admins

These do **not** require separate authentication modules.

Use one `AuthModule` with separate controllers/services when appropriate:

```text
auth/
├── controller/
│   ├── auth.controller.ts
│   └── organization-auth.controller.ts
├── service/
│   ├── auth.service.ts
│   └── organization-auth.service.ts
├── domain/
│   ├── roles.ts
│   ├── scopes.ts
│   ├── permissions.ts
│   └── authorization.ts
├── guard/
├── decorator/
├── dto/
└── auth.module.ts
```

A separate organization login entry point does not mean a separate authentication system.

---

# 9. Authorization

Authorization is currently static.

The conceptual model is:

```text
Role       = Who
Scope      = Where
Permission = What
```

Current roles:

```text
SUPER_ADMIN
ORGANIZATION_ADMIN
SUB_ORGANIZATION_ADMIN
USER
```

Current scopes:

```text
SYSTEM
ORGANIZATION
SUB_ORGANIZATION
PUBLIC
```

Example permissions:

```text
EVENT:READ
EVENT:LIST
EVENT:CREATE
EVENT:UPDATE
EVENT:DELETE
EVENT:PUBLISH
```

Example mapping:

```text
SUPER_ADMIN
    SYSTEM
    all event permissions

ORGANIZATION_ADMIN
    ORGANIZATION
    EVENT:READ
    EVENT:LIST
    EVENT:CREATE
    EVENT:UPDATE
    EVENT:PUBLISH

SUB_ORGANIZATION_ADMIN
    SUB_ORGANIZATION
    EVENT:READ
    EVENT:LIST
    EVENT:CREATE
    EVENT:UPDATE

USER
    PUBLIC
    EVENT:READ
    EVENT:LIST
```

Do not create a database-backed roles/permissions system unless requirements change.

---

# 10. Guards and Decorators

Guards that are genuinely reusable across modules may live under `shared`.

Example:

```text
src/
├── shared/
│   └── guards/
│       └── jwt-auth.guard.ts
└── modules/
    └── auth/
        ├── guard/
        │   ├── scope.guard.ts
        │   └── permission.guard.ts
        └── decorator/
            ├── permissions.decorator.ts
            └── scopes.decorator.ts
```

Prefer keeping authorization-specific guards close to `AuthModule` when they directly depend on:

* Roles
* Scopes
* Permissions
* Authorization definitions

This prevents `shared` from becoming tightly coupled to Auth internals.

`shared` should contain reusable infrastructure, not domain-specific authorization logic.

---

# 11. Users Module

The Users module owns:

* User entity
* User persistence
* User profile data
* User lifecycle operations

Typical service methods:

```text
create
findById
findByPhone
findByUsername
updateProfile
updatePassword
block
unblock
list
```

Auth should use `UsersService` rather than directly accessing the user repository.

There is one User entity for all user types.

---

# 12. Organizations Module

Organizations and sub-organizations currently belong to one module.

Important business rule:

> An organization user belongs to exactly one organization at a time.

Organization admins operate within their organization.

Sub-organization admins operate within their sub-organization.

Organization admins can access:

* Their organization's events
* Events belonging to its sub-organizations

Sub-organization admins can access:

* Their own sub-organization's events

Do not introduce a separate `SubOrganizationsModule` unless the domain becomes independently complex.

---

# 13. Events Module

Events belong to the Events module.

Participants currently remain part of the Events domain.

Do not create a separate `ParticipantsModule` unless participation becomes a substantial independent domain.

Possible structure:

```text
events/
├── controller/
│   ├── events.controller.ts
│   └── organization-events.controller.ts
├── service/
│   ├── events.service.ts
│   └── event-participants.service.ts
├── domain/
│   ├── event.entity.ts
│   ├── event.types.ts
│   ├── event-status.ts
│   ├── event-rules.ts
│   └── participant.types.ts
└── repository/
```

---

# 14. API Design

Use REST-style resource-oriented endpoints.

OpenAPI paths must use:

```text
/events/{eventId}
```

not:

```text
/events/:eventId
```

`:eventId` is a Nest/Express route declaration style, not OpenAPI path syntax.

State-changing operations must not use `GET`.

For example:

```text
PATCH /organization/events/{eventId}/cancel
```

rather than:

```text
GET /organization/events/{eventId}/cancel
```

---

# 15. Response Format

Use the project's response convention.

Success:

```json
{
  "success": true,
  "message": "EVENT_CREATED",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "EVENT_NOT_FOUND"
}
```

Validation:

```json
{
  "success": false,
  "message": "VALIDATION_FAILED",
  "errors": [
    {
      "field": "title",
      "code": "REQUIRED"
    }
  ]
}
```

Machine-readable message codes should be stable.

Examples:

```text
VALIDATION_FAILED
PHONE_ALREADY_REGISTERED
OTP_VERIFIED
OTP_EXPIRED
OTP_INVALID
OTP_RESEND_SUCCESS
OTP_RESEND_FAILED
OTP_RESEND_COOLDOWN_ACTIVE
```

Do not expose inconsistent ad-hoc error messages from different controllers.

---

# 16. Controller Naming

Use controllers according to responsibility.

Examples:

```text
AdminOrganizationsController
AdminUsersController
OrganizationController
SubOrganizationsController
EventsController
OrganizationEventsController
AuthController
OrganizationAuthController
```

Avoid giant controllers containing unrelated responsibilities.

---

# 17. Service Naming

Services should represent a domain/application responsibility.

Examples:

```text
AuthService
OrganizationAuthService
UsersService
OrganizationsService
SubOrganizationsService
EventsService
EventParticipantsService
```

Do not create classes such as:

```text
BaseService
GenericService
CrudService
CommonService
```

unless there is a concrete reason.

---

# 18. Cross-Module Communication

Allowed:

```text
AuthService
    ↓
UsersService
```

Allowed:

```text
EventsService
    ↓
OrganizationsService
```

Not allowed:

```text
EventsService
    ↓
OrganizationRepository
```

Not allowed:

```text
AuthService
    ↓
MongooseUserModel
```

The owning module exposes the required operation through its service.

---

# 19. Dependency Direction

Prefer:

```text
Controller
   ↓
Service
   ↓
Domain / Repository abstraction
   ↓
Infrastructure
```

Infrastructure should not leak upward.

For example:

```text
Domain ❌ → Mongoose
Domain ❌ → HTTP
Domain ❌ → Controller
```

Keep dependencies explicit.

---

# 20. Naming Conventions

Use:

```text
kebab-case filenames
PascalCase classes
camelCase variables/functions
UPPER_SNAKE_CASE constants/enums where appropriate
```

Examples:

```text
create-event.dto.ts
event.repository.ts
mongoose-event.repository.ts
events.service.ts
organization-events.controller.ts
```

Classes:

```ts
CreateEventDto
EventRepository
MongooseEventRepository
EventsService
OrganizationEventsController
```

---

# 21. DTO Rules

DTOs are transport-layer objects.

Do not use DTOs as domain entities.

Example:

```text
CreateEventDto
        ↓
EventsService
        ↓
Event domain object
```

Avoid putting persistence-specific fields or Mongoose types into DTOs.

---

# 22. Domain Rules

Put reusable business rules in domain files when they are not tied to HTTP.

Examples:

```text
event-status.ts
event-rules.ts
organization-rules.ts
authorization.ts
```

A domain rule should answer a business question, not an HTTP question.

Good:

```text
canPublishEvent(event)
```

Less appropriate:

```text
validatePublishEventRequest(req)
```

The latter belongs to the HTTP/application layer.

---

# 23. Authentication vs Authorization

Keep the distinction clear.

Authentication:

```text
Who are you?
```

Authorization:

```text
What are you allowed to do?
```

Typical flow:

```text
Request
  ↓
JWT Authentication
  ↓
Authenticated User
  ↓
Scope Check
  ↓
Permission Check
  ↓
Service / Resource Boundary
  ↓
Repository
```

Do not put all authorization logic inside controllers.

---

# 24. Resource Ownership

A permission alone may not be sufficient.

For example:

```text
ORGANIZATION_ADMIN
EVENT:UPDATE
```

does not automatically mean the admin can update every event.

The service must also enforce the resource boundary:

```text
Is this event owned by the administrator's organization?
```

For sub-organization admins:

```text
Is this event owned by the administrator's sub-organization?
```

Authorization therefore has two dimensions:

```text
Capability
+
Resource boundary
```

---

# 25. API Documentation

When editing OpenAPI:

* Use `{parameter}` instead of `:parameter`
* Define server URLs using `servers`
* Do not define `{{url}}` as a path parameter
* Remove duplicate routes
* Do not use GET for state-changing actions
* Ensure path parameters are declared
* Keep request/response schemas synchronized with DTOs

Avoid duplicate routes such as:

```text
/organization/:organizationId/auth/login
/organizations/:organizationId/auth/login
```

Keep one canonical route unless they intentionally represent different resources.

---

# 26. Testing

Prefer testing business behavior rather than implementation details.

Test important service/domain cases such as:

* User creation
* Duplicate phone/identity handling
* Authentication
* OTP verification
* OTP expiry
* Authorization
* Organization boundaries
* Sub-organization boundaries
* Event creation
* Event publishing
* Event cancellation
* Event joining
* Participant handling

Repository tests should focus on persistence behavior.

Do not write tests merely to increase coverage numbers.

---

# 27. Changes and Refactoring

Before making a change:

1. Identify the owning module.
2. Identify the correct layer.
3. Check whether an existing service/repository already provides the required operation.
4. Preserve existing module boundaries.
5. Avoid introducing abstractions unless necessary.
6. Update related DTOs/types/tests when behavior changes.
7. Check TypeScript strictness.

When refactoring, prefer small structural improvements over large architecture rewrites.

---

# 28. Adding a New Feature

For a new feature:

```text
1. Identify domain ownership
2. Define/modify domain types and rules
3. Define repository operations if persistence is required
4. Implement repository
5. Implement service logic
6. Add DTOs
7. Add controller endpoint
8. Apply authentication/authorization
9. Add tests
10. Update API documentation
```

Do not start by creating random folders or abstractions.

---

# 29. Shared Folder Rules

`shared/` is for genuinely reusable infrastructure.

Good candidates:

```text
shared/
├── guards/
├── decorators/
├── pipes/
├── filters/
├── interceptors/
└── utils/
```

Only move something into `shared` if multiple modules genuinely need it.

Do not put domain-specific logic into `shared`.

Bad:

```text
shared/
├── event-utils.ts
├── organization-rules.ts
├── user-business-logic.ts
```

Those belong to their owning modules.

---

# 30. Do Not Break These Rules for Convenience

Do not:

* Import another module's repository
* Import another module's Mongoose model
* Put database queries in controllers
* Put database queries in domain entities
* Put business rules in controllers
* Put business rules only in DTO validation
* Add a use-case class for every service method
* Add generic CRUD abstractions
* Add a new module for every small concept
* Add a new database technology
* Introduce microservices
* Disable TypeScript strictness
* Use `any`
* Duplicate authorization definitions
* Duplicate user entities
* Create separate auth systems just because there are separate login pages

---

# 31. Decision Principle

When there are multiple technically valid solutions, prefer the one that:

1. Preserves module ownership
2. Has the fewest unnecessary abstractions
3. Is easy to understand
4. Keeps infrastructure isolated
5. Makes business rules explicit
6. Fits the existing architecture
7. Can be extended later without prematurely designing for hypothetical requirements

The project should be:

> **Simple by default, structured where necessary.**

---

# 32. Agent Working Style

When modifying this repository:

* Inspect existing code before creating new abstractions.
* Follow the existing architecture unless there is a concrete reason to change it.
* Do not silently introduce new architectural patterns.
* Explain significant architectural changes before making them.
* Prefer minimal changes that satisfy the requirement.
* Preserve existing API contracts unless the task explicitly changes them.
* Maintain strict TypeScript.
* Keep module boundaries enforceable.
* If a requirement conflicts with the architecture, identify the conflict explicitly and propose the smallest reasonable adjustment.

The objective is not to maximize architectural sophistication.

The objective is to build a clear, maintainable NestJS backend with strong module boundaries and minimal unnecessary complexity.
