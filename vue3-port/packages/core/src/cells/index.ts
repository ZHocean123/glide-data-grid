/**
 * 单元格渲染器统一导出
 * Vue3 版本的所有单元格渲染器和相关工具
 */

// 基础单元格渲染器
export * from './text-cell.js';
export * from './number-cell.js';
export * from './boolean-cell.js';

// 高级单元格渲染器
export * from './image-cell.js';
export * from './markdown-cell.js';
export * from './uri-cell.js';
export * from './bubble-cell.js';
export * from './drilldown-cell.js';
export * from './loading-cell.js';

// 类型和接口
import type { CustomRenderer } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 导入所有内部渲染器
import { internalTextCellRenderer } from './text-cell.js';
import { internalNumberCellRenderer } from './number-cell.js';
import { internalBooleanCellRenderer } from './boolean-cell.js';
import { internalImageCellRenderer } from './image-cell.js';
import { internalMarkdownCellRenderer } from './markdown-cell.js';
import { internalUriCellRenderer } from './uri-cell.js';
import { internalBubbleCellRenderer } from './bubble-cell.js';
import { internalDrilldownCellRenderer } from './drilldown-cell.js';
import { internalLoadingCellRenderer } from './loading-cell.js';

// 渲染器映射表
export const cellRenderers: Record<GridCellKind, CustomRenderer<any>> = {
  [GridCellKind.Text]: internalTextCellRenderer,
  [GridCellKind.Number]: internalNumberCellRenderer,
  [GridCellKind.Boolean]: internalBooleanCellRenderer,
  [GridCellKind.Image]: internalImageCellRenderer,
  [GridCellKind.Markdown]: internalMarkdownCellRenderer,
  [GridCellKind.Uri]: internalUriCellRenderer,
  [GridCellKind.Bubble]: internalBubbleCellRenderer,
  [GridCellKind.Drilldown]: internalDrilldownCellRenderer,
  [GridCellKind.Loading]: internalLoadingCellRenderer,
};

// 获取单元格渲染器
export function getCellRenderer(kind: GridCellKind): CustomRenderer<any> | undefined {
  return cellRenderers[kind];
}

// 注册自定义渲染器
export function registerCellRenderer(kind: GridCellKind, renderer: CustomRenderer<any>): void {
  cellRenderers[kind] = renderer;
}

// 检查渲染器是否存在
export function hasCellRenderer(kind: GridCellKind): boolean {
  return kind in cellRenderers;
}

// 获取所有可用的单元格类型
export function getAvailableCellKinds(): GridCellKind[] {
  return Object.keys(cellRenderers) as GridCellKind[];
}

// 渲染器功能检查
export function rendererSupportsEdit(kind: GridCellKind): boolean {
  const renderer = getCellRenderer(kind);
  return renderer?.provideEditor !== undefined;
}

export function rendererSupportsClick(kind: GridCellKind): boolean {
  const renderer = getCellRenderer(kind);
  return renderer?.onClick !== undefined;
}

export function rendererSupportsPaste(kind: GridCellKind): boolean {
  const renderer = getCellRenderer(kind);
  return renderer?.onPaste !== undefined;
}

// 渲染器工厂函数映射
export const cellFactories = {
  // 基础类型
  text: () => import('./text-cell.js').then(m => m.createTextCell),
  number: () => import('./number-cell.js').then(m => m.createNumberCell),
  boolean: () => import('./boolean-cell.js').then(m => m.createBooleanCell),

  // 高级类型
  image: () => import('./image-cell.js').then(m => m.createImageCell),
  markdown: () => import('./markdown-cell.js').then(m => m.createMarkdownCell),
  uri: () => import('./uri-cell.js').then(m => m.createUriCell),
  bubble: () => import('./bubble-cell.js').then(m => m.createBubbleCell),
  drilldown: () => import('./drilldown-cell.js').then(m => m.createDrilldownCell),
  loading: () => import('./loading-cell.js').then(m => m.createLoadingCell),

  // 特殊加载类型
  spinner: () => import('./loading-cell.js').then(m => m.createSpinnerCell),
  dots: () => import('./loading-cell.js').then(m => m.createDotsCell),
  pulse: () => import('./loading-cell.js').then(m => m.createPulseCell),
  wave: () => import('./loading-cell.js').then(m => m.createWaveCell),
  skeleton: () => import('./loading-cell.js').then(m => m.createSkeletonCell),
  error: () => import('./loading-cell.js').then(m => m.createErrorCell),
  empty: () => import('./loading-cell.js').then(m => m.createEmptyCell),
};

// 动态创建单元格的工厂函数
export async function createCell(type: keyof typeof cellFactories, ...args: any[]) {
  const factory = await cellFactories[type]();
  return factory(...args);
}

