/**
 * 支持工具函数
 * 从 React 版本迁移，保持核心逻辑不变
 */

// 类型证明函数 (编译时类型检查)
export function proveType<T>(_val: T): void {
  // 什么都不做，只是证明编译器认为类型匹配
}

// 抛出错误的panic函数
function panic(message = 'This should not happen'): never {
  throw new Error(message);
}

// 断言函数
export function assert(fact: boolean, message = 'Assertion failed'): asserts fact {
  if (fact) return;
  return panic(message);
}

// 永不到达断言
export function assertNever(_never: never, msg?: string): never {
  return panic(msg ?? 'Hell froze over');
}

// 安全执行函数，失败时返回默认值
export function maybe<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

// 深度相等比较 (移植自 Luke Edwards 的 dequal 库，MIT许可)
const has = Object.prototype.hasOwnProperty;

export function deepEqual(foo: any, bar: any): boolean {
  let ctor: any, len: number;
  if (foo === bar) return true;

  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
    if (ctor === Date) return foo.getTime() === bar.getTime();
    if (ctor === RegExp) return foo.toString() === bar.toString();

    if (ctor === Array) {
      if ((len = foo.length) === bar.length) {
        while (len-- && deepEqual(foo[len], bar[len]));
      }
      return len === -1;
    }

    if (!ctor || typeof foo === 'object') {
      len = 0;
      for (ctor in foo) {
        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
        if (!(ctor in bar) || !deepEqual(foo[ctor], bar[ctor])) return false;
      }
      return Object.keys(bar).length === len;
    }
  }

  return foo !== foo && bar !== bar;
}

// 强制类型完全定义 (V8优化辅助)
export type FullyDefined<T> = {
  [K in keyof Required<T>]: T[K];
};

// Vue3 特有的工具函数

// 安全的JSON解析
export function safeJsonParse<T = any>(str: string, defaultValue: T): T {
  return maybe(() => JSON.parse(str), defaultValue);
}

// 安全的JSON字符串化
export function safeJsonStringify(obj: any, defaultValue = '{}'): string {
  return maybe(() => JSON.stringify(obj), defaultValue);
}

// 对象属性安全访问
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

// 数组安全访问
export function safeArrayGet<T>(arr: T[] | null | undefined, index: number): T | undefined {
  return arr?.[index];
}

// 数字范围限制
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 调试相关函数
export function logDev(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Vue Glide Data Grid] ${message}`, ...args);
  }
}

export function warnDev(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Vue Glide Data Grid] ${message}`, ...args);
  }
}

export function errorDev(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Vue Glide Data Grid] ${message}`, ...args);
  }
}

// 性能测量
export function measurePerformance<T>(name: string, fn: () => T): T {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    logDev(`Performance: ${name} took ${end - start}ms`);
    return result;
  }
  return fn();
}

// 异步性能测量
export async function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    logDev(`Performance: ${name} took ${end - start}ms`);
    return result;
  }
  return await fn();
}

// 防抖函数 (简化版本)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数 (简化版本)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}

// 唯一ID生成器
let idCounter = 0;
export function generateId(prefix = 'id'): string {
  return `${prefix}_${++idCounter}_${Date.now()}`;
}

// 类型检查工具
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}
