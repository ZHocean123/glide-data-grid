import { ref, reactive, onUnmounted } from 'vue';

/**
 * 对象池接口
 */
export interface ObjectPool<T> {
  /** 获取对象 */
  acquire(): T;
  /** 释放对象 */
  release(obj: T): void;
  /** 清空池 */
  clear(): void;
  /** 获取池大小 */
  size(): number;
}

/**
 * 简单对象池实现
 */
export function createObjectPool<T>(
  createFn: () => T,
  resetFn?: (obj: T) => void,
  maxSize = 100
): ObjectPool<T> {
  const pool: T[] = [];
  
  return {
    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!;
      }
      return createFn();
    },
    
    release(obj: T): void {
      if (pool.length < maxSize) {
        if (resetFn) {
          resetFn(obj);
        }
        pool.push(obj);
      }
    },
    
    clear(): void {
      pool.length = 0;
    },
    
    size(): number {
      return pool.length;
    }
  };
}

/**
 * 内存管理器配置
 */
export interface MemoryManagerOptions {
  /** 最大缓存大小 */
  maxCacheSize?: number;
  /** 对象池最大大小 */
  maxPoolSize?: number;
  /** 垃圾回收间隔（毫秒） */
  gcInterval?: number;
  /** 是否启用弱引用缓存 */
  useWeakCache?: boolean;
}

/**
 * 内存管理器
 * 提供对象池、缓存和内存监控功能
 */
