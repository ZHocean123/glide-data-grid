/**
 * 单元格渲染器类型定义
 * 从 React 版本迁移并适配 Vue3
 */

import type { Component } from 'vue';
import type { GridCell } from './grid-cell.js';
import type { Rectangle } from './base.js';

// 主题类型 (简化版本，完整版本在theme.ts中)
export interface Theme {
  accentColor: string;
  textDark: string;
  textMedium: string;
  textLight: string;
  bgCell: string;
  borderColor: string;
  fontFamily: string;
  baseFontStyle: string;
  cellHorizontalPadding: number;
  cellVerticalPadding: number;
  [key: string]: any;
}

// 图片窗口加载器接口
export interface ImageWindowLoader {
  loadOrGetImage: (url: string, col: number, row: number) => HTMLImageElement | ImageBitmap | undefined;
  setWindow: (window: Rectangle) => void;
}

// 基础绘制参数
export interface BaseDrawArgs {
  ctx: CanvasRenderingContext2D;
  theme: Theme;
  rect: Rectangle;
  col: number;
  row: number;
  hoverAmount: number;
  hoverX: number | undefined;
  hoverY: number | undefined;
  highlighted: boolean;
  imageLoader: ImageWindowLoader;
}

// 绘制参数 (包含单元格数据)
export interface DrawArgs<T extends GridCell = GridCell> extends BaseDrawArgs {
  cell: T;
}

// 自定义渲染器接口
export interface CustomRenderer<T extends GridCell = GridCell> {
  // 渲染函数
  draw: (args: DrawArgs<T>) => void;

  // 测量函数 (可选，用于自动宽度计算)
  measure?: (ctx: CanvasRenderingContext2D, cell: T, theme: Theme) => number;

  // 点击测试函数 (可选，用于自定义点击区域)
  hitTest?: (
    data: T,
    pos: { x: number; y: number },
    bounds: Rectangle,
    theme: Theme
  ) => boolean;

  // 编辑器函数 (可选，返回Vue组件用于编辑)
  provideEditor?: (cell: T) => {
    editor: Component;
    disablePadding?: boolean;
    deletedValue?: (cell: T) => T;
    styleOverride?: Record<string, any>;
  };

  // 光标样式 (可选)
  getCursor?: (cell: T, pos: { x: number; y: number }, bounds: Rectangle) => string | undefined;

  // 复制数据处理 (可选)
  onPaste?: (val: string, cell: T) => T | undefined;
}

// 内部单元格渲染器 (包含kind信息)
export interface InternalCellRenderer extends CustomRenderer {
  readonly kind: string;
}

// 单元格渲染器类型
export type CellRenderer<T extends GridCell = GridCell> = CustomRenderer<T>;

// 获取单元格渲染器的回调
export type GetCellRendererCallback = (cell: GridCell) => CellRenderer | undefined;

// 编辑器结果类型
export interface EditorResult<T = any> {
  readonly value: T;
  readonly formatValue?: string;
}

// 编辑器回调类型
export type ProvideEditorCallback<T extends GridCell = GridCell> = (
  cell: T
) => {
  editor: Component;
  disablePadding?: boolean;
  deletedValue?: (cell: T) => T;
  styleOverride?: Record<string, any>;
} | undefined;

// 编辑器组件Props接口
export interface BaseEditorProps<T extends GridCell = GridCell> {
  value: T;
  onFinishedEditing: (newValue: T | undefined, movement?: readonly [number, number]) => void;
  isHighlighted: boolean;
  onChange?: (newValue: T) => void;
  validatedSelection?: { start: number; end: number };
  imageEditorOverride?: Component;
  markdownDivCreateNode?: (content: string) => DocumentFragment;
  forceEditMode?: boolean;
  target: Rectangle;
  onKeyDown?: (event: KeyboardEvent) => void;
  createNode?: (content: string) => DocumentFragment;
}

// 文本编辑器Props
export interface TextEditorProps extends BaseEditorProps {
  readonly?: boolean;
  placeholder?: string;
  validationRegex?: RegExp;
}

// 数字编辑器Props
export interface NumberEditorProps extends BaseEditorProps {
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  fixedDecimals?: number;
}

// 图片编辑器Props
export interface ImageEditorProps extends BaseEditorProps {
  canWrite: boolean;
  onCanvasBlur: () => void;
  allowAdd: boolean;
  onFinishedEditing: (newValue: any) => void;
}

// 渲染器注册表
export interface RendererRegistry {
  registerRenderer: (kind: string, renderer: InternalCellRenderer) => void;
  getRenderer: (kind: string) => InternalCellRenderer | undefined;
  getAllRenderers: () => Map<string, InternalCellRenderer>;
}

// 默认渲染器工厂
export function createDefaultRenderer<T extends GridCell>(
  kind: string,
  drawFn: (args: DrawArgs<T>) => void,
  options: Partial<CustomRenderer<T>> = {}
): InternalCellRenderer {
  return {
    kind,
    draw: drawFn as any,
    ...options,
  };
}

// 渲染器辅助函数
export function measureTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
): number {
  const oldFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = oldFont;
  return width;
}

export function drawTextInRect(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rectangle,
  theme: Theme,
  options: {
    alignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'middle' | 'bottom';
    color?: string;
    font?: string;
    allowWrapping?: boolean;
  } = {}
): void {
  const {
    alignment = 'left',
    verticalAlignment = 'middle',
    color = theme.textDark,
    font = theme.baseFontStyle,
    allowWrapping = false,
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = verticalAlignment;

  let x = rect.x + theme.cellHorizontalPadding;
  if (alignment === 'center') {
    x = rect.x + rect.width / 2;
    ctx.textAlign = 'center';
  } else if (alignment === 'right') {
    x = rect.x + rect.width - theme.cellHorizontalPadding;
    ctx.textAlign = 'right';
  }

  let y = rect.y + rect.height / 2;
  if (verticalAlignment === 'top') {
    y = rect.y + theme.cellVerticalPadding;
  } else if (verticalAlignment === 'bottom') {
    y = rect.y + rect.height - theme.cellVerticalPadding;
  }

  if (allowWrapping) {
    // 简化的文本换行实现
    const words = text.split(' ');
    const maxWidth = rect.width - 2 * theme.cellHorizontalPadding;
    let line = '';
    let lineY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, lineY);
        line = word + ' ';
        lineY += 20; // 简化的行高
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  } else {
    // 单行文本，处理溢出
    const maxWidth = rect.width - 2 * theme.cellHorizontalPadding;
    const textWidth = ctx.measureText(text).width;

    if (textWidth > maxWidth) {
      // 截断文本并添加省略号
      let truncatedText = text;
      while (ctx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
        truncatedText = truncatedText.slice(0, -1);
      }
      ctx.fillText(truncatedText + '...', x, y);
    } else {
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

// 绘制边框辅助函数
export function drawCellBorder(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  theme: Theme,
  sides: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } = {}
): void {
  const { top = true, right = true, bottom = true, left = true } = sides;

  ctx.save();
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();

  if (top) {
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x + rect.width, rect.y);
  }
  if (right) {
    ctx.moveTo(rect.x + rect.width, rect.y);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
  }
  if (bottom) {
    ctx.moveTo(rect.x, rect.y + rect.height);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
  }
  if (left) {
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.height);
  }

  ctx.stroke();
  ctx.restore();
}
