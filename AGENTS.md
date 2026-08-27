# Repository Guidelines

## Project Structure & Module Organization

SkyrimWebMonitor is a Vue 3 PWA + Capacitor/Electron companion app organized with Feature-Sliced Design (FSD). Source lives under `src/` with layers: `app/` (bootstrap, router, layout), `pages/` (route screens), `features/` (user interactions), `entities/` (domain models), `shared/` (reusable UI, libs, styles), and `stores/` (Pinia stores). Platform configs live at the repo root: `android/` (Capacitor), `electron/`, and `capacitor.config.ts`. Tests are co-located in `src/**/tests/`; static assets and build output sit in `public/` and `dist/`.

## Build, Test, and Development Commands

- `npm run dev` — run the Vite dev server.
- `npm test` / `vitest` — run the unit test suite.
- `npm run tsc` — type-check with `vue-tsc --noEmit`.
- `npm run lint` — type-check with `vue-tsc`, then lint and auto-fix JS/TS/Vue against ESLint rules, then lint and auto-fix SCSS/CSS with Stylelint.
- `npm run build` — production PWA build via Vite.
- `npm run build:android` — Capacitor build (`VITE_CAPACITOR=true`).
- `npm run android:apk` — build the Android APK.

## Coding Style & Naming Conventions

Follow FSD: keep domain logic in `entities/`, interactions in `features/`, and shared utilities in `shared/`. Components use PascalCase filenames (`BaseSwitch.vue`); stores use camelCase with a `use` prefix (`useNavigationStore`); Pinia stores live in `src/stores/`. Use 2-space indentation, single quotes, and trailing commas (Prettier config). SCSS uses BEM-flavored prefixless classes with Skyrim theme variables. Prefer composition over nesting and keep components small.

## Testing Guidelines

Tests use Vitest with `happy-dom` and `@vue/test-utils`. Place tests in a `tests/` folder next to the code they cover, named `*.test.ts`. Keep tests focused on store/app/composable behavior rather than rendering snapshots. Run the suite with `npm test`; add or update tests for any new logic.

## Commit & Pull Request Guidelines

- Follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `perf:` (e.g. `fix: blur button on click ...`). Ready-to-merge release commits use `chore(release): 0.x.y`.
- Keep subject lines short and imperative; describe scope in parentheses when relevant (`fix(dev): remote host connect`).
- Work on feature branches (e.g. `feature/...`, `bugfix/...`) and open a PR to the main branch.
- PRs must include a concise description, be scoped to a single logical change, and pass `npm run lint` and `npm test` before merge. Include screenshots for UI changes.

## Security & Configuration Tips

- Env config lives in `.env*` files (see `.env.example`). Never commit real credentials or tokens; `.gitignore` excludes local env files.
- `notes` on the `server` block: the Capacitor Android build uses `androidScheme: 'http'` with cleartext enabled — keep this in mind for any asset/network debugging in the native app.
