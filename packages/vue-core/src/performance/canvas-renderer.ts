import { ref, type Ref } from 'vue';
import type { GridCell, Item, Rectangle } from '../internal/data-grid/data-grid-types.js';

/**
 * 高性能Canvas渲染器
 * 实现脏区域检测、增量更新和绘制优化
 */
export interface CanvasRendererOptions {
  /** Canvas元素引用 */
  canvasRef: Ref<HTMLCanvasElement | null>;
  /** 网格宽度 */
  width: Ref<number>;
  /** 网格高度 */
  height: Ref<number>;
  /** 列数 */
  columns: Ref<number>;
  /** 行数 */
  rows: Ref<number>;
  /** 行高 */
  rowHeight: Ref<number>;
  /** 获取单元格内容 */
  getCellContent: (item: Item) => GridCell;
  /** 当前选择区域 */
  selection: Ref<{ current?: { cell: Item; range: Rectangle } | undefined }>;
  /** 主题 */
  theme: Ref<any>;
}

export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderCache {
  /** 单元格内容缓存 */
  cellContent: Map<string, GridCell>;
  /** 单元格渲染缓存 */
  cellRender: Map<string, ImageBitmap>;
  /** 网格线缓存 */
  gridLines: ImageBitmap | null;
  /** 缓存版本 */
  version: number;
}

/**
 * 高性能Canvas渲染器
 */
