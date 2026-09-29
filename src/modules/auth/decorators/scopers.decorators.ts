import { SetMetadata } from "@nestjs/common";

export const SCOPE_KEY = "scopes";

export const Scopes = (...scopes: string[]) => SetMetadata(SCOPE_KEY, scopes);
