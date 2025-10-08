import { ref, reactive, computed, onMounted, onUnmounted, type Ref } from 'vue';
import type { Rectangle } from '../internal/data-grid/data-grid-types.js';
import { useMemoryManager } from './memory-manager.js';
import { useEventOptimizer } from './event-optimizer.js';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollOptions {
  /** 容器宽度 */
  width: Ref<number>;
  /** 容器高度 */
  height: Ref<number>;
  /** 行高（固定或函数） */
  rowHeight: Ref<number> | ((row: number) => number);
  /** 列宽 */
  columnWidth: Ref<number>;
  /** 总行数 */
  totalRows: Ref<number>;
  /** 总列数 */
  totalColumns: Ref<number>;
  /** 缓冲区大小（额外渲染的行/列数） */
  bufferSize?: number;
  /** 是否启用动态高度计算 */
  dynamicHeight?: boolean;
  /** 是否启用预测性滚动 */
  enablePrediction?: boolean;
  /** 滚动阈值（像素） */
  scrollThreshold?: number;
}

/**
 * 可见区域信息
 */
export interface VisibleRegion {
  /** 起始行索引 */
  startRow: number;
  /** 结束行索引 */
  endRow: number;
  /** 起始列索引 */
  startCol: number;
  /** 结束列索引 */
  endCol: number;
  /** 可见区域矩形 */
  bounds: Rectangle;
  /** 滚动偏移 */
  scrollLeft: number;
  scrollTop: number;
}

/**
 * 虚拟滚动项
 */
export interface VirtualItem {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
  /** 位置 */
  x: number;
  /** Y位置 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 是否可见 */
  visible: boolean;
  /** 缓存键 */
  key: string;
}

/**
 * 滚动预测信息
 */
export interface ScrollPrediction {
  /** 预测的滚动位置 */
  predictedScrollLeft: number;
  predictedScrollTop: number;
  /** 预测的可见区域 */
  predictedRegion: VisibleRegion;
  /** 预测置信度 */
  confidence: number;
}

/**
 * 虚拟滚动优化器
 * 提供高性能的虚拟滚动实现，包括动态缓冲区、预测性滚动和内存优化
 */
