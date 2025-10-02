# Phase 2 – Core Grid Port

## Desired Outcomes
- Ship a Vue 3 `DataGrid` component with feature parity for rendering, interaction, and accessibility compared to the React implementation.
- Reuse shared business logic (selection model, clipboard, column sizing, theme tokens) via extracted utilities.
- Provide Vue composables/composition APIs for imperative helpers currently exposed as React hooks.

## Prerequisites
- Phase 1 scaffolding complete and validated.
- Shared utilities identified in Phase 0 moved or aliased for Vue consumption.
- Canvas rendering layer assumptions documented (e.g. reliance on `useLayoutEffect`, portals).

## Task Breakdown

### 2.1 Stabilise Shared Logic
- Extract framework-agnostic modules (`packages/core/src/common`, `packages/core/src/utils`) into shared exports accessible from Vue.
- Provide adapter interfaces for areas where React relied on context/providers (e.g. theme, clipboard handlers).
- Add unit tests covering shared logic to prevent regressions when reused by Vue.

### 2.2 Define Vue Component Architecture
- Design top-level `DataGrid.vue` SFC using `<script setup>` + render helpers for canvas drawing.
- Map React props to Vue props/emit events, ensuring naming conventions follow Vue style (kebab-case events via `defineEmits`).
- Implement provide/inject or composables to replace React context (selection state, theme, grid metrics).
- Decide on reactivity strategy for large datasets (e.g. `shallowRef` for data windows, computed for derived metrics).

### 2.3 Lifecycle & Interaction Layer
- Replace `useEffect`/`useLayoutEffect` logic with Vue `watchEffect`, `onMounted`, `onUpdated`, and `onBeforeUnmount` equivalents.
- Port keyboard/mouse event handling into Vue event listeners while keeping shared gesture logic centralized.
- Implement focus management using Vue refs and ensure compatibility with portal/overlay requirements.
- Provide composition utilities (`useGridSelection`, `useGridApi`) mirroring React hooks for advanced consumers.

### 2.4 Canvas Rendering Integration
- Reuse existing canvas drawing modules; wrap them in Vue-friendly functions that accept reactive state.
- Validate performance under heavy scrolling (profile using Vue devtools + custom telemetry).
- Ensure theme updates trigger efficient redraws (watch on theme props, throttle as needed).
- Handle window resize, DPI changes, and virtualization boundaries via `ResizeObserver` hooks or Vue directives.

### 2.5 Testing & Documentation
- Author Vitest suites for core behaviours (selection, editing, keyboard shortcuts, redraw triggers).
- Add Storybook scenarios covering dense data, editable cells, grouping, custom renderers.
- Create migration guide `docs/vue-migration/core-parity-checklist.md` (or update README) enumerating parity status.
- Update API docs (Typedoc + Vue-specific README) describing props, emits, slots, and composables.

## Deliverables & Acceptance Criteria
- `packages/core-vue/src/DataGrid.vue` renders sample datasets with virtualization, selection, editing, and range fill working.
- Feature parity checklist signed off for: keyboard navigation, copy/paste, column resizing, theming, overlays, custom renderers.
- Minimum 80% coverage for shared logic reused by both frameworks; key Vue components covered by interaction tests.
- Storybook stories demonstrate no major regressions and align visually with React equivalents.

## Collaboration & Review
- Partner with original React authors to validate architectural changes and shared module boundaries.
- Schedule UX/QA review sessions comparing React vs Vue behaviours side-by-side.
- Run performance benchmarking sessions with large datasets to confirm parity within ±5% of React metrics.

## Risks & Mitigations
- **Canvas lifecycle mismatches** due to different update scheduling → Profile and adjust watchers, consider manual `requestAnimationFrame` control.
- **Event emission divergence** confusing consumers → Document prop/emit mapping and add TypeScript tests to enforce naming.
- **Reactivity overhead** on massive grids → Use shallow/computed refs and avoid deep watchers; reuse shared caches.
- **Shared utility drift** → Add lint rules or TypeScript types enforcing single source of truth for constants (e.g. theme tokens).
