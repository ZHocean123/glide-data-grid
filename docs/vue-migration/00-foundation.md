# Phase 0 – Discovery & Shared Infrastructure

## Desired Outcomes
- Map React-specific vs framework-agnostic logic across `packages/core`, `packages/cells`, and `packages/source`.
- Produce a migration-ready backlog describing which modules can be shared directly, require adapters, or need Vue rewrites.
- Agree on naming, packaging, and release strategy for the new Vue workspaces.
- Document technical constraints that impact later phases (canvas APIs, styling, build tooling, Storybook setup).

## Prerequisites
- Current `main` branch synced and `npm install` executed at repository root (covers workspace dependencies).
- Access to recent product requirements for the Vue port (feature parity goals, timeline expectations).
- Stakeholder alignment on licensing, publishing scope, and support policy for the Vue packages.

## Task Breakdown

### 0.1 Inventory React Packages
- Review entry points: `packages/core/src/index.ts`, `packages/cells/src/index.ts`, `packages/source/src/index.ts`.
- Trace key component trees (`components/DataGrid.tsx`, cell renderers, data source hooks) to locate React-specific boundaries.
- Catalogue canvas and utility modules under `packages/core/src/common`, `packages/core/src/utils`, and `packages/core/src/internal`.
- Capture findings in a shared spreadsheet or issue tracker tagged `vue-migration`.

### 0.2 Identify Shared Module Strategy
- Classify each module as:
  - **Shared** – pure TS/JS logic that can be moved to `packages/shared` or re-exported from core.
  - **Adapter** – requires thin React/Vue wrappers around shared logic.
  - **Rewrite** – fundamentally React-specific and demands a Vue implementation.
- Propose directory layout for shared assets (e.g. `packages/core/src/common` vs new `packages/shared`).
- Flag high-risk areas (focus management, clipboard, portal usage) for early spikes.

### 0.3 Decide Package Naming & Distribution
- Evaluate naming options: `@glideapps/glide-data-grid-vue`, `@glideapps/glide-data-grid-core-vue`, etc.
- Confirm bundling targets (ESM for bundlers, CJS compatibility, CSS distribution).
- Align on versioning strategy (match React releases vs independent SemVer).
- Draft release channel plan (alpha → beta → stable) and npm tag usage.

### 0.4 Tooling & Environment Decisions
- Choose Vue build stack (Vite + Rollup + esbuild) and confirm compatibility with existing lint/test infra.
- Define minimum supported Vue version (target Vue 3.4+ with `<script setup>` support).
- Outline testing stack: `vitest`, `@vue/test-utils`, end-to-end via Playwright/Storybook testing library.

## Findings — 2025-10-02 Audit

### Inventory Summary by Package

#### `@glideapps/glide-data-grid` (core)
| Path/Module | Purpose | Classification | Notes |
| --- | --- | --- | --- |
| `common/math.ts`, `common/image-window-loader.ts`, `internal/data-grid/animation-manager.ts`, `internal/data-grid/cell-set.ts`, `internal/data-grid/color-parser.ts` | Canvas math, image batching, animation orchestration, color parsing | Shared candidate | No React imports; pure TS utilities ready to extract to `packages/shared/canvas` bundle. |
| `types/` exports, `internal/data-grid/event-args.ts` | Shared type definitions for grid events, cells, props | Shared candidate | Requires separating React-specific JSX types but otherwise framework-neutral. |
| `common/utils.tsx`, `common/styles.ts` | Hook utilities and CSS variable helpers | Adapter | Depend on `React.useEffect`/`context`; plan to expose DOM helpers plus framework adapters (`useEventListener` becomes `useEventListenerAdapter`). |
| `components/DataGrid.tsx`, `internal/data-grid/data-grid.tsx`, `data-editor/` | Core React component tree | Rewrite | Will inform Vue SFC structure; rely on React portals, contexts, keyboard handlers. |
| `internal/data-grid-overlay-editor/`, `internal/data-grid-search/` | Overlay UX and search panels | Adapter/Rewrite mix | Logic shareable but UI wiring uses React portals; candidate for shared state module plus Vue/React shells. |