export function useCanvasRenderer(options: CanvasRendererOptions) {
  const {
    canvasRef,
    width,
    height,
    columns,
    rows,
    rowHeight,
    getCellContent,
    selection,
    theme
  } = options;

  // 渲染状态
  const isRendering = ref(false);
  const renderFrameId = ref<number | null>(null);
  
  // 脏区域管理
  const dirtyRegions = ref<DirtyRegion[]>([]);
  const fullRedrawNeeded = ref(false);
  
  // 渲染缓存
  const renderCache = ref<RenderCache>({
    cellContent: new Map(),
    cellRender: new Map(),
    gridLines: null,
    version: 0
  });
  
  // 性能统计
  const renderStats = ref({
    frameCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    cellRenderCount: 0,
    cacheHitCount: 0,
    cacheMissCount: 0
  });

  // 获取2D渲染上下文
  const getContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.value;
    if (!canvas) return null;
    return canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
  };

  // 标记脏区域
  const markDirty = (region: DirtyRegion) => {
    dirtyRegions.value.push(region);
    scheduleRender();
  };

  // 标记整个画布为脏
  const markAllDirty = () => {
    fullRedrawNeeded.value = true;
    scheduleRender();
  };

  // 合并脏区域
  const mergeDirtyRegions = (): DirtyRegion[] => {
    if (fullRedrawNeeded.value) {
      return [{
        x: 0,
        y: 0,
        width: width.value,
        height: height.value
      }];
    }

    if (dirtyRegions.value.length === 0) {
      return [];
    }

    // 简化实现：合并所有脏区域为一个大的区域
    // 实际应该实现更智能的区域合并算法
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    
    for (const region of dirtyRegions.value) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    }

    return [{
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }];
  };

  // 清除脏区域
  const clearDirtyRegions = () => {
    dirtyRegions.value = [];
    fullRedrawNeeded.value = false;
  };

  // 绘制网格线
  const drawGridLines = (ctx: CanvasRenderingContext2D, region: DirtyRegion) => {
    const startX = Math.floor(region.x / 100) * 100;
    const startY = Math.floor(region.y / rowHeight.value) * rowHeight.value;
    const endX = region.x + region.width;
    const endY = region.y + region.height;

    ctx.strokeStyle = theme.value?.borderColor || '#e0e0e0';
    ctx.lineWidth = 1;

    // 绘制垂直线
    for (let x = startX; x <= endX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y <= endY; y += rowHeight.value) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  // 绘制单元格背景
  const drawCellBackground = (
    ctx: CanvasRenderingContext2D,
    _cell: Item,
    bounds: Rectangle,
    isSelected: boolean
  ) => {
    if (isSelected) {
      ctx.fillStyle = theme.value?.selectedBackgroundColor || 'rgba(0, 120, 255, 0.1)';
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  };

  // 绘制单元格内容
  const drawCellContent = (
    ctx: CanvasRenderingContext2D,
    cell: Item,
    bounds: Rectangle,
    _cellData: GridCell
  ) => {
    const cacheKey = `${cell[0]}-${cell[1]}-${renderCache.value.version}`;
    
    // 检查缓存
    if (renderCache.value.cellContent.has(cacheKey)) {
      renderStats.value.cacheHitCount++;
      return;
    }
    
    renderStats.value.cacheMissCount++;
    renderStats.value.cellRenderCount++;

    // 缓存单元格内容
    renderCache.value.cellContent.set(cacheKey, _cellData);

    ctx.fillStyle = theme.value?.textColor || '#333';
    ctx.font = `${theme.value?.fontSize || 14}px ${theme.value?.fontFamily || 'Arial'}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let text = '';
    switch (_cellData.kind) {
      case 'text':
      case 'markdown':
      case 'uri':
        text = (_cellData as any).data;
        break;
      case 'number':
        text = (_cellData as any).data.toString();
        break;
      case 'boolean':
        text = (_cellData as any).data ? 'true' : 'false';
        break;
    }

    // 文本截断处理
    const maxWidth = bounds.width - 16; // 左右各留8px边距
    const truncatedText = truncateText(ctx, text, maxWidth);
    
    ctx.fillText(
      truncatedText,
      bounds.x + 8,
      bounds.y + bounds.height / 2
    );
  };

  // 文本截断
  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
  };

  // 绘制选择区域
  const drawSelection = (ctx: CanvasRenderingContext2D) => {
    if (!selection.value?.current) return;

    const { range } = selection.value?.current || {};
    
    ctx.strokeStyle = theme.value?.accentColor || '#007acc';
    ctx.lineWidth = 2;
    ctx.strokeRect(range.x, range.y, range.width, range.height);
    
    // 绘制选择手柄
    const handleSize = 8;
    const handleColor = theme.value?.accentColor || '#007acc';
    
    // 右下角手柄
    ctx.fillStyle = handleColor;
    ctx.fillRect(
      range.x + range.width - handleSize / 2,
      range.y + range.height - handleSize / 2,
      handleSize,
      handleSize
    );
  };

  // 主渲染函数
  const render = () => {
    const startTime = performance.now();
    
    const ctx = getContext();
    if (!ctx) return;

    isRendering.value = true;
    renderStats.value.frameCount++;

    try {
      // 获取需要重绘的区域
      const regions = mergeDirtyRegions();
      
      if (regions.length === 0) {
        return;
      }

      // 设置渲染状态
      ctx.save();
      
      // 清除脏区域
      for (const region of regions) {
        ctx.clearRect(region.x, region.y, region.width, region.height);
        
        // 绘制背景
        ctx.fillStyle = theme.value?.backgroundColor || '#ffffff';
        ctx.fillRect(region.x, region.y, region.width, region.height);
        
        // 绘制网格线
        drawGridLines(ctx, region);
        
        // 计算需要重绘的单元格
        const startCol = Math.floor(region.x / 100);
        const endCol = Math.ceil((region.x + region.width) / 100);
        const startRow = Math.floor(region.y / rowHeight.value);
        const endRow = Math.ceil((region.y + region.height) / rowHeight.value);
        
        // 绘制单元格
        for (let row = startRow; row < Math.min(endRow, rows.value); row++) {
          for (let col = startCol; col < Math.min(endCol, columns.value); col++) {
            const cell: Item = [col, row];
            const cellData = getCellContent(cell);
            const bounds = {
              x: col * 100,
              y: row * rowHeight.value,
              width: 100,
              height: rowHeight.value
            };
            
            // 检查单元格是否在选择区域内
            const isSelected = Boolean(selection.value?.current?.range &&
              col * 100 >= selection.value.current.range.x &&
              col * 100 < selection.value.current.range.x + selection.value.current.range.width &&
              row * rowHeight.value >= selection.value.current.range.y &&
              row * rowHeight.value < selection.value.current.range.y + selection.value.current.range.height);
            
            drawCellBackground(ctx, cell, bounds, isSelected);
            drawCellContent(ctx, cell, bounds, cellData);
          }
        }
      }
      
      // 绘制选择区域（最上层）
      drawSelection(ctx);
      
      ctx.restore();
      
      // 更新缓存版本
      renderCache.value.version++;
      
      // 清除脏区域
      clearDirtyRegions();
      
    } finally {
      isRendering.value = false;
      
      // 更新性能统计
      const renderTime = performance.now() - startTime;
      renderStats.value.lastRenderTime = renderTime;
      renderStats.value.totalRenderTime += renderTime;
      renderStats.value.averageRenderTime = renderStats.value.totalRenderTime / renderStats.value.frameCount;
    }
  };

  // 调度渲染
  const scheduleRender = () => {
    if (renderFrameId.value !== null) {
      cancelAnimationFrame(renderFrameId.value);
    }
    
    renderFrameId.value = requestAnimationFrame(() => {
      render();
      renderFrameId.value = null;
    });
  };

  // 强制完全重绘
  const forceFullRedraw = () => {
    fullRedrawNeeded.value = true;
    
    // 清除缓存
    renderCache.value.cellContent.clear();
    renderCache.value.cellRender.clear();
    renderCache.value.gridLines = null;
    
    scheduleRender();
  };

  // 清理资源
  const cleanup = () => {
    if (renderFrameId.value !== null) {
      cancelAnimationFrame(renderFrameId.value);
      renderFrameId.value = null;
    }
    
    // 清除缓存
    renderCache.value.cellContent.clear();
    renderCache.value.cellRender.clear();
    if (renderCache.value.gridLines) {
      renderCache.value.gridLines.close();
      renderCache.value.gridLines = null;
    }
  };

  return {
    // 状态
    isRendering,
    renderStats,
    
    // 方法
    markDirty,
    markAllDirty,
    scheduleRender,
    forceFullRedraw,
    cleanup,
    
    // 性能监控
    getPerformanceReport: () => ({
      ...renderStats.value,
      cacheHitRate: renderStats.value.cacheHitCount / (renderStats.value.cacheHitCount + renderStats.value.cacheMissCount) || 0,
      averageFPS: 1000 / renderStats.value.averageRenderTime || 0
    })
  };
}