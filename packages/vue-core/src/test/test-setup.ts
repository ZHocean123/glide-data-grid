/**
 * 测试设置文件
 * 为所有测试提供全局配置和模拟
 */

import { vi, beforeEach, afterEach } from 'vitest';

// 模拟Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4)
    })),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    fill: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    isPointInPath: vi.fn(() => false),
    isPointInStroke: vi.fn(() => false)
  })),
  writable: true
});

// 模拟ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// 模拟IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(() => [])
}));

// 模拟MutationObserver
globalThis.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// 模拟requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
globalThis.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// 模拟performance API
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2048 * 1024 * 1024
    }
  },
  writable: true
});

// 模拟媒体查询
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟BroadcastChannel
globalThis.BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));

// 模拟localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// 模拟navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue([])
  },
  writable: true
});

// 模拟console方法以减少测试输出噪音
const originalConsole = { ...console };
globalThis.console = {
  ...originalConsole,
  // 保留error和warn
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // error和warn使用原始方法以便调试
  error: originalConsole.error,
  warn: originalConsole.warn
};

// 模拟Touch事件
Object.defineProperty(window, 'TouchEvent', {
  value: vi.fn().mockImplementation((type, eventInitDict) => {
    const event = new Event(type, eventInitDict);
    Object.defineProperty(event, 'touches', {
      value: eventInitDict?.touches || [],
      writable: false
    });
    Object.defineProperty(event, 'targetTouches', {
      value: eventInitDict?.targetTouches || [],
      writable: false
    });
    Object.defineProperty(event, 'changedTouches', {
      value: eventInitDict?.changedTouches || [],
      writable: false
    });
    return event;
  })
});

// 模拟Touch对象
Object.defineProperty(window, 'Touch', {
  value: vi.fn().mockImplementation((touchInitDict) => ({
    identifier: touchInitDict?.identifier || 0,
    target: touchInitDict?.target || null,
    clientX: touchInitDict?.clientX || 0,
    clientY: touchInitDict?.clientY || 0,
    pageX: touchInitDict?.pageX || 0,
    pageY: touchInitDict?.pageY || 0,
    screenX: touchInitDict?.screenX || 0,
    screenY: touchInitDict?.screenY || 0,
    radiusX: touchInitDict?.radiusX || 0,
    radiusY: touchInitDict?.radiusY || 0,
    rotationAngle: touchInitDict?.rotationAngle || 0,
    force: touchInitDict?.force || 1
  }))
});

// 模拟Pointer事件
Object.defineProperty(window, 'PointerEvent', {
  value: vi.fn().mockImplementation((type, eventInitDict) => {
    const event = new MouseEvent(type, eventInitDict);
    Object.defineProperty(event, 'pointerId', {
      value: eventInitDict?.pointerId || 1,
      writable: false
    });
    Object.defineProperty(event, 'pointerType', {
      value: eventInitDict?.pointerType || 'mouse',
      writable: false
    });
    return event;
  })
});

// 全局测试设置
beforeEach(() => {
  // 清除所有模拟调用
  vi.clearAllMocks();
  
  // 重置localStorage模拟
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // 重置sessionStorage模拟
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

afterEach(() => {
  // 清理DOM
  document.body.innerHTML = '';
  document.documentElement.innerHTML = '';
  
  // 重置documentElement样式
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('data-viewport');
});

// 导出测试工具
export * from './test-utils.js';