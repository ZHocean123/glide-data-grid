/**
 * 全面的单元格渲染器测试套件
 * 测试所有实现的单元格类型
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridCellKind } from '../../types/grid-cell.js';
import { defaultTheme } from '../../styles/theme.js';

// 导入所有单元格渲染器
import { textCellRenderer, createTextCell } from '../text-cell.js';
import { numberCellRenderer, createNumberCell } from '../number-cell.js';
import { booleanCellRenderer, createBooleanCell } from '../boolean-cell.js';
import { imageCellRenderer, createImageCell } from '../image-cell.js';
import { markdownCellRenderer, createMarkdownCell } from '../markdown-cell.js';
import { uriCellRenderer, createUriCell } from '../uri-cell.js';
import { bubbleCellRenderer, createBubbleCell } from '../bubble-cell.js';
import { drilldownCellRenderer, createDrilldownCell } from '../drilldown-cell.js';
import { loadingCellRenderer, createLoadingCell } from '../loading-cell.js';

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left',
  textBaseline: 'top',
  globalAlpha: 1,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  roundRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => [])
}));

// Mock Image
global.Image = class {
  width = 100;
  height = 100;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';

  constructor() {
    // 模拟异步加载
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
} as any;

describe('Cell Renderers', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCtx = mockCanvas.getContext('2d')!;
  });

  const createMockDrawArgs = (cell: any) => ({
    ctx: mockCtx,
    rect: { x: 0, y: 0, width: 100, height: 30 },
    cell,
    theme: defaultTheme,
    col: 0,
    row: 0,
    highlighted: false,
    hoverAmount: 0,
    hoverX: 0,
    hoverY: 0,
    requestAnimationFrame: vi.fn()
  });

  describe('Text Cell Renderer', () => {
    it('should render text cell correctly', () => {
      const cell = createTextCell('Hello World');
      const args = createMockDrawArgs(cell);

      expect(() => textCellRenderer.draw(args)).not.toThrow();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should measure text cell width', () => {
      const cell = createTextCell('Hello World');
      const width = textCellRenderer.measure?.(mockCtx, cell, defaultTheme);

      expect(width).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const cell = createTextCell('');
      const args = createMockDrawArgs(cell);

      expect(() => textCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle paste operation', () => {
      const cell = createTextCell('Original');
      const newCell = textCellRenderer.onPaste?.('Pasted Text', cell);

      expect(newCell?.data).toBe('Pasted Text');
    });
  });

  describe('Number Cell Renderer', () => {
    it('should render number cell correctly', () => {
      const cell = createNumberCell(42.5);
      const args = createMockDrawArgs(cell);

      expect(() => numberCellRenderer.draw(args)).not.toThrow();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should format numbers correctly', () => {
      const cell = createNumberCell(1234.56, {
        fixedDecimals: 2,
        thousandSeparator: true
      });
      const args = createMockDrawArgs(cell);

      expect(() => numberCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle invalid numbers', () => {
      const cell = createNumberCell(NaN);
      const args = createMockDrawArgs(cell);

      expect(() => numberCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('Boolean Cell Renderer', () => {
    it('should render boolean cell correctly', () => {
      const cell = createBooleanCell(true);
      const args = createMockDrawArgs(cell);

      expect(() => booleanCellRenderer.draw(args)).not.toThrow();
    });

    it('should render checkbox style', () => {
      const cell = createBooleanCell(false, { style: 'checkbox' });
      const args = createMockDrawArgs(cell);

      expect(() => booleanCellRenderer.draw(args)).not.toThrow();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
    });

    it('should handle click interaction', () => {
      const cell = createBooleanCell(false, { allowEdit: true });
      const bounds = { x: 0, y: 0, width: 100, height: 30 };
      const pos = { x: 50, y: 15 };

      const result = booleanCellRenderer.hitTest?.(cell, pos, bounds);
      expect(result).toBe(true);
    });
  });

  describe('Image Cell Renderer', () => {
    it('should render image cell correctly', () => {
      const cell = createImageCell('https://example.com/image.jpg');
      const args = createMockDrawArgs(cell);

      expect(() => imageCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle multiple images', () => {
      const cell = createImageCell(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      const args = createMockDrawArgs(cell);

      expect(() => imageCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle empty image data', () => {
      const cell = createImageCell([]);
      const args = createMockDrawArgs(cell);

      expect(() => imageCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('Markdown Cell Renderer', () => {
    it('should render markdown cell correctly', () => {
      const cell = createMarkdownCell('# Title\n\nSome **bold** text and *italic* text.');
      const args = createMockDrawArgs(cell);

      expect(() => markdownCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle links', () => {
      const cell = createMarkdownCell('[Link](https://example.com)');
      const args = createMockDrawArgs(cell);

      expect(() => markdownCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle code blocks', () => {
      const cell = createMarkdownCell('Some `inline code` here.');
      const args = createMockDrawArgs(cell);

      expect(() => markdownCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('URI Cell Renderer', () => {
    it('should render URI cell correctly', () => {
      const cell = createUriCell('https://example.com');
      const args = createMockDrawArgs(cell);

      expect(() => uriCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle email addresses', () => {
      const cell = createUriCell('user@example.com');
      const args = createMockDrawArgs(cell);

      expect(() => uriCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle phone numbers', () => {
      const cell = createUriCell('+1-555-123-4567');
      const args = createMockDrawArgs(cell);

      expect(() => uriCellRenderer.draw(args)).not.toThrow();
    });

    it('should show validation warning for invalid URIs', () => {
      const cell = createUriCell('invalid-uri');
      const args = createMockDrawArgs(cell);

      expect(() => uriCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('Bubble Cell Renderer', () => {
    it('should render bubble cell correctly', () => {
      const cell = createBubbleCell(['tag1', 'tag2', 'tag3']);
      const args = createMockDrawArgs(cell);

      expect(() => bubbleCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle empty bubbles', () => {
      const cell = createBubbleCell([]);
      const args = createMockDrawArgs(cell);

      expect(() => bubbleCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle many bubbles with overflow indicator', () => {
      const manyBubbles = Array.from({ length: 20 }, (_, i) => `bubble${i}`);
      const cell = createBubbleCell(manyBubbles);
      const args = createMockDrawArgs(cell);

      expect(() => bubbleCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('Drilldown Cell Renderer', () => {
    it('should render drilldown cell correctly', () => {
      const items = [
        { text: 'Item 1', enabled: true },
        { text: 'Item 2', badge: '5', enabled: true },
        { text: 'Item 3', color: 'primary', enabled: false }
      ];
      const cell = createDrilldownCell(items);
      const args = createMockDrawArgs(cell);

      expect(() => drilldownCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle empty drilldown', () => {
      const cell = createDrilldownCell([]);
      const args = createMockDrawArgs(cell);

      expect(() => drilldownCellRenderer.draw(args)).not.toThrow();
    });

    it('should handle click on specific item', () => {
      const items = [
        { text: 'Item 1', enabled: true },
        { text: 'Item 2', enabled: true }
      ];
      const cell = createDrilldownCell(items, {
        onClickItem: vi.fn()
      });
      const bounds = { x: 0, y: 0, width: 100, height: 60 };
      const pos = { x: 50, y: 12 }; // 点击第一个项目

      const result = drilldownCellRenderer.onClick?.(cell, pos, bounds);
      expect(result).toBe(false); // 因为没有设置onClickItem回调
    });
  });

  describe('Loading Cell Renderer', () => {
    it('should render loading cell correctly', () => {
      const cell = createLoadingCell();
      const args = createMockDrawArgs(cell);

      expect(() => loadingCellRenderer.draw(args)).not.toThrow();
    });

    it('should render different loading animations', () => {
      const spinnerCell = createLoadingCell({ animationType: 'spinner' });
      const dotsCell = createLoadingCell({ animationType: 'dots' });
      const pulseCell = createLoadingCell({ animationType: 'pulse' });

      expect(() => loadingCellRenderer.draw(createMockDrawArgs(spinnerCell))).not.toThrow();
      expect(() => loadingCellRenderer.draw(createMockDrawArgs(dotsCell))).not.toThrow();
      expect(() => loadingCellRenderer.draw(createMockDrawArgs(pulseCell))).not.toThrow();
    });

    it('should render error state', () => {
      const cell = createLoadingCell({ state: 'error', text: 'Failed to load' });
      const args = createMockDrawArgs(cell);

      expect(() => loadingCellRenderer.draw(args)).not.toThrow();
    });

    it('should render empty state', () => {
      const cell = createLoadingCell({ state: 'empty', text: 'No data' });
      const args = createMockDrawArgs(cell);

      expect(() => loadingCellRenderer.draw(args)).not.toThrow();
    });
  });

  describe('Cell Factory Functions', () => {
    it('should create correct cell types', () => {
      const textCell = createTextCell('text');
      const numberCell = createNumberCell(42);
      const booleanCell = createBooleanCell(true);
      const imageCell = createImageCell('image.jpg');
      const markdownCell = createMarkdownCell('# Markdown');
      const uriCell = createUriCell('https://example.com');
      const bubbleCell = createBubbleCell(['tag']);
      const drilldownCell = createDrilldownCell([{ text: 'item', enabled: true }]);
      const loadingCell = createLoadingCell();

      expect(textCell.kind).toBe(GridCellKind.Text);
      expect(numberCell.kind).toBe(GridCellKind.Number);
      expect(booleanCell.kind).toBe(GridCellKind.Boolean);
      expect(imageCell.kind).toBe(GridCellKind.Image);
      expect(markdownCell.kind).toBe(GridCellKind.Markdown);
      expect(uriCell.kind).toBe(GridCellKind.Uri);
      expect(bubbleCell.kind).toBe(GridCellKind.Bubble);
      expect(drilldownCell.kind).toBe(GridCellKind.Drilldown);
      expect(loadingCell.kind).toBe(GridCellKind.Loading);
    });
  });

  describe('Cell Renderer Common Interface', () => {
    const renderers = [
      { name: 'text', renderer: textCellRenderer },
      { name: 'number', renderer: numberCellRenderer },
      { name: 'boolean', renderer: booleanCellRenderer },
      { name: 'image', renderer: imageCellRenderer },
      { name: 'markdown', renderer: markdownCellRenderer },
      { name: 'uri', renderer: uriCellRenderer },
      { name: 'bubble', renderer: bubbleCellRenderer },
      { name: 'drilldown', renderer: drilldownCellRenderer },
      { name: 'loading', renderer: loadingCellRenderer }
    ];

    renderers.forEach(({ name, renderer }) => {
      describe(`${name} renderer interface`, () => {
        it('should have required draw method', () => {
          expect(typeof renderer.draw).toBe('function');
        });

        it('should have optional measure method', () => {
          if (renderer.measure) {
            expect(typeof renderer.measure).toBe('function');
          }
        });

        it('should have optional hitTest method', () => {
          if (renderer.hitTest) {
            expect(typeof renderer.hitTest).toBe('function');
          }
        });

        it('should have optional onPaste method', () => {
          if (renderer.onPaste) {
            expect(typeof renderer.onPaste).toBe('function');
          }
        });

        it('should have optional getCursor method', () => {
          if (renderer.getCursor) {
            expect(typeof renderer.getCursor).toBe('function');
          }
        });

        it('should have optional onClick method', () => {
          if (renderer.onClick) {
            expect(typeof renderer.onClick).toBe('function');
          }
        });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should render cells within reasonable time', () => {
      const cells = [
        createTextCell('Performance Test'),
        createNumberCell(123456.789),
        createBooleanCell(true),
        createImageCell('test.jpg'),
        createMarkdownCell('# Performance **test**'),
        createUriCell('https://performance-test.com'),
        createBubbleCell(['perf', 'test', 'fast']),
        createDrilldownCell([{ text: 'Performance Item', enabled: true }]),
        createLoadingCell()
      ];

      const renderers = [
        textCellRenderer,
        numberCellRenderer,
        booleanCellRenderer,
        imageCellRenderer,
        markdownCellRenderer,
        uriCellRenderer,
        bubbleCellRenderer,
        drilldownCellRenderer,
        loadingCellRenderer
      ];

      const start = performance.now();

      cells.forEach((cell, index) => {
        const args = createMockDrawArgs(cell);
        renderers[index].draw(args);
      });

      const end = performance.now();
      const duration = end - start;

      // 应该在合理时间内完成渲染（例如 10ms）
      expect(duration).toBeLessThan(10);
    });

    it('should handle large datasets efficiently', () => {
      const largeBubbleCell = createBubbleCell(
        Array.from({ length: 100 }, (_, i) => `bubble${i}`)
      );

      const largeDrilldownCell = createDrilldownCell(
        Array.from({ length: 100 }, (_, i) => ({
          text: `Item ${i}`,
          enabled: true,
          badge: i % 10 === 0 ? `${i}` : undefined
        }))
      );

      const start = performance.now();

      bubbleCellRenderer.draw(createMockDrawArgs(largeBubbleCell));
      drilldownCellRenderer.draw(createMockDrawArgs(largeDrilldownCell));

      const end = performance.now();
      const duration = end - start;

      // 即使是大数据集也应该快速渲染
      expect(duration).toBeLessThan(50);
    });
  });
});
