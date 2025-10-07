// Core Vue Data Grid Package

// Components
export { default as DataEditor } from './components/DataEditor.vue'
export { default as CanvasRenderer } from './components/CanvasRenderer.vue'
export { default as TextCellRenderer } from './components/TextCellRenderer.vue'

// Composables
export { useSelection } from './composables/use-selection.js'
export { useEditing } from './composables/use-editing.js'
export { useEvents } from './composables/use-events.js'

// Types
export type {
  GridSelection,
  Item,
  GridCell,
  GridColumn,
  Rectangle,
  DataEditorProps,
  DataEditorRef,
  TextCell,
  NumberCell,
  BooleanCell,
  ImageCell,
  BubbleCell,
  MarkdownCell,
  UriCell,
  CustomCell,
  LoadingCell,
  ProtectedCell,
  DrilldownCell,
  RowIDCell,
  EditableGridCell,
  ValidatedGridCell,
  ProvideEditorCallback,
  EditListItem
} from './types/data-grid-types.js'

export { GridCellKind, CompactSelection } from './types/data-grid-types.js'

// Utilities
export { getDataEditorTheme, mergeAndRealizeTheme, makeCSSStyle } from './common/styles.js'
export { 
  getScrollBarWidth, 
  clamp, 
  range, 
  maybe, 
  emptyGridSelection,
  useEventListener,
  useDebouncedMemo,
  useStateWithReactiveInput,
  useDeepMemo
} from './common/utils.js'
export { assertNever, proveType, deepEqual } from './common/support.js'