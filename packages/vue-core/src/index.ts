/**
 * Vue版本的Glide Data Grid
 * 提供与React版本相同的功能，但使用Vue 3的Composition API
 */

// 核心组件
export { default as DataEditor } from './data-editor/DataEditor.vue';

// 组合式函数
export { useSelectionBehavior } from './data-editor/use-selection-behavior.js';
export { useKeyboardShortcuts } from './data-editor/use-keyboard-shortcuts.js';
export { useCellEditor } from './data-editor/use-cell-editor.js';
export { useFillHandle } from './data-editor/use-fill-handle.js';
export { useCopyPaste } from './data-editor/use-copy-paste.js';

// 辅助功能组合式函数
export { useAccessibility } from './data-editor/use-accessibility.js';
export { useHighContrastTheme } from './data-editor/use-high-contrast-theme.js';
export { useZoomSupport } from './data-editor/use-zoom-support.js';

// 滚动和虚拟化相关功能
export { useInitialScrollOffset } from './data-editor/use-initial-scroll-offset.js';
export { useAutoscroll } from './data-editor/use-autoscroll.js';
export { useScrollPosition, useViewportCalculation } from './data-editor/use-scroll-position.js';
export { useViewport } from './data-editor/use-viewport.js';
export { useScrollEvents } from './data-editor/use-scroll-events.js';
export { useFrozenRowsColumns } from './data-editor/use-frozen-rows-columns.js';

// 辅助功能组件
export { default as AccessibilityTree } from './data-editor/AccessibilityTree.vue';
export { default as KeyboardShortcutsHelp } from './data-editor/KeyboardShortcutsHelp.vue';

// 滚动组件
export { default as InfiniteScroller } from './internal/scrolling-data-grid/InfiniteScroller.vue';
export { default as ScrollingDataGrid } from './internal/scrolling-data-grid/ScrollingDataGrid.vue';
export { default as Scrollbar } from './internal/scrolling-data-grid/Scrollbar.vue';
export { default as DataGridDnd } from './internal/data-grid-dnd/DataGridDnd.vue';

// 工具函数
export { useResizeDetector } from './common/resize-detector.js';
export { useThrottleFn, useDebounceFn } from './common/utils.js';

// 类型定义
export type {
  GridSelection,
  GridCell,
  GridColumn,
  Item,
  Rectangle,
  CompactSelection,
  SelectionBlending,
  SelectionTrigger,
  FillHandleDirection,
  FillHandleConfig,
  FillHandle,
  CellActivationBehavior,
  RowSelectionMode,
  ColumnSelectionMode,
  RangeSelectType,
  SelectType,
  EditListItem,
  ValidatedGridCell,
  GridMouseEventArgs,
  GridKeyEventArgs,
  CellClickedEventArgs,
  CellActivatedEventArgs,
  HeaderClickedEventArgs,
  GroupHeaderClickedEventArgs,
  FillPatternEventArgs,
  DataGridSearchProps
} from './internal/data-grid/data-grid-types.js';

// 滚动和虚拟化相关类型
export type { VisibleRegion } from './data-editor/visible-region.js';
export type {
  BaseGridMouseEventArgs,
  GridMouseCellEventArgs,
  GridMouseHeaderEventArgs,
  GridMouseGroupHeaderEventArgs,
  GridMouseOutOfBoundsEventArgs,
  GridDragEventArgs
} from './internal/data-grid/event-args.js';

export {
  GridCellKind,
  BooleanEmpty,
  BooleanIndeterminate,
  emptyGridSelection,
  isEditableGridCell,
  isReadWriteCell,
  isInnerOnlyCell
} from './internal/data-grid/data-grid-types.js';

// 键盘绑定类型
export type {
  Keybinds,
  RealizedKeybinds,
  ConfigurableKeybinds
} from './data-editor/data-editor-keybindings.js';

// 工具函数
export { useKeybindingsWithDefaults } from './data-editor/data-editor-keybindings.js';
export { copyToClipboard, unquote } from './data-editor/data-editor-fns.js';

// 示例组件
export { default as DataEditorExample } from './examples/DataEditorExample.vue';
export { default as ScrollingExample } from './examples/ScrollingExample.vue';
export { default as AccessibilityExample } from './examples/AccessibilityExample.vue';
export { default as BasicExample } from './examples/BasicExample.vue';
export { default as QuickStartExample } from './examples/QuickStartExample.vue';
export { default as AdvancedExample } from './examples/AdvancedExample.vue';
export { default as PerformanceExample } from './examples/PerformanceExample.vue';
export { default as AccessibilityDemo } from './examples/AccessibilityDemo.vue';
export { default as ExamplesDemo } from './examples/ExamplesDemo.vue';

// 版本信息
export const version = '1.0.0';