export function useVirtualScrollOptimizer(options: VirtualScrollOptions): {
  scrollState: any;
  visibleRegion: any;
  scrollPrediction: any;
  performanceStats: any;
  totalContentSize: any;
  scrollContainer: any;
  virtualItems: any;
  scrollTo: (scrollLeft: number, scrollTop: number, smooth?: boolean) => void;
  scrollToCell: (row: number, col: number, alignment?: 'start' | 'center' | 'end' | 'auto') => void;
  getRowHeight: (row: number) => number;
  getRowOffset: (row: number) => number;
  updateVisibleRegion: (scrollLeft: number, scrollTop: number, containerWidth: number, containerHeight: number) => void;
  memoryManager: any;
  eventOptimizer: any;
} {
  const {
    width,
    height,
    rowHeight,
    columnWidth,
    totalRows,
    totalColumns,
    bufferSize = 10,
    enablePrediction = true
  } = options;

  // 内存管理器
  const memoryManager = useMemoryManager({
    maxCacheSize: 500,
    maxPoolSize: 50
  });

  // 事件优化器
  const eventOptimizer = useEventOptimizer({
    defaultThrottleInterval: 16,
    maxEventQueueSize: 100
  });

  // 滚动状态
  const scrollState = reactive({
    scrollLeft: 0,
    scrollTop: 0,
    isScrolling: false,
    scrollDirection: { x: 0, y: 0 },
    lastScrollTime: 0,
    scrollVelocity: { x: 0, y: 0 }
  });

  // 可见区域
  const visibleRegion = ref<VisibleRegion>({
    startRow: 0,
    endRow: 0,
    startCol: 0,
    endCol: 0,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    scrollLeft: 0,
    scrollTop: 0
  });

  // 虚拟项缓存
  const virtualItems = ref<Map<string, VirtualItem>>(new Map());
  
  // 行高缓存（用于动态高度）
  const rowHeightCache = ref<Map<number, number>>(new Map());
  
  // 滚动预测
  const scrollPrediction = ref<ScrollPrediction | null>(null);

  // 性能统计
  const performanceStats = reactive({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    cacheHitRate: 0,
    predictionAccuracy: 0
  });

  // 获取行高
  const getRowHeight = (row: number): number => {
    if (typeof rowHeight === 'function') {
      // 检查缓存
      if (rowHeightCache.value.has(row)) {
        return rowHeightCache.value.get(row)!;
      }
      
      const height = (rowHeight as Function)(row);
      rowHeightCache.value.set(row, height);
      return height;
    }
    
    return (rowHeight as Ref<number>).value;
  };

  // 计算行的累积高度
  const getRowOffset = (row: number): number => {
    if (typeof rowHeight !== 'function') {
      return row * (rowHeight as Ref<number>).value;
    }
    
    let offset = 0;
    for (let i = 0; i < row; i++) {
      offset += getRowHeight(i);
    }
    
    return offset;
  };

  // 查找指定偏移量的行
  const getRowFromOffset = (offset: number): number => {
    if (typeof rowHeight !== 'function') {
      return Math.floor(offset / (rowHeight as Ref<number>).value);
    }
    
    let currentOffset = 0;
    for (let i = 0; i < totalRows.value; i++) {
      const height = getRowHeight(i);
      if (currentOffset + height > offset) {
        return i;
      }
      currentOffset += height;
    }
    
    return totalRows.value - 1;
  };

  // 计算可见区域
  const calculateVisibleRegion = (
    scrollLeft: number,
    scrollTop: number,
    containerWidth: number,
    containerHeight: number
  ): VisibleRegion => {
    // 计算可见的列范围
    const startCol = Math.floor(scrollLeft / columnWidth.value);
    const endCol = Math.min(
      Math.ceil((scrollLeft + containerWidth) / columnWidth.value),
      totalColumns.value - 1
    );

    // 计算可见的行范围
    const startRow = getRowFromOffset(scrollTop);
    
    let endRow = startRow;
    let currentHeight = 0;
    const maxOffset = scrollTop + containerHeight;
    
    for (let i = startRow; i < totalRows.value; i++) {
      currentHeight += getRowHeight(i);
      if (currentHeight >= maxOffset) {
        endRow = i;
        break;
      }
      endRow = i;
    }

    // 应用缓冲区
    const bufferedStartRow = Math.max(0, startRow - bufferSize);
    const bufferedEndRow = Math.min(totalRows.value - 1, endRow + bufferSize);
    const bufferedStartCol = Math.max(0, startCol - bufferSize);
    const bufferedEndCol = Math.min(totalColumns.value - 1, endCol + bufferSize);

    return {
      startRow: bufferedStartRow,
      endRow: bufferedEndRow,
      startCol: bufferedStartCol,
      endCol: bufferedEndCol,
      bounds: {
        x: scrollLeft,
        y: scrollTop,
        width: containerWidth,
        height: containerHeight
      },
      scrollLeft,
      scrollTop
    };
  };

  // 生成虚拟项
  const generateVirtualItems = (region: VisibleRegion): VirtualItem[] => {
    const items: VirtualItem[] = [];
    
    for (let row = region.startRow; row <= region.endRow; row++) {
      for (let col = region.startCol; col <= region.endCol; col++) {
        const key = `${row}-${col}`;
        
        // 检查缓存
        if (virtualItems.value.has(key)) {
          const cachedItem = virtualItems.value.get(key)!;
          cachedItem.visible = true;
          items.push(cachedItem);
          memoryManager.memoryStats.cacheHits++;
          continue;
        }
        
        memoryManager.memoryStats.cacheMisses++;
        
        const item: VirtualItem = {
          row,
          col,
          x: col * columnWidth.value,
          y: getRowOffset(row),
          width: columnWidth.value,
          height: getRowHeight(row),
          visible: true,
          key
        };
        
        virtualItems.value.set(key, item);
        items.push(item);
      }
    }
    
    // 标记不可见的项
    for (const [, item] of virtualItems.value) {
      if (
        item.row < region.startRow || 
        item.row > region.endRow || 
        item.col < region.startCol || 
        item.col > region.endCol
      ) {
        item.visible = false;
      }
    }
    
    return items;
  };

  // 预测滚动位置
  const predictScrollPosition = (): ScrollPrediction | null => {
    if (!enablePrediction) return null;
    
    const { scrollVelocity, lastScrollTime } = scrollState;
    const timeSinceLastScroll = Date.now() - lastScrollTime;
    
    // 如果滚动停止或速度太低，不进行预测
    if (timeSinceLastScroll > 100 || 
        (Math.abs(scrollVelocity.x) < 0.1 && Math.abs(scrollVelocity.y) < 0.1)) {
      return null;
    }
    
    // 预测下一帧的位置（约16ms后）
    const predictionTime = 16;
    const predictedScrollLeft = Math.max(0, 
      scrollState.scrollLeft + scrollVelocity.x * predictionTime);
    const predictedScrollTop = Math.max(0, 
      scrollState.scrollTop + scrollVelocity.y * predictionTime);
    
    // 计算预测的可见区域
    const predictedRegion = calculateVisibleRegion(
      predictedScrollLeft,
      predictedScrollTop,
      width.value,
      height.value
    );
    
    // 计算预测置信度（基于滚动速度和时间）
    const confidence = Math.max(0, 1 - timeSinceLastScroll / 100) * 
      Math.min(1, Math.sqrt(scrollVelocity.x ** 2 + scrollVelocity.y ** 2) / 10);
    
    return {
      predictedScrollLeft,
      predictedScrollTop,
      predictedRegion,
      confidence
    };
  };

  // 更新可见区域
  const updateVisibleRegion = (
    scrollLeft: number,
    scrollTop: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    const startTime = performance.now();
    
    // 计算新的可见区域
    const newRegion = calculateVisibleRegion(
      scrollLeft,
      scrollTop,
      containerWidth,
      containerHeight
    );
    
    // 检查是否需要更新
    const currentRegion = visibleRegion.value;
    const needsUpdate = 
      currentRegion.startRow !== newRegion.startRow ||
      currentRegion.endRow !== newRegion.endRow ||
      currentRegion.startCol !== newRegion.startCol ||
      currentRegion.endCol !== newRegion.endCol;
    
    if (needsUpdate) {
      visibleRegion.value = newRegion;
      
      // 生成虚拟项
      generateVirtualItems(newRegion);
      
      // 更新性能统计
      performanceStats.renderCount++;
      const renderTime = performance.now() - startTime;
      performanceStats.totalRenderTime += renderTime;
      performanceStats.averageRenderTime = performanceStats.totalRenderTime / performanceStats.renderCount;
      
      // 更新缓存命中率
      const totalCacheOps = memoryManager.memoryStats.cacheHits + memoryManager.memoryStats.cacheMisses;
      performanceStats.cacheHitRate = memoryManager.memoryStats.cacheHits / totalCacheOps || 0;
    }
    
    // 更新滚动预测
    scrollPrediction.value = predictScrollPosition();
  };

  // 滚动事件处理器
  const handleScroll = eventOptimizer.throttle((event: Event) => {
    const target = event.target as HTMLElement;
    const newScrollLeft = target.scrollLeft;
    const newScrollTop = target.scrollTop;
    
    // 计算滚动速度
    const currentTime = Date.now();
    const timeDelta = currentTime - scrollState.lastScrollTime;
    
    if (timeDelta > 0) {
      scrollState.scrollVelocity.x = (newScrollLeft - scrollState.scrollLeft) / timeDelta;
      scrollState.scrollVelocity.y = (newScrollTop - scrollState.scrollTop) / timeDelta;
    }
    
    // 更新滚动状态
    scrollState.scrollLeft = newScrollLeft;
    scrollState.scrollTop = newScrollTop;
    scrollState.lastScrollTime = currentTime;
    scrollState.isScrolling = true;
    
    // 更新可见区域
    updateVisibleRegion(newScrollLeft, newScrollTop, width.value, height.value);
    
    // 停止滚动检测
    clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(() => {
      scrollState.isScrolling = false;
      scrollState.scrollVelocity = { x: 0, y: 0 };
      scrollPrediction.value = null;
    }, 150);
  }, 16);

  let scrollStopTimer: number;

  // 滚动到指定位置
  const scrollTo = (scrollLeft: number, scrollTop: number, smooth = false) => {
    const container = scrollContainer.value;
    if (!container) return;
    
    if (smooth) {
      container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth'
      });
    } else {
      container.scrollLeft = scrollLeft;
      container.scrollTop = scrollTop;
    }
  };

  // 滚动到指定单元格
  const scrollToCell = (row: number, col: number, alignment = 'auto' as 'start' | 'center' | 'end' | 'auto') => {
    const container = scrollContainer.value;
    if (!container) return;
    
    const cellX = col * columnWidth.value;
    const cellY = getRowOffset(row);
    const cellWidth = columnWidth.value;
    const cellHeight = getRowHeight(row);
    
    let scrollLeft = cellX;
    let scrollTop = cellY;
    
    switch (alignment) {
      case 'center':
        scrollLeft = cellX - (width.value - cellWidth) / 2;
        scrollTop = cellY - (height.value - cellHeight) / 2;
        break;
      case 'end':
        scrollLeft = cellX - width.value + cellWidth;
        scrollTop = cellY - height.value + cellHeight;
        break;
      case 'auto':
        // 自动选择最佳滚动位置
        if (cellX < container.scrollLeft) {
          scrollLeft = cellX;
        } else if (cellX + cellWidth > container.scrollLeft + width.value) {
          scrollLeft = cellX + cellWidth - width.value;
        }
        
        if (cellY < container.scrollTop) {
          scrollTop = cellY;
        } else if (cellY + cellHeight > container.scrollTop + height.value) {
          scrollTop = cellY + cellHeight - height.value;
        }
        break;
    }
    
    scrollTo(
      Math.max(0, scrollLeft),
      Math.max(0, scrollTop),
      true
    );
  };

  // 获取总内容大小
  const totalContentSize = computed(() => {
    let totalHeight = 0;
    
    if (typeof rowHeight === 'function') {
      for (let i = 0; i < totalRows.value; i++) {
        totalHeight += getRowHeight(i);
      }
    } else {
      totalHeight = totalRows.value * (rowHeight as Ref<number>).value;
    }
    
    return {
      width: totalColumns.value * columnWidth.value,
      height: totalHeight
    };
  });

  // 滚动容器引用
  const scrollContainer = ref<HTMLElement>();

  // 初始化
  onMounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true });
      
      // 初始计算可见区域
      updateVisibleRegion(0, 0, width.value, height.value);
    }
  });

  // 清理
  onUnmounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll);
    }
    
    clearTimeout(scrollStopTimer);
    
    // 清理缓存
    virtualItems.value.clear();
    rowHeightCache.value.clear();
    memoryManager.garbageCollect();
  });

  return {
    // 状态
    scrollState,
    visibleRegion,
    scrollPrediction,
    performanceStats,
    totalContentSize,
    
    // 引用
    scrollContainer,
    virtualItems: computed(() => Array.from(virtualItems.value.values()).filter(item => item.visible)),
    
    // 方法
    scrollTo,
    scrollToCell,
    getRowHeight,
    getRowOffset,
    updateVisibleRegion,
    
    // 内存管理
    memoryManager,
    eventOptimizer
  };
}

