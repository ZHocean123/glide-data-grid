import { ref, reactive, computed, shallowRef, shallowReactive, markRaw, type Ref, type ComputedRef } from 'vue';
import { useMemoryManager } from './memory-manager.js';

/**
 * 响应式数据优化配置
 */
export interface ReactiveOptimizerOptions {
  /** 是否启用浅响应式 */
  useShallow?: boolean;
  /** 是否启用计算属性缓存 */
  enableComputedCache?: boolean;
  /** 计算属性缓存大小 */
  computedCacheSize?: number;
  /** 是否启用批量更新 */
  enableBatchUpdate?: boolean;
  /** 批量更新延迟（毫秒） */
  batchUpdateDelay?: number;
}

/**
 * 计算属性缓存项
 */
interface ComputedCacheItem<T = any> {
  value: T;
  dependencies: Set<any>;
  lastAccessed: number;
}

/**
 * 批量更新队列项
 */
interface BatchUpdateItem {
  fn: () => void;
  priority: number;
}

/**
 * 响应式数据优化器
 * 提供浅响应式、计算属性缓存和批量更新功能
 */
export function useReactiveOptimizer(options: ReactiveOptimizerOptions = {}): {
  createOptimizedRef: <T>(value: T) => any;
  createOptimizedReactive: <T extends object>(value: T) => any;
  createImmutableReactive: <T extends object>(value: T) => any;
  createCachedComputed: <T>(key: string, getter: () => T, dependencies?: any[]) => any;
  batchUpdate: (fn: () => void, priority?: number) => void;
  flushBatchQueueImmediate: () => void;
  createDebouncedRef: <T>(initialValue: T, delay?: number) => any;
  createThrottledRef: <T>(initialValue: T, interval?: number) => any;
  createConditionalRef: <T>(condition: any, trueValue: T, falseValue: T) => any;
  createLazyRef: <T>(loader: () => T | Promise<T>) => any;
  createOptimizedArray: <T>(initialItems?: T[]) => any;
  getOptimizationStats: () => any;
  cleanup: () => void;
} {
  const {
    useShallow = true,
    enableComputedCache = true,
    computedCacheSize = 100,
    enableBatchUpdate = true,
    batchUpdateDelay = 16 // ~60fps
  } = options;

  // 内存管理器
  const memoryManager = useMemoryManager({
    maxCacheSize: computedCacheSize,
    gcInterval: 10000
  });

  // 计算属性缓存
  const computedCache = new Map<string, ComputedCacheItem>();
  
  // 批量更新队列
  const batchQueue: BatchUpdateItem[] = [];
  let batchTimerId: number | null = null;
  let isBatching = false;

  // 创建优化的响应式引用
  const createOptimizedRef = <T>(value: T) => {
    return useShallow ? shallowRef(value) : ref(value);
  };

  // 创建优化的响应式对象
  const createOptimizedReactive = <T extends object>(value: T) => {
    return useShallow ? shallowReactive(value) : reactive(value);
  };

  // 创建不可变的响应式对象
  const createImmutableReactive = <T extends object>(value: T) => {
    return markRaw(reactive(value));
  };

  // 创建缓存的计算属性
  const createCachedComputed = <T>(
    key: string,
    getter: () => T,
    dependencies?: any[]
  ): ComputedRef<T> => {
    if (!enableComputedCache) {
      return computed(getter);
    }

    // 检查缓存
    const cached = computedCache.get(key);
    if (cached) {
      cached.lastAccessed = Date.now();
      memoryManager.memoryStats.cacheHits++;
      return computed(() => cached.value);
    }

    memoryManager.memoryStats.cacheMisses++;

    // 创建新的计算属性
    const computedRef = computed(getter);
    
    // 缓存结果
    const cacheItem: ComputedCacheItem<T> = {
      value: computedRef.value,
      dependencies: new Set(dependencies || []),
      lastAccessed: Date.now()
    };
    
    computedCache.set(key, cacheItem);
    
    // 清理过期缓存
    cleanExpiredCache();
    
    return computedRef;
  };

  // 清理过期缓存
  const cleanExpiredCache = () => {
    if (computedCache.size <= computedCacheSize) return;

    // 按最后访问时间排序
    const entries = Array.from(computedCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // 删除最旧的25%
    const toDelete = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toDelete; i++) {
      computedCache.delete(entries[i][0]);
    }
  };

  // 批量更新
  const batchUpdate = (fn: () => void, priority = 0) => {
    if (!enableBatchUpdate) {
      fn();
      return;
    }

    batchQueue.push({ fn, priority });
    
    if (!batchTimerId) {
      batchTimerId = window.setTimeout(() => {
        flushBatchQueue();
      }, batchUpdateDelay);
    }
  };

  // 刷新批量队列
  const flushBatchQueue = () => {
    if (isBatching) return;
    
    isBatching = true;
    batchTimerId = null;
    
    try {
      // 按优先级排序
      batchQueue.sort((a, b) => b.priority - a.priority);
      
      // 执行所有更新
      while (batchQueue.length > 0) {
        const item = batchQueue.shift()!;
        item.fn();
      }
    } finally {
      isBatching = false;
    }
  };

  // 强制刷新批量队列
  const flushBatchQueueImmediate = () => {
    if (batchTimerId) {
      clearTimeout(batchTimerId);
      batchTimerId = null;
    }
    flushBatchQueue();
  };

  // 创建防抖的响应式更新
  const createDebouncedRef = <T>(
    initialValue: T,
    delay = 100
  ) => {
    const refValue = createOptimizedRef(initialValue) as any;
    let timerId: number | null = null;

    const setValue = (value: T) => {
      if (timerId) {
        clearTimeout(timerId);
      }
      
      timerId = window.setTimeout(() => {
        refValue.value = value;
        timerId = null;
      }, delay);
    };

    return [refValue, setValue] as [any, (value: T) => void];
  };

  // 创建节流的响应式更新
  const createThrottledRef = <T>(
    initialValue: T,
    interval = 100
  ) => {
    const refValue = createOptimizedRef(initialValue) as any;
    let lastUpdate = 0;
    let pendingValue: T | null = null;

    const setValue = (value: T) => {
      const now = Date.now();
      
      if (now - lastUpdate >= interval) {
        refValue.value = value;
        lastUpdate = now;
        pendingValue = null;
      } else {
        pendingValue = value;
        
        if (!timerId) {
          timerId = window.setTimeout(() => {
            if (pendingValue !== null) {
              refValue.value = pendingValue;
              lastUpdate = Date.now();
              pendingValue = null;
            }
            timerId = null;
          }, interval - (now - lastUpdate));
        }
      }
    };

    let timerId: number | null = null;
    return [refValue, setValue] as [any, (value: T) => void];
  };

  // 创建条件响应式
  const createConditionalRef = <T>(
    condition: Ref<boolean>,
    trueValue: T,
    falseValue: T
  ): ComputedRef<T> => {
    return computed(() => condition.value ? trueValue : falseValue);
  };

  // 创建延迟加载的响应式
  const createLazyRef = <T>(
    loader: () => T | Promise<T>
  ): Ref<T | undefined> => {
    const refValue = createOptimizedRef<T | undefined>(undefined);
    let isLoading = false;
    let isLoaded = false;

    const load = async () => {
      if (isLoading || isLoaded) return;
      
      isLoading = true;
      try {
        const result = await loader();
        refValue.value = result;
        isLoaded = true;
      } finally {
        isLoading = false;
      }
    };

    // 当访问值时触发加载
    return computed(() => {
      if (!isLoaded && !isLoading) {
        load();
      }
      return refValue.value;
    });
  };

  // 创建响应式数组优化
  const createOptimizedArray = <T>(initialItems: T[] = []) => {
    const array = createOptimizedReactive({
      items: initialItems,
      length: initialItems.length
    });

    const addItem = (item: T) => {
      batchUpdate(() => {
        (array.items as any).push(item);
        array.length++;
      });
    };

    const removeItem = (index: number) => {
      batchUpdate(() => {
        if (index >= 0 && index < array.items.length) {
          array.items.splice(index, 1);
          array.length--;
        }
      });
    };

    const updateItem = (index: number, item: T) => {
      batchUpdate(() => {
        if (index >= 0 && index < array.items.length) {
          array.items[index] = item;
        }
      });
    };

    const clearItems = () => {
      batchUpdate(() => {
        array.items.length = 0;
        array.length = 0;
      });
    };

    return {
      array,
      addItem,
      removeItem,
      updateItem,
      clearItems
    };
  };

  // 获取优化统计信息
  const getOptimizationStats = () => {
    return {
      computedCacheSize: computedCache.size,
      computedCacheMaxSize: computedCacheSize,
      batchQueueSize: batchQueue.length,
      isBatching,
      memoryStats: memoryManager.getMemoryReport()
    };
  };

  // 清理资源
  const cleanup = () => {
    if (batchTimerId) {
      clearTimeout(batchTimerId);
      batchTimerId = null;
    }
    
    flushBatchQueueImmediate();
    computedCache.clear();
    memoryManager.garbageCollect();
  };

  return {
    // 创建优化的响应式对象
    createOptimizedRef,
    createOptimizedReactive,
    createImmutableReactive,
    
    // 缓存计算属性
    createCachedComputed,
    
    // 批量更新
    batchUpdate,
    flushBatchQueueImmediate,
    
    // 特殊响应式类型
    createDebouncedRef,
    createThrottledRef,
    createConditionalRef,
    createLazyRef,
    
    // 数组优化
    createOptimizedArray,
    
    // 统计和清理
    getOptimizationStats,
    cleanup
  };
}

/**
 * 响应式数据监控器
 */
export function useReactivityMonitor() {
  const stats = reactive({
    refCount: 0,
    reactiveCount: 0,
    computedCount: 0,
    updateCount: 0,
    lastUpdateTime: 0,
    averageUpdateTime: 0
  });

  const trackUpdate = (updateTime: number) => {
    stats.updateCount++;
    stats.lastUpdateTime = updateTime;
    stats.averageUpdateTime = (stats.averageUpdateTime * (stats.updateCount - 1) + updateTime) / stats.updateCount;
  };

  const getReport = () => {
    return { ...stats };
  };

  return {
    stats,
    trackUpdate,
    getReport
  };
}