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

## Deliverables & Acceptance Criteria
- Completed inventory document with module classifications and notes on reuse potential.
- Decision log covering package names, build outputs, Vue version support, and release cadence.
- Updated architectural diagram or README snippet explaining the planned shared module layout.
- Backlog of RFCs or tickets for any open questions requiring stakeholder input.

## Collaboration & Review
- Schedule review workshop with representatives from Core, Cells, Source, and DX teams.
- Circulate findings in `docs/vue-migration/00-foundation.md` and collect sign-off before moving to Phase 1.
- Ensure product/QA stakeholders validate the proposed parity scope.

## Risks & Mitigations
- **Incomplete inventory** → Pair reviews across teams and cross-check with Storybook stories/tests.
- **Underestimated shared code effort** → Prototype extraction of one complex module (e.g. selection model) to validate approach.
- **Naming conflicts** → Consult npm registry early and reserve package names.
