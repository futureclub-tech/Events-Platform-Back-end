---
name: event-platform-architecture
description: Layer blueprints, coding standards, and scaffolding runbooks for the Event Management Platform backend. Activate this skill whenever creating, modifying, or testing routes, controllers, services, repositories, or Inversify DI bindings.
---

# Event Platform Architecture & Feature Scaffolding

This skill provides step-by-step procedures and templates for implementing features in this repository without needing to explore or search the codebase for architectural context.

---

## 1. Architectural Rules Cheat Sheet

* **Paradigm**: Traditional Monolith with strict horizontal layering.
* **Flow**: Express Route $\rightarrow$ Controller $\rightarrow$ Service Interface / Impl $\rightarrow$ Domain Entity $\rightarrow$ Repository Interface / Impl $\rightarrow$ Database.
* **DI Library**: Inversify (`@injectable()`, `@inject(TYPES.<Token>)`).
* **ESM Imports**: All relative imports MUST specify `.js` extension (`import ... from "./foo.js"`).
* **Path Alias**: `@/*` points to `src/*`.
* **API Response Envelope**: Always `successResponse(RESPONSE_MESSAGE.<KEY>, data)` or `failureResponse(RESPONSE_MESSAGE.<KEY>, errors)`.

---

## 2. Standard Feature Implementation Workflow

When adding a feature or endpoint (e.g. `User`, `Event`, `Auth`, `Organization`):

### Step 1: Define Domain Entity / Types
* Path: `src/domain/entities/<feature>.entity.ts` and `src/domain/types/<feature>.types.ts`
* Keep domain pure TypeScript. Do not import Express, Inversify, or DB drivers.

### Step 2: Define & Implement Repository
1. Contract in `src/repositories/interfaces/<feature>.repository.interface.ts`:
   ```ts
   import type { User } from "@/domain/entities/user.entity.js";

   export interface IUserRepository {
     findById(id: string): Promise<User | null>;
     create(user: Partial<User>): Promise<User>;
   }
   ```
2. Concrete class in `src/repositories/implementations/<feature>.repository.ts`:
   ```ts
   import { injectable } from "inversify";
   import type { IUserRepository } from "../interfaces/user.repository.interface.js";
   import type { User } from "@/domain/entities/user.entity.js";

   @injectable()
   export class UserRepository implements IUserRepository {
     async findById(id: string): Promise<User | null> {
       // Data store interaction
     }
     async create(user: Partial<User>): Promise<User> {
       // Data store interaction
     }
   }
   ```

### Step 3: Define & Implement Application Service
1. Contract in `src/services/interfaces/<feature>.service.interface.ts`:
   ```ts
   import type { User } from "@/domain/entities/user.entity.js";

   export interface IUserService {
     getUserProfile(id: string): Promise<User>;
   }
   ```
2. Concrete class in `src/services/implementations/<feature>.service.ts`:
   ```ts
   import { injectable, inject } from "inversify";
   import { TYPES } from "@/di/types.js";
   import type { IUserService } from "../interfaces/user.service.interface.js";
   import type { IUserRepository } from "@/repositories/interfaces/user.repository.interface.js";
   import type { User } from "@/domain/entities/user.entity.js";

   @injectable()
   export class UserService implements IUserService {
     constructor(
       @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
     ) {}

     async getUserProfile(id: string): Promise<User> {
       const user = await this.userRepo.findById(id);
       if (!user) {
         throw new Error("User not found");
       }
       return user;
     }
   }
   ```

### Step 4: Implement Controller
* Path: `src/controllers/<feature>.controller.ts`:
   ```ts
   import { injectable, inject } from "inversify";
   import type { Request, Response, NextFunction } from "express";
   import { TYPES } from "@/di/types.js";
   import type { IUserService } from "@/services/interfaces/user.service.interface.js";
   import { successResponse } from "@/shared/types/api-response.js";
   import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum.js";

   @injectable()
   export class UserController {
     constructor(
       @inject(TYPES.UserService) private readonly userService: IUserService,
     ) {}

     getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
       try {
         const user = await this.userService.getUserProfile(req.params.id as string);
         res.status(200).json(successResponse(RESPONSE_MESSAGE.PROFILE_FETCHED, user));
       } catch (error) {
         next(error);
       }
     };
   }
   ```

### Step 5: Register DI Bindings
1. Add symbols to `src/di/types.ts`:
   ```ts
   export const TYPES = {
     UserRepository: Symbol.for("UserRepository"),
     UserService: Symbol.for("UserService"),
     UserController: Symbol.for("UserController"),
     // ...
   } as const;
   ```
2. Bind implementations in `src/di/container.ts`:
   ```ts
   import { Container } from "inversify";
   import { TYPES } from "./types.js";
   import type { IUserRepository } from "@/repositories/interfaces/user.repository.interface.js";
   import { UserRepository } from "@/repositories/implementations/user.repository.js";
   import type { IUserService } from "@/services/interfaces/user.service.interface.js";
   import { UserService } from "@/services/implementations/user.service.js";
   import { UserController } from "@/controllers/user.controller.js";

   export const container = new Container({ defaultScope: "Singleton" });

   container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
   container.bind<IUserService>(TYPES.UserService).to(UserService);
   container.bind<UserController>(TYPES.UserController).to(UserController);
   ```

### Step 6: Create Routes & Mount in Express App
1. Route definition in `src/routes/<feature>.routes.ts`:
   ```ts
   import { Router } from "express";
   import { container } from "@/di/container.js";
   import { TYPES } from "@/di/types.js";
   import { UserController } from "@/controllers/user.controller.js";

   const router = Router();
   const userController = container.get<UserController>(TYPES.UserController);

   router.get("/:id", userController.getProfile);

   export default router;
   ```
2. Mount in `src/app.ts`:
   ```ts
   import userRoutes from "./routes/user.routes.js";
   // ...
   app.use("/api/users", userRoutes);
   ```

---

## 3. Verification & Quality Gate
After implementing:
1. Verify ESM imports end with `.js`.
2. Check for type safety (no `any`).
3. Run tests or build:
   - `npm run test:run`
   - `npm run build`
