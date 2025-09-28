/**
 * 单元格渲染器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  textCellRenderer,
  numberCellRenderer,
  booleanCellRenderer,
  createTextCell,
  createNumberCell,
  createBooleanCell,
  getCellRenderer,
  hasCellRenderer,
  registerCellRenderer,
} from '../cells/index.js';
import { GridCellKind } from '../types/grid-cell.js';
import { defaultTheme } from '../types/theme.js';
import type { DrawArgs } from '../types/cell-renderer.js';

// Mock Canvas Context
const createMockContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  roundRect: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  fillText: vi.fn(),
  set fillStyle(value) {
    this._fillStyle = value;
  },
  get fillStyle() {
    return this._fillStyle;
  },
  set strokeStyle(value) {
    this._strokeStyle = value;
  },
  get strokeStyle() {
    return this._strokeStyle;
  },
  set font(value) {
    this._font = value;
  },
  get font() {
    return this._font;
  },
  set textAlign(value) {
    this._textAlign = value;
  },
  get textAlign() {
    return this._textAlign;
  },
  set textBaseline(value) {
    this._textBaseline = value;
  },
  get textBaseline() {
    return this._textBaseline;
  },
  set lineWidth(value) {
    this._lineWidth = value;
  },
  get lineWidth() {
    return this._lineWidth;
  },
  set lineCap(value) {
    this._lineCap = value;
  },
  get lineCap() {
    return this._lineCap;
  },
  set lineJoin(value) {
    this._lineJoin = value;
  },
  get lineJoin() {
    return this._lineJoin;
  },
  set globalAlpha(value) {
    this._globalAlpha = value;
  },
  get globalAlpha() {
    return this._globalAlpha;
  },
});

const createDrawArgs = (cell: any): DrawArgs => ({
  ctx: createMockContext() as any,
  rect: { x: 0, y: 0, width: 150, height: 32 },
  cell,
  theme: defaultTheme,
  col: 0,
  row: 0,
  hoverAmount: 0,
  hoverX: undefined,
  hoverY: undefined,
  highlighted: false,
  imageLoader: {} as any,
});

describe('单元格渲染器', () => {
  describe('textCellRenderer', () => {
    it('渲染文本单元格', () => {
      const cell = createTextCell('Hello World');
      const args = createDrawArgs(cell);

      expect(() => textCellRenderer.draw(args)).not.toThrow();
      expect(args.ctx.fillRect).toHaveBeenCalled();
      expect(args.ctx.fillText).toHaveBeenCalledWith(
        'Hello World',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('测量文本宽度', () => {
      const cell = createTextCell('Test');
      const ctx = createMockContext() as any;

      const width = textCellRenderer.measure!(ctx, cell, defaultTheme);
      expect(width).toBeGreaterThan(0);
      expect(ctx.measureText).toHaveBeenCalledWith('Test');
    });

    it('处理空文本', () => {
      const cell = createTextCell('');
      const args = createDrawArgs(cell);

      expect(() => textCellRenderer.draw(args)).not.toThrow();
    });

    it('支持粘贴操作', () => {
      const cell = createTextCell('Original');
      const result = textCellRenderer.onPaste!('New Text', cell);

      expect(result.data).toBe('New Text');
      expect(result.displayData).toBe('New Text');
    });
  });

  describe('numberCellRenderer', () => {
    it('渲染数字单元格', () => {
      const cell = createNumberCell(42.5);
      const args = createDrawArgs(cell);

      expect(() => numberCellRenderer.draw(args)).not.toThrow();
      expect(args.ctx.fillRect).toHaveBeenCalled();
    });

    it('格式化数字显示', () => {
      const cell = createNumberCell(1234.567, { fixedDecimals: 2 });
      const args = createDrawArgs(cell);

      numberCellRenderer.draw(args);
      expect(args.ctx.fillText).toHaveBeenCalledWith(
        '1234.57',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('处理undefined数字', () => {
      const cell = createNumberCell(undefined);
      const args = createDrawArgs(cell);

      expect(() => numberCellRenderer.draw(args)).not.toThrow();
    });

    it('支持数字粘贴', () => {
      const cell = createNumberCell(0);
      const result = numberCellRenderer.onPaste!('123.45', cell);

      expect(result.data).toBe(123.45);
    });

    it('处理无效数字粘贴', () => {
      const cell = createNumberCell(0);
      const result = numberCellRenderer.onPaste!('invalid', cell);

      expect(result.data).toBeUndefined();
    });
  });

  describe('booleanCellRenderer', () => {
    it('渲染true状态', () => {
      const cell = createBooleanCell(true);
      const args = createDrawArgs(cell);

      expect(() => booleanCellRenderer.draw(args)).not.toThrow();
      expect(args.ctx.fill).toHaveBeenCalled();
      expect(args.ctx.stroke).toHaveBeenCalled();
    });

    it('渲染false状态', () => {
      const cell = createBooleanCell(false);
      const args = createDrawArgs(cell);

      expect(() => booleanCellRenderer.draw(args)).not.toThrow();
    });

    it('渲染不确定状态', () => {
      const cell = createBooleanCell(undefined);
      const args = createDrawArgs(cell);

      expect(() => booleanCellRenderer.draw(args)).not.toThrow();
    });

    it('点击测试', () => {
      const cell = createBooleanCell(true);
      const bounds = { x: 0, y: 0, width: 150, height: 32 };

      const isHit = booleanCellRenderer.hitTest!(cell, { x: 75, y: 16 }, bounds, defaultTheme);
      expect(isHit).toBe(true);
    });

    it('支持布尔值粘贴', () => {
      const cell = createBooleanCell(false);

      const trueResult = booleanCellRenderer.onPaste!('true', cell);
      expect(trueResult.data).toBe(true);

      const falseResult = booleanCellRenderer.onPaste!('false', cell);
      expect(falseResult.data).toBe(false);

      const emptyResult = booleanCellRenderer.onPaste!('', cell);
      expect(emptyResult.data).toBe(null);
    });
  });

  describe('渲染器注册表', () => {
    it('注册内置渲染器', () => {
      expect(hasCellRenderer(GridCellKind.Text)).toBe(true);
      expect(hasCellRenderer(GridCellKind.Number)).toBe(true);
      expect(hasCellRenderer(GridCellKind.Boolean)).toBe(true);
    });

    it('获取渲染器', () => {
      const textRenderer = getCellRenderer(GridCellKind.Text);
      expect(textRenderer).toBeDefined();
      expect(textRenderer?.kind).toBe(GridCellKind.Text);
    });

    it('注册自定义渲染器', () => {
      const customRenderer = {
        kind: 'custom',
        draw: vi.fn(),
      };

      registerCellRenderer('custom' as any, customRenderer as any);

      expect(hasCellRenderer('custom' as any)).toBe(true);
      expect(getCellRenderer('custom' as any)).toBe(customRenderer);
    });

    it('默认渲染器回调', () => {
      const textCell = createTextCell('test');
      const renderer = getCellRenderer(textCell.kind);

      expect(renderer).toBeDefined();
      expect(renderer?.kind).toBe(GridCellKind.Text);
    });
  });

  describe('单元格创建函数', () => {
    it('创建文本单元格', () => {
      const cell = createTextCell('Hello', { allowOverlay: true });

      expect(cell.kind).toBe(GridCellKind.Text);
      expect(cell.data).toBe('Hello');
      expect(cell.allowOverlay).toBe(true);
    });

    it('创建数字单元格', () => {
      const cell = createNumberCell(42, { formatHint: 'currency' });

      expect(cell.kind).toBe(GridCellKind.Number);
      expect(cell.data).toBe(42);
      expect(cell.formatHint).toBe('currency');
    });

    it('创建布尔单元格', () => {
      const cell = createBooleanCell(true, { allowEdit: true });

      expect(cell.kind).toBe(GridCellKind.Boolean);
      expect(cell.data).toBe(true);
      expect(cell.allowEdit).toBe(true);
    });
  });
});
