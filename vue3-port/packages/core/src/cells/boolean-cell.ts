/**
 * 布尔单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { BooleanCell, BooleanEmpty, BooleanIndeterminate } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';
import {
  getSquareXPosFromAlign,
  getSquareWidth,
  getSquareBB,
  pointIsWithinBB,
} from '../common/utils.js';

// 绘制复选框
function drawCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  checked: boolean | BooleanEmpty | BooleanIndeterminate,
  theme: any,
  style: 'square' | 'circle' = 'square',
  hoverAmount = 0
) {
  ctx.save();

  // 计算位置
  const centerX = x;
  const centerY = y;
  const halfSize = size / 2;

  // 背景颜色 (根据状态和悬停)
  const bgColor = checked === true ? theme.accentColor : theme.bgCell;
  const borderColor = checked === true ? theme.accentColor : theme.borderColor;

  // 悬停效果
  if (hoverAmount > 0) {
    ctx.globalAlpha = 0.1 + hoverAmount * 0.1;
    ctx.fillStyle = theme.accentLight;
    if (style === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, halfSize + 2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(centerX - halfSize - 2, centerY - halfSize - 2, size + 4, size + 4);
    }
    ctx.globalAlpha = 1;
  }

  // 绘制复选框背景
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;

  if (style === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, halfSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    const rect = {
      x: centerX - halfSize,
      y: centerY - halfSize,
      width: size,
      height: size,
    };

    // 圆角矩形
    const radius = 2;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
    ctx.fill();
    ctx.stroke();
  }

  // 绘制勾选标记
  if (checked === true) {
    ctx.strokeStyle = theme.accentFg;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 绘制勾
    const checkSize = size * 0.6;
    const startX = centerX - checkSize * 0.3;
    const startY = centerY;
    const midX = centerX - checkSize * 0.1;
    const midY = centerY + checkSize * 0.2;
    const endX = centerX + checkSize * 0.3;
    const endY = centerY - checkSize * 0.2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  } else if (checked === undefined) {
    // 不确定状态 - 绘制短横线
    ctx.strokeStyle = theme.textMedium;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const lineSize = size * 0.4;
    ctx.beginPath();
    ctx.moveTo(centerX - lineSize / 2, centerY);
    ctx.lineTo(centerX + lineSize / 2, centerY);
    ctx.stroke();
  }

  ctx.restore();
}

// 布尔单元格渲染器实现
export const booleanCellRenderer: CustomRenderer<BooleanCell> = {
  draw: (args: DrawArgs<BooleanCell>) => {
    const { ctx, rect, cell, theme, highlighted, hoverAmount = 0 } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    // 计算复选框大小和位置
    const maxSize = Math.min(theme.checkboxMaxSize || 18, rect.height - 8);
    const size = getSquareWidth(maxSize, rect.height, 4);
    const x = getSquareXPosFromAlign('center', rect.x, rect.width, 0, size);
    const y = rect.y + rect.height / 2;

    // 绘制复选框
    drawCheckbox(
      ctx,
      x,
      y,
      size,
      cell.data,
      theme,
      'square', // 或者从主题/配置中获取
      hoverAmount
    );

    ctx.restore();
  },

  measure: () => {
    return 32; // 布尔单元格固定宽度
  },

  hitTest: (cell, pos, bounds, theme) => {
    // 计算复选框的点击区域
    const maxSize = Math.min(theme?.checkboxMaxSize || 18, bounds.height - 8);
    const size = getSquareWidth(maxSize, bounds.height, 4);
    const x = getSquareXPosFromAlign('center', bounds.x, bounds.width, 0, size);
    const y = bounds.y + bounds.height / 2;

    const bb = getSquareBB(x, y, size + 8); // 增加一些点击容差
    return pointIsWithinBB(pos.x, pos.y, bb);
  },

  // 布尔单元格通常不需要专门的编辑器，直接点击切换，省略该属性

  getCursor: () => 'pointer',

  onPaste: (val, cell) => {
    // 解析粘贴的文本为布尔值
    const lowerVal = val.toLowerCase().trim();
    let newValue: boolean | BooleanEmpty | BooleanIndeterminate;

    if (lowerVal === 'true' || lowerVal === '1' || lowerVal === 'yes' || lowerVal === 'on') {
      newValue = true;
    } else if (
      lowerVal === 'false' ||
      lowerVal === '0' ||
      lowerVal === 'no' ||
      lowerVal === 'off'
    ) {
      newValue = false;
    } else if (lowerVal === '' || lowerVal === 'null') {
      newValue = null;
    } else {
      newValue = undefined; // 不确定状态
    }

    return {
      ...cell,
      data: newValue,
    };
  },
};

// 内部渲染器导出
export const internalBooleanCellRenderer = {
  ...booleanCellRenderer,
  kind: GridCellKind.Boolean,
};

// 创建布尔单元格的工厂函数
export function createBooleanCell(
  data: boolean | BooleanEmpty | BooleanIndeterminate,
  options: Partial<Omit<BooleanCell, 'kind' | 'data'>> = {}
): BooleanCell {
  return {
    kind: GridCellKind.Boolean,
    data,
    allowOverlay: false,
    showUnchecked: true,
    allowEdit: true,
    ...options,
  };
}

// 布尔单元格工具函数
export function toggleBooleanCell(cell: BooleanCell): BooleanCell {
  let newValue: boolean | BooleanEmpty | BooleanIndeterminate;

  if (cell.data === true) {
    newValue = false;
  } else if (cell.data === false) {
    newValue = cell.showUnchecked ? null : true;
  } else if (cell.data === null) {
    newValue = undefined; // 不确定状态
  } else {
    newValue = true;
  }

  return {
    ...cell,
    data: newValue,
  };
}

export function isBooleanTrue(cell: BooleanCell): boolean {
  return cell.data === true;
}

export function isBooleanFalse(cell: BooleanCell): boolean {
  return cell.data === false;
}

export function isBooleanEmpty(cell: BooleanCell): boolean {
  return cell.data === null;
}

export function isBooleanIndeterminate(cell: BooleanCell): boolean {
  return cell.data === undefined;
}

export function getBooleanDisplayText(cell: BooleanCell): string {
  if (cell.data === true) return 'Yes';
  if (cell.data === false) return 'No';
  if (cell.data === null) return '';
  return 'Mixed'; // 不确定状态
}

// 从字符串解析布尔值
export function parseBooleanValue(str: string): boolean | BooleanEmpty | BooleanIndeterminate {
  const lowerVal = str.toLowerCase().trim();

  const trueValues = ['true', '1', 'yes', 'on', 'checked', 'y', 't'];
  const falseValues = ['false', '0', 'no', 'off', 'unchecked', 'n', 'f'];
  const emptyValues = ['', 'null', 'empty'];

  if (trueValues.includes(lowerVal)) return true;
  if (falseValues.includes(lowerVal)) return false;
  if (emptyValues.includes(lowerVal)) return null;

  return undefined; // 不确定状态
}
