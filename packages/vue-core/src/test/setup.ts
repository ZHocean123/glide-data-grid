import { vi, expect } from 'vitest';

// 全局模拟
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb: any) => setTimeout(cb, 16))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn((id: any) => clearTimeout(id))
});

Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// 模拟Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  createImageData: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '12px Arial',
  textAlign: 'left',
  textBaseline: 'middle',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over'
} as any));

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// 模拟MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

// Vue测试工具配置（暂时注释掉，因为没有安装@vue/test-utils）
// config.global.stubs = {
//   'transition': false,
//   'transition-group': false,
//   'keep-alive': false,
//   'teleport': false
// };

// 模拟console方法以减少测试输出噪音
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
};

// 添加自定义匹配器
expect.extend({
  toBeApproximately(received: number, expected: number, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision);
    return {
      message: () =>
        `expected ${received} to be approximately ${expected} (±${Math.pow(10, -precision)})`,
      pass
    };
  }
});

// 扩展Expect类型
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeApproximately(expected: number, precision?: number): T;
    }
  }
}