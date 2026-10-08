# AGENTS.md

## Project Overview

This repository is the backend for an **MVP Event Management Platform**.

* **Architecture Style**: **Traditional Monolith** (strictly NOT a modular monolith, NOT microservices).
* **Architectural Pattern**: **Strict Layered Architecture** with distinct horizontal layers.
* **Tech Stack**: Node.js (ESM), Express 5 (`^5.2.1`), TypeScript (`module: "nodenext"`), Inversify (`^8.2.3`), `reflect-metadata`, Vitest.

Whenever you work on this project, follow this document as the single source of truth so you do not need to search the entire project for architectural context.

---

## 1. Directory Structure & Responsibilities

The codebase follows this strict layered layout:

```text
src/
├── app.ts                          # Express application configuration & top-level middlewares
├── server.ts                       # Entry point, HTTP server listen, process error handlers
├── config/                         # Environment variables and application configuration
├── routes/                         # Express route definitions; binds routes to controller methods
├── controllers/                    # HTTP adapters: parses inputs, calls services, returns ApiResponse
├── middleware/                     # Express middlewares: auth guards, validation, error handler, not-found
├── services/                       # Application business logic orchestration
│   ├── interfaces/                 # Service contracts (e.g., IAuthService, IEventService)
│   └── implementations/            # Service implementations decorated with @injectable()
├── domain/                         # Pure domain logic (entities, domain types, business rules)
│   ├── entities/                   # Domain entities and business invariant models
│   └── types/                      # Domain-specific types and enums
├── repositories/                   # Data access layer
│   ├── interfaces/                 # Repository contracts (e.g., IUserRepository, IEventRepository)
│   └── implementations/            # Persistence implementations (MongoDB/Mongoose or in-memory)
├── di/                             # Dependency Injection via Inversify
│   ├── types.ts                    # DI Symbol identifiers (TYPES)
│   ├── container.ts                # Inversify Container instance setup
│   └── modules/                    # (or bindings/) Inversify ContainerModule definitions
└── shared/                         # Cross-cutting utilities and shared infrastructure
    ├── constants/                  # System constants & RESPONSE_MESSAGE enum
    ├── errors/                     # Custom error classes (AppError, NotFoundError, etc.)
    ├── types/                      # Shared types (ApiResponse<T>, pagination, etc.)
    └── utils/                      # Pure helper utilities (hashing, token helpers, formatters)
```

---

## 2. Request Flow & Architectural Boundaries

Every request flows strictly downward through the layers:

```text
HTTP Request
     ↓
Express Route (src/routes/)
     ↓
Controller (src/controllers/)
     ↓
Service Interface → Service Implementation (src/services/)
     ↓
Domain Entities & Rules (src/domain/)
     ↓
Repository Interface → Repository Implementation (src/repositories/)
     ↓
Database / Storage
```

### Layer Rules:
1. **Controllers (`src/controllers/`)**:
   - Handle HTTP concerns only (request body, params, query, status codes).
   - Validate incoming request payloads.
   - Call service interfaces.
   - Return formatted responses via `ApiResponse<T>` (`successResponse` or `failureResponse`).
   - **FORBIDDEN**: Direct database queries, Mongoose models, or calling repositories directly.

2. **Services (`src/services/`)**:
   - Orchestrate business operations and execute business rules.
   - Call repository interfaces and domain models.
   - Throw application/domain errors (e.g. `AppError`, `NotFoundError`).
   - **FORBIDDEN**: Express objects (`req`, `res`, `next`), HTTP status codes, or raw database queries.

3. **Domain (`src/domain/`)**:
   - Pure TypeScript containing domain entities, types, and invariants.
   - Independent of Express, Inversify, and database drivers/Mongoose.

4. **Repositories (`src/repositories/`)**:
   - Own all data access and persistence logic.
   - Implement repository interfaces defined in `src/repositories/interfaces/`.
   - Isolate database-specific models and queries from the rest of the application.

5. **Dependency Injection (`src/di/`)**:
   - All services, repositories, and controllers participating in DI must be registered in the Inversify container.
   - Resolved at the route layer or container bootstrap.

---

## 3. Strict Coding Standards & Conventions

### TypeScript & ESM Rules:
* **Module Resolution**: `"nodenext"` with ESM (`"type": "module"`).
* **Relative Imports MUST have `.js` extension**:
  ```ts
  import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum.js";
  import { IUserService } from "../interfaces/user.service.interface.js";
  ```