export function useMemoryManager(options: MemoryManagerOptions = {}) {
  const {
    maxCacheSize = 1000,
    maxPoolSize = 100,
    gcInterval = 30000,
    useWeakCache = false
  } = options;

  // 内存统计
  const memoryStats = reactive({
    /** 总分配对象数 */
    totalAllocated: 0,
    /** 总释放对象数 */
    totalReleased: 0,
    /** 当前活跃对象数 */
    activeObjects: 0,
    /** 缓存命中次数 */
    cacheHits: 0,
    /** 缓存未命中次数 */
    cacheMisses: 0,
    /** 垃圾回收次数 */
    gcCount: 0,
    /** 上次垃圾回收时间 */
    lastGCTime: 0,
    /** 内存使用量（字节） */
    memoryUsage: 0
  });

  // 缓存存储
  const cache = useWeakCache ? new WeakMap() : new Map();
  
  // 对象池
  const pools = new Map<string, ObjectPool<any>>();
  
  // 定时器ID
  let gcTimerId: number | null = null;

  // 获取或创建对象池
  const getPool = <T>(
    name: string,
    createFn: () => T,
    resetFn?: (obj: T) => void
  ): ObjectPool<T> => {
    if (!pools.has(name)) {
      pools.set(name, createObjectPool(createFn, resetFn, maxPoolSize));
    }
    return pools.get(name) as ObjectPool<T>;
  };

  // 缓存操作
  const cacheOps = {
    get: <T>(key: any): T | undefined => {
      if (useWeakCache) {
        // WeakMap不支持size检查，直接尝试获取
        const result = (cache as WeakMap<any, any>).get(key);
        if (result !== undefined) {
          memoryStats.cacheHits++;
          return result;
        }
      } else {
        if ((cache as Map<any, any>).has(key)) {
          memoryStats.cacheHits++;
          return (cache as Map<any, any>).get(key);
        }
      }
      
      memoryStats.cacheMisses++;
      return undefined;
    },
    
    set: <T>(key: any, value: T): void => {
      if (useWeakCache) {
        (cache as WeakMap<any, any>).set(key, value);
      } else {
        const map = cache as Map<any, any>;
        if (map.size >= maxCacheSize) {
          // 简单的LRU：删除第一个元素
          const firstKey = map.keys().next().value;
          map.delete(firstKey);
        }
        map.set(key, value);
      }
    },
    
    delete: (key: any): boolean => {
      if (useWeakCache) {
        // WeakMap没有delete方法
        return false;
      }
      return (cache as Map<any, any>).delete(key);
    },
    
    clear: (): void => {
      if (useWeakCache) {
        // WeakMap没有clear方法，只能重新创建
        return;
      }
      (cache as Map<any, any>).clear();
    },
    
    size: (): number => {
      if (useWeakCache) {
        // WeakMap没有size属性
        return 0;
      }
      return (cache as Map<any, any>).size;
    }
  };

  // 内存分配跟踪
  const allocate = <T>(createFn: () => T): T => {
    memoryStats.totalAllocated++;
    memoryStats.activeObjects++;
    return createFn();
  };

  // 内存释放跟踪
  const release = <T>(_obj: T): void => {
    memoryStats.totalReleased++;
    memoryStats.activeObjects = Math.max(0, memoryStats.activeObjects - 1);
  };

  // 垃圾回收
  const garbageCollect = (): void => {
    const startTime = performance.now();
    
    // 清理缓存
    if (!useWeakCache) {
      const map = cache as Map<any, any>;
      if (map.size > maxCacheSize * 0.8) {
        // 删除最旧的20%缓存项
        const entriesToRemove = Math.floor(map.size * 0.2);
        const keys = Array.from(map.keys()).slice(0, entriesToRemove);
        keys.forEach(key => map.delete(key));
      }
    }
    
    // 清理对象池
    for (const [, pool] of pools) {
      if (pool.size() > maxPoolSize * 0.8) {
        pool.clear();
      }
    }
    
    // 强制垃圾回收（如果可用）
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    memoryStats.gcCount++;
    memoryStats.lastGCTime = performance.now() - startTime;
    
    // 更新内存使用量
    updateMemoryUsage();
  };

  // 更新内存使用量
  const updateMemoryUsage = (): void => {
    if ((performance as any).memory) {
      memoryStats.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  };

  // 启动定时垃圾回收
  const startGC = (): void => {
    if (gcTimerId === null) {
      gcTimerId = window.setInterval(garbageCollect, gcInterval);
    }
  };

  // 停止定时垃圾回收
  const stopGC = (): void => {
    if (gcTimerId !== null) {
      clearInterval(gcTimerId);
      gcTimerId = null;
    }
  };

  // 获取内存报告
  const getMemoryReport = () => {
    updateMemoryUsage();
    
    return {
      ...memoryStats,
      cacheHitRate: memoryStats.cacheHits / (memoryStats.cacheHits + memoryStats.cacheMisses) || 0,
      cacheSize: cacheOps.size(),
      poolCount: pools.size,
      poolSizes: Object.fromEntries(
        Array.from(pools.entries()).map(([name, pool]) => [name, pool.size()])
      ),
      performanceMemory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  };

  // 创建优化的数组
  const createOptimizedArray = <T>(initialCapacity = 10): T[] => {
    const arr = new Array<T>(initialCapacity);
    memoryStats.totalAllocated++;
    memoryStats.activeObjects++;
    return arr;
  };

  // 创建优化的对象
  const createOptimizedObject = <T extends object>(prototype?: any): T => {
    const obj = Object.create(prototype || {});
    memoryStats.totalAllocated++;
    memoryStats.activeObjects++;
    return obj as T;
  };

  // 预分配常用对象池
  const initializePools = (): void => {
    // 矩形对象池
    getPool('rectangle', () => ({ x: 0, y: 0, width: 0, height: 0 }), (obj) => {
      obj.x = 0;
      obj.y = 0;
      obj.width = 0;
      obj.height = 0;
    });
    
    // 点对象池
    getPool('point', () => ({ x: 0, y: 0 }), (obj) => {
      obj.x = 0;
      obj.y = 0;
    });
    
    // 数组池
    getPool('array', () => [], (arr) => {
      arr.length = 0;
    });
  };

  // 启动内存管理器
  initializePools();
  startGC();

  // 组件卸载时清理
  onUnmounted(() => {
    stopGC();
    cacheOps.clear();
    pools.forEach(pool => pool.clear());
    pools.clear();
  });

  return {
    // 统计信息
    memoryStats,
    
    // 缓存操作
    cache: cacheOps,
    
    // 对象池操作
    getPool,
    
    // 内存操作
    allocate,
    release,
    createOptimizedArray,
    createOptimizedObject,
    
    // 垃圾回收
    garbageCollect,
    startGC,
    stopGC,
    
    // 报告
    getMemoryReport
  };
}

/**
 * 内存监控钩子
 */
export function useMemoryMonitor(interval = 5000) {
  const memoryHistory = ref<Array<{
    timestamp: number;
    used: number;
    total: number;
    limit: number;
  }>>([]);

  let timerId: number | null = null;

  const startMonitoring = () => {
    if (timerId !== null) return;

    timerId = window.setInterval(() => {
      if ((performance as any).memory) {
        memoryHistory.value.push({
          timestamp: Date.now(),
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        });

        // 保持历史记录在合理范围内
        if (memoryHistory.value.length > 100) {
          memoryHistory.value.shift();
        }
      }
    }, interval);
  };

  const stopMonitoring = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const getMemoryTrend = () => {
    if (memoryHistory.value.length < 2) return 'stable';
    
    const recent = memoryHistory.value.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const change = (last.used - first.used) / first.used;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  };

  // 组件卸载时停止监控
  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    memoryHistory,
    startMonitoring,
    stopMonitoring,
    getMemoryTrend
  };
}