// 单元格工具函数
export const cellUtils = {
  // 文本相关
  isTextEmpty: () => import('./text-cell.js').then(m => m.isTextEmpty),
  formatText: () => import('./text-cell.js').then(m => m.formatText),
  truncateText: () => import('./text-cell.js').then(m => m.truncateText),

  // 数字相关
  isNumberEmpty: () => import('./number-cell.js').then(m => m.isNumberEmpty),
  formatNumber: () => import('./number-cell.js').then(m => m.formatNumber),

  // 布尔相关
  isBooleanEmpty: () => import('./boolean-cell.js').then(m => m.isBooleanEmpty),

  // 图片相关
  isImageEmpty: () => import('./image-cell.js').then(m => m.isImageEmpty),
  validateImageUrl: () => import('./image-cell.js').then(m => m.validateImageUrl),
  optimizeImageUrl: () => import('./image-cell.js').then(m => m.optimizeImageUrl),

  // Markdown相关
  isMarkdownEmpty: () => import('./markdown-cell.js').then(m => m.isMarkdownEmpty),
  getMarkdownPlainText: () => import('./markdown-cell.js').then(m => m.getMarkdownPlainText),
  formatMarkdown: () => import('./markdown-cell.js').then(m => m.formatMarkdown),

  // URI相关
  isUriEmpty: () => import('./uri-cell.js').then(m => m.isUriEmpty),
  isUriValid: () => import('./uri-cell.js').then(m => m.isUriValid),
  validateEmail: () => import('./uri-cell.js').then(m => m.validateEmail),
  validateUrl: () => import('./uri-cell.js').then(m => m.validateUrl),

  // 气泡相关
  isBubbleEmpty: () => import('./bubble-cell.js').then(m => m.isBubbleEmpty),
  addBubbleToCell: () => import('./bubble-cell.js').then(m => m.addBubbleToCell),
  sortBubbles: () => import('./bubble-cell.js').then(m => m.sortBubbles),

  // 下钻相关
  isDrilldownEmpty: () => import('./drilldown-cell.js').then(m => m.isDrilldownEmpty),
  addDrilldownItem: () => import('./drilldown-cell.js').then(m => m.addDrilldownItem),
  sortDrilldownItems: () => import('./drilldown-cell.js').then(m => m.sortDrilldownItems),

  // 加载相关
  isLoading: () => import('./loading-cell.js').then(m => m.isLoading),
  setLoadingState: () => import('./loading-cell.js').then(m => m.setLoadingState),
  startLoading: () => import('./loading-cell.js').then(m => m.startLoading),
  finishLoading: () => import('./loading-cell.js').then(m => m.finishLoading),
};

// 批量操作工具
export const batchOperations = {
  // 批量创建单元格
  async createCells(configs: Array<{ type: keyof typeof cellFactories; args: any[] }>) {
    return Promise.all(
      configs.map(config => createCell(config.type, ...config.args))
    );
  },

  // 批量转换单元格类型
  async convertCells(cells: any[], targetType: keyof typeof cellFactories) {
    const factory = await cellFactories[targetType]();
    return cells.map(cell => {
      // 简化的类型转换逻辑
      switch (targetType) {
        case 'text':
          return factory(String(cell.data || ''));
        case 'number':
          return factory(Number(cell.data) || 0);
        case 'boolean':
          return factory(Boolean(cell.data));
        default:
          return factory(cell.data);
      }
    });
  },

  // 批量验证单元格
  async validateCells(cells: any[]) {
    const results = [];

    for (const cell of cells) {
      let isValid = true;
      let error = '';

      try {
        switch (cell.kind) {
          case GridCellKind.Uri:
            const isUriValid = await cellUtils.isUriValid();
            isValid = isUriValid(cell);
            if (!isValid) error = 'Invalid URI format';
            break;
          case GridCellKind.Image:
            const validateImageUrl = await cellUtils.validateImageUrl();
            isValid = validateImageUrl(cell.data);
            if (!isValid) error = 'Invalid image URL';
            break;
          // 添加其他验证逻辑
        }
      } catch (e) {
        isValid = false;
        error = 'Validation failed';
      }

      results.push({ cell, isValid, error });
    }

    return results;
  },
};

// 性能优化工具
export const performanceUtils = {
  // 预加载渲染器
  async preloadRenderers(kinds: GridCellKind[]) {
    const promises = kinds.map(kind => {
      switch (kind) {
        case GridCellKind.Image:
          return import('./image-cell.js');
        case GridCellKind.Markdown:
          return import('./markdown-cell.js');
        case GridCellKind.Uri:
          return import('./uri-cell.js');
        case GridCellKind.Bubble:
          return import('./bubble-cell.js');
        case GridCellKind.Drilldown:
          return import('./drilldown-cell.js');
        case GridCellKind.Loading:
          return import('./loading-cell.js');
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(promises);
  },

  // 缓存渲染器实例
  rendererCache: new Map<GridCellKind, CustomRenderer<any>>(),

  getCachedRenderer(kind: GridCellKind): CustomRenderer<any> | undefined {
    if (!this.rendererCache.has(kind)) {
      const renderer = getCellRenderer(kind);
      if (renderer) {
        this.rendererCache.set(kind, renderer);
      }
    }
    return this.rendererCache.get(kind);
  },

  clearRendererCache() {
    this.rendererCache.clear();
  },
};

// 默认导出
export default {
  cellRenderers,
  cellFactories,
  cellUtils,
  batchOperations,
  performanceUtils,
  getCellRenderer,
  registerCellRenderer,
  hasCellRenderer,
  getAvailableCellKinds,
  createCell,
};
