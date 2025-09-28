/**
 * 文本单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { TextCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawTextInRect, drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 文本单元格渲染器实现
export const textCellRenderer: CustomRenderer<TextCell> = {
  draw: (args: DrawArgs<TextCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    // 绘制文本内容
    if (cell.data) {
      const textColor = cell.readonly ? theme.textLight : theme.textDark;
      const displayText = cell.displayData ?? cell.data;

      drawTextInRect(ctx, displayText, rect, theme, {
        color: textColor,
        allowWrapping: cell.allowWrapping ?? false,
        alignment: 'left',
        verticalAlignment: 'middle',
      });
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    if (!cell.data) return theme.cellHorizontalPadding * 2;

    const displayText = cell.displayData ?? cell.data;
    ctx.save();
    ctx.font = theme.baseFontStyle;
    const width = ctx.measureText(displayText).width + theme.cellHorizontalPadding * 2;
    ctx.restore();

    return Math.max(width, 50); // 最小宽度
  },

  hitTest: (cell, pos, bounds) => {
    // 文本单元格整个区域都可点击
    return (
      pos.x >= bounds.x &&
      pos.x <= bounds.x + bounds.width &&
      pos.y >= bounds.y &&
      pos.y <= bounds.y + bounds.height
    );
  },

  // 暂时禁用编辑器，避免TypeScript错误
  // provideEditor: (cell) => {
  //   if (!cell.allowOverlay) return undefined;
  //   return {
  //     editor: {} as any, // TextEditor component
  //     disablePadding: false,
  //     deletedValue: () => ({ ...cell, data: '', displayData: '' }),
  //   };
  // },

  onPaste: (val, cell) => {
    return {
      ...cell,
      data: val,
      displayData: val,
    };
  },
};

// 内部渲染器导出
export const internalTextCellRenderer = {
  ...textCellRenderer,
  kind: GridCellKind.Text,
};

// 创建文本单元格的工厂函数
export function createTextCell(
  data: string,
  options: Partial<Omit<TextCell, 'kind' | 'data'>> = {}
): TextCell {
  return {
    kind: GridCellKind.Text,
    data,
    allowOverlay: false,
    displayData: data,
    allowWrapping: false,
    ...options,
  };
}

// 文本单元格工具函数
export function isTextEmpty(cell: TextCell): boolean {
  return !cell.data || cell.data.trim() === '';
}

export function getTextLength(cell: TextCell): number {
  return cell.data?.length ?? 0;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function wrapText(text: string, maxWidth: number, font: string): string[] {
  if (typeof document === 'undefined') return [text];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [text];

  ctx.font = font;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