#### `@glideapps/glide-data-grid-cells`
| Path/Module | Purpose | Classification | Notes |
| --- | --- | --- | --- |
| `src/utils/`, `src/draw-fns.ts` | Formatting helpers, shared canvas draw routines | Shared candidate | Pure functions aside from imports from `@glideapps/glide-data-grid`; can move to shared cells toolkit. |
| `src/cells/*` | Individual cell renderers and editors | Rewrite | Implemented as React components (`.tsx`); Vue versions require full rewrite but data contracts reusable. |
| `src/index.ts` | Registration glue | Adapter | Manage exports that will map to Vue plugin/composable pattern. |

#### `@glideapps/glide-data-grid-source`
| Path/Module | Purpose | Classification | Notes |
| --- | --- | --- | --- |
| `use-async-data-source.ts`, `use-undo-redo.ts`, `use-column-sort.ts`, `use-movable-columns.ts`, `use-collapsing-groups.ts` | React hooks implementing async pipelines and derived state | Rewrite | Depend on `React.useState`/`useRef`; need Vue composables replicating behaviour. Shared algorithms inside functions can be extracted. |
| Shared logic within hooks (selection math, `CompactSelection`, lodash helpers) | Data manipulation | Shared candidate | Move to `packages/shared/data` to reduce duplication and keep parity. |
| Storybook stories under `src/stories/` | Demo hooks in React | Out of scope | Keep for React; create new Vue demos later. |

### Shared Module Strategy Proposal
- Create `packages/shared` workspace housing canvas math, color parsing, selection models, clipboard helpers, and data transforms.
- Expose framework-agnostic utilities via subpath exports (`@glideapps/glide-data-grid-shared/canvas`, `/data`, `/theme`).
- Maintain React-specific adapters (`useEventListener`, `useMeasure`) alongside new Vue adapters implementing identical signatures for parity.
- Establish automated tests in shared workspace before copying logic into Vue packages to prevent drift.

### Package Naming & Distribution Decisions
- Reserve npm names `@glideapps/glide-data-grid-vue`, `@glideapps/glide-data-grid-cells-vue`, `@glideapps/glide-data-grid-source-vue`. (`npm view` check on `@glideapps/glide-data-grid-vue` returned 404, confirming availability.)
- Align versioning with React packages (shared SemVer) to simplify cross-framework parity communication.
- Ship ESM + CJS bundles with identical folder layout to React packages (`dist/esm`, `dist/cjs`, `dist/dts`, optional `dist/style.css`).
- Publish initial releases under `next` tag; promote to `latest` after Phase 5 hardening.

### Tooling & Environment Decisions
- Build tooling: Vite for dev/Storybook builder, Rollup for library bundling (`vite build --config library` pattern).
- Testing: Extend Vitest with `@vue/test-utils` + DOM canvas mocks reused from React setups; add Playwright smoke tests for shared scenarios.
- Linting/Formatting: `eslint-plugin-vue`, reuse Prettier config, enable type-check via `vue-tsc --build` in CI.
- Minimum versions: Vue 3.4+, TypeScript 5.4+ (matching repo baseline), Node 20 per `.nvmrc`.

### Risks & Follow-ups Identified
- React-specific context patterns (DataEditor overlays, focus traps) need clear adapter design before Phase 2 kicks off.
- Some "shared" files import React (e.g. `common/styles.ts`) and must be refactored to drop React dependencies or wrapped per framework.
- Third-party React-only dependencies (`@toast-ui/react-editor`, `react-select`) require Vue alternatives or neutral wrappers—tracked for Phase 3.

## Next Actions
1. Draft extraction plan for high-value shared modules (canvas math, animation manager, color parser) including target paths under `packages/shared`.
2. Author RFC covering adapter patterns (`useEventListener`, overlay portals) and align with core team.
3. Begin refactoring React shared files to remove direct React imports where feasible, de-risking Phase 2 timeline.
