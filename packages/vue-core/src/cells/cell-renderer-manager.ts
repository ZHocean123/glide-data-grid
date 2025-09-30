import type { GridCell, InnerGridCell } from '../internal/data-grid/data-grid-types.js'
import type { CellRenderer, InternalCellRenderer } from './cell-types.js'
import { textCellRenderer } from './text-cell.js'
import { numberCellRenderer } from './number-cell.js'
import { booleanCellRenderer } from './boolean-cell.js'
import { imageCellRenderer } from './image-cell.js'

export class CellRendererManager {
  private renderers: Map<string, InternalCellRenderer<any>> = new Map()
  private customRenderers: CellRenderer<any>[] = []

  constructor() {
    this.registerDefaultRenderers()
  }

  private registerDefaultRenderers() {
    this.registerRenderer(textCellRenderer)
    this.registerRenderer(numberCellRenderer)
    this.registerRenderer(booleanCellRenderer)
    this.registerRenderer(imageCellRenderer)
  }

  registerRenderer<T extends InnerGridCell>(renderer: InternalCellRenderer<T>) {
    this.renderers.set(renderer.kind, renderer)
  }

  registerCustomRenderer<T extends GridCell>(renderer: CellRenderer<T>) {
    this.customRenderers.push(renderer)
  }

  getRendererForCell(cell: GridCell): CellRenderer<any> | null {
    // 首先检查自定义渲染器
    for (const customRenderer of this.customRenderers) {
      if ('isMatch' in customRenderer && customRenderer.isMatch(cell)) {
        return customRenderer
      }
    }

    // 然后检查内置渲染器
    const renderer = this.renderers.get(cell.kind)
    if (renderer) {
      return renderer
    }

    return null
  }

  drawCell(args: any) {
    const { cell } = args
    const renderer = this.getRendererForCell(cell)

    if (renderer && renderer.draw) {
      renderer.draw(args)
    } else {
      // 默认渲染器
      this.drawDefaultCell(args)
    }
  }

  private drawDefaultCell(args: any) {
    const { ctx, cell, rect, theme } = args

    // 绘制单元格背景
    ctx.fillStyle = theme.bgCell
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    // 绘制单元格内容
    ctx.fillStyle = theme.textDark
    ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    const text = this.getCellText(cell)
    ctx.fillText(text, rect.x + 8, rect.y + rect.height / 2)
  }

  private getCellText(cell: GridCell): string {
    const renderer = this.getRendererForCell(cell)
    if (renderer && renderer.getAccessibilityString) {
      return renderer.getAccessibilityString(cell)
    }

    // 默认文本
    switch (cell.kind) {
      case 'text':
        return cell.displayData || cell.data || ''
      case 'number':
        return cell.displayData || cell.data?.toString() || ''
      case 'boolean':
        return cell.data === true ? 'true' : cell.data === false ? 'false' : 'indeterminate'
      case 'image':
        return cell.data?.[0] || 'Image'
      default:
        return `Unknown cell type: ${cell.kind}`
    }
  }

  measureCell(ctx: CanvasRenderingContext2D, cell: GridCell, theme: any): number {
    const renderer = this.getRendererForCell(cell)

    if (renderer && renderer.measure) {
      return renderer.measure(ctx, cell, theme)
    }

    // 默认测量
    const text = this.getCellText(cell)
    return ctx.measureText(text).width + 16
  }

  getAccessibilityString(cell: GridCell): string {
    const renderer = this.getRendererForCell(cell)

    if (renderer && renderer.getAccessibilityString) {
      return renderer.getAccessibilityString(cell)
    }

    return this.getCellText(cell)
  }
}

// 创建全局实例
export const cellRendererManager = new CellRendererManager()
