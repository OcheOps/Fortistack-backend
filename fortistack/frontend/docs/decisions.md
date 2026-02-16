# FortiStack Frontend — Architecture Decisions

## 1. User Identity Derived from JWT Claims

The backend **does not** expose a `/me` or `/auth/me` endpoint. Instead, user identity is derived by decoding the JWT `access_token` on the client side using `jwt-decode`.

**Claims used:**
- `sub` or `user_id` → `user_id`
- `tenant_id` → `tenant_id`
- `role` → `role` (admin | tenant_admin | viewer)
- `exp` → token expiration (checked on page load)

**Trade-offs:**
- Faster: no extra HTTP round-trip to get user info
- Simpler: backend didn't need to implement `/me`
- Risk: if the JWT payload structure changes, the frontend decoding breaks silently

**Mitigation:** The `JWTClaims` type in `src/lib/types.ts` explicitly types every claim we read.

## 2. API Envelope Unwrapping

Every backend response is wrapped in `{ data: T, error: { code, message, details? } }`.

The `ApiClient.request()` method unwraps this automatically:
- On success: returns `envelope.data` as `T`
- On error: throws `ApiError` with the backend's error message and code

This means hooks and components never see the envelope — they receive clean typed data or catch typed errors.

## 3. Docker Networking

`NEXT_PUBLIC_API_BASE_URL` is set to `http://localhost:8080` in docker-compose.

**Reasoning:** The Next.js frontend runs in the browser (client-side rendering). The browser makes API calls from the user's machine, not from the Docker container. Since the `api` service maps port 8080 to the host, `localhost:8080` is correct.

If you switch to server-side rendering (SSR) for API calls, you would need `http://api:8080` for server-to-server communication within Docker.

## 4. Token Refresh

On 401 responses (except `/auth/login` and `/auth/refresh`), the API client:
1. Attempts to refresh using the stored `refresh_token`
2. If successful, retries the original request with the new access token
3. If refresh fails, clears tokens and redirects to `/login`

## 5. Tailwind CSS v4

This project uses **Tailwind CSS v4** with the new `@import "tailwindcss"` and `@theme` syntax. There is no `tailwind.config.ts` file — all theme tokens are defined in `globals.css` using CSS custom properties inside `@theme {}`.

## 6. Component Library

Using **Shadcn UI** components (Card, Button, Badge, Table, Dialog, Input, Label, DropdownMenu, Sheet, Skeleton). All components are in `src/components/ui/` and use the `cn()` utility from `src/lib/utils.ts`.

## 7. Error Handling — No `any` Types

All error catches use `unknown` type and are narrowed with `instanceof Error` checks. The `ApiError` class uses `unknown` for its `details` field. API body parameters use `Record<string, unknown>` instead of `any`.
