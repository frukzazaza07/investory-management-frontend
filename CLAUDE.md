# Investory Management Frontend

## Project

React 18 + TypeScript SPA for the Investory inventory management system.

- **Backend API:** `http://localhost:8080`
- **Dev server:** `npm run dev` (Vite, default port 5173)
- **Auth:** JWT Bearer for dashboard routes (`/api/v1/*`), API Key for POS routes (`/api/v1/pos/*`)

## Rules

### After every implementation, run a loop test until it passes

After implementing any feature, fix, or change:

1. Start the dev server if not running: `npm run dev`
2. Run TypeScript check: `npx tsc --noEmit`
3. If errors exist, fix them and repeat from step 2
4. Test the feature manually in the browser against the live API at `http://localhost:8080`
5. Do not report the task done until TypeScript is clean and the feature works end-to-end

### General rules

- Always use the `/verify` skill to test UI changes in the browser before reporting done
- The Investory backend must be running on port 8080 before any API hooks can be exercised
- Use `sonner` `toast.success` / `toast.error` for all user feedback — never `alert()`
- Forms must use `react-hook-form` + `zod` — no uncontrolled inputs
- All API calls go through `src/lib/api.ts` (`api` for JWT routes, `posApi` for POS routes)
- New pages must be added to the router in `src/App.tsx` and the sidebar in `src/components/layout/Sidebar.tsx`
- UI primitives live in `src/components/ui/` — extend there, not inline

## Key file locations

| What | Where |
|------|-------|
| API instances | [src/lib/api.ts](src/lib/api.ts) |
| Auth store (Zustand) | [src/store/authStore.ts](src/store/authStore.ts) |
| All types | [src/types/index.ts](src/types/index.ts) |
| Sidebar nav | [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) |
| Route tree | [src/App.tsx](src/App.tsx) |
| Env vars | [.env.local](.env.local) |
