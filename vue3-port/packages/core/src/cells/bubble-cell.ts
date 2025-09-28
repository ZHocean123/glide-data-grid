/**
 * 气泡单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { BubbleCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 气泡样式接口
interface BubbleStyle {
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: { x: number; y: number };
}

// 默认气泡样式
const defaultBubbleStyles: Record<string, BubbleStyle> = {
  default: {
    backgroundColor: '#e5e7eb',
    textColor: '#374151',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  primary: {
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  success: {
    backgroundColor: '#10b981',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  warning: {
    backgroundColor: '#f59e0b',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  error: {
    backgroundColor: '#ef4444',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  info: {
    backgroundColor: '#06b6d4',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  secondary: {
    backgroundColor: '#6b7280',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  light: {
    backgroundColor: '#f9fafb',
    textColor: '#374151',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
  dark: {
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: { x: 8, y: 4 },
  },
};

// 测量文本宽度
function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const savedFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = savedFont;
  return width;
}

// 获取气泡样式
function getBubbleStyle(bubble: string, theme: any): BubbleStyle {
  // 检查是否有自定义样式
  if (theme.bubbleStyles && theme.bubbleStyles[bubble]) {
    return { ...defaultBubbleStyles.default, ...theme.bubbleStyles[bubble] };
  }

  // 使用预定义样式
  if (defaultBubbleStyles[bubble]) {
    return defaultBubbleStyles[bubble];
  }

  // 默认样式
  return defaultBubbleStyles.default;
}

// 绘制单个气泡
function drawBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: BubbleStyle,
  font: string,
  maxWidth?: number
): { width: number; height: number } {
  const padding = style.padding || { x: 8, y: 4 };
  const borderRadius = style.borderRadius || 12;

  // 测量文本
  ctx.font = font;
  let displayText = text;
  let textWidth = measureText(ctx, text, font);

  // 处理文本截断
  if (maxWidth && textWidth + padding.x * 2 > maxWidth) {
    const ellipsis = '...';
    const ellipsisWidth = measureText(ctx, ellipsis, font);

    while (displayText.length > 0) {
      const currentWidth = measureText(ctx, displayText + ellipsis, font);
      if (currentWidth + padding.x * 2 <= maxWidth) {
        displayText = displayText + ellipsis;
        textWidth = currentWidth;
        break;
      }
      displayText = displayText.slice(0, -1);
    }
  }

  const bubbleWidth = textWidth + padding.x * 2;
  const bubbleHeight = 20 + padding.y * 2; // 固定高度

  ctx.save();

  // 绘制气泡背景
  ctx.fillStyle = style.backgroundColor;
  ctx.beginPath();
  ctx.roundRect(x, y, bubbleWidth, bubbleHeight, borderRadius);
  ctx.fill();

  // 绘制边框
  if (style.borderColor && style.borderWidth) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = style.borderWidth;
    ctx.stroke();
  }

  // 绘制文本
  ctx.fillStyle = style.textColor;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, x + bubbleWidth / 2, y + bubbleHeight / 2);

  ctx.restore();

  return { width: bubbleWidth, height: bubbleHeight };
}

// 计算气泡布局
function calculateBubbleLayout(
  bubbles: readonly string[],
  containerWidth: number,
  containerHeight: number,
  font: string,
  theme: any,
  ctx: CanvasRenderingContext2D
): Array<{
  bubble: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: BubbleStyle;
}> {
  const layout: Array<{
    bubble: string;
    x: number;
    y: number;
    width: number;
    height: number;
    style: BubbleStyle;
  }> = [];
  const spacing = 4; // 气泡间距
  const padding = 4; // 容器内边距

  let currentX = padding;
  let currentY = padding;
  let rowHeight = 0;

  for (const bubble of bubbles) {
    const style = getBubbleStyle(bubble, theme);
    const bubblePadding = style.padding || { x: 8, y: 4 };

    // 计算气泡尺寸
    const textWidth = measureText(ctx, bubble, font);
    const bubbleWidth = textWidth + bubblePadding.x * 2;
    const bubbleHeight = 20 + bubblePadding.y * 2;

    // 检查是否需要换行
    if (currentX + bubbleWidth > containerWidth - padding && currentX > padding) {
      currentX = padding;
      currentY += rowHeight + spacing;
      rowHeight = 0;
    }

    // 检查是否超出垂直空间
    if (currentY + bubbleHeight > containerHeight - padding) {
      break; // 停止添加更多气泡
    }

    layout.push({
      bubble,
      x: currentX,
      y: currentY,
      width: bubbleWidth,
      height: bubbleHeight,
      style,
    });

    currentX += bubbleWidth + spacing;
    rowHeight = Math.max(rowHeight, bubbleHeight);
  }

  return layout;
}

// 气泡单元格渲染器实现
export const bubbleCellRenderer: CustomRenderer<BubbleCell> = {
  draw: (args: DrawArgs<BubbleCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    const bubbles = cell.data || [];
    if (bubbles.length === 0) {
      // 空气泡提示
      ctx.fillStyle = theme.textLight || '#999999';
      ctx.font = theme.baseFontStyle || '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No bubbles', rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
      return;
    }

    // 计算气泡布局
    const font = theme.baseFontStyle || '12px sans-serif';
    const layout = calculateBubbleLayout(bubbles, rect.width, rect.height, font, theme, ctx);

    // 绘制气泡
    for (const item of layout) {
      drawBubble(ctx, item.bubble, rect.x + item.x, rect.y + item.y, item.style, font, item.width);
    }

    // 显示省略指示器
    if (layout.length < bubbles.length) {
      const remainingCount = bubbles.length - layout.length;
      const moreText = `+${remainingCount}`;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(rect.x + rect.width - 30, rect.y + rect.height - 20, 26, 16);

      ctx.fillStyle = theme.textMedium || '#666666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(moreText, rect.x + rect.width - 17, rect.y + rect.height - 12);
      ctx.restore();
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    const bubbles = cell.data || [];
    if (bubbles.length === 0) return (theme.cellHorizontalPadding || 8) * 2 + 80;

    const font = theme.baseFontStyle || '12px sans-serif';
    let totalWidth = 0;
    const spacing = 4;
    const padding = 8;

    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const style = getBubbleStyle(bubble, theme);
      const bubblePadding = style.padding || { x: 8, y: 4 };

      const textWidth = measureText(ctx, bubble, font);
      const bubbleWidth = textWidth + bubblePadding.x * 2;

      totalWidth += bubbleWidth;
      if (i < bubbles.length - 1) {
        totalWidth += spacing;
      }
    }

    return Math.max(totalWidth + padding * 2, 100);
  },

  hitTest: (cell, pos, bounds) => {
    // 整个单元格都可点击
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
  //     editor: {} as any, // BubbleEditor component
  //     disablePadding: false,
  //     deletedValue: () => ({ ...cell, data: [] }),
  //   };
  // },

  getCursor: () => 'pointer',

  onPaste: (val, cell) => {
    // 处理粘贴的文本，按逗号或换行分割成气泡
    const bubbles = val
      .split(/[,\n]/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    return {
      ...cell,
      data: bubbles,
    };
  },

  onClick: (cell, pos, bounds) => {
    // 可以在这里处理气泡点击事件
    if (cell.onClick) {
      // 简化实现：点击整个单元格
      cell.onClick(cell.data || []);
      return true;
    }
    return false;
  },
};

// 内部渲染器导出
export const internalBubbleCellRenderer = {
  ...bubbleCellRenderer,
  kind: GridCellKind.Bubble,
};

// 创建气泡单元格的工厂函数
export function createBubbleCell(
  data: readonly string[],
  options: Partial<Omit<BubbleCell, 'kind' | 'data'>> = {}
): BubbleCell {
  return {
    kind: GridCellKind.Bubble,
    data,
    allowOverlay: false,
    ...options,
  };
}

// 气泡单元格工具函数
export function isBubbleEmpty(cell: BubbleCell): boolean {
  return !cell.data || cell.data.length === 0;
}

export function getBubbleCount(cell: BubbleCell): number {
  return cell.data?.length || 0;
}

export function addBubbleToCell(cell: BubbleCell, bubble: string): BubbleCell {
  if (!bubble.trim()) return cell;

  const newData = [...(cell.data || []), bubble.trim()];
  return {
    ...cell,
    data: newData,
  };
}

export function removeBubbleFromCell(cell: BubbleCell, index: number): BubbleCell {
  if (!cell.data || index < 0 || index >= cell.data.length) return cell;

  const newData = cell.data.filter((_, i) => i !== index);
  return {
    ...cell,
    data: newData,
  };
}

export function hasBubble(cell: BubbleCell, bubble: string): boolean {
  return (cell.data || []).includes(bubble);
}

export function toggleBubble(cell: BubbleCell, bubble: string): BubbleCell {
  if (hasBubble(cell, bubble)) {
    const index = cell.data?.indexOf(bubble) || -1;
    return removeBubbleFromCell(cell, index);
  } else {
    return addBubbleToCell(cell, bubble);
  }
}

// 气泡样式工具
export function createBubbleStyle(
  backgroundColor: string,
  textColor: string,
  options: Partial<Omit<BubbleStyle, 'backgroundColor' | 'textColor'>> = {}
): BubbleStyle {
  return {
    backgroundColor,
    textColor,
    borderRadius: 12,
    padding: { x: 8, y: 4 },
    ...options,
  };
}

export function registerBubbleStyle(name: string, style: BubbleStyle, theme: any): void {
  if (!theme.bubbleStyles) {
    theme.bubbleStyles = {};
  }
  theme.bubbleStyles[name] = style;
}

// 气泡验证工具
export function validateBubbleText(text: string): boolean {
  return text.trim().length > 0 && text.length <= 50;
}

export function sanitizeBubbleText(text: string): string {
  return text.trim().substring(0, 50);
}

// 气泡排序工具
export function sortBubbles(bubbles: readonly string[], order: 'asc' | 'desc' = 'asc'): string[] {
  return [...bubbles].sort((a, b) => {
    const comparison = a.localeCompare(b);
    return order === 'asc' ? comparison : -comparison;
  });
}

export function groupBubblesByPrefix(bubbles: readonly string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const bubble of bubbles) {
    const colonIndex = bubble.indexOf(':');
    const prefix = colonIndex >= 0 ? bubble.substring(0, colonIndex) : 'default';
    const value = colonIndex >= 0 ? bubble.substring(colonIndex + 1) : bubble;

    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(value);
  }

  return groups;
}

// 导出默认样式供外部使用
export { defaultBubbleStyles };
