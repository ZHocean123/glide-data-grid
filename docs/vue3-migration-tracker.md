# Glide Data Grid Vue 3 Migration Tracker

> This tracker complements the migration plan in `docs/vue3-migration-plan.md`. Update the status, owners, and notes after each work session to keep the team aligned.

## Phase Snapshot

| Phase | Focus | Owner(s) | Status | Start | Target Complete | Actual Complete | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Environment preparation | _Unassigned_ | [~] In progress | 2025-09-29 | | | Vue toolchain scaffolding in progress |
| 1 | Shared logic extraction | _Unassigned_ | [~] In progress | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 2025-09-29 | Phase 2 | Shared mouse hit-testing helper powers Vue `onMouseMove`; pointer vitest covers emitted coordinates. | Hook up click/drag events and hover state next |
| 2025-09-29 | Phase 2 | Pointer down/up/context menu events now flow through shared helper; added pointer vitest coverage. | Continue wiring click/drag selection + hover state |
| 2025-09-29 | Phase 2 | Storybook showcases pointer interactions updating selection via new Vue story. | Polish selection visuals & integrate hover feedback |
| 2 | Vue data grid foundations | _Unassigned_ | [~] In progress | 2025-09-29 | Phase 0 | Vue composable scaffolding underway (HelloGrid, useGridGeometry, useMappedColumns). | Continue migrating render math & build Vue adapters |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 3 | DataEditor container migration | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 4 | Cells & overlay editors | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 5 | Supporting packages | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 6 | Documentation & Storybook | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 7 | Cleanup & release | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |
| 8 | Ongoing tracking & QA | _Unassigned_ | [ ] Not started | 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |

_Use `[ ] Not started`, `[~] In progress`, or `[x] Complete` to indicate phase status._

## Detailed Task Log

### Phase 0 - Environment Preparation
- **Milestones:** Tooling inventory, Vue stack bootstrap, regression verification.
- **Latest Update:** Vue dependencies, configs, placeholder component, vitest suite, and Storybook build (`npx storybook@9 build -c .storybook-vue`).
- **Risks/Blockers:** Pending dependency install and validation runs; no blocking issues identified.
- **Next Actions:** Continue shared extraction (e.g., selection helpers), prepare Vue adapters mirroring React hooks.

### Phase 1 - Shared Logic Extraction
- **Milestones:** Shared module scaffolding, React/Vue adapters, shared tests.
- **Latest Update:** Shared helpers now include geometry/bounds (`getColumnIndexForX`, `getRowIndexForY`, `computeBounds`) with dedicated tests; Vue composable `useGridGeometry` scaffolds future adapters.
- **Risks/Blockers:** Ensure re-exports stay aligned to avoid duplicate symbol errors; coordinate future refactors touching computeBounds consumers.
- **Next Actions:** Continue migrating render math (`computeHeaderLayout`, overlay metrics) and flesh out Vue DataGrid wrapper using these composables.

### Phase 2 - Vue Data Grid Foundations
- **Milestones:** Vue entry point, DataGrid.vue port, canvas parity tests.
- **Latest Update:** DataGrid.vue 已添加键盘事件绑定（tabindex、keydown/keyup）并通过新建 vitest 用例验证 GridKeyEventArgs 解析（bounds/location/key/keyCode）及 cancel/stopPropagation 行为；指针事件与渲染管线仍在持续完善。
- **Risks/Blockers:** 需在 Storybook Vue 手动验证键盘导航与可聚焦性；后续与选择行为和编辑器交互可能存在耦合风险。
- **Next Actions:** 启动 Storybook Vue 进行键盘交互手动检查；继续完善选择/拖拽与渲染集成，并补充更多键盘快捷键覆盖。

### Phase 3 - DataEditor Container Migration
- **Milestones:** Vue DataEditor core, hook conversions, feature regression tests.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

### Phase 4 - Cells and Overlay Editors
- **Milestones:** Cell renderer refactor, CSS pipeline update, overlay teleports.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

### Phase 5 - Supporting Packages
- **Milestones:** Vue composition utilities in `packages/source`, package split strategy.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

