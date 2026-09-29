import { IPermission, PERMISSION } from "./Permission.js";
import { IRole, ROLE } from "./roles.js";
import { IScope, SCOPE } from "./scope.js";

export interface IRoleDefinition {
  scope: IScope;
  permissions: IPermission[];
}

export const AUTHORIZATION: Record<IRole, IRoleDefinition> = {
  [ROLE.SUPER_ADMIN]: {
    scope: SCOPE.SYSTEM,
    permissions: [PERMISSION.EVENT_READ],
  },
  [ROLE.USER]: {
    scope: SCOPE.PUBLIC,
    permissions: [],
  },
  [ROLE.ORGANIZATION_ADMIN]: {
    scope: SCOPE.ORGANIZATION,
    permissions: [],
  },
  [ROLE.SUB_ORGANIZATION_ADMIN]: {
    scope: SCOPE.ORGANIZATION,
    permissions: [],
  },
};
