/**
 * Vue版本的缩放支持
 * 提供字体缩放和界面缩放功能
 */

import { ref, computed, reactive, watch, onMounted, type Ref } from 'vue';

export interface ZoomSupportOptions {
  /** 默认缩放级别 */
  defaultZoom?: number;
  /** 最小缩放级别 */
  minZoom?: number;
  /** 最大缩放级别 */
  maxZoom?: number;
  /** 缩放步长 */
  zoomStep?: number;
  /** 是否启用键盘快捷键 */
  enableKeyboardShortcuts?: boolean;
  /** 是否启用鼠标滚轮缩放 */
  enableWheelZoom?: boolean;
  /** 是否需要按住Ctrl键进行滚轮缩放 */
  requireCtrlForWheel?: boolean;
  /** 缩放模式 */
  zoomMode?: 'font' | 'interface' | 'both';
}

export interface ZoomSupportState {
  /** 当前缩放级别 */
  currentZoom: number;
  /** 系统缩放级别 */
  systemZoom: number;
  /** 是否正在缩放 */
  isZooming: boolean;
  /** 缩放中心点 */
  zoomCenter: { x: number; y: number } | null;
}

export function useZoomSupport(
  options: Ref<ZoomSupportOptions> | ZoomSupportOptions = {}
) {
  // 将选项转换为响应式引用
  const optionsRef = ref(options) as Ref<ZoomSupportOptions>;
  
  // 缩放状态
  const zoomState = reactive<ZoomSupportState>({
    currentZoom: 1,
    systemZoom: 1,
    isZooming: false,
    zoomCenter: null
  });

  // 默认选项
  const defaultOptions = {
    defaultZoom: 1,
    minZoom: 0.5,
    maxZoom: 3,
    zoomStep: 0.1,
    enableKeyboardShortcuts: true,
    enableWheelZoom: true,
    requireCtrlForWheel: true,
    zoomMode: 'both'
  };

  // 计算实际选项
  const actualOptions = computed(() => ({
    ...defaultOptions,
    ...optionsRef.value
  }));

  // 计算当前缩放级别
  const currentZoomLevel = computed(() => {
    return zoomState.currentZoom;
  });

  // 计算缩放百分比
  const zoomPercentage = computed(() => {
    return Math.round(zoomState.currentZoom * 100);
  });

  // 计算CSS变换
  const cssTransform = computed(() => {
    const { zoomMode } = actualOptions.value;
    
    if (zoomMode === 'font') {
      return {
        fontSize: `${zoomState.currentZoom}em`
      };
    } else if (zoomMode === 'interface') {
      return {
        transform: `scale(${zoomState.currentZoom})`,
        transformOrigin: zoomState.zoomCenter ? 
          `${zoomState.zoomCenter.x}px ${zoomState.zoomCenter.y}px` : 
          'center center'
      };
    } else {
      return {
        fontSize: `${zoomState.currentZoom}em`,
        transform: `scale(${zoomState.currentZoom})`,
        transformOrigin: zoomState.zoomCenter ? 
          `${zoomState.zoomCenter.x}px ${zoomState.zoomCenter.y}px` : 
          'center center'
      };
    }
  });

  // 计算CSS变量
  const cssVariables = computed(() => {
    return {
      '--gdg-zoom-level': zoomState.currentZoom.toString(),
      '--gdg-zoom-percentage': `${zoomPercentage.value}%`,
      '--gdg-font-size': `${zoomState.currentZoom}em`,
      '--gdg-scale': zoomState.currentZoom.toString()
    };
  });

  // 应用缩放
  const applyZoom = () => {
    const root = document.documentElement;
    const body = document.body;
    
    // 应用CSS变量
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // 应用缩放属性
    body.setAttribute('data-zoom-level', zoomState.currentZoom.toString());
    body.setAttribute('data-zoom-percentage', zoomPercentage.value.toString());
    
    // 应用缩放模式
    body.setAttribute('data-zoom-mode', actualOptions.value.zoomMode);
    
    // 应用变换
    if (actualOptions.value.zoomMode === 'interface' || actualOptions.value.zoomMode === 'both') {
      Object.assign(root.style, {
        transform: cssTransform.value.transform,
        transformOrigin: cssTransform.value.transformOrigin
      });
    }
    
    // 应用字体大小
    if (actualOptions.value.zoomMode === 'font' || actualOptions.value.zoomMode === 'both') {
      const fontSize = cssTransform.value.fontSize;
      if (fontSize) {
        root.style.fontSize = fontSize;
      }
    }
  };

  // 设置缩放级别
  const setZoomLevel = (level: number, center?: { x: number; y: number }) => {
    const { minZoom, maxZoom } = actualOptions.value;
    
    // 限制缩放范围
    const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level));
    
    // 如果没有变化，直接返回
    if (Math.abs(clampedLevel - zoomState.currentZoom) < 0.01) return;
    
    // 设置缩放中心
    if (center) {
      zoomState.zoomCenter = center;
    }
    
    // 更新缩放级别
    zoomState.currentZoom = clampedLevel;
    zoomState.isZooming = true;
    
    // 应用缩放
    applyZoom();
    
    // 重置缩放状态
    setTimeout(() => {
      zoomState.isZooming = false;
    }, 100);
  };

  // 增加缩放级别
  const increaseZoom = (center?: { x: number; y: number }) => {
    const { zoomStep } = actualOptions.value;
    setZoomLevel(zoomState.currentZoom + zoomStep, center);
  };

  // 减少缩放级别
  const decreaseZoom = (center?: { x: number; y: number }) => {
    const { zoomStep } = actualOptions.value;
    setZoomLevel(zoomState.currentZoom - zoomStep, center);
  };

  // 重置缩放级别
  const resetZoom = () => {
    const { defaultZoom } = actualOptions.value;
    setZoomLevel(defaultZoom);
    zoomState.zoomCenter = null;
  };

  // 放大到合适大小
  const zoomToFit = (element?: HTMLElement) => {
    if (!element) return;
    
    const container = element.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // 计算适合的缩放级别
    const scaleX = containerRect.width / elementRect.width;
    const scaleY = containerRect.height / elementRect.height;
    const scale = Math.min(scaleX, scaleY, actualOptions.value.maxZoom);
    
    // 计算缩放中心
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    setZoomLevel(scale, { x: centerX, y: centerY });
  };

  // 检测系统缩放级别
  const detectSystemZoom = () => {
    // 检测设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 检测浏览器缩放
    const zoomLevel = Math.round(window.outerWidth / window.innerWidth * 100) / 100;
    
    // 使用较大的值作为系统缩放级别
    zoomState.systemZoom = Math.max(dpr, zoomLevel);
  };

  // 处理键盘快捷键
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    const { enableKeyboardShortcuts, requireCtrlForWheel } = actualOptions.value;
    
    if (!enableKeyboardShortcuts) return;
    
    // Ctrl/Cmd + Plus/Minus 缩放
    const isCtrlKey = event.ctrlKey || event.metaKey;
    
    if (isCtrlKey) {
      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          increaseZoom();
          break;
        case '-':
        case '_':
          event.preventDefault();
          decreaseZoom();
          break;
        case '0':
          event.preventDefault();
          resetZoom();
          break;
      }
    }
    
    // Ctrl/Cmd + 鼠标滚轮缩放
    if (requireCtrlForWheel && !isCtrlKey) return;
  };

  // 处理鼠标滚轮缩放
  const handleWheelZoom = (event: WheelEvent) => {
    const { enableWheelZoom, requireCtrlForWheel } = actualOptions.value;
    
    if (!enableWheelZoom) return;
    
    // 检查是否需要按住Ctrl键
    const isCtrlKey = event.ctrlKey || event.metaKey;
    if (requireCtrlForWheel && !isCtrlKey) return;
    
    // 阻止默认行为
    event.preventDefault();
    
    // 计算缩放中心
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    
    // 根据滚轮方向缩放
    if (event.deltaY < 0) {
      increaseZoom({ x: centerX, y: centerY });
    } else {
      decreaseZoom({ x: centerX, y: centerY });
    }
  };

  // 处理触摸缩放
  let touchStartDistance = 0;
  let touchStartZoom = 1;
  
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2) return;
    
    // 计算两点之间的距离
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    touchStartZoom = zoomState.currentZoom;
  };
  
  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 2) return;
    
    // 计算当前两点之间的距离
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算缩放比例
    const scale = currentDistance / touchStartDistance;
    const newZoom = touchStartZoom * scale;
    
    // 计算缩放中心
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
    
    // 应用缩放
    setZoomLevel(newZoom, { x: centerX, y: centerY });
  };

  // 设置事件监听器
  const setupEventListeners = (element?: HTMLElement) => {
    // 键盘事件监听器
    const keyboardHandler = (e: Event) => handleKeyboardShortcut(e as KeyboardEvent);
    document.addEventListener('keydown', keyboardHandler);
    
    // 鼠标滚轮事件监听器
    let wheelHandler: ((e: Event) => void) | null = null;
    if (element) {
      wheelHandler = (e: Event) => handleWheelZoom(e as WheelEvent);
      element.addEventListener('wheel', wheelHandler, { passive: false });
    }
    
    // 触摸事件监听器
    let touchStartHandler: ((e: Event) => void) | null = null;
    let touchMoveHandler: ((e: Event) => void) | null = null;
    if (element) {
      touchStartHandler = (e: Event) => handleTouchStart(e as TouchEvent);
      touchMoveHandler = (e: Event) => handleTouchMove(e as TouchEvent);
      element.addEventListener('touchstart', touchStartHandler);
      element.addEventListener('touchmove', touchMoveHandler, { passive: false });
    }
    
    // 窗口大小变化监听器
    const resizeHandler = () => {
      detectSystemZoom();
    };
    window.addEventListener('resize', resizeHandler);
    
    // 返回清理函数
    return () => {
      document.removeEventListener('keydown', keyboardHandler);
      if (wheelHandler && element) {
        element.removeEventListener('wheel', wheelHandler);
      }
      if (touchStartHandler && element) {
        element.removeEventListener('touchstart', touchStartHandler);
      }
      if (touchMoveHandler && element) {
        element.removeEventListener('touchmove', touchMoveHandler);
      }
      window.removeEventListener('resize', resizeHandler);
    };
  };

  // 监听选项变化
  watch(() => optionsRef.value, () => {
    applyZoom();
  }, { deep: true });

  // 监听缩放状态变化
  watch(() => zoomState.currentZoom, () => {
    applyZoom();
  });

  // 生命周期
  onMounted(() => {
    detectSystemZoom();
    
    // 设置默认缩放级别
    const { defaultZoom } = actualOptions.value;
    if (defaultZoom !== 1) {
      setZoomLevel(defaultZoom);
    }
  });

  return {
    // 状态
    zoomState,
    
    // 计算属性
    currentZoomLevel,
    zoomPercentage,
    cssTransform,
    cssVariables,
    
    // 方法
    setZoomLevel,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    zoomToFit,
    detectSystemZoom,
    applyZoom,
    setupEventListeners
  };
}