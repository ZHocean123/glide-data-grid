/**
 * 下钻单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { DrilldownCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 下钻项接口
export interface DrilldownItem {
  text: string;
  img?: string;
  badge?: string | number;
  color?: string;
  enabled?: boolean;
  data?: any;
}

// 测量文本宽度
function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const savedFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = savedFont;
  return width;
}

// 绘制圆形图标/头像
function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  text?: string
): void {
  ctx.save();

  // 绘制圆形背景
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.fill();

  // 如果有文本（通常是首字母），绘制文本
  if (text) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.floor(radius)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + radius, y + radius);
  }

  ctx.restore();
}

// 绘制徽章
function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  theme: any
): { width: number; height: number } {
  const badgeHeight = 16;
  const badgePadding = 6;
  const font = '10px sans-serif';

  const textWidth = measureText(ctx, text, font);
  const badgeWidth = Math.max(textWidth + badgePadding * 2, badgeHeight);

  ctx.save();

  // 绘制徽章背景
  ctx.fillStyle = theme.accentColor || '#ef4444';
  ctx.beginPath();
  ctx.roundRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();

  // 绘制徽章文本
  ctx.fillStyle = '#ffffff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + badgeWidth / 2, y + badgeHeight / 2);

  ctx.restore();

  return { width: badgeWidth, height: badgeHeight };
}

// 绘制箭头图标
function drawArrowIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const arrowSize = size * 0.6;
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  // 绘制箭头
  ctx.beginPath();
  ctx.moveTo(centerX - arrowSize / 2, centerY - arrowSize / 3);
  ctx.lineTo(centerX + arrowSize / 2, centerY);
  ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize / 3);
  ctx.stroke();

  ctx.restore();
}

// 获取颜色（支持预定义颜色名称）
function getColor(color: string | undefined, theme: any): string {
  if (!color) return theme.accentColor || '#3b82f6';

  const colorMap: Record<string, string> = {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    light: '#f9fafb',
    dark: '#1f2937',
  };

  return colorMap[color] || color;
}

// 生成初始字母
function getInitials(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// 下钻单元格渲染器实现
export const drilldownCellRenderer: CustomRenderer<DrilldownCell> = {
  draw: (args: DrawArgs<DrilldownCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    const items = cell.data || [];
    if (items.length === 0) {
      // 空内容提示
      ctx.fillStyle = theme.textLight || '#999999';
      ctx.font = theme.baseFontStyle || '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No items', rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
      return;
    }

    const padding = 8;
    const itemHeight = 24;
    const iconSize = 20;
    const spacing = 4;
    const maxItems = Math.floor((rect.height - padding * 2) / (itemHeight + spacing));

    // 绘制项目列表
    for (let i = 0; i < Math.min(items.length, maxItems); i++) {
      const item = items[i];
      const itemY = rect.y + padding + i * (itemHeight + spacing);
      const itemRect = {
        x: rect.x + padding,
        y: itemY,
        width: rect.width - padding * 2,
        height: itemHeight,
      };

      // 检查项目是否被禁用
      const isEnabled = item.enabled !== false;
      const opacity = isEnabled ? 1.0 : 0.5;

      ctx.save();
      if (!isEnabled) {
        ctx.globalAlpha = opacity;
      }

      let currentX = itemRect.x;

      // 绘制图标/头像
      if (item.img || item.text) {
        const iconColor = getColor(item.color, theme);
        const initials = item.img ? undefined : getInitials(item.text);

        drawCircleImage(
          ctx,
          currentX,
          itemRect.y + (itemRect.height - iconSize) / 2,
          iconSize / 2,
          iconColor,
          initials
        );

        currentX += iconSize + 8;
      }

      // 绘制文本
      const textColor = isEnabled ? theme.textDark || '#000000' : theme.textLight || '#999999';
      const font = theme.baseFontStyle || '12px sans-serif';
      const availableTextWidth = itemRect.x + itemRect.width - currentX - 20; // 为箭头留空间

      ctx.fillStyle = textColor;
      ctx.font = font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // 处理文本截断
      let displayText = item.text;
      const textWidth = measureText(ctx, displayText, font);

      if (textWidth > availableTextWidth) {
        const ellipsis = '...';
        const ellipsisWidth = measureText(ctx, ellipsis, font);

        while (displayText.length > 0) {
          const currentWidth = measureText(ctx, displayText + ellipsis, font);
          if (currentWidth <= availableTextWidth) {
            displayText = displayText + ellipsis;
            break;
          }
          displayText = displayText.slice(0, -1);
        }
      }

      ctx.fillText(displayText, currentX, itemRect.y + itemRect.height / 2);

      // 绘制徽章
      if (item.badge) {
        const badgeText = typeof item.badge === 'number' ? item.badge.toString() : item.badge;
        const badgeX = itemRect.x + itemRect.width - 40;
        const badgeY = itemRect.y + (itemRect.height - 16) / 2;

        drawBadge(ctx, badgeText, badgeX, badgeY, theme);
      }

      // 绘制箭头
      if (isEnabled) {
        const arrowX = itemRect.x + itemRect.width - 16;
        const arrowY = itemRect.y + (itemRect.height - 12) / 2;
        const arrowColor = theme.textMedium || '#666666';

        drawArrowIcon(ctx, arrowX, arrowY, 12, arrowColor);
      }

      ctx.restore();
    }

    // 显示更多指示器
    if (items.length > maxItems) {
      const moreCount = items.length - maxItems;
      const moreText = `+${moreCount} more`;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(rect.x + padding, rect.y + rect.height - 20, rect.width - padding * 2, 16);

      ctx.fillStyle = theme.textMedium || '#666666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(moreText, rect.x + rect.width / 2, rect.y + rect.height - 12);
      ctx.restore();
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    const items = cell.data || [];
    if (items.length === 0) return (theme.cellHorizontalPadding || 8) * 2 + 100;

    let maxWidth = 0;
    const font = theme.baseFontStyle || '12px sans-serif';
    const iconSize = 20;
    const padding = 16;

    for (const item of items) {
      let itemWidth = padding;

      // 图标宽度
      if (item.img || item.text) {
        itemWidth += iconSize + 8;
      }

      // 文本宽度
      itemWidth += measureText(ctx, item.text, font);

      // 徽章宽度
      if (item.badge) {
        const badgeText = typeof item.badge === 'number' ? item.badge.toString() : item.badge;
        itemWidth += measureText(ctx, badgeText, '10px sans-serif') + 12;
      }

      // 箭头宽度
      itemWidth += 20;

      maxWidth = Math.max(maxWidth, itemWidth);
    }

    return Math.max(maxWidth, 150);
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
  //     editor: {} as any, // DrilldownEditor component
  //     disablePadding: false,
  //     deletedValue: () => ({ ...cell, data: [] }),
  //   };
  // },

  getCursor: () => 'pointer',

  onPaste: (val, cell) => {
    // 处理粘贴的文本，每行作为一个项目
    const lines = val.split('\n').filter((line) => line.trim());
    const items: DrilldownItem[] = lines.map((line) => ({
      text: line.trim(),
      enabled: true,
    }));

    return {
      ...cell,
      data: items,
    };
  },

  onClick: (cell, pos, bounds) => {
    // 计算点击了哪个项目
    const items = cell.data || [];
    if (items.length === 0) return false;

    const padding = 8;
    const itemHeight = 24;
    const spacing = 4;
    const relativeY = pos.y - bounds.y - padding;
    const itemIndex = Math.floor(relativeY / (itemHeight + spacing));

    if (itemIndex >= 0 && itemIndex < items.length) {
      const item = items[itemIndex];
      if (item.enabled !== false && cell.onClickItem) {
        cell.onClickItem(item, itemIndex);
        return true;
      }
    }

    return false;
  },
};

// 内部渲染器导出
export const internalDrilldownCellRenderer = {
  ...drilldownCellRenderer,
  kind: GridCellKind.Drilldown,
};

// 创建下钻单元格的工厂函数
export function createDrilldownCell(
  data: readonly DrilldownItem[],
  options: Partial<Omit<DrilldownCell, 'kind' | 'data'>> = {}
): DrilldownCell {
  return {
    kind: GridCellKind.Drilldown,
    data,
    allowOverlay: false,
    ...options,
  };
}

// 下钻单元格工具函数
export function isDrilldownEmpty(cell: DrilldownCell): boolean {
  return !cell.data || cell.data.length === 0;
}

export function getDrilldownItemCount(cell: DrilldownCell): number {
  return cell.data?.length || 0;
}

export function getEnabledItemCount(cell: DrilldownCell): number {
  return (cell.data || []).filter((item) => item.enabled !== false).length;
}

export function addDrilldownItem(cell: DrilldownCell, item: DrilldownItem): DrilldownCell {
  const newData = [...(cell.data || []), item];
  return {
    ...cell,
    data: newData,
  };
}

export function removeDrilldownItem(cell: DrilldownCell, index: number): DrilldownCell {
  if (!cell.data || index < 0 || index >= cell.data.length) return cell;

  const newData = cell.data.filter((_, i) => i !== index);
  return {
    ...cell,
    data: newData,
  };
}

export function updateDrilldownItem(
  cell: DrilldownCell,
  index: number,
  updates: Partial<DrilldownItem>
): DrilldownCell {
  if (!cell.data || index < 0 || index >= cell.data.length) return cell;

  const newData = cell.data.map((item, i) => (i === index ? { ...item, ...updates } : item));

  return {
    ...cell,
    data: newData,
  };
}

export function toggleItemEnabled(cell: DrilldownCell, index: number): DrilldownCell {
  if (!cell.data || index < 0 || index >= cell.data.length) return cell;

  const item = cell.data[index];
  return updateDrilldownItem(cell, index, { enabled: !item.enabled });
}

// 下钻项工具函数
export function createDrilldownItem(
  text: string,
  options: Partial<Omit<DrilldownItem, 'text'>> = {}
): DrilldownItem {
  return {
    text,
    enabled: true,
    ...options,
  };
}

export function createPersonItem(
  name: string,
  options: { color?: string; badge?: string | number; data?: any } = {}
): DrilldownItem {
  return {
    text: name,
    color: options.color || '#3b82f6',
    badge: options.badge,
    data: options.data,
    enabled: true,
  };
}

export function createCategoryItem(
  category: string,
  count?: number,
  options: Partial<DrilldownItem> = {}
): DrilldownItem {
  return {
    text: category,
    badge: count,
    color: '#6b7280',
    enabled: true,
    ...options,
  };
}

// 排序和筛选工具
export function sortDrilldownItems(
  items: readonly DrilldownItem[],
  sortBy: 'text' | 'badge' = 'text',
  order: 'asc' | 'desc' = 'asc'
): DrilldownItem[] {
  return [...items].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortBy === 'badge') {
      aValue = typeof a.badge === 'number' ? a.badge : a.badge || '';
      bValue = typeof b.badge === 'number' ? b.badge : b.badge || '';
    } else {
      aValue = a.text;
      bValue = b.text;
    }

    let comparison: number;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

export function filterDrilldownItems(
  items: readonly DrilldownItem[],
  filter: {
    enabled?: boolean;
    text?: string;
    hasImage?: boolean;
    hasBadge?: boolean;
  }
): DrilldownItem[] {
  return items.filter((item) => {
    if (filter.enabled !== undefined && item.enabled !== filter.enabled) {
      return false;
    }

    if (filter.text && !item.text.toLowerCase().includes(filter.text.toLowerCase())) {
      return false;
    }

    if (filter.hasImage !== undefined && !!item.img !== filter.hasImage) {
      return false;
    }

    if (filter.hasBadge !== undefined && !!item.badge !== filter.hasBadge) {
      return false;
    }

    return true;
  });
}

export function groupDrilldownItems(
  items: readonly DrilldownItem[],
  groupBy: (item: DrilldownItem) => string
): Record<string, DrilldownItem[]> {
  const groups: Record<string, DrilldownItem[]> = {};

  for (const item of items) {
    const key = groupBy(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
}
