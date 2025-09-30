import type { TextCell } from '../internal/data-grid/data-grid-types.js'
import type { InternalCellRenderer } from './cell-types.js'

export const textCellRenderer: InternalCellRenderer<TextCell> = {
  getAccessibilityString: c => c.data?.toString() ?? "",
  kind: 'text',
  needsHover: textCell => textCell.hoverEffect === true,
  needsHoverPosition: false,
  useLabel: true,
  draw: (args) => {
    const { cell, ctx, rect, theme } = args
    const { displayData, contentAlign } = cell

    // 设置文本样式
    ctx.fillStyle = theme.textDark
    ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`
    ctx.textAlign = contentAlign || 'left'
    ctx.textBaseline = 'middle'

    // 计算文本位置
    const padding = 8
    const x = contentAlign === 'right' ? rect.x + rect.width - padding : rect.x + padding
    const y = rect.y + rect.height / 2

    // 绘制文本
    ctx.fillText(displayData || cell.data || '', x, y)
  },
  measure: (ctx, cell, theme) => {
    const lines = (cell.displayData || cell.data || '').split("\n", cell.allowWrapping === true ? undefined : 1)
    let maxLineWidth = 0
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width)
    }
    return maxLineWidth + 2 * theme.cellHorizontalPadding
  },
  onDelete: c => ({
    ...c,
    data: "",
  }),
  provideEditor: cell => ({
    disablePadding: cell.allowWrapping === true,
    editor: (props) => {
      // 在Vue中，编辑器将在覆盖编辑器中实现
      return null
    },
  }),
}
