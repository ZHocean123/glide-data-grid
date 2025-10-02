# Glide Data Grid Vue 3 Migration Plan

## Objectives
- Deliver first-class Vue 3 equivalents for the core grid, optional cell editors, and data source helpers without regressing the React packages.
- Preserve as much shared TypeScript business logic as possible so that React and Vue distributions evolve together.
- Provide a polished developer experience (DX) with testing, documentation, and tooling that matches the existing React setup.

## Scope
- Create new Vue-first workspaces inside `packages/`: `core-vue`, `cells-vue`, and `source-vue` (final package names TBD during foundation work).
- Expose Vue single-file components (SFCs) and composables that mirror the public API surface of the React packages.
- Establish dedicated Storybook stories, Vitest suites, and build pipelines for the Vue packages.
- Coordinate shared assets (styles, icons, constants, canvas utilities) between React and Vue packages to avoid duplication.

_Out of scope_
- Rewriting the React implementation or changing its public API beyond what is required for shared abstractions.
- Supporting Vue 2 or legacy tooling.
- Shipping mixed React/Vue hybrid integration helpers beyond interop examples.

## Guiding Principles
1. **Framework parity**: Feature-level parity with the React grid drives acceptance criteria for each milestone.
2. **Shared core logic**: Move framework-agnostic logic (state machines, math utilities, data transforms) into common modules to minimise divergence.
3. **Progressive hardening**: Land each package behind an opt-in preview flag, iterate with internal adoption, then stabilise for public release.
4. **DX symmetry**: Align linting, TypeScript configs, testing, and release automation with the existing workspaces for maintainability.

## Workstreams & Milestones

### Phase 0 – Discovery & Shared Infrastructure (1 sprint)
**Goals**
- Audit React packages to catalogue reusable logic vs React-specific layers.
- Define the folder structure, package names, tooling stack (Vite + Rollup build, ESLint, Vitest), and build outputs.
- Draft cross-package coding conventions (prop naming, event casing, composables).

**Deliverables**
- `docs/vue-migration/00-foundation.md` with audit results and extracted shared modules list.
- RFC for package naming and npm publishing strategy.
- Skeleton shared utilities folder (e.g. `packages/shared`) or documented plan to reuse existing code paths.

### Phase 1 – Vue Workspace Scaffolding (1 sprint)
**Goals**
- Generate template workspaces (`core-vue`, `cells-vue`, `source-vue`) with `package.json`, `tsconfig`, lint/test scripts, and build tooling.
- Configure Storybook for Vue and align root `package.json` scripts.
- Establish shared ESLint/Prettier/Vitest configs and ensure monorepo tooling recognises the new packages.

**Deliverables**
- Compilable hello-world Vue components/composables proving the toolchain.
- CI smoke test covering `npm run build` and a dedicated `npm run test-vue` script (new).
- `docs/vue-migration/01-workspace.md` detailing setup decisions and outstanding gaps.

### Phase 2 – Core Grid Port (2–3 sprints)
**Goals**
- Port the primary `DataGrid` API to a Vue SFC while reusing the canvas rendering layer.
- Implement Vue composables mirroring imperative APIs (selection, editing, keyboard handling).
- Ensure styling, virtualization, and accessibility features match React behaviour.

**Deliverables**
- `packages/core-vue` with documented props/events and a parity checklist.
- Interactive Storybook stories and a `playground` scenario exercising major features.
- `docs/vue-migration/02-core-grid.md` describing architecture decisions, shared module boundaries, and open items.

### Phase 3 – Cells Library Port (1–2 sprints)
**Goals**
- Recreate optional cell editors/renderers as Vue components with consistent theming and async loading behaviour.
- Share validation and formatting logic with React where feasible.
- Provide fallbacks or shims for React-specific dependencies (e.g. replace `@toast-ui/react-editor` with the underlying editor or a Vue alternative).

**Deliverables**
- `packages/cells-vue` shipping the component library and documentation.
- Test suite ensuring editor lifecycle, focus management, and keyboard handling.
- `docs/vue-migration/03-cells.md` capturing differences from React cells and third-party dependency strategy.

### Phase 4 – Data Source Helpers Port (1 sprint)
**Goals**
- Convert hook-based data sources (`useDataEditor`, etc.) into Vue composables and provide TypeScript-first APIs.
- Validate compatibility with Vue reactivity (watchers, computed values) and concurrency considerations.
- Provide migration notes for consumers adopting the new composables.

**Deliverables**
- `packages/source-vue` with published composables and docs.
- Example integration in `test-projects/` demonstrating a full Vue data pipeline.
- `docs/vue-migration/04-source.md` outlining design choices and open questions.

### Phase 5 – Integration, Hardening & Release (1 sprint)
**Goals**
- Run cross-framework regression tests, Storybook visual diffing, and playground smoke checks.
- Finalise documentation (API references, migration guides) and marketing handoff.
- Prepare release candidates, update changelogs, and align semantic versioning with React packages.

**Deliverables**
- Unified release checklist in `docs/vue-migration/05-integration.md`.
- Changelog entries per package (`core-vue`, `cells-vue`, `source-vue`).
- Publishing automation updates (GitHub Actions, npm tags).

## Cross-Cutting Concerns
- **Shared utilities extraction**: Track candidates for `packages/shared` or move into existing `packages/core/src/common` with framework-neutral exports.
- **Styling strategy**: Decide between CSS modules, PostCSS, or scoped SFC styles; ensure design tokens remain single-sourced.
- **Storybook strategy**: Evaluate single Storybook instance with multi-framework stories vs a dedicated Vue Storybook.
- **Testing**: Extend Vitest configuration for Vue (`@vitest/ui`, `@vue/test-utils`) and add Playwright smoke tests for end-to-end verification.
- **Documentation**: Plan updates to `docs/`, marketing site, and API references (Typedoc + Vue-specific guides).

## Risks & Mitigations
- **React-specific assumptions** in core code may block reuse → Early audit, extract shared services, and add adapter layers.
- **Third-party React dependencies** (e.g. Toast UI React editor) lack direct Vue equivalents → Evaluate dependency replacements or build wrapper adapters.
- **Performance regressions** due to Vue reactivity overhead → Profile critical paths, leverage shallow refs, and reuse existing canvas batching logic.
- **Resource constraints** across multiple packages → Phase workstreams to allow incremental release (core first, cells/source trailing).

## Success Metrics
- Vue grid achieves feature parity checklist with React for top 20 scenarios (virtualization, editing, theming, drag fill, clipboard).
- CI pipelines for Vue packages run under 5 minutes with >90% unit test coverage on shared logic.
- Beta adopters report fewer than five framework-specific defects before GA release.

## Next Steps
1. Kick off Phase 0 discovery sessions and document shared module candidates.
2. Confirm package naming and publishing strategy with stakeholders.
3. Begin scaffolding the Vue workspace per `docs/vue-migration/01-workspace.md` once foundational decisions are locked.
