import type { Rectangle } from '../data-grid-types.js'
import type { FullTheme } from '../../common/styles.js'
import type { GridSelection } from '../data-grid-types.js'

export interface DrawGridArg {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  cellXOffset: number
  cellYOffset: number
  translateX: number
  translateY: number
  theme: FullTheme
  gridSelection: GridSelection
  columns: any[]
  rows: number
  rowHeight: number
  headerHeight: number
  groupHeaderHeight: number
  freezeColumns: number
  hasRowMarkers: boolean
}

export function drawGrid(arg: DrawGridArg): void {
  const {
    ctx,
    width,
    height,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    theme,
    gridSelection,
    columns,
    rows,
    rowHeight,
    headerHeight,
    groupHeaderHeight,
    freezeColumns,
    hasRowMarkers
  } = arg

  // Clear canvas
  ctx.fillStyle = theme.bgCell
  ctx.fillRect(0, 0, width, height)

  // Draw grid background
  drawGridBackground(ctx, theme, width, height)

  // Draw headers
  drawHeaders(arg)

  // Draw cells
  drawCells(arg)

  // Draw grid lines
  drawGridLines(arg)

  // Draw selection
  drawSelection(arg)
}

function drawGridBackground(ctx: CanvasRenderingContext2D, theme: FullTheme, width: number, height: number): void {
  ctx.fillStyle = theme.bgCell
  ctx.fillRect(0, 0, width, height)
}

function drawHeaders(arg: DrawGridArg): void {
  const { ctx, theme, headerHeight, groupHeaderHeight, columns, cellXOffset, translateX, hasRowMarkers } = arg

  // Draw main header
  ctx.fillStyle = theme.bgHeader
  ctx.fillRect(0, 0, arg.width, headerHeight)

  // Draw header text
  ctx.fillStyle = theme.textHeader
  ctx.font = `${theme.headerFontStyle} ${theme.headerFontSize}px ${theme.fontFamily}`

  let x = hasRowMarkers ? 40 : 0
  columns.forEach((col, index) => {
    if (index < cellXOffset) return

    const colX = x - translateX
    if (colX + col.width > 0 && colX < arg.width) {
      ctx.fillText(col.title || `Column ${index + 1}`, colX + 8, headerHeight - 12)
    }
    x += col.width
  })

  // Draw group headers if present
  if (groupHeaderHeight > 0) {
    ctx.fillStyle = theme.bgHeaderHasFocus
    ctx.fillRect(0, headerHeight, arg.width, groupHeaderHeight)
  }
}

function drawCells(arg: DrawGridArg): void {
  const {
    ctx,
    theme,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    columns,
    rows,
    rowHeight,
    headerHeight,
    groupHeaderHeight,
    hasRowMarkers
  } = arg

  const headerTotalHeight = headerHeight + groupHeaderHeight

  ctx.fillStyle = theme.textDark
  ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`

  // Draw row markers if enabled
  if (hasRowMarkers) {
    for (let row = cellYOffset; row < rows; row++) {
      const y = headerTotalHeight + (row - cellYOffset) * rowHeight - translateY
      if (y + rowHeight < headerTotalHeight || y > arg.height) continue

      ctx.fillStyle = theme.bgCell
      ctx.fillRect(0, y, 40, rowHeight)

      ctx.fillStyle = theme.textDark
      ctx.fillText(`${row + 1}`, 20, y + rowHeight / 2 + 4)
    }
  }

  // Draw cell content
  let x = hasRowMarkers ? 40 : 0
  for (let col = cellXOffset; col < columns.length; col++) {
    const column = columns[col]
    const colX = x - translateX

    if (colX + column.width <= 0 || colX >= arg.width) {
      x += column.width
      continue
    }

    for (let row = cellYOffset; row < rows; row++) {
      const y = headerTotalHeight + (row - cellYOffset) * rowHeight - translateY

      if (y + rowHeight < headerTotalHeight || y > arg.height) continue

      // Draw cell background
      ctx.fillStyle = theme.bgCell
      ctx.fillRect(colX, y, column.width, rowHeight)

      // Draw cell content (placeholder)
      ctx.fillStyle = theme.textDark
      ctx.fillText(`Cell ${col + 1},${row + 1}`, colX + 8, y + rowHeight / 2 + 4)
    }

    x += column.width
  }
}

function drawGridLines(arg: DrawGridArg): void {
  const {
    ctx,
    theme,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    columns,
    rows,
    rowHeight,
    headerHeight,
    groupHeaderHeight,
    hasRowMarkers
  } = arg

  const headerTotalHeight = headerHeight + groupHeaderHeight

  ctx.strokeStyle = theme.horizontalBorderColor
  ctx.lineWidth = 1

  // Draw horizontal lines
  for (let row = cellYOffset; row <= rows; row++) {
    const y = headerTotalHeight + (row - cellYOffset) * rowHeight - translateY
    if (y < headerTotalHeight || y > arg.height) continue

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(arg.width, y)
    ctx.stroke()
  }

  // Draw vertical lines
  let x = hasRowMarkers ? 40 : 0
  for (let col = cellXOffset; col <= columns.length; col++) {
    const colX = x - translateX
    if (colX < 0 || colX > arg.width) {
      if (col < columns.length) x += columns[col].width
      continue
    }

    ctx.beginPath()
    ctx.moveTo(colX, 0)
    ctx.lineTo(colX, arg.height)
    ctx.stroke()

    if (col < columns.length) x += columns[col].width
  }
}

function drawSelection(arg: DrawGridArg): void {
  const { ctx, theme, gridSelection, cellXOffset, cellYOffset, translateX, translateY, columns, rowHeight, headerHeight, groupHeaderHeight, hasRowMarkers } = arg

  if (!gridSelection.current) return

  const headerTotalHeight = headerHeight + groupHeaderHeight
  const selection = gridSelection.current.range

  let x = hasRowMarkers ? 40 : 0
  for (let col = 0; col < columns.length; col++) {
    if (col < cellXOffset) {
      x += columns[col].width
      continue
    }

    const colX = x - translateX
    if (colX + columns[col].width <= 0 || colX >= arg.width) {
      x += columns[col].width
      continue
    }

    for (let row = cellYOffset; row < arg.rows; row++) {
      const y = headerTotalHeight + (row - cellYOffset) * rowHeight - translateY

      if (y + rowHeight < headerTotalHeight || y > arg.height) continue

      if (row >= selection.y && row < selection.y + selection.height &&
          col >= selection.x && col < selection.x + selection.width) {

        ctx.fillStyle = theme.accentLight
        ctx.fillRect(colX, y, columns[col].width, rowHeight)

        // Draw selection border
        ctx.strokeStyle = theme.accentColor
        ctx.lineWidth = 2
        ctx.strokeRect(colX, y, columns[col].width, rowHeight)
      }
    }

    x += columns[col].width
  }
}