* **Path Alias**: `@/*` is mapped to `./src/*`.
* **Type Safety**:
  - `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
  - **Never use `any`**. Use explicit types or `unknown` with type narrowing.
  - No `@ts-ignore` or unsafe casts (`as any`).

### API Response Format:
Every API response must strictly follow the `ApiResponse<TData>` envelope:
* Import helper functions from `@/shared/types/api-response.js`:
  - `successResponse(message: RESPONSE_MESSAGE, data: TData)`
  - `failureResponse(message: RESPONSE_MESSAGE, errors?: object)`
* Every message MUST come from the `RESPONSE_MESSAGE` enum in `@/shared/constants/response-message.enum.js`.
* Response structure:
  ```json
  {
    "success": true,
    "message": "LOGIN_SUCCESS",
    "data": { ... }
  }
  ```

---

## 4. Inversify DI Implementation Patterns

### 1. DI Tokens (`src/di/types.ts`):
```ts
export const TYPES = {
  // Repositories
  UserRepository: Symbol.for("UserRepository"),
  EventRepository: Symbol.for("EventRepository"),

  // Services
  UserService: Symbol.for("UserService"),
  AuthService: Symbol.for("AuthService"),
  EventService: Symbol.for("EventService"),

  // Controllers
  UserController: Symbol.for("UserController"),
  AuthController: Symbol.for("AuthController"),
  EventController: Symbol.for("EventController"),
} as const;
```

### 2. Service Definition & Injection:
```ts
// src/services/interfaces/user.service.interface.ts
export interface IUserService {
  getUserById(id: string): Promise<User>;
}

// src/services/implementations/user.service.ts
import { injectable, inject } from "inversify";
import { TYPES } from "@/di/types.js";
import type { IUserService } from "../interfaces/user.service.interface.js";
import type { IUserRepository } from "@/repositories/interfaces/user.repository.interface.js";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository
  ) {}

  async getUserById(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }
}
```

### 3. Controller Definition:
```ts
// src/controllers/user.controller.ts
import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "@/di/types.js";
import type { IUserService } from "@/services/interfaces/user.service.interface.js";
import { successResponse } from "@/shared/types/api-response.js";
import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum.js";

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService
  ) {}

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id as string);
      res.status(200).json(successResponse(RESPONSE_MESSAGE.PROFILE_FETCHED, user));
    } catch (error) {
      next(error);
    }
  };
}
```

### 4. Route Wiring with Container:
```ts
// src/routes/user.routes.ts
import { Router } from "express";
import { container } from "@/di/container.js";
import { TYPES } from "@/di/types.js";
import { UserController } from "@/controllers/user.controller.js";

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.get("/:id", userController.getUser);

export default router;
```

---

## 5. Domain Modules & Business Concepts

The platform covers these core functional areas (aligned with `RESPONSE_MESSAGE` enum):
1. **Authentication & OTP**:
   - User Registration & Phone validation (`REGISTRATION_SUCCESS`, `PHONE_ALREADY_REGISTERED`)
   - Login / Logout (`LOGIN_SUCCESS`, `LOGIN_FAILED`)
   - OTP handling: Send, Resend, Cooldown, Verification (`OTP_VERIFIED`, `OTP_EXPIRED`, `OTP_INVALID`, `OTP_RESEND_COOLDOWN_ACTIVE`)
   - Password Management: Update password, verify current password
2. **Users**:
   - Profiles: Fetch user profile (`PROFILE_FETCHED`, `PROFILE_NOT_FOUND`)
   - Admin user management: Fetch users, Block, Unblock
3. **Organizations & Sub-Organizations**:
   - Sub-organization: Create, Fetch, Update, Block (`SUB_ORGANIZATION_CREATED`, etc.)
   - Admin organization oversight: Approve/Reject registration, Block/Unblock
4. **Events**:
   - Event creation & draft saving (`EVENT_DRAFT_SAVED`, `EVENT_DRAFT_SAVE_FAILED`)
   - Publishing validation & state transition (`EVENT_PUBLISHED`, `EVENT_NOT_READY_TO_PUBLISH`)
   - Event discovery & details fetching (`EVENT_FETCHED`, `EVENT_NOT_FOUND`)
   - Participant tracking (`PARTICIPANTS_FETCHED`)

---

## 6. Step-by-Step Feature Implementation Checklist

When tasked with implementing or updating a feature:
1. **Domain**: Define domain types/entities in `src/domain/types/` and `src/domain/entities/`.
2. **Repository**:
   - Define interface in `src/repositories/interfaces/<name>.repository.interface.ts`.
   - Implement in `src/repositories/implementations/<name>.repository.ts`.
3. **Service**:
   - Define interface in `src/services/interfaces/<name>.service.interface.ts`.
   - Implement orchestration in `src/services/implementations/<name>.service.ts` with `@injectable()`.
4. **Controller**:
   - Implement in `src/controllers/<name>.controller.ts` with `@injectable()`, returning `ApiResponse<T>`.
5. **Route**:
   - Create router in `src/routes/<name>.routes.ts`, resolve controller from `container.get()`, mount in `src/app.ts`.
6. **DI Container**:
   - Add token to `TYPES` in `src/di/types.ts`.
   - Bind repository, service, and controller in `src/di/container.ts` (or `src/di/modules/`).
7. **Verify**:
   - Ensure imports use `.js` extension.
   - Run typecheck and tests (`npm run test:run` or `npm run build`).