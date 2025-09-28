/**
 * Canvas渲染管理组合式函数
 * 负责Canvas的创建、管理和渲染逻辑
 */

import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type Ref
} from 'vue';
import type { GridColumn } from '../types/grid-column.js';
import type { GridCell } from '../types/grid-cell.js';
import type { Item, Rectangle, GridSelection } from '../types/base.js';
import type { FullTheme } from '../types/theme.js';
import type { GetCellRendererCallback } from '../types/cell-renderer.js';
import { getDefaultCellRenderer } from '../cells/index.js';
import { useEventListener } from '../common/utils.js';

// Canvas渲染配置
export interface CanvasRenderConfig {
  width: number;
  height: number;
  columns: GridColumn[];
  rows: number;
  getCellContent: (cell: Item) => GridCell;
  getCellRenderer?: GetCellRendererCallback;
  selection?: GridSelection;
  scrollX?: number;
  scrollY?: number;
  freezeColumns?: number;
  freezeRows?: number;
  rowHeight?: number;
  headerHeight?: number;
  smoothScrollX?: boolean;
  smoothScrollY?: boolean;
}

// 渲染状态
interface RenderState {
  visibleRegion: Rectangle;
  scale: number;
  needsRedraw: boolean;
  lastRenderTime: number;
  frameId: number | null;
}

// 使用Canvas渲染的组合式函数
export function useCanvasRender(
  canvasRef: Ref<HTMLCanvasElement | null>,
  config: Ref<CanvasRenderConfig>,
  theme: Ref<FullTheme>
) {
  // 渲染状态
  const renderState = ref<RenderState>({
    visibleRegion: { x: 0, y: 0, width: 0, height: 0 },
    scale: 1,
    needsRedraw: true,
    lastRenderTime: 0,
    frameId: null,
  });

  // Canvas上下文
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  // 设备像素比
  const devicePixelRatio = ref(window.devicePixelRatio || 1);

  // Canvas尺寸 (考虑设备像素比)
  const canvasSize = computed(() => ({
    width: config.value.width * devicePixelRatio.value,
    height: config.value.height * devicePixelRatio.value,
  }));

  // 显示尺寸
  const displaySize = computed(() => ({
    width: config.value.width,
    height: config.value.height,
  }));

  // 获取单元格渲染器
  const getCellRenderer = computed(() =>
    config.value.getCellRenderer || getDefaultCellRenderer
  );

  // 初始化Canvas
  const initCanvas = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    ctx.value = context;

    // 设置Canvas尺寸
    canvas.width = canvasSize.value.width;
    canvas.height = canvasSize.value.height;
    canvas.style.width = `${displaySize.value.width}px`;
    canvas.style.height = `${displaySize.value.height}px`;

    // 缩放上下文以适应设备像素比
    context.scale(devicePixelRatio.value, devicePixelRatio.value);

    // 设置渲染质量
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.textBaseline = 'middle';

    requestRedraw();
  };

  // 请求重绘
  const requestRedraw = () => {
    if (renderState.value.frameId !== null) return;

    renderState.value.needsRedraw = true;
    renderState.value.frameId = requestAnimationFrame(performRender);
  };

  // 立即重绘
  const forceRedraw = () => {
    if (renderState.value.frameId !== null) {
      cancelAnimationFrame(renderState.value.frameId);
      renderState.value.frameId = null;
    }
    performRender();
  };

  // 执行渲染
  const performRender = () => {
    renderState.value.frameId = null;

    if (!ctx.value || !renderState.value.needsRedraw) return;

    const startTime = performance.now();

    try {
      renderGrid();
      renderState.value.needsRedraw = false;
      renderState.value.lastRenderTime = performance.now() - startTime;
    } catch (error) {
      console.error('Canvas render error:', error);
    }
  };

  // 渲染网格
  const renderGrid = () => {
    if (!ctx.value) return;

    const context = ctx.value;
    const { width, height, columns, rows, getCellContent } = config.value;
    const currentTheme = theme.value;

    // 清空画布
    context.clearRect(0, 0, width, height);

    // 设置背景
    context.fillStyle = currentTheme.bgCell;
    context.fillRect(0, 0, width, height);

    // 计算可见区域
    const visibleRegion = calculateVisibleRegion();
    renderState.value.visibleRegion = visibleRegion;

    // 渲染单元格
    renderCells(context, visibleRegion, columns, getCellContent, currentTheme);

    // 渲染选择
    if (config.value.selection) {
      renderSelection(context, config.value.selection, currentTheme);
    }

    // 渲染网格线
    renderGridLines(context, visibleRegion, columns, currentTheme);

    // 渲染标题
    renderHeaders(context, columns, currentTheme);
  };

  // 计算可见区域
  const calculateVisibleRegion = (): Rectangle => {
    const { scrollX = 0, scrollY = 0, rowHeight = 32 } = config.value;
    const { width, height } = displaySize.value;

    // 简化的可见区域计算
    const startCol = Math.floor(scrollX / 150); // 假设列宽150
    const endCol = Math.min(config.value.columns.length, startCol + Math.ceil(width / 150) + 1);
    const startRow = Math.floor(scrollY / rowHeight);
    const endRow = Math.min(config.value.rows, startRow + Math.ceil(height / rowHeight) + 1);

    return {
      x: startCol,
      y: startRow,
      width: endCol - startCol,
      height: endRow - startRow,
    };
  };

  // 渲染单元格
  const renderCells = (
    context: CanvasRenderingContext2D,
    visibleRegion: Rectangle,
    columns: GridColumn[],
    getCellContent: (cell: Item) => GridCell,
    currentTheme: FullTheme
  ) => {
    const { rowHeight = 32 } = config.value;
    const cellRenderer = getCellRenderer.value;

    for (let row = visibleRegion.y; row < visibleRegion.y + visibleRegion.height; row++) {
      for (let col = visibleRegion.x; col < visibleRegion.x + visibleRegion.width; col++) {
        if (col >= columns.length) continue;

        const column = columns[col];
        const cell = getCellContent([col, row]);
        const renderer = cellRenderer(cell);

        if (!renderer) continue;

        // 计算单元格矩形
        const cellRect: Rectangle = {
          x: col * 150, // 简化的列宽计算
          y: row * rowHeight,
          width: 150,
          height: rowHeight,
        };

        // 渲染单元格
        renderer.draw({
          ctx: context,
          rect: cellRect,
          cell,
          theme: currentTheme,
          col,
          row,
          hoverAmount: 0,
          hoverX: undefined,
          hoverY: undefined,
          highlighted: false,
          imageLoader: {} as any, // 简化的图片加载器
        });
      }
    }
  };

  // 渲染选择区域
  const renderSelection = (
    context: CanvasRenderingContext2D,
    selection: GridSelection,
    currentTheme: FullTheme
  ) => {
    if (!selection.current) return;

    const { range } = selection.current;
    const { rowHeight = 32 } = config.value;

    // 绘制选择框
    context.save();
    context.strokeStyle = currentTheme.accentColor;
    context.lineWidth = 2;
    context.setLineDash([]);

    const rect = {
      x: range.x * 150,
      y: range.y * rowHeight,
      width: range.width * 150,
      height: range.height * rowHeight,
    };

    context.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制选择背景
    context.fillStyle = currentTheme.accentLight;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);

    context.restore();
  };

  // 渲染网格线
  const renderGridLines = (
    context: CanvasRenderingContext2D,
    visibleRegion: Rectangle,
    columns: GridColumn[],
    currentTheme: FullTheme
  ) => {
    const { rowHeight = 32 } = config.value;

    context.save();
    context.strokeStyle = currentTheme.borderColor;
    context.lineWidth = 1;

    // 垂直线
    for (let col = visibleRegion.x; col <= visibleRegion.x + visibleRegion.width; col++) {
      const x = col * 150;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, displaySize.value.height);
      context.stroke();
    }

    // 水平线
    for (let row = visibleRegion.y; row <= visibleRegion.y + visibleRegion.height; row++) {
      const y = row * rowHeight;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(displaySize.value.width, y);
      context.stroke();
    }

    context.restore();
  };

  // 渲染标题
  const renderHeaders = (
    context: CanvasRenderingContext2D,
    columns: GridColumn[],
    currentTheme: FullTheme
  ) => {
    const { headerHeight = 36 } = config.value;

    context.save();
    context.fillStyle = currentTheme.bgHeader;
    context.fillRect(0, 0, displaySize.value.width, headerHeight);

    context.font = currentTheme.headerFontStyle;
    context.fillStyle = currentTheme.textHeader;
    context.textAlign = 'center';

    columns.forEach((column, index) => {
      const x = index * 150 + 75; // 列中心
      const y = headerHeight / 2;
      context.fillText(column.title, x, y);
    });

    context.restore();
  };

  // 获取Canvas坐标系中的点
  const getCanvasPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // 获取网格坐标中的单元格
  const getCellAtPoint = (canvasX: number, canvasY: number): Item | null => {
    const { rowHeight = 32 } = config.value;
    const col = Math.floor(canvasX / 150);
    const row = Math.floor(canvasY / rowHeight);

    if (col < 0 || col >= config.value.columns.length || row < 0 || row >= config.value.rows) {
      return null;
    }

    return [col, row];
  };

  // 监听配置变化
  watch(config, () => {
    requestRedraw();
  }, { deep: true });

  // 监听主题变化
  watch(theme, () => {
    requestRedraw();
  }, { deep: true });

  // 监听Canvas尺寸变化
  watch([canvasSize, displaySize], () => {
    nextTick(() => {
      initCanvas();
    });
  }, { deep: true });

  // 监听设备像素比变化
  useEventListener('resize', () => {
    const newDPR = window.devicePixelRatio || 1;
    if (newDPR !== devicePixelRatio.value) {
      devicePixelRatio.value = newDPR;
      nextTick(() => {
        initCanvas();
      });
    }
  }, window);

  // 组件挂载时初始化
  onMounted(() => {
    nextTick(() => {
      initCanvas();
    });
  });

  // 组件卸载时清理
  onBeforeUnmount(() => {
    if (renderState.value.frameId !== null) {
      cancelAnimationFrame(renderState.value.frameId);
    }
  });

  return {
    // 状态
    canvasSize: computed(() => canvasSize.value),
    displaySize: computed(() => displaySize.value),
    renderState: computed(() => renderState.value),

    // 方法
    requestRedraw,
    forceRedraw,
    getCanvasPoint,
    getCellAtPoint,

    // Canvas上下文 (只读)
    ctx: computed(() => ctx.value),
  };
}
