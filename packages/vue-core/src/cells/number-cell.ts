import type { NumberCell } from '../internal/data-grid/data-grid-types.js'
import type { InternalCellRenderer } from './cell-types.js'

export const numberCellRenderer: InternalCellRenderer<NumberCell> = {
  getAccessibilityString: c => c.data?.toString() ?? "",
  kind: 'number',
  needsHover: numberCell => numberCell.hoverEffect === true,
  needsHoverPosition: false,
  useLabel: true,
  draw: (args) => {
    const { cell, ctx, rect, theme } = args
    const { displayData, contentAlign } = cell

    // 设置文本样式
    ctx.fillStyle = theme.textDark
    ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`
    ctx.textAlign = contentAlign || 'right'
    ctx.textBaseline = 'middle'

    // 计算文本位置
    const padding = 8
    const x = contentAlign === 'right' ? rect.x + rect.width - padding : rect.x + padding
    const y = rect.y + rect.height / 2

    // 格式化数字
    let displayText = displayData
    if (!displayText && cell.data !== undefined && cell.data !== null) {
      displayText = cell.data.toString()

      // 应用数字格式
      if (cell.format && cell.format.type === 'currency') {
        displayText = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: cell.format.currency || 'USD'
        }).format(cell.data)
      } else if (cell.format && cell.format.type === 'percent') {
        displayText = (cell.data * 100).toFixed(cell.format.decimalPlaces || 0) + '%'
      } else if (cell.format && cell.format.type === 'number') {
        displayText = cell.data.toFixed(cell.format.decimalPlaces || 0)
      }
    }

    // 绘制文本
    ctx.fillText(displayText || '', x, y)
  },
  measure: (ctx, cell, theme) => {
    let displayText = cell.displayData
    if (!displayText && cell.data !== undefined && cell.data !== null) {
      displayText = cell.data.toString()
    }

    const width = ctx.measureText(displayText || '').width
    return width + 2 * theme.cellHorizontalPadding
  },
  onDelete: c => ({
    ...c,
    data: undefined,
  }),
  provideEditor: cell => ({
    disablePadding: false,
    editor: (props) => {
      // 在Vue中，编辑器将在覆盖编辑器中实现
      return null
    },
  }),
}
