/**
 * 通用工具函数
 * 从 React 版本迁移并适配 Vue3
 */

import { ref, watch, onBeforeUnmount, type Ref } from 'vue';
import { debounce } from 'lodash';
import { deepEqual } from './support.js';

// 事件监听器组合式函数 (替代React的useEventListener)
export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  element: Ref<HTMLElement | null> | HTMLElement | Window | Document | null,
  options: AddEventListenerOptions = {}
) {
  const { passive = false, capture = false } = options;

  const cleanup = ref<(() => void) | null>(null);

  const attach = () => {
    const el = 'value' in element ? element.value : element;
    if (!el || !el.addEventListener) return;

    el.addEventListener(eventName, handler, { passive, capture });

    cleanup.value = () => {
      el.removeEventListener(eventName, handler, { capture });
    };
  };

  const detach = () => {
    cleanup.value?.();
    cleanup.value = null;
  };

  // 如果element是ref，监听其变化
  if ('value' in element) {
    watch(element, () => {
      detach();
      attach();
    }, { immediate: true });
  } else {
    attach();
  }

  onBeforeUnmount(() => {
    detach();
  });

  return detach;
}

// 条件返回函数
export function whenDefined<T>(obj: any, result: T): T | undefined {
  return obj === undefined ? undefined : result;
}

// 数学工具函数
const PI = Math.PI;
export function degreesToRadians(degrees: number): number {
  return (degrees * PI) / 180;
}

// 正方形边界框计算
export const getSquareBB = (posX: number, posY: number, squareSideLength: number) => ({
  x1: posX - squareSideLength / 2,
  y1: posY - squareSideLength / 2,
  x2: posX + squareSideLength / 2,
  y2: posY + squareSideLength / 2,
});

// 根据对齐方式获取正方形X位置
export const getSquareXPosFromAlign = (
  alignment: 'left' | 'center' | 'right',
  containerX: number,
  containerWidth: number,
  horizontalPadding: number,
  squareWidth: number
): number => {
  switch (alignment) {
    case 'left':
      return Math.floor(containerX) + horizontalPadding + squareWidth / 2;
    case 'center':
      return Math.floor(containerX + containerWidth / 2);
    case 'right':
      return Math.floor(containerX + containerWidth) - horizontalPadding - squareWidth / 2;
  }
};

// 计算正方形宽度
export const getSquareWidth = (maxSize: number, containerHeight: number, verticalPadding: number): number =>
  Math.min(maxSize, containerHeight - verticalPadding * 2);

// 边界框类型
type BoundingBox = { x1: number; y1: number; x2: number; y2: number };

// 判断点是否在边界框内
export const pointIsWithinBB = (x: number, y: number, bb: BoundingBox): boolean =>
  bb.x1 <= x && x <= bb.x2 && bb.y1 <= y && y <= bb.y2;

// 精灵图标属性接口
export interface SpriteProps {
  fgColor: string;
  bgColor: string;
}

// 防抖memo组合式函数 (替代React的useDebouncedMemo)
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: Ref<any>[],
  time: number
): Ref<T> {
  const result = ref(factory()) as Ref<T>;
  const isMounted = ref(true);

  const debouncedUpdate = debounce(() => {
    if (isMounted.value) {
      result.value = factory();
    }
  }, time);

  // 监听依赖变化
  watch(deps, () => {
    if (isMounted.value) {
      debouncedUpdate();
    }
  }, { deep: true });

  onBeforeUnmount(() => {
    isMounted.value = false;
    debouncedUpdate.cancel();
  });

  return result;
}

// 文本方向检测
const rtlRange = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const ltrRange =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF';

const rtl = new RegExp('^[^' + ltrRange + ']*[' + rtlRange + ']');

export function direction(value: string): 'rtl' | 'not-rtl' {
  return rtl.test(value) ? 'rtl' : 'not-rtl';
}

// 滚动条宽度缓存
let scrollbarWidthCache: number | undefined = undefined;

export function getScrollBarWidth(): number {
  if (typeof document === 'undefined') return 0;
  if (scrollbarWidthCache !== undefined) return scrollbarWidthCache;

  const inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '200px';

  const outer = document.createElement('div');
  outer.id = 'testScrollbar';

  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '200px';
  outer.style.height = '150px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);

  document.body.appendChild(outer);
  const w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  let w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }

  outer.remove();

  scrollbarWidthCache = w1 - w2;
  return scrollbarWidthCache;
}

// 响应式状态管理 (替代React的useStateWithReactiveInput)
export function useReactiveState<T>(initialValue: Ref<T> | T) {
  const inputValue = ref(initialValue);
  const internalValue = ref(initialValue);

  // 监听输入值变化
  watch(inputValue, (newValue) => {
    internalValue.value = newValue;
  }, { immediate: true });

  const setValue = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(internalValue.value)
      : newValue;
    internalValue.value = nextValue;
  };

  const reset = () => {
    internalValue.value = inputValue.value;
  };

  return {
    value: internalValue,
    setValue,
    reset,
  };
}

// 无障碍字符串生成
export function makeAccessibilityStringForArray(arr: readonly string[]): string {
  if (arr.length === 0) {
    return '';
  }

  let index = 0;
  let count = 0;
  for (const str of arr) {
    count += str.length;
    if (count > 10_000) break;
    index++;
  }
  return arr.slice(0, index).join(', ');
}

// 深度比较memo (替代React的useDeepMemo)
export function useDeepMemo<T>(value: Ref<T>): Ref<T> {
  const result = ref(value.value) as Ref<T>;

  watch(value, (newValue) => {
    if (!deepEqual(newValue, result.value)) {
      result.value = newValue;
    }
  }, { deep: true });

  return result;
}

// 节流函数
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

// RAF节流 (用于动画)
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

// 安全的JSON操作
export function safeParseJSON<T = any>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

export function safeStringifyJSON(obj: any, defaultValue = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}

// 数组工具
export function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = array.slice();
  const [element] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, element);
  return result;
}

export function arrayInsert<T>(array: T[], index: number, item: T): T[] {
  const result = array.slice();
  result.splice(index, 0, item);
  return result;
}

export function arrayRemove<T>(array: T[], index: number): T[] {
  const result = array.slice();
  result.splice(index, 1);
  return result;
}

// 尺寸相关工具
export function getTextWidth(text: string, font: string): number {
  if (typeof document === 'undefined') return 0;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;

  context.font = font;
  return context.measureText(text).width;
}

// CSS 单位转换
export function pxToRem(px: number, baseFontSize = 16): number {
  return px / baseFontSize;
}

export function remToPx(rem: number, baseFontSize = 16): number {
  return rem * baseFontSize;
}

// 颜色工具
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// 平台检测
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toLowerCase().includes('mac');
}

export function isWindows(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toLowerCase().includes('win');
}

// 键盘事件工具
export function isModifierKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

export function getModifierKey(): 'Ctrl' | 'Cmd' {
  return isMac() ? 'Cmd' : 'Ctrl';
}
