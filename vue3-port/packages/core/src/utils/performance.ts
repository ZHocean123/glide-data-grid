/**
 * 性能优化工具集
 * 专为 Vue3 版本的数据网格设计
 */

import { ref, computed, watch, nextTick, type Ref } from 'vue';

// 性能监控接口
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  scrollTime: number;
  cellCount: number;
  fps: number;
  memoryUsage: number;
  timestamp: number;
}

// 渲染统计
export interface RenderStats {
  totalCells: number;
  visibleCells: number;
  skippedCells: number;
  renderTime: number;
  batchSize: number;
}

// 缓存配置
export interface CacheConfig {
  maxSize: number;
  ttl: number; // 毫秒
  cleanupInterval: number; // 毫秒
}

// LRU 缓存实现
export class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; accessTime: number }>();
  private maxSize: number;
  private ttl: number;
  private cleanupTimer?: number;

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize;
    this.ttl = config.ttl;

    // 定期清理过期项
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, config.cleanupInterval);
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新访问时间
    item.accessTime = now;
    return item.value;
  }

  set(key: K, value: V): void {
    const now = Date.now();

    // 如果已存在，直接更新
    if (this.cache.has(key)) {
      this.cache.set(key, { value, timestamp: now, accessTime: now });
      return;
    }

    // 检查是否需要清理空间
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecent();
    }

    this.cache.set(key, { value, timestamp: now, accessTime: now });
  }

  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLeastRecent(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.accessTime < oldestTime) {
        oldestTime = item.accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: K[] = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: number | undefined;
  let result: ReturnType<T>;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && !timeout;

    const later = () => {
      timeout = undefined;
      if (!immediate) {
        result = func.apply(this, args);
      }
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);

    if (callNow) {
      result = func.apply(this, args);
    }

    return result;
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = undefined;
  };

  return debounced;
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
  let timeout: number | undefined;
  let previous = 0;
  let result: ReturnType<T>;

  const { leading = true, trailing = true } = options;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      previous = now;
      result = func.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = window.setTimeout(() => {
        previous = !leading ? 0 : Date.now();
        timeout = undefined;
        result = func.apply(this, args);
      }, remaining);
    }

    return result;
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    clearTimeout(timeout);
    timeout = undefined;
    previous = 0;
  };

  return throttled;
}

// RAF 节流
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): T & { cancel: () => void } {
  let rafId: number | undefined;
  let lastArgs: Parameters<T>;

  const throttled = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === undefined) {
      rafId = requestAnimationFrame(() => {
        rafId = undefined;
        func.apply(this, lastArgs);
      });
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
  };

  return throttled;
}

// 批处理工具
export class BatchProcessor<T> {
  private queue: T[] = [];
  private isProcessing = false;
  private batchSize: number;
  private processor: (items: T[]) => Promise<void> | void;
  private delay: number;

  constructor(
    processor: (items: T[]) => Promise<void> | void,
    options: {
      batchSize?: number;
      delay?: number;
    } = {}
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 50;
    this.delay = options.delay || 16; // ~60fps
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleProcess();
  }

  addBatch(items: T[]): void {
    this.queue.push(...items);
    this.scheduleProcess();
  }

  private scheduleProcess(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    setTimeout(() => {
      this.process();
    }, this.delay);
  }

  private async process(): Promise<void> {
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      try {
        await this.processor(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      }

      // 让出控制权给其他任务
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.queue.length = 0;
  }

  size(): number {
    return this.queue.length;
  }
}

// 虚拟滚动计算
export interface VirtualScrollInfo {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleCount: number;
}

export function calculateVirtualScroll(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
): VirtualScrollInfo {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount - 1);
  const totalHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleCount: endIndex - startIndex + 1,
  };
}

// 性能监控器
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxHistory = 100;
  private isEnabled = true;

  private frameStart = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 0;

  constructor() {
    this.startFpsMonitoring();
  }

  private startFpsMonitoring(): void {
    const updateFps = () => {
      this.frameCount++;
      const now = performance.now();

      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      if (this.isEnabled) {
        requestAnimationFrame(updateFps);
      }
    };

    requestAnimationFrame(updateFps);
  }

  startRender(): void {
    if (!this.isEnabled) return;
    this.frameStart = performance.now();
  }

  endRender(cellCount: number): void {
    if (!this.isEnabled) return;

    const renderTime = performance.now() - this.frameStart;
    const memoryUsage = this.getMemoryUsage();

    const metric: PerformanceMetrics = {
      renderTime,
      updateTime: 0,
      scrollTime: 0,
      cellCount,
      fps: this.currentFps,
      memoryUsage,
      timestamp: Date.now(),
    };

    this.addMetric(metric);
  }

  measureUpdate<T>(fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const updateTime = performance.now() - start;

    // 更新最新指标
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].updateTime = updateTime;
    }

    return result;
  }

  measureScroll<T>(fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const scrollTime = performance.now() - start;

    // 更新最新指标
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].scrollTime = scrollTime;
    }

    return result;
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    if (this.metrics.length > this.maxHistory) {
      this.metrics.shift();
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getMetrics(): readonly PerformanceMetrics[] {
    return this.metrics;
  }

  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.renderTime, 0);
    return sum / this.metrics.length;
  }

  getAverageFps(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.fps, 0);
    return sum / this.metrics.length;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  clear(): void {
    this.metrics.length = 0;
  }
}

// 内存池
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    options: {
      reset?: (obj: T) => void;
      maxSize?: number;
      initialSize?: number;
    } = {}
  ) {
    this.factory = factory;
    this.reset = options.reset;
    this.maxSize = options.maxSize || 100;

    // 预分配对象
    const initialSize = options.initialSize || 10;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  size(): number {
    return this.pool.length;
  }
}

// Vue3 组合式函数
export function usePerformance() {
  const monitor = new PerformanceMonitor();

  const metrics = ref<PerformanceMetrics[]>([]);
  const isEnabled = ref(true);

  // 定期更新指标
  const updateMetrics = debounce(() => {
    metrics.value = [...monitor.getMetrics()];
  }, 100);

  watch(() => monitor.getMetrics().length, updateMetrics);

  const averageRenderTime = computed(() => monitor.getAverageRenderTime());
  const averageFps = computed(() => monitor.getAverageFps());

  const enable = () => {
    isEnabled.value = true;
    monitor.enable();
  };

  const disable = () => {
    isEnabled.value = false;
    monitor.disable();
  };

  const clear = () => {
    monitor.clear();
    metrics.value = [];
  };

  return {
    monitor,
    metrics,
    isEnabled,
    averageRenderTime,
    averageFps,
    enable,
    disable,
    clear,
  };
}

// 缓存组合式函数
export function useCache<K, V>(config: CacheConfig) {
  const cache = new LRUCache<K, V>(config);

  const get = (key: K) => cache.get(key);
  const set = (key: K, value: V) => cache.set(key, value);
  const has = (key: K) => cache.has(key);
  const del = (key: K) => cache.delete(key);
  const clear = () => cache.clear();
  const size = computed(() => cache.size());

  return {
    get,
    set,
    has,
    delete: del,
    clear,
    size,
    cache,
  };
}

// Classes and functions are already exported above, no need for duplicate export