### Phase 6 - Documentation & Storybook
- **Milestones:** Vue-friendly docs, Storybook dual builds, API docs refresh.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

### Phase 7 - Cleanup & Release
- **Milestones:** Dependency cleanup, CI/CD updates, staged release.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

### Phase 8 - Ongoing Tracking & QA
- **Milestones:** Status cadence, regression automation, feedback loop.
- **Latest Update:** _TBD_
- **Risks/Blockers:** _TBD_
- **Next Actions:** _TBD_

## Checkpoint Log

| Date | Phase(s) Touched | Summary | Action Items |
| --- | --- | --- | --- |
| 2025-09-29 | Phase 0 | Vue toolchain scaffolding committed (deps, Storybook Vue, vitest config). | Install deps and validate new scripts |\n| 2025-09-29 | Phase 0 | `npm install` completed; `npm run test:vue` green. | Exercise Storybook Vue build; start shared extraction |\n| 2025-09-29 | Phases 0 & 1 | React + Vue vitest suites passing after extracting `mapColumns` into shared helpers. | Run Storybook Vue; plan next shared refactors |\n| 2025-09-29 | Phase 0 | Vue Storybook build succeeded via `npx storybook@9 build -c .storybook-vue`. | Continue shared extraction work |\n| 2025-09-29 | Phase 1 | Shared selection helpers extracted; React & Vue vitest suites green. | Plan next shared migrations / add unit coverage |\n| 2025-09-29 | Phase 1 | Column geometry helpers moved to `src/shared/columns.ts`; both test suites still green. | Add direct tests for shared helpers |
| 2025-09-29 | Phase 1 | Geometry helpers extracted (`getColumnIndexForX`, `getRowIndexForY`) and covered by shared tests. | Plan computeBounds extraction next |
| 2025-09-29 | Phases 1 & 2 | `computeBounds` moved to shared layer with tests; Vue `useGridGeometry` composable scaffolded. | Continue migrating render math & build Vue adapters |
| 2025-09-29 | Phases 1 & 2 | Vue `useMappedColumns` composable exports shared column virtualization; targeted Vue vitest run `npm run test:vue -- test/vue/use-mapped-columns.test.ts`. | Wire composable into Vue DataGrid shell next |
| 2025-09-29 | Phase 2 | Vue DataGrid skeleton renders mapped headers via shared composables; targeted Vue vitest run `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate canvas rendering and input handling |
| 2025-09-29 | Phase 2 | Vue `useGridGeometry` composable now accepts reactive inputs; added Vue vitest `npm run test:vue -- test/vue/use-grid-geometry.test.ts`. | Hook geometry outputs into canvas draw pipeline |
| 2025-09-29 | Phase 2 | Vue DataGrid canvas scaffold adds DPR-aware sizing and Storybook controls; vitest `npm run test:vue -- test/vue/data-grid.test.ts`. | Integrate shared drawGrid renderer |
| 2025-09-29 | Phase 2 | Vue DataGrid applies theme overrides via shared `makeCSSStyle`; tests assert CSS vars while canvas stubs remain. | Wire shared theme + drawGrid integration |

_Add a new row after every sync or review to capture progress and decisions._


| 2025-09-29 | Phase 2 | Vue DataGrid invokes shared `drawGrid` with stubbed render state while Vue-specific wiring migrates. | Replace placeholders with real data/interaction handlers |
| 2025-09-29 | Phase 2 | Shared mouse helper drives Vue `onMouseMove`; pointer vitest ensures emitted locations. | Port click/drag handlers and hover state wiring |
| 2025-09-29 | Phase 2 | Pointer down/up/context menu wired via shared helper; new vitest file covers pointer capture + preventDefault. | Expand pointer path to click/drag + selection integration |
| 2025-09-29 | Phase 2 | Storybook pointer events story highlights selection updates driven by Vue callbacks. | Align hover/drag UX with React parity |
| 2025-09-29 | Phase 2 | Vue DataGrid resolves built-in vs custom cell renderers using shared AllCellRenderers; vitest covers default, override, and additional renderer paths. | Wire DataEditor Vue adapter to supply sprite manager and renderer configs |
| 2025-09-29 | Phase 2 | DataGrid.vue 键盘事件（tabindex、keydown/keyup）迁移完成；新增 vitest：data-grid-key-events.test.ts 验证 GridKeyEventArgs 与 cancel/stopPropagation。 | 启动 Storybook Vue 手动检查键盘导航与焦点，扩展快捷键覆盖 |
| 2025-09-29 | Phase 2 | Vue DataGrid spawns default SpriteManager from shared header icons when one is not provided; vitest asserts provided managers and spies are forwarded. | Hook compose DataEditor Vue wrapper to deliver header icon maps & sprite loader |
| 2025-09-29 | Phase 2 | Storybook Vue3 添加 KeyboardEvents 故事；手动验证：点击网格可获得焦点（tabindex=0），按下方向键/Enter/TAB 等触发 onKeyDown/onKeyUp，事件面板显示 key/keyCode/location（示例：ArrowRight→code=39, location=(1,1)）。同时注意到 .storybook-vue/main.cjs 在 Vite 下的 CommonJS 警告。 | 在 docs 记录验证结果；迁移 .storybook-vue/main.cjs 至 ESM（main.ts）以消除警告；扩展快捷键覆盖与取消逻辑的 Story；验证 selection 与编辑器耦合路径 |
| 2025-09-29 | Phase 6 | .storybook-vue/main.cjs 已迁移为 ESM main.ts；重新启动 Storybook（http://localhost:65251/）后 UI 正常，侧边栏加载 Vue/DataGrid 的所有故事，Keyboard events 能显示 KeyUp 文本与焦点提示。 | 升级 storybook@latest（可选）；继续在 Pointer/Keyboard 故事中覆盖取消/阻止传播与选择交互场景 |

### Checkpoint Log – Phase 6（Storybook Vue3 验证与增强）
- 扩展 KeyboardEvents 故事：新增四个 UI 开关（取消 KeyDown、停止传播 KeyDown、取消 KeyUp、停止传播 KeyUp），用于手动验证键盘事件的取消与传播逻辑是否正确；在事件文本中追加状态标记，便于观察影响效果。
- Storybook 预览正常：在 `http://localhost:65251/?path=/story/vue-datagrid--keyboard-events` 加载该故事，点击网格使其获取焦点（tabindex=0），勾选对应开关后按下方向键或其他键，事件文本区域可显示 KeyDown/KeyUp 以及位置（location）与状态标记。
- Vue DataGrid overlay canvas实现：成功为Vue DataGrid组件添加了overlay canvas，参考React版本的实现，用于渲染header和其他overlay元素。包括：
  - 在模板中添加了`overlayCanvas` ref和对应的canvas元素
  - 更新了渲染逻辑以同时初始化主canvas和overlay canvas
  - 将`headerCanvasCtx`参数正确指向overlay canvas的上下文
  - 添加了适当的CSS样式确保overlay canvas正确叠加在主canvas之上（z-index: 2, pointer-events: none）
  - 验证了overlay canvas的正常工作，尺寸为655x344（主canvas）和655x77（overlay canvas）
- 风险点：
  - 事件取消/传播与网格内部导航、选区变化存在耦合，需谨慎验证对选择移动与编辑器激活的影响；
  - 浏览器模拟事件与真实键盘事件在一些环境下可能存在差异，建议以人工交互为准；
  - overlay canvas的渲染性能需要进一步优化和测试。
- 后续行动：
  - 在 Pointer/Keyboard 故事中补充更多热键场景（如 Home/End、PageUp/PageDown、Ctrl/Shift 组合键），并覆盖取消/传播的组合路径；
  - 验证选择与编辑器耦合路径（选择移动、进入编辑、提交/取消编辑）在取消/传播下的行为一致性；
  - 按需将 `.storybook-vue` 配置继续优化（如升级 Storybook 版本并清理潜在弃用 API），保持构建与预览稳定；
  - 启动Phase 3 DataEditor容器迁移工作。
