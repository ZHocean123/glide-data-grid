# Repository Guidelines

## Local Setup Essentials
Target Node 20 (`.nvmrc`). Run `npm install` at the repo root to hydrate all workspaces and keep using the committed `package-lock.json`.

## Project Structure & Module Organization
Core grid logic and public exports live in `packages/core/src`, the only published workspace. `packages/cells/src` hosts reusable cell editors, while `packages/source/src` collects data helpers. Vitest suites sit in each package¨s `test` folder, with integration smoke checks in `test-projects`. Storybook assets live under `.storybook`, `playground` is the manual regression harness, `docs/` holds generated API material, and `media/` stores shared imagery.

## Build, Test & Development Commands
- `npm run storybook` ！ start Storybook on :9009 with live rebuilds for `packages/core`.
- `npm run watch:core` ！ run incremental builds for local debugging.
- `npm run build` ！ build every workspace, then lint.
- `npm run lint --workspaces` ！ execute ESLint across packages; fix issues before committing.
- `npm run typedoc` ！ refresh API docs consumed by `docs/` and marketing sites.
- `npm run test`, `npm run test-cells`, `npm run test-source` ！ run Vitest suites; add `npm run test-18` or `test-19` for the React matrix.
- `npm run test-projects` ！ spin up sample apps in `test-projects/` to verify bundle output.

## Coding Style & Naming Conventions
TypeScript with React hooks is the baseline. Prettier enforces four-space indentation, 120-character lines, semicolons, and double quotes！use `npx prettier --check .` (or `--write`) before pushing. Use PascalCase for components, camelCase for utilities, and prefix hooks with `use`. Match file names to their primary export and prefer named exports unless interop requires defaults.

## Testing Guidelines
Add Vitest specs alongside implementation under `test/` as `*.test.ts` or `*.test.tsx`. Reuse the canvas mocks wired in `vitest.setup.ts`. Surface UX regressions by pairing tests with Storybook stories or `playground` demos. Collect coverage with `npx vitest run --coverage` ahead of larger refactors and update `test-projects` when distribution artifacts change.

## Commit & Pull Request Guidelines
Adopt the conventional prefixes seen in history (`feat(core):`, `fix(cells):`, `deps:`) and keep subjects under ~72 characters. Expand on context in the body and link issues with `Closes #123`. Pull requests should outline motivation, key changes, test evidence, and screenshots or screencasts for visual updates. Validate `npm run build` and the relevant `npm run test*` targets locally before requesting review.
