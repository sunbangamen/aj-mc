# Repository Guidelines

## Project Structure & Modules
- `src/components/` reusable UI (PascalCase, e.g., `SensorChart.jsx`)
- `src/pages/` route-level views (e.g., `AdminDashboard.jsx`)
- `src/services/` Firebase config (`firebase.js`)
- `src/hooks/` custom hooks (`useSensorData.js`, etc.)
- `src/contexts/`, `src/utils/`, `src/types/` shared primitives
- `public/` static assets, `index.html` entry; app starts at `src/main.jsx`

## Build, Dev, and Utility Commands
- `npm install` install dependencies
- `npm run dev` start Vite dev server on `:5173`
- `npm run build` production build to `dist/`
- `npm run preview` serve build locally
- `npm run lint` run ESLint (errors fail CI/local)
- `npm run format` apply Prettier to `src/**/*`
- `npm run check-env` validate required Firebase env vars
- `npm run clear-db` destructive: clears `sensors` and `sites` in Realtime DB

## Coding Style & Naming
- Prettier: 2 spaces, single quotes, no semicolons, width 80, trailing commas `es5`.
- ESLint: `@eslint/js` + React Hooks + Vite refresh; no unused vars (except ALL_CAPS globals).
- Components: PascalCase `.jsx`; hooks: `useX.js`; utilities: `camelCase.js`.
- Keep modules focused; colocate styles (`.css`) near components.

## Testing Guidelines
- No formal test suite yet. Prefer Vitest + React Testing Library.
- Add tests as `src/__tests__/file.test.jsx` or colocated `*.test.jsx`.
- Aim for coverage on hooks and complex components (formatting, lint must pass).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
  - Example: `feat: add zoom to SensorChart`
- PRs must include: purpose/summary, linked issues, screenshots for UI changes, and notes on data impact.
- Before opening a PR: `npm run lint && npm run format && npm run check-env`.

## Security & Configuration
- Never commit secrets. Copy `.env.example` to `.env` and fill Firebase values.
- Verify config with `npm run check-env`.
- `npm run clear-db` is irreversible; use only in development with explicit confirmation.
- See `docs/firebase-data-structure.md` for expected DB shape.

## Architecture Overview
- React + Vite frontend; Firebase Realtime Database backend.
- Entry: `src/main.jsx`; app shell/styles: `App.jsx`/`App.css`.
- Routing lives under `src/pages/`; charts via `recharts`.
