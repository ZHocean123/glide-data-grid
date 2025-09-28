/**
 * Vue Glide Data Grid - 主入口文件
 * 高性能Canvas数据网格Vue3组件
 */

// 导出主要组件
export { default as DataGrid } from './components/DataGrid.vue';

// 导出所有类型
export type * from './types/base.js';
export type * from './types/grid-cell.js';
export type * from './types/grid-column.js';
export type * from './types/theme.js';
export type * from './types/events.js';
export type * from './types/cell-renderer.js';

// 导出类型常量和枚举
export {
  GridCellKind,
  BooleanEmpty,
  BooleanIndeterminate,
  GridColumnIcon,
  GridColumnMenuIcon,
  CellActivationBehavior,
  FillHandleDirection,
  OutOfBoundsRegionAxis,
  Direction,
  BlendMode,
} from './types/grid-cell.js';

export {
  emptyGridSelection,
  CompactSelection,
} from './types/base.js';

// 导出主题相关
export {
  defaultTheme,
  darkTheme,
  themePresets,
  type ThemePreset,
  createTheme,
  mergeTheme,
  makeCSSStyle,
  validateTheme,
} from './types/theme.js';

// 导出组合式函数
export { useTheme, provideTheme, useThemeSwitch, useThemeAnimation } from './composables/useTheme.js';
export { useCanvasRender, type CanvasRenderConfig } from './composables/useCanvasRender.js';
export { useGridEvents } from './composables/useGridEvents.js';

// 导出单元格渲染器
export {
  // 单元格创建函数
  createTextCell,
  createNumberCell,
  createBooleanCell,
  createImageCell,
  createMarkdownCell,
  createUriCell,
  createBubbleCell,
  createDrilldownCell,
  createLoadingCell,

  // 具体渲染器
  textCellRenderer,
  numberCellRenderer,
  booleanCellRenderer,
  imageCellRenderer,
  markdownCellRenderer,
  uriCellRenderer,
  bubbleCellRenderer,
  drilldownCellRenderer,
  loadingCellRenderer,

  // 渲染器管理
  cellRenderers,
  getCellRenderer,
  registerCellRenderer,
  hasCellRenderer,
  getAvailableCellKinds,
} from './cells/index.js';

// 导出工具函数
export {
  // 数学工具
  pointInRect,
  itemIsInRect,
  intersectRect,
  combineRects,
  rectContains,
  getClosestRect,
  hugRectToTarget,
  splitRectIntoRegions,
  distance,
  clamp,
  lerp,
  degToRad,
  radToDeg,
} from './common/math.js';

export {
  // 支持工具
  assert,
  assertNever,
  maybe,
  deepEqual,
  type FullyDefined,
  safeJsonParse,
  safeJsonStringify,
  safeGet,
  safeArrayGet,
  debounce,
  throttle,
  generateId,
  isNumber,
  isString,
  isBoolean,
  isFunction,
  isObject,
  isArray,
  isNull,
  isUndefined,
  isNullOrUndefined,
} from './common/support.js';

export {
  // 浏览器检测
  browserIsFirefox,
  browserIsSafari,
  browserIsChrome,
  browserIsEdge,
  browserIsWebKit,
  browserIsOSX,
  browserIsWindows,
  browserIsLinux,
  browserIsIOS,
  browserIsAndroid,
  browserIsMobile,
  deviceHasTouch,
  deviceIsHighDPI,
  supportsPassiveEvents,
  supportsResizeObserver,
  supportsIntersectionObserver,
  supportsOffscreenCanvas,
  supportsImageBitmap,
  supportsCSS,
  supportsCSSGrid,
  supportsCSSFlexbox,
  supportsCSSContainerQueries,
  supportsRequestIdleCallback,
  supportsWebGL,
  supportsWebGL2,
  getScrollBarWidth,
  getBrowserInfo,
  type BrowserInfo,
} from './common/browser-detect.js';

export {
  // 通用工具
  useEventListener,
  whenDefined,
  degreesToRadians,
  getSquareBB,
  getSquareXPosFromAlign,
  getSquareWidth,
  pointIsWithinBB,
  type SpriteProps,
  useDebouncedMemo,
  direction,
  useReactiveState,
  makeAccessibilityStringForArray,
  useDeepMemo,
  rafThrottle,
  safeParseJSON,
  safeStringifyJSON,
  arrayMove,
  arrayInsert,
  arrayRemove,
  getTextWidth,
  pxToRem,
  remToPx,
  hexToRgb,
  rgbToHex,
  isMac,
  isWindows,
  isModifierKey,
  getModifierKey,
} from './common/utils.js';

// 导出事件相关
export {
  cellKind,
  headerKind,
  groupHeaderKind,
  outOfBoundsKind,
  mouseEventArgsAreEqual,
  isCellClickedEvent,
  isHeaderClickedEvent,
  isGroupHeaderClickedEvent,
  isOutOfBoundsEvent,
  type EventListener,
  type EventSubscriber,
} from './types/events.js';

// 导出单元格工具函数
export {
  // 文本单元格
  isTextEmpty,
  getTextLength,
  truncateText,
  wrapText,
} from './cells/text-cell.js';

export {
  // 数字单元格
  isNumberEmpty,
  isNumberPositive,
  isNumberNegative,
  isNumberZero,
  roundNumber,
  clampNumber,
  validateNumber,
  numberFormats,
} from './cells/number-cell.js';

export {
  // 布尔单元格
  toggleBooleanCell,
  isBooleanTrue,
  isBooleanFalse,
  isBooleanEmpty,
  isBooleanIndeterminate,
  getBooleanDisplayText,
  parseBooleanValue,
} from './cells/boolean-cell.js';

// 版本信息
export const VERSION = '1.0.0-alpha.1';

// 默认导出主组件
import DataGrid from './components/DataGrid.vue';
export default DataGrid;

// 全局安装函数 (Vue插件支持)
export function install(app: any) {
  app.component('DataGrid', DataGrid);
  app.component('VueGlideDataGrid', DataGrid);
}

// 类型声明增强
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    DataGrid: typeof DataGrid;
    VueGlideDataGrid: typeof DataGrid;
  }
}

// 开发者工具支持
if (process.env.NODE_ENV === 'development') {
  console.log(`Vue Glide Data Grid v${VERSION} - Development Mode`);

  // 导出调试工具
  (globalThis as any).__VUE_GLIDE_DATA_GRID__ = {
    version: VERSION,
    cellRendererRegistry,
    performanceMonitor,
    rendererDebugger,
    themePresets,
  };
}

// 注释：主要特性说明
/**
 * Vue Glide Data Grid 主要特性:
 *
 * 🚀 高性能Canvas渲染
 * - 支持百万行数据
 * - 虚拟化滚动
 * - 60fps流畅体验
 *
 * 🎨 完全可定制
 * - 自定义单元格渲染器
 * - 丰富的主题系统
 * - 灵活的列配置
 *
 * 🔧 Vue3原生支持
 * - 组合式API
 * - TypeScript完整支持
 * - 响应式数据绑定
 *
 * 📱 跨平台兼容
 * - 桌面和移动端
 * - 触摸手势支持
 * - 无障碍访问
 *
 * 🛠️ 开发者友好
 * - 完整的类型定义
 * - 丰富的调试工具
 * - 详细的文档
 */
