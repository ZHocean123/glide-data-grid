/**
 * 单元格渲染器注册表和导出
 * 集中管理所有单元格渲染器
 */

import type { GridCell } from '../types/grid-cell.js';
import type { CellRenderer, InternalCellRenderer, GetCellRendererCallback } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 导入所有渲染器
import { internalTextCellRenderer } from './text-cell.js';
import { internalNumberCellRenderer } from './number-cell.js';
import { internalBooleanCellRenderer } from './boolean-cell.js';

// 渲染器注册表类
class CellRendererRegistry {
  private renderers = new Map<string, InternalCellRenderer>();

  constructor() {
    // 注册内置渲染器
    this.registerRenderer(GridCellKind.Text, internalTextCellRenderer);
    this.registerRenderer(GridCellKind.Number, internalNumberCellRenderer);
    this.registerRenderer(GridCellKind.Boolean, internalBooleanCellRenderer);
  }

  registerRenderer(kind: string, renderer: InternalCellRenderer): void {
    this.renderers.set(kind, renderer);
  }

  getRenderer(kind: string): InternalCellRenderer | undefined {
    return this.renderers.get(kind);
  }

  getAllRenderers(): Map<string, InternalCellRenderer> {
    return new Map(this.renderers);
  }

  unregisterRenderer(kind: string): boolean {
    return this.renderers.delete(kind);
  }

  hasRenderer(kind: string): boolean {
    return this.renderers.has(kind);
  }

  getRegisteredKinds(): string[] {
    return Array.from(this.renderers.keys());
  }
}

// 全局渲染器注册表实例
export const cellRendererRegistry = new CellRendererRegistry();

// 获取单元格渲染器的默认回调
export const getDefaultCellRenderer: GetCellRendererCallback = (cell: GridCell) => {
  return cellRendererRegistry.getRenderer(cell.kind);
};

// 导出所有渲染器
export const AllCellRenderers = {
  [GridCellKind.Text]: internalTextCellRenderer,
  [GridCellKind.Number]: internalNumberCellRenderer,
  [GridCellKind.Boolean]: internalBooleanCellRenderer,
} as const;

// 类型安全的渲染器获取函数
export function getCellRenderer<T extends GridCell>(cell: T): CellRenderer<T> | undefined {
  const renderer = cellRendererRegistry.getRenderer(cell.kind);
  return renderer as CellRenderer<T> | undefined;
}

// 注册自定义渲染器的便捷函数
export function registerCustomCellRenderer(
  kind: string,
  renderer: CellRenderer
): void {
  const internalRenderer: InternalCellRenderer = {
    ...renderer,
    kind,
  };
  cellRendererRegistry.registerRenderer(kind, internalRenderer);
}

// 批量注册渲染器
export function registerCellRenderers(
  renderers: Record<string, CellRenderer>
): void {
  Object.entries(renderers).forEach(([kind, renderer]) => {
    registerCustomCellRenderer(kind, renderer);
  });
}

// 验证渲染器是否完整
export function validateRenderer(renderer: CellRenderer): string[] {
  const errors: string[] = [];

  if (!renderer.draw || typeof renderer.draw !== 'function') {
    errors.push('Missing or invalid draw function');
  }

  if (renderer.measure && typeof renderer.measure !== 'function') {
    errors.push('Invalid measure function');
  }

  if (renderer.hitTest && typeof renderer.hitTest !== 'function') {
    errors.push('Invalid hitTest function');
  }

  if (renderer.provideEditor && typeof renderer.provideEditor !== 'function') {
    errors.push('Invalid provideEditor function');
  }

  if (renderer.getCursor && typeof renderer.getCursor !== 'function') {
    errors.push('Invalid getCursor function');
  }

  if (renderer.onPaste && typeof renderer.onPaste !== 'function') {
    errors.push('Invalid onPaste function');
  }

  return errors;
}

// 渲染器性能监控
export function createPerformanceMonitor() {
  const metrics = new Map<string, { totalTime: number; callCount: number }>();

  return {
    wrapRenderer<T extends GridCell>(kind: string, renderer: CellRenderer<T>): CellRenderer<T> {
      return {
        ...renderer,
        draw: (args) => {
          const start = performance.now();
          renderer.draw(args);
          const end = performance.now();

          const current = metrics.get(kind) || { totalTime: 0, callCount: 0 };
          metrics.set(kind, {
            totalTime: current.totalTime + (end - start),
            callCount: current.callCount + 1,
          });
        },
      };
    },

    getMetrics: () => new Map(metrics),

    getAverageTime: (kind: string) => {
      const metric = metrics.get(kind);
      return metric ? metric.totalTime / metric.callCount : 0;
    },

    reset: () => metrics.clear(),
  };
}

// 默认性能监控器
export const performanceMonitor = createPerformanceMonitor();

// 开发模式下的渲染器调试
export function createRendererDebugger() {
  return {
    logRenderCall: (kind: string, args: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cell Renderer] ${kind}:`, args);
      }
    },

    validateDrawCall: (kind: string, args: any) => {
      if (process.env.NODE_ENV === 'development') {
        const { ctx, rect, cell, theme } = args;

        if (!ctx) console.warn(`[Cell Renderer] ${kind}: Missing canvas context`);
        if (!rect) console.warn(`[Cell Renderer] ${kind}: Missing rect`);
        if (!cell) console.warn(`[Cell Renderer] ${kind}: Missing cell data`);
        if (!theme) console.warn(`[Cell Renderer] ${kind}: Missing theme`);

        // 验证rect的有效性
        if (rect && (rect.width <= 0 || rect.height <= 0)) {
          console.warn(`[Cell Renderer] ${kind}: Invalid rect dimensions`, rect);
        }
      }
    },
  };
}

// 默认调试器
export const rendererDebugger = createRendererDebugger();

// 导出所有单元格创建函数
export { createTextCell } from './text-cell.js';
export { createNumberCell } from './number-cell.js';
export { createBooleanCell } from './boolean-cell.js';

// 导出所有渲染器
export {
  textCellRenderer,
  internalTextCellRenderer,
} from './text-cell.js';

export {
  numberCellRenderer,
  internalNumberCellRenderer,
} from './number-cell.js';

export {
  booleanCellRenderer,
  internalBooleanCellRenderer,
} from './boolean-cell.js';
