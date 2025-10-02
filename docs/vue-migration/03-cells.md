# Phase 3 – Cells Library Port

## Desired Outcomes
- Provide Vue implementations of optional cell editors/renderers with consistent APIs and theming.
- Ensure advanced editors (markdown, rich text, dropdowns, image pickers) function in Vue while sharing validation/formatting logic with React.
- Offer a distribution that can be consumed independently or alongside the Vue core grid package.

## Prerequisites
- Core Vue grid component available with extension points for custom cell renderers/editors.
- Decisions on third-party editor dependencies completed (replacement vs wrapper strategy).
- Shared styling tokens and helpers published for reuse (`packages/core-vue` or `packages/shared`).

## Task Breakdown

### 3.1 Audit React Cells & Dependencies
- Review `packages/cells/src` to classify cell types (simple renderers vs complex editors).
- Inventory external packages (e.g. `@toast-ui/react-editor`, `react-select`, `react-number-format`) and determine Vue equivalents (`@toast-ui/editor`, `vue-select`, native formatting).
- Identify shared utility hooks that require Vue counterparts (e.g. clipboard helpers, async commit flows).

### 3.2 Define Vue Cell API Surface
- Decide on naming convention (e.g. `useCheckboxCell`, component SFC `MarkdownCell`).
- Implement TypeScript interfaces describing cell render props, editor lifecycle callbacks, and emit events.
- Provide registration helper similar to React `provideExtraCellRenderers`, adapted for Vue plugin/composable usage.

### 3.3 Implement Core Cell Types
- Port simple display cells (text, number, boolean) using shared formatting logic.
- Rebuild interactive editors (dropdown, autocomplete, markdown, custom forms) leveraging Vue component patterns (teleport for overlays where needed).
- Handle asynchronous validation/commit flows using Vue `emit` + `Promise` patterns consistent with grid expectations.

### 3.4 Styling & Theming
- Reuse CSS/linaria styles where possible; otherwise expose theme-aware classes that map to core grid tokens.
- Validate dark mode, high-contrast, and custom theme overrides.
- Document recommended styling overrides for Vue consumers.

### 3.5 Testing & Documentation
- Create Vitest suites verifying editor lifecycle (mount, input, commit/cancel, focus handoff).
- Add Storybook stories per cell type demonstrating configuration options.
- Publish usage guide in `packages/cells-vue/README.md` including registration snippets and compatibility notes.

## Deliverables & Acceptance Criteria
- `packages/cells-vue` exports parity set of cell renderers/editors matching React names (or documented alternatives).
- Complex editors have Vue-compatible third-party integrations (or approved substitutions) with QA sign-off.
- Example project in `test-projects/` demonstrates the Vue core grid using cells-vue package end-to-end.
- Documentation clearly states any deviations, fallback behaviour, or missing features compared to React cells.

## Collaboration & Review
- Coordinate with design/UX to confirm theming accuracy and accessibility compliance (focus order, ARIA roles).
- Engage legal/licensing stakeholders if new third-party Vue packages introduce different licenses.
- Run user testing sessions with internal teams migrating existing React cell customisations.

## Risks & Mitigations
- **Third-party gaps** (no Vue equivalent) → Build lightweight wrapper around vanilla JS editor or scope v1 without feature until replacement ready.
- **Performance regressions** from reactive forms → Use controlled inputs sparingly, rely on shared debounced update helpers.
- **Inconsistent API naming** vs React → Provide migration table and TypeScript aliases for near-term compatibility.
- **Styling drift** → Add visual regression tests comparing React vs Vue stories where feasible.
