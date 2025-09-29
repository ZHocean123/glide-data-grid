# Glide Data Grid Vue 3 Migration Plan

## Overview

This document outlines the step-by-step approach for migrating Glide Data Grid from the existing React stack to a Vue 3-based implementation while preserving functionality and ensuring verifiable progress at each milestone. The migration is organized so React and Vue stacks can coexist during the transition, enabling iterative delivery and validation.

## Current State Snapshot

- Core package (`packages/core`) exports the primary data grid components written in React.
- Rendering logic for canvas-based cells resides under `packages/core/src/internal/data-grid/render` and is largely framework-agnostic TypeScript.
- Supporting packages (`packages/source`, `packages/cells`) provide React-oriented hooks and renderers.
- Storybook, testing utilities, and docs rely on React-specific tooling (`@storybook/react-*`, `@testing-library/react`).

## Guiding Principles

- Maintain a working React build and test suite until the Vue stack reaches feature parity.
- Favor extraction of framework-neutral logic before rewriting UI layers.
- Deliver migration work in reviewable, self-contained slices (module-by-module, file-by-file).
- Add or extend automated tests in tandem with each migration step to lock in behavior.
- Provide manual verification paths (Storybook examples, exploratory testing) for critical UX flows.

## Phase Breakdown

### Phase 0 - Environment Preparation

- Inventory shared logic and record React-specific touchpoints in the codebase.
- Introduce Vue 3, `@vitejs/plugin-vue`, and `@storybook/vue3-vite` into the toolchain; create a dedicated `tsconfig.vue.json`.
- Ensure existing React Storybook and unit tests continue passing; stand up a minimal Vue demo to confirm dual-stack tooling.
- **Validation:** React regression suite, Vue hello-world smoke check.

### Phase 1 - Shared Logic Extraction

- Move framework-neutral utilities (e.g., from `packages/core/src/common`, `internal/data-grid/render`) into a shared module namespace.
- Refactor React-specific hooks/components to wrap shared primitives; expose equivalent adapters for Vue.
- Add Vitest coverage for shared logic where gaps exist.
- **Validation:** React build/test remain green; new shared tests pass.

### Phase 2 - Vue Data Grid Foundations

- Create Vue entry point under `packages/core/src/vue` with theming utilities, context providers, and helpers mirroring React behavior.
- Port `internal/data-grid/data-grid.tsx` to a Composition API-based `DataGrid.vue`, preserving canvas rendering flows.
- Keep React implementation intact for diffing during review.
- **Validation:** Vue unit tests with `@vue/test-utils`; Storybook Vue stories for base grid rendering.

### Phase 3 - DataEditor Container Migration

- Translate `data-editor/data-editor.tsx` and `data-editor-all.tsx` into Vue components, using composition functions to manage complex state.
- Sequentially migrate each React hook (`use-autoscroll`, `use-column-sizer`, etc.) into shared logic plus Vue-specific wrappers.
- Add automated tests around critical behavior (scrolling, selection, clipboard) before/after migration.
- **Validation:** React + Vue Storybook scenarios for parity; targeted interaction tests via Vitest or Playwright.

### Phase 4 - Cells and Overlay Editors

- Convert cell renderers in `packages/core/src/cells` to framework-neutral functions plus Vue bindings; replace `@linaria/react` usage with `@linaria/core` or equivalent CSS pipeline.
- Rebuild overlay editor system (`internal/data-grid-overlay-editor/**`) using Vue Teleport for layered UI.
- Maintain per-cell Storybook stories to confirm styling and interaction matches.
- **Validation:** Component-level tests for each cell type; Storybook visual inspection.

### Phase 5 - Supporting Packages

- Update `packages/source` hooks to provide Vue composition functions while keeping React exports temporarily.
- Adjust `packages/cells` or any auxiliary packages to publish Vue-ready modules.
- Consider publishing React bindings under a dedicated package (`@glideapps/glide-data-grid-react`) if long-term support is desired.
- **Validation:** Integration tests within sample projects (React and Vue) consuming the shared packages.

### Phase 6 - Documentation and Storybook

- Migrate Storybook configuration to support Vue 3 stories; retain React stories either in parallel or under a separate build.
- Revise documentation (`README.md`, `API.md`) with Vue usage guides and migration notes.
- Generate Vue-focused API docs via Typedoc or equivalent tooling.
- **Validation:** Storybook builds for both stacks; doc site link checks.

### Phase 7 - Cleanup and Release

- Remove React-specific dependencies/scripts once Vue parity is established or split React into its own package.
- Update CI/CD pipelines to run Vue builds/tests and publish Vue bundles.
- Cut staged releases (`alpha`, `beta`) to gather feedback before GA.
- **Validation:** Full CI pass, manual regression in sample apps, successful pre-release publish.

### Phase 8 - Ongoing Tracking and QA

- After each phase, produce status updates with achieved milestones, blockers, and next actions.
- Expand automated regression coverage (e.g., screenshot or pixel-diff tests) comparing React vs. Vue outputs during overlap period.
- Collect user feedback from early adopters and incorporate into subsequent sprints.
- **Validation:** Regular review checkpoints, QA sign-offs, stakeholder demos.

---

**Next Steps Checklist**

1. Confirm team alignment on the phase schedule and resource allocation.
2. Set up tracking (issue board or roadmap) using the phases above as epics.
3. Kick off Phase 0 tasks and log findings in this document.

## Progress Log

- 2025-09-29: Shared bounds/geometry/column helpers are now consumed from Vue through new `useGridGeometry` and `useMappedColumns` composables. Added Vue Vitest coverage (`use-mapped-columns.test.ts`) to document behaviour while continuing Phase 2 foundations.
- 2025-09-29: Vue DataGrid component skeleton renders mapped headers via shared composables; added `data-grid.test.ts` to capture width/sticky metrics.
- 2025-09-29: `useGridGeometry` now supports Vue refs/getters; covered by `use-grid-geometry.test.ts`.
- 2025-09-29: DataGrid canvas scaffold wired with DPR-aware sizing plus Storybook controls; added canvas sizing test coverage.
- 2025-09-29: Theme overrides now flow through the Vue DataGrid root, applying CSS variables via shared `makeCSSStyle` for upcoming canvas rendering work.
