# Phase 4 – Data Source Helpers Port

## Desired Outcomes
- Deliver Vue composables that replicate the functionality of React data source hooks (pagination, async loading, undo/redo, filtering).
- Ensure composables integrate cleanly with the Vue grid component and external state management patterns (Pinia, vanilla reactive stores).
- Provide exhaustive TypeScript typings and guidance for integrating with remote APIs.

## Prerequisites
- Core Vue grid package exposes extension points for data APIs (props/events for data requests, row updates, selection change notifications).
- Shared utility modules for async queues, caching, and undo history extracted and reusable across frameworks.
- Agreement on error handling and loading indicator conventions for Vue consumers.

## Task Breakdown

### 4.1 Map React Hooks to Vue Composables
- Catalogue hooks from `packages/source/src` (e.g. `useMockDataGenerator`, `useUndoRedo`, `useAsyncDataSource`).
- For each hook, define equivalent Vue composable signature (`useAsyncDataSourceVue`) with reactive return types (`ref`, `computed`).
- Document differences in invocation (React hook rules vs Vue composable usage) for migration guidance.

### 4.2 Implement Core Composables
- Port asynchronous data fetching logic using Vue `watch`/`watchEffect` to respond to reactive parameters.
- Replace React state with `ref`/`reactive` structures; ensure large datasets use shallow refs to avoid unnecessary tracking.
- Implement undo/redo stacks with Vue reactivity while keeping shared history algorithms centralized.
- Provide cancellation/cleanup hooks using `onScopeDispose` to avoid memory leaks.

### 4.3 Integration with Core Grid
- Ensure composables expose handlers compatible with `DataGrid` props (e.g. `getData`, `onCellEdited`).
- Add helper utilities for bridging events (e.g. convert Vue emits to composable callbacks).
- Create example wrappers that combine composables with the grid to form end-to-end data flows.

### 4.4 Testing & Examples
- Write Vitest suites simulating async pipelines, optimistic updates, errors, and undo/redo flows.
- Build `test-projects/vue-data-source` demo showcasing real API integration (REST or GraphQL stub).
- Add Storybook stories focusing on data operations (infinite scroll, inline editing with save buttons).

### 4.5 Documentation & Migration Guide
- Update `packages/source-vue/README.md` with usage patterns, TypeScript signatures, and integration notes.
- Produce migration guide comparing React hook usage to Vue composables, highlighting changes in lifecycle and state access.
- Document best practices for caching, error boundaries, and concurrency control.

## Deliverables & Acceptance Criteria
- `packages/source-vue` exports composables covering feature parity with React hooks (async data, clipboard integration, undo/redo).
- Example project and Storybook demos verified by QA/product for critical workflows.
- TypeScript declaration files include JSDoc comments for IDE hints and align with generated docs.
- Comprehensive documentation clarifies migration steps and caveats.

## Collaboration & Review
- Collaborate with backend/data teams to validate API interaction assumptions and loading semantics.
- Engage customer-success or solution engineers to ensure the Vue composables satisfy real-world integration scenarios.
- Conduct joint testing sessions with the core grid team to validate data integration boundaries.

## Risks & Mitigations
- **Reactive caching pitfalls** → Use memoisation strategies that avoid stale closures; test with concurrent updates.
- **Different lifecycle semantics** → Leverage `onMounted` + `onScopeDispose` wrappers and document usage in `<script setup>` and options API contexts.
- **Complexity of undo/redo** → Add snapshot limits, expose instrumentation hooks, and ensure tests cover race conditions.
- **Documentation drift** → Automate Typedoc generation for Vue packages and include them in release checklists.
