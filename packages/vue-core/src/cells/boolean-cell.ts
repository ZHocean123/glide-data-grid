import type { BooleanCell } from '../internal/data-grid/data-grid-types.js'
import type { InternalCellRenderer } from './cell-types.js'

export const booleanCellRenderer: InternalCellRenderer<BooleanCell> = {
  getAccessibilityString: c => {
    if (c.data === true) return 'true'
    if (c.data === false) return 'false'
    return 'indeterminate'
  },
  kind: 'boolean',
  needsHover: booleanCell => booleanCell.hoverEffect === true,
  needsHoverPosition: false,
  useLabel: false,
  draw: (args) => {
    const { cell, ctx, rect, theme } = args

    // 计算复选框位置和大小
    const size = Math.min(rect.height - 8, 16)
    const x = rect.x + (rect.width - size) / 2
    const y = rect.y + (rect.height - size) / 2

    // 绘制复选框边框
    ctx.strokeStyle = theme.textLight
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, size, size)

    // 根据状态绘制内容
    if (cell.data === true) {
      // 绘制勾选状态
      ctx.fillStyle = theme.accentColor
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4)

      // 绘制对勾
      ctx.strokeStyle = theme.textHeader
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 4, y + size / 2)
      ctx.lineTo(x + size / 2, y + size - 4)
      ctx.lineTo(x + size - 4, y + 4)
      ctx.stroke()
    } else if (cell.data === false) {
      // 不绘制内容，保持空框
    } else {
      // 绘制不确定状态（横线）
      ctx.strokeStyle = theme.textLight
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 4, y + size / 2)
      ctx.lineTo(x + size - 4, y + size / 2)
      ctx.stroke()
    }
  },
  measure: (ctx, cell, theme) => {
    return 24 // 固定宽度
  },
  onDelete: c => ({
    ...c,
    data: false,
  }),
  provideEditor: cell => ({
    disablePadding: true,
    editor: (props) => {
      // 在Vue中，编辑器将在覆盖编辑器中实现
      return null
    },
  }),
}
