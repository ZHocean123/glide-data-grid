import type { GridCell, InnerGridCell } from '../internal/data-grid/data-grid-types.js'

export interface CellRenderer<T extends GridCell> {
  getAccessibilityString: (cell: T) => string
  kind: T['kind']
  needsHover?: (cell: T) => boolean
  needsHoverPosition?: boolean
  drawPrep?: (ctx: CanvasRenderingContext2D, cell: T, theme: any) => void
  useLabel?: boolean
  draw: (args: DrawCellArgs<T>) => void
  measure?: (ctx: CanvasRenderingContext2D, cell: T, theme: any) => number
  onDelete?: (cell: T) => T
  provideEditor?: (cell: T) => EditorResult<T>
}

export interface InternalCellRenderer<T extends InnerGridCell> extends CellRenderer<T> {
  // 内部渲染器特定属性
}

export interface DrawCellArgs<T extends GridCell> {
  ctx: CanvasRenderingContext2D
  cell: T
  theme: any
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  hoverAmount?: number
  hyperWrapping?: boolean
  overrideCursor?: (cursor: string) => void
}

export interface EditorResult<T extends GridCell> {
  disablePadding?: boolean
  editor: (props: EditorProps<T>) => any
}

export interface EditorProps<T extends GridCell> {
  value: T
  onChange: (newValue: T) => void
  onFinishedEditing: (newValue?: T, movement?: [number, number]) => void
  isHighlighted?: boolean
  validatedSelection?: [number, number]
}

export interface CustomRenderer<T extends GridCell> {
  draw: (args: DrawCellArgs<T>) => void
  isMatch: (cell: GridCell) => cell is T
  provideEditor?: (cell: T) => EditorResult<T>
}
