/**
 * 测试工具函数
 */

import type { GridCell, GridColumn } from '../../internal/data-grid/data-grid-types';

// 创建测试数据集
export function createLargeDataset(rows: number, cols: number): GridCell[][] {
  const data: GridCell[][] = [];
  
  for (let row = 0; row < rows; row++) {
    const rowData: GridCell[] = [];
    for (let col = 0; col < cols; col++) {
      rowData.push({
        kind: 'text',
        data: `Cell ${row}-${col}`,
        displayData: `Cell ${row}-${col}`,
        allowOverlay: true,
        readonly: false
      });
    }
    data.push(rowData);
  }
  
  return data;
}

// 创建中等大小的测试数据集
export function createMediumDataset(rows: number = 1000, cols: number = 20): GridCell[][] {
  return createLargeDataset(rows, cols);
}

// 创建小型测试数据集
export function createSmallDataset(rows: number = 10, cols: number = 5): GridCell[][] {
  return createLargeDataset(rows, cols);
}

// 创建测试列
export function createTestColumns(count: number): GridColumn[] {
  const columns: GridColumn[] = [];
  
  for (let i = 0; i < count; i++) {
    columns.push({
      id: `col-${i}`,
      title: `Column ${i}`,
      width: 150,
      icon: undefined,
      hasMenu: false,
      overlayIcon: undefined,
      style: 'normal',
      theme: undefined,
      grow: 0,
      sticky: undefined,
      contentAlign: undefined,
      trailingRowOptions: undefined
    });
  }
  
  return columns;
}

// 模拟DOM事件
export function createMockEvent(type: string, properties: Record<string, any> = {}): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  
  Object.assign(event, properties);
  
  return event;
}

// 模拟鼠标事件
export function createMockMouseEvent(type: string, x: number, y: number, properties: Record<string, any> = {}): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    ...properties
  });
  
  return event;
}

// 模拟键盘事件
export function createMockKeyboardEvent(type: string, key: string, properties: Record<string, any> = {}): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key,
    ...properties
  });
  
  return event;
}

// 模拟Canvas上下文
export function createMockCanvasContext(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }
  
  return ctx;
}

// 等待下一个动画帧
export function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

// 等待指定时间
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

// 模拟性能API
export function createMockPerformanceAPI() {
  const entries: PerformanceEntry[] = [];
  
  return {
    now: () => Date.now(),
    mark: (name: string) => {
      entries.push({
        name,
        entryType: 'mark',
        startTime: performance.now(),
        duration: 0
      } as PerformanceMark);
    },
    measure: (name: string, startMark?: string, endMark?: string) => {
      const startTime = startMark ? performance.now() : 0;
      const duration = endMark ? performance.now() - startTime : 0;
      
      entries.push({
        name,
        entryType: 'measure',
        startTime,
        duration
      } as PerformanceMeasure);
    },
    getEntries: () => entries,
    getEntriesByName: (name: string) => entries.filter(entry => entry.name === name),
    getEntriesByType: (type: string) => entries.filter(entry => entry.entryType === type),
    clearMarks: (name?: string) => {
      if (name) {
        const index = entries.findIndex(entry => entry.name === name && entry.entryType === 'mark');
        if (index !== -1) {
          entries.splice(index, 1);
        }
      } else {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (entries[i].entryType === 'mark') {
            entries.splice(i, 1);
          }
        }
      }
    },
    clearMeasures: (name?: string) => {
      if (name) {
        const index = entries.findIndex(entry => entry.name === name && entry.entryType === 'measure');
        if (index !== -1) {
          entries.splice(index, 1);
        }
      } else {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (entries[i].entryType === 'measure') {
            entries.splice(i, 1);
          }
        }
      }
    }
  };
}

// 模拟内存API
export function createMockMemoryAPI() {
  return {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2048 * 1024 * 1024 // 2GB
  };
}

// 模拟IntersectionObserver
export function createMockIntersectionObserver(callback: IntersectionObserverCallback) {
  const observers = new Set<Element>();
  
  const observer = {
    observe: (element: Element) => {
      observers.add(element);
      
      // 立即触发回调
      setTimeout(() => {
        callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: element.getBoundingClientRect(),
          intersectionRect: element.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now()
        }], observer);
      }, 0);
    },
    unobserve: (element: Element) => {
      observers.delete(element);
    },
    disconnect: () => {
      observers.clear();
    },
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: () => []
  };
}

// 模拟ResizeObserver
export function createMockResizeObserver(callback: ResizeObserverCallback) {
  const observers = new Set<Element>();
  
  const observer = {
    observe: (element: Element) => {
      observers.add(element);
      
      // 立即触发回调
      setTimeout(() => {
        callback([{
          target: element,
          contentRect: element.getBoundingClientRect(),
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: []
        }], observer);
      }, 0);
    },
    unobserve: (element: Element) => {
      observers.delete(element);
    },
    disconnect: () => {
      observers.clear();
    }
  };
}

// 设置全局模拟
export function setupGlobalMocks() {
  // 模拟performance.memory
  if (!(performance as any).memory) {
    (performance as any).memory = createMockMemoryAPI();
  }
  
  // 模拟IntersectionObserver
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = createMockIntersectionObserver as any;
  }
  
  // 模拟ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = createMockResizeObserver as any;
  }
  
  // 模拟requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(Date.now()), 16) as unknown as number;
    };
  }
  
  // 模拟cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
}

// 清理全局模拟
export function cleanupGlobalMocks() {
  delete (performance as any).memory;
  delete (window as any).IntersectionObserver;
  delete (window as any).ResizeObserver;
}