# FortiStack Frontend

Production-ready frontend for FortiStack using Next.js 14 (App Router), TypeScript, TailwindCSS, and TanStack Query.

## Structure

- `src/app`: App Router pages
  - `/login`: Authentication
  - `/dashboard`: Main overview
  - `/reports`: Report history & generation
  - `/settings`: Alert configuration
  - `/tenants`: Admin tenant management
- `src/components`:
  - `ui`: Reusable components (shadcn-like)
  - `layout`: Dashboard shell
- `src/lib`:
  - `api.ts`: Axios client with interceptors
  - `types.ts`: TypeScript definitions
- `src/hooks`: Custom React Query hooks
- `src/context`: Auth state management

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env.local`
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Key Features

- **RBAC**: Admin-only routes (Tenants) are protected.
- **Auth**: JWT storage in localStorage with automatic refresh token rotation.
- **Data Fetching**: TanStack Query for caching and state management.
- **Forms**: React Hook Form + Zod validation.
