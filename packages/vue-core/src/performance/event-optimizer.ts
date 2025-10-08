import { ref, reactive, onUnmounted } from 'vue';

/**
 * 事件处理优化配置
 */
export interface EventOptimizerOptions {
  /** 默认防抖延迟（毫秒） */
  defaultDebounceDelay?: number;
  /** 默认节流间隔（毫秒） */
  defaultThrottleInterval?: number;
  /** 事件队列最大大小 */
  maxEventQueueSize?: number;
  /** 是否启用事件优先级 */
  enableEventPriority?: boolean;
}

/**
 * 事件优先级
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 队列中的事件项
 */
interface QueuedEvent {
  id: string;
  type: string;
  handler: () => void;
  priority: EventPriority;
  timestamp: number;
  retryCount?: number;
}

/**
 * 事件统计信息
 */
export interface EventStats {
  totalEvents: number;
  processedEvents: number;
  droppedEvents: number;
  averageProcessingTime: number;
  eventCounts: Record<string, number>;
  queueSize: number;
}

/**
 * 事件处理优化器
 * 提供防抖、节流、事件队列和优先级处理功能
 */
export function useEventOptimizer(options: EventOptimizerOptions = {}) {
  const {
    defaultDebounceDelay = 100,
    defaultThrottleInterval = 16,
    maxEventQueueSize = 1000,
    enableEventPriority = true
  } = options;

  // 事件队列
  const eventQueue = ref<QueuedEvent[]>([]);
  
  // 事件统计
  const eventStats = reactive<EventStats>({
    totalEvents: 0,
    processedEvents: 0,
    droppedEvents: 0,
    averageProcessingTime: 0,
    eventCounts: {},
    queueSize: 0
  });

  // 处理中的定时器
  const timers = new Map<string, number>();
  let isProcessingQueue = false;
  let totalProcessingTime = 0;

  // 生成唯一ID
  const generateEventId = () => `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay = defaultDebounceDelay,
    id?: string
  ): T => {
    const eventId = id || generateEventId();
    
    return ((...args: any[]) => {
      // 清除之前的定时器
      if (timers.has(eventId)) {
        clearTimeout(timers.get(eventId)!);
      }
      
      // 设置新的定时器
      const timerId = window.setTimeout(() => {
        fn(...args);
        timers.delete(eventId);
      }, delay);
      
      timers.set(eventId, timerId);
    }) as T;
  };

  // 节流函数
  const throttle = <T extends (...args: any[]) => any>(
    fn: T,
    interval = defaultThrottleInterval,
    id?: string
  ): T => {
    const eventId = id || generateEventId();
    let lastExecution = 0;
    let lastArgs: any[] | null = null;
    
    return ((...args: any[]) => {
      lastArgs = args;
      const now = Date.now();
      
      if (now - lastExecution >= interval) {
        lastExecution = now;
        fn(...args);
      } else if (!timers.has(eventId)) {
        // 安排在下次可执行时间执行
        const timerId = window.setTimeout(() => {
          lastExecution = Date.now();
          if (lastArgs) {
            fn(...lastArgs);
          }
          timers.delete(eventId);
        }, interval - (now - lastExecution));
        
        timers.set(eventId, timerId);
      }
    }) as T;
  };

  // 一次性防抖（只执行最后一次）
  const debounceOnce = <T extends (...args: any[]) => any>(
    fn: T,
    delay = defaultDebounceDelay,
    id?: string
  ): T => {
    const eventId = id || generateEventId();
    let hasExecuted = false;
    
    return ((...args: any[]) => {
      if (hasExecuted) return;
      
      // 清除之前的定时器
      if (timers.has(eventId)) {
        clearTimeout(timers.get(eventId)!);
      }
      
      // 设置新的定时器
      const timerId = window.setTimeout(() => {
        hasExecuted = true;
        fn(...args);
        timers.delete(eventId);
      }, delay);
      
      timers.set(eventId, timerId);
    }) as T;
  };

  // 添加事件到队列
  const queueEvent = (
    type: string,
    handler: () => void,
    priority = EventPriority.NORMAL
  ): string => {
    const eventId = generateEventId();
    
    // 检查队列大小
    if (eventQueue.value.length >= maxEventQueueSize) {
      // 移除优先级最低的事件
      const lowestPriorityIndex = eventQueue.value.reduce((minIndex, event, index, array) => {
        return event.priority < array[minIndex].priority ? index : minIndex;
      }, 0);
      
      if (eventQueue.value[lowestPriorityIndex].priority <= priority) {
        eventQueue.value.splice(lowestPriorityIndex, 1);
        eventStats.droppedEvents++;
      } else {
        // 新事件优先级太低，丢弃
        eventStats.droppedEvents++;
        return eventId;
      }
    }
    
    const queuedEvent: QueuedEvent = {
      id: eventId,
      type,
      handler,
      priority,
      timestamp: Date.now()
    };
    
    eventQueue.value.push(queuedEvent);
    eventStats.totalEvents++;
    eventStats.eventCounts[type] = (eventStats.eventCounts[type] || 0) + 1;
    eventStats.queueSize = eventQueue.value.length;
    
    // 异步处理队列
    processEventQueue();
    
    return eventId;
  };

  // 处理事件队列
  const processEventQueue = async () => {
    if (isProcessingQueue || eventQueue.value.length === 0) return;
    
    isProcessingQueue = true;
    
    try {
      // 如果启用优先级，按优先级排序
      if (enableEventPriority) {
        eventQueue.value.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // 高优先级在前
          }
          return a.timestamp - b.timestamp; // 相同优先级按时间排序
        });
      }
      
      // 处理事件
      while (eventQueue.value.length > 0) {
        const event = eventQueue.value.shift()!;
        const startTime = performance.now();
        
        try {
          await event.handler();
          eventStats.processedEvents++;
        } catch (error) {
          console.error(`Error processing event ${event.id}:`, error);
        }
        
        const processingTime = performance.now() - startTime;
        totalProcessingTime += processingTime;
        eventStats.averageProcessingTime = totalProcessingTime / eventStats.processedEvents;
      }
    } finally {
      isProcessingQueue = false;
      eventStats.queueSize = eventQueue.value.length;
    }
  };

  // 批量事件处理
  const batchEvents = <T>(
    events: Array<{ type: string; data: T }>,
    handler: (events: Array<{ type: string; data: T }>) => void,
    batchSize = 10,
    delay = 16
  ) => {
    let batchIndex = 0;
    
    const processBatch = () => {
      const start = batchIndex * batchSize;
      const end = start + batchSize;
      const batch = events.slice(start, end);
      
      if (batch.length > 0) {
        handler(batch);
        batchIndex++;
        
        if (end < events.length) {
          setTimeout(processBatch, delay);
        }
      }
    };
    
    processBatch();
  };

  // 事件委托处理器
  const createEventDelegate = <T extends Event>(
    eventType: string,
    selector: string,
    handler: (event: T, target: Element) => void,
    options?: AddEventListenerOptions
  ) => {
    const delegateHandler = (event: Event) => {
      const target = (event.target as Element)?.closest(selector);
      if (target) {
        handler(event as T, target);
      }
    };
    
    document.addEventListener(eventType, delegateHandler, options);
    
    // 返回清理函数
    return () => {
      document.removeEventListener(eventType, delegateHandler, options);
    };
  };

  // 鼠标事件优化
  const optimizeMouseEvents = (
    element: HTMLElement,
    options: {
      moveThrottle?: number;
      clickDebounce?: number;
      enablePrediction?: boolean;
    } = {}
  ) => {
    const {
      moveThrottle = 16,
      clickDebounce = 100,
      enablePrediction = false
    } = options;
    
    let lastMousePos = { x: 0, y: 0 };
    let mouseVelocity = { x: 0, y: 0 };
    let lastMouseTime = 0;
    
    // 鼠标移动事件（节流）
    const throttledMouseMove = throttle((event: MouseEvent) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastMouseTime;
      
      if (deltaTime > 0) {
        mouseVelocity.x = (event.clientX - lastMousePos.x) / deltaTime;
        mouseVelocity.y = (event.clientY - lastMousePos.y) / deltaTime;
      }
      
      lastMousePos = { x: event.clientX, y: event.clientY };
      lastMouseTime = currentTime;
      
      element.dispatchEvent(new CustomEvent('optimizedmousemove', {
        detail: {
          originalEvent: event,
          position: lastMousePos,
          velocity: mouseVelocity
        }
      }));
    }, moveThrottle);
    
    // 点击事件（防抖）
    const debouncedClick = debounce((event: MouseEvent) => {
      element.dispatchEvent(new CustomEvent('optimizedclick', {
        detail: { originalEvent: event }
      }));
    }, clickDebounce);
    
    // 鼠标预测
    const predictMousePosition = () => {
      if (!enablePrediction) return null;
      
      return {
        x: lastMousePos.x + mouseVelocity.x * 16, // 预测下一帧位置
        y: lastMousePos.y + mouseVelocity.y * 16
      };
    };
    
    element.addEventListener('mousemove', throttledMouseMove);
    element.addEventListener('click', debouncedClick);
    
    return {
      cleanup: () => {
        element.removeEventListener('mousemove', throttledMouseMove);
        element.removeEventListener('click', debouncedClick);
      },
      predictMousePosition,
      getCurrentPosition: () => lastMousePos,
      getVelocity: () => mouseVelocity
    };
  };

  // 滚动事件优化
  const optimizeScrollEvents = (
    element: HTMLElement,
    options: {
      throttleInterval?: number;
      enableMomentum?: boolean;
    } = {}
  ) => {
    const {
      throttleInterval = 16,
      enableMomentum = true
    } = options;
    
    let lastScrollPos = { x: 0, y: 0 };
    let scrollVelocity = { x: 0, y: 0 };
    let lastScrollTime = 0;
    let scrollMomentum = { x: 0, y: 0 };
    
    const throttledScroll = throttle((event: Event) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastScrollTime;
      const target = event.target as HTMLElement;
      
      if (deltaTime > 0) {
        const currentScrollPos = {
          x: target.scrollLeft,
          y: target.scrollTop
        };
        
        scrollVelocity.x = (currentScrollPos.x - lastScrollPos.x) / deltaTime;
        scrollVelocity.y = (currentScrollPos.y - lastScrollPos.y) / deltaTime;
        
        if (enableMomentum) {
          scrollMomentum.x = scrollMomentum.x * 0.9 + scrollVelocity.x * 0.1;
          scrollMomentum.y = scrollMomentum.y * 0.9 + scrollVelocity.y * 0.1;
        }
        
        lastScrollPos = currentScrollPos;
      }
      
      lastScrollTime = currentTime;
      
      element.dispatchEvent(new CustomEvent('optimizedscroll', {
        detail: {
          originalEvent: event,
          position: lastScrollPos,
          velocity: scrollVelocity,
          momentum: scrollMomentum
        }
      }));
    }, throttleInterval);
    
    element.addEventListener('scroll', throttledScroll, { passive: true });
    
    return {
      cleanup: () => {
        element.removeEventListener('scroll', throttledScroll);
      },
      getVelocity: () => scrollVelocity,
      getMomentum: () => scrollMomentum
    };
  };

  // 获取事件统计信息
  const getEventStats = (): EventStats => {
    return { ...eventStats };
  };

  // 重置统计信息
  const resetStats = () => {
    eventStats.totalEvents = 0;
    eventStats.processedEvents = 0;
    eventStats.droppedEvents = 0;
    eventStats.averageProcessingTime = 0;
    eventStats.eventCounts = {};
    eventStats.queueSize = eventQueue.value.length;
    totalProcessingTime = 0;
  };

  // 清理资源
  const cleanup = () => {
    // 清除所有定时器
    for (const timerId of timers.values()) {
      clearTimeout(timerId);
    }
    timers.clear();
    
    // 清空事件队列
    eventQueue.value = [];
    
    // 重置统计
    resetStats();
  };

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    // 防抖和节流
    debounce,
    throttle,
    debounceOnce,
    
    // 事件队列
    queueEvent,
    processEventQueue,
    batchEvents,
    
    // 事件优化
    createEventDelegate,
    optimizeMouseEvents,
    optimizeScrollEvents,
    
    // 统计和清理
    getEventStats,
    resetStats,
    cleanup,
    
    // 响应式状态
    eventQueue,
    eventStats
  };
}

/**
 * 事件性能监控器
 */
export function useEventPerformanceMonitor() {
  const performanceData = ref<Array<{
    eventType: string;
    timestamp: number;
    duration: number;
  }>>([]);

  const trackEvent = (eventType: string, duration: number) => {
    performanceData.value.push({
      eventType,
      timestamp: Date.now(),
      duration
    });
    
    // 保持数据量在合理范围内
    if (performanceData.value.length > 1000) {
      performanceData.value = performanceData.value.slice(-500);
    }
  };

  const getAverageEventTime = (eventType?: string) => {
    const filtered = eventType 
      ? performanceData.value.filter(d => d.eventType === eventType)
      : performanceData.value;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, d) => sum + d.duration, 0);
    return total / filtered.length;
  };

  const getSlowEvents = (threshold = 50) => {
    return performanceData.value
      .filter(d => d.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  };

  return {
    performanceData,
    trackEvent,
    getAverageEventTime,
    getSlowEvents
  };
}