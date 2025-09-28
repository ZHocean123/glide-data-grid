/**
 * 浏览器检测工具
 * 从 React 版本迁移，适配 Vue3 和 SSR 环境
 */

// 懒加载类，用于延迟初始化昂贵的计算
class Lazy<T> {
  private fn: () => T;
  private val: T | undefined;

  constructor(fn: () => T) {
    this.fn = fn;
  }

  public get value(): T {
    return this.val ?? (this.val = this.fn());
  }
}

function lazy<T>(fn: () => T): Lazy<T> {
  return new Lazy(fn);
}

// 检查是否在浏览器环境中
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
}

// 安全获取 navigator 信息
function safeNavigator() {
  if (!isBrowser()) {
    return {
      userAgent: '',
      platform: '',
      vendor: '',
    };
  }
  return window.navigator;
}

// 浏览器检测 (懒加载，SSR友好)
export const browserIsFirefox = lazy(() => {
  return safeNavigator().userAgent.includes('Firefox');
});

export const browserIsSafari = lazy(() => {
  const nav = safeNavigator();
  return (
    nav.userAgent.includes('Mac OS') &&
    nav.userAgent.includes('Safari') &&
    !nav.userAgent.includes('Chrome')
  );
});

export const browserIsChrome = lazy(() => {
  const nav = safeNavigator();
  return nav.userAgent.includes('Chrome') && !nav.userAgent.includes('Edge');
});

export const browserIsEdge = lazy(() => {
  return safeNavigator().userAgent.includes('Edge');
});

export const browserIsWebKit = lazy(() => {
  return safeNavigator().userAgent.includes('WebKit');
});

// 操作系统检测
export const browserIsOSX = lazy(() => {
  return safeNavigator().platform.toLowerCase().startsWith('mac');
});

export const browserIsWindows = lazy(() => {
  return safeNavigator().platform.toLowerCase().startsWith('win');
});

export const browserIsLinux = lazy(() => {
  const platform = safeNavigator().platform.toLowerCase();
  return platform.includes('linux') || platform.includes('x11');
});

export const browserIsIOS = lazy(() => {
  const nav = safeNavigator();
  return /iPad|iPhone|iPod/.test(nav.userAgent);
});

export const browserIsAndroid = lazy(() => {
  return safeNavigator().userAgent.includes('Android');
});

export const browserIsMobile = lazy(() => {
  return browserIsIOS.value || browserIsAndroid.value;
});

// 设备检测
export const deviceHasTouch = lazy(() => {
  if (!isBrowser()) return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
});

export const deviceIsHighDPI = lazy(() => {
  if (!isBrowser()) return false;
  return window.devicePixelRatio > 1;
});

// 功能检测
export const supportsPassiveEvents = lazy(() => {
  if (!isBrowser()) return false;

  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return false;
      },
    });
    window.addEventListener('testPassive', () => {}, opts);
    window.removeEventListener('testPassive', () => {}, opts);
  } catch {
    supportsPassive = false;
  }
  return supportsPassive;
});

export const supportsResizeObserver = lazy(() => {
  if (!isBrowser()) return false;
  return typeof ResizeObserver !== 'undefined';
});

export const supportsIntersectionObserver = lazy(() => {
  if (!isBrowser()) return false;
  return typeof IntersectionObserver !== 'undefined';
});

export const supportsOffscreenCanvas = lazy(() => {
  if (!isBrowser()) return false;
  return typeof OffscreenCanvas !== 'undefined';
});

export const supportsImageBitmap = lazy(() => {
  if (!isBrowser()) return false;
  return typeof createImageBitmap !== 'undefined';
});

// CSS 功能检测
export const supportsCSS = lazy(() => {
  if (!isBrowser()) return false;
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
});

export const supportsCSSGrid = lazy(() => {
  if (!supportsCSS.value) return false;
  return CSS.supports('display', 'grid');
});

export const supportsCSSFlexbox = lazy(() => {
  if (!supportsCSS.value) return false;
  return CSS.supports('display', 'flex');
});

export const supportsCSSContainerQueries = lazy(() => {
  if (!supportsCSS.value) return false;
  return CSS.supports('container-type', 'inline-size');
});

// 性能相关检测
export const supportsRequestIdleCallback = lazy(() => {
  if (!isBrowser()) return false;
  return typeof requestIdleCallback !== 'undefined';
});

export const supportsWebGL = lazy(() => {
  if (!isBrowser()) return false;

  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
});

export const supportsWebGL2 = lazy(() => {
  if (!isBrowser()) return false;

  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
});

// 滚动条宽度检测
export const getScrollBarWidth = lazy(() => {
  if (!isBrowser()) return 17; // 默认值，用于SSR

  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  outer.style.msOverflowStyle = 'scrollbar'; // 需要IE

  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  // 强制显示滚动条
  outer.style.overflow = 'scroll';

  // 添加内部div
  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  // 移除div
  outer.parentNode?.removeChild(outer);

  return widthNoScroll - widthWithScroll;
});

// 浏览器引擎信息
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  os: string;
  mobile: boolean;
  touch: boolean;
  highDPI: boolean;
}

export const getBrowserInfo = lazy((): BrowserInfo => {
  const nav = safeNavigator();

  let name = 'Unknown';
  let engine = 'Unknown';

  if (browserIsFirefox.value) {
    name = 'Firefox';
    engine = 'Gecko';
  } else if (browserIsSafari.value) {
    name = 'Safari';
    engine = 'WebKit';
  } else if (browserIsChrome.value) {
    name = 'Chrome';
    engine = 'Blink';
  } else if (browserIsEdge.value) {
    name = 'Edge';
    engine = 'Blink';
  }

  let os = 'Unknown';
  if (browserIsOSX.value) os = 'macOS';
  else if (browserIsWindows.value) os = 'Windows';
  else if (browserIsLinux.value) os = 'Linux';
  else if (browserIsIOS.value) os = 'iOS';
  else if (browserIsAndroid.value) os = 'Android';

  // 简化的版本检测
  const version = nav.userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[1] || 'Unknown';

  return {
    name,
    version,
    engine,
    os,
    mobile: browserIsMobile.value,
    touch: deviceHasTouch.value,
    highDPI: deviceIsHighDPI.value,
  };
});

// 导出便捷函数
export function logBrowserInfo(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Browser Info:', getBrowserInfo.value);
  }
}