/**
 * 虚拟滚动性能监控器
 */
export function useVirtualScrollPerformanceMonitor() {
  const performanceData = ref<Array<{
    timestamp: number;
    visibleItems: number;
    renderTime: number;
    scrollVelocity: { x: number; y: number };
  }>>([]);

  const trackRender = (visibleItems: number, renderTime: number, scrollVelocity: { x: number; y: number }) => {
    performanceData.value.push({
      timestamp: Date.now(),
      visibleItems,
      renderTime,
      scrollVelocity: { ...scrollVelocity }
    });
    
    // 保持数据量在合理范围内
    if (performanceData.value.length > 100) {
      performanceData.value = performanceData.value.slice(-50);
    }
  };

  const getAverageRenderTime = () => {
    if (performanceData.value.length === 0) return 0;
    
    const total = performanceData.value.reduce((sum, d) => sum + d.renderTime, 0);
    return total / performanceData.value.length;
  };

  const getPerformanceReport = () => {
    if (performanceData.value.length === 0) {
      return {
        averageRenderTime: 0,
        maxRenderTime: 0,
        averageVisibleItems: 0,
        maxScrollVelocity: 0
      };
    }
    
    const renderTimes = performanceData.value.map(d => d.renderTime);
    const visibleItems = performanceData.value.map(d => d.visibleItems);
    const scrollVelocities = performanceData.value.map(d => 
      Math.sqrt(d.scrollVelocity.x ** 2 + d.scrollVelocity.y ** 2)
    );
    
    return {
      averageRenderTime: renderTimes.reduce((a, b) => a + b) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      averageVisibleItems: visibleItems.reduce((a, b) => a + b) / visibleItems.length,
      maxScrollVelocity: Math.max(...scrollVelocities)
    };
  };

  return {
    performanceData,
    trackRender,
    getAverageRenderTime,
    getPerformanceReport
  };
}