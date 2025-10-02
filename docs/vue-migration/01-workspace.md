# Phase 1 – Vue Workspace Scaffolding

## Desired Outcomes
- New Vue-focused workspaces exist in the monorepo with consistent tooling, build outputs, and publish configuration.
- Storybook and Vitest support Vue components and composables.
- CI and local developer ergonomics match the existing React workspaces.

## Prerequisites
- Phase 0 deliverables signed off (shared module strategy, package naming, tooling decisions).
- Candidate package names reserved on npm.
- Vue 3 tooling dependencies added to the root `package.json` (e.g. `vue`, `@vitejs/plugin-vue`).

## Task Breakdown

### 1.1 Scaffold Workspaces
- Create directories: `packages/core-vue`, `packages/cells-vue`, `packages/source-vue`.
- Author `package.json` files with aligned metadata (`name`, `version`, `files`, `exports`, `peerDependencies` including `vue`).
- Copy/adapt `tsconfig` templates from React packages; enable `jsx: "preserve"` and Vue-specific compiler options where needed.
- Add placeholder `src/index.ts` and `src/components/HelloWorld.vue` (or similar) with smoke-test exports.

### 1.2 Configure Build Tooling
- Introduce shared Vite/Rollup config in `packages/core-vue/vite.config.ts` (and reuse via `tsconfig` path references for other packages).
- Ensure outputs include `dist/esm`, `dist/cjs`, and `dist/dts` bundles mirroring React packaging.
- Update root scripts: `npm run build` should invoke new workspace builds, add `npm run build-vue` if isolation is helpful.
- Document any platform-specific steps (e.g. `cross-env NODE_ENV=production`).

### 1.3 Linting & TypeScript
- Extend ESLint config to cover `.vue` files (use `eslint-plugin-vue`, align with Prettier settings).
- Configure VSCode settings recommendations for `.vue` formatting.
- Add `tsconfig` project references so `tsc -b` includes new packages without breaking existing builds.

### 1.4 Testing Setup
- Install `@vue/test-utils`, `@testing-library/vue`, and configure `vitest.config.ts` per package.
- Ensure `vitest.setup.ts` handles canvas mocks or DOM polyfills needed by the grid.
- Add root scripts: `npm run test-vue` (aggregated) and package-level `npm run test`.

### 1.5 Storybook Integration
- Update `.storybook/main.ts` to register Vue stories or create a sibling config (e.g. `.storybook/vue-main.ts`).
- Verify Storybook can render both React and Vue stories without conflicting webpack/vite settings.
- Add example story in `packages/core-vue/stories/DataGrid.stories.ts` using placeholder components.

### 1.6 CI & Developer Tooling
- Update GitHub Actions to build/test Vue packages (matrix updates, caching for `node_modules` and `dist`).
- Provide documentation for running `npm run watch:core-vue` (new script) if incremental builds are required.
- Validate `npm run lint --workspaces` includes Vue packages and ensure faster targeted scripts exist.

## Deliverables & Acceptance Criteria
- Workspaces compile with `npm run build` (or dedicated Vue script) producing distributable artifacts.
- `npm run test-vue` executes sample tests successfully in CI and locally.
- Storybook preview demonstrates at least one Vue story.
- `docs/vue-migration/01-workspace.md` updated with any deviations or follow-up actions.

## Collaboration & Review
- Pair with DevOps to ensure CI changes are reliable and caching strategy is sound.
- Engage DX/Docs team to align README/Storybook naming with Vue introduction.
- Run a developer onboarding session capturing feedback on the new workflow.

## Risks & Mitigations
- **Tooling conflicts** between React (Webpack) and Vue (Vite) stories → Use Storybook framework-specific builders or split configs.
- **TypeScript project reference issues** → Validate `tsc -b` after each change and adjust path mappings early.
- **Inconsistent lint/format rules** → Reuse Prettier config and add lint-staged entries for `.vue` files.
