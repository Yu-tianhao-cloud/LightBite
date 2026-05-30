# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference docs

Next.js 16 has breaking changes. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test runner is configured yet.

## Architecture

**LightBite (🥗)** — a recipe discovery and nutrition tracking app. The backend is a Python/FastAPI server in `../backend/` serving `http://localhost:8000/api/v1`.

### Routing — Pages Router

This project uses the **Next.js Pages Router** (`pages/`), not the App Router. Each file exports a default React component as the page. Dynamic routes use file-system brackets (e.g., `pages/recipe/[id].tsx`).

| Route | Page | Auth |
|---|---|---|
| `/` | `pages/index.tsx` | No |
| `/recipe/[id]` | `pages/recipe/[id].tsx` | No |
| `/login` | `pages/login.tsx` | No |
| `/register` | `pages/register.tsx` | No |
| `/dashboard` | `pages/dashboard.tsx` | Yes |
| `/log` | `pages/log.tsx` | Yes |
| `/plan` | `pages/plan.tsx` | Yes |
| `/shopping` | `pages/shopping.tsx` | Yes |

### Auth flow

- `context/AuthContext.tsx` wraps the entire app in `_app.tsx` via `<AuthProvider>`.
- On mount, it reads the JWT token from `localStorage`, calls `/auth/me` to validate and populate `user`.
- `lib/api.ts` is a singleton `ApiClient` class with an in-memory token cache. On 401, it clears the token and redirects to `/login`.
- Layout protection: `components/layout/Layout.tsx` checks `PROTECTED` paths and redirects unauthenticated users to `/login`.

### Data layer

- All API calls go through `lib/api.ts` (`api.get()`, `api.post()`, `api.put()`, `api.delete()`). Never use raw `fetch` directly.
- The backend base URL is configured via `NEXT_PUBLIC_API_URL` env var, defaulting to `http://localhost:8000/api/v1`.
- The backend returns JSON. Paginated lists use `{ items: [...], total: number }`.

### Styling

- **Tailwind CSS 4** with the `@tailwindcss/postcss` PostCSS plugin.
- Custom theme colors are defined in both `styles/globals.css` (`@theme inline`) and `tailwind.config.ts` (for IDE IntelliSense):
  - `primary` (#4a7c59), `primary-light` (#e8f5e0), `primary-dark` (#3d6b4f)
  - `accent` (#e94560), `accent-light` (#fef0f0)
  - `warm` (#f39c12)

### Component conventions

- Components are organized by domain under `components/`: `auth/`, `dashboard/`, `layout/`, `recipe/`.
- The `Layout` component provides the shared shell (header + auth guard) — pages wrap their content in `<Layout>...</Layout>`.
- The Header includes a search input that redirects to `/?search=...`.
- Forms manage their own local state and call AuthContext methods (`login`, `register`) or `api` directly.

### Key dependencies

- **recharts** (^3.8.1) for dashboard charts (`CalorieTrendChart`, `WeightTrendChart`).
- No state management library — React Context (`AuthContext`) plus local `useState`/`useEffect` is the pattern.
