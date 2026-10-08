# Events Platform API

Starter TypeScript and Express API.

## Getting started

```sh
npm install
npm run dev
```

The API listens on port `3000` by default. Set `PORT` to change it. `GET /health`
returns a basic health response.

Login requires independent `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
environment variables. It sets HTTP-only `accessToken` and `refreshToken`
cookies, expiring after 15 minutes and 7 days respectively. Cookies use the
`Secure` flag when `NODE_ENV=production`.

## Response format

Responses use stable machine-readable codes from
`src/shared/constants/response-message.enum.ts`:

```json
{
  "success": true,
  "message": "HEALTH_CHECK_SUCCESS",
  "data": { "status": "ok" }
}
```

Use `successResponse` and `failureResponse` from
`src/shared/types/api-response.ts` when adding route handlers. Add response
codes to `RESPONSE_MESSAGE` rather than returning ad hoc message strings.

Unknown routes return `ROUTE_NOT_FOUND`; uncaught request errors return
`INTERNAL_ERROR`.

## Import aliases

Use `@/*` for modules under `src`, for example:

```ts
import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum";
```

TypeScript resolves this alias through `tsconfig.json`. The build script rewrites
the alias in compiled JavaScript so it runs directly in Node.js.
