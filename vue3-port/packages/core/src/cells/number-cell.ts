/**
 * 数字单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { NumberCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawTextInRect, drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 数字格式化函数
function formatNumber(
  value: number | undefined,
  formatHint?: string,
  fixedDecimals?: number
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }

  // 如果有固定小数位数
  if (fixedDecimals !== undefined) {
    return value.toFixed(fixedDecimals);
  }

  // 根据格式提示处理
  switch (formatHint) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value / 100);
    case 'integer':
      return Math.round(value).toString();
    case 'decimal':
      return value.toString();
    case 'scientific':
      return value.toExponential(2);
    default:
      // 自动格式化
      if (Number.isInteger(value)) {
        return value.toString();
      } else {
        // 保留合理的小数位数
        const decimals = Math.min(6, Math.max(0, 2 - Math.floor(Math.log10(Math.abs(value)))));
        return value.toFixed(decimals).replace(/\.?0+$/, '');
      }
  }
}

// 解析数字字符串
function parseNumber(str: string, allowNegative = true): number | undefined {
  if (!str || str.trim() === '') return undefined;

  // 移除非数字字符 (除了小数点、负号、科学计数法)
  const cleaned = str.replace(/[^\d.-eE]/g, '');
  if (!cleaned) return undefined;

  const num = parseFloat(cleaned);
  if (isNaN(num)) return undefined;

  if (!allowNegative && num < 0) return Math.abs(num);

  return num;
}

// 数字单元格渲染器实现
export const numberCellRenderer: CustomRenderer<NumberCell> = {
  draw: (args: DrawArgs<NumberCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    // 绘制数字内容
    if (cell.data !== undefined && cell.data !== null) {
      const textColor = cell.readonly ? theme.textLight : theme.textDark;
      const displayText =
        cell.displayData ?? formatNumber(cell.data, cell.formatHint, cell.fixedDecimals);

      drawTextInRect(ctx, displayText, rect, theme, {
        color: textColor,
        alignment: 'right', // 数字右对齐
        verticalAlignment: 'middle',
      });
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    if (cell.data === undefined || cell.data === null) {
      return theme.cellHorizontalPadding * 2 + 50; // 最小宽度
    }

    const displayText =
      cell.displayData ?? formatNumber(cell.data, cell.formatHint, cell.fixedDecimals);

    ctx.save();
    ctx.font = theme.baseFontStyle;
    const width = ctx.measureText(displayText).width + theme.cellHorizontalPadding * 2;
    ctx.restore();

    return Math.max(width, 60); // 数字最小宽度
  },

  hitTest: (cell, pos, bounds) => {
    // 数字单元格整个区域都可点击
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
  //     editor: {} as any, // NumberEditor component
  //     disablePadding: false,
  //     deletedValue: () => ({ ...cell, data: undefined, displayData: '' }),
  //   };
  // },

  onPaste: (val, cell) => {
    const numValue = parseNumber(val, cell.allowNegative);
    return {
      ...cell,
      data: numValue,
      displayData:
        numValue !== undefined ? formatNumber(numValue, cell.formatHint, cell.fixedDecimals) : '',
    };
  },
};

// 内部渲染器导出
export const internalNumberCellRenderer = {
  ...numberCellRenderer,
  kind: GridCellKind.Number,
};

// 创建数字单元格的工厂函数
export function createNumberCell(
  data: number | undefined,
  options: Partial<Omit<NumberCell, 'kind' | 'data'>> = {}
): NumberCell {
  return {
    kind: GridCellKind.Number,
    data,
    allowOverlay: false,
    formatHint: 'decimal',
    ...options,
  };
}

// 数字单元格工具函数
export function isNumberEmpty(cell: NumberCell): boolean {
  return cell.data === undefined || cell.data === null || isNaN(cell.data);
}

export function isNumberPositive(cell: NumberCell): boolean {
  return !isNumberEmpty(cell) && cell.data! > 0;
}

export function isNumberNegative(cell: NumberCell): boolean {
  return !isNumberEmpty(cell) && cell.data! < 0;
}

export function isNumberZero(cell: NumberCell): boolean {
  return !isNumberEmpty(cell) && cell.data === 0;
}

export function roundNumber(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function clampNumber(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return result;
}

// 数字验证
export function validateNumber(
  value: number,
  cell: NumberCell
): { valid: boolean; message?: string } {
  if (isNaN(value)) {
    return { valid: false, message: 'Invalid number' };
  }

  if (!cell.allowNegative && value < 0) {
    return { valid: false, message: 'Negative numbers not allowed' };
  }

  return { valid: true };
}

// 格式化预设
export const numberFormats = {
  integer: (value: number) => Math.round(value).toString(),
  decimal: (value: number, decimals = 2) => value.toFixed(decimals),
  currency: (value: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value),
  percent: (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(
      value / 100
    ),
  scientific: (value: number, decimals = 2) => value.toExponential(decimals),
  compact: (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value),
} as const;
