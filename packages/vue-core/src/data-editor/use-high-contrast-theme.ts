/**
 * Vue版本的高对比度主题支持
 * 提供高对比度模式的主题切换和样式管理
 */

import { ref, computed, reactive, watch, onMounted, onUnmounted, type Ref } from 'vue';

export interface HighContrastThemeOptions {
  /** 是否启用高对比度模式 */
  enabled?: boolean;
  /** 主题类型 */
  theme?: 'light' | 'dark' | 'system';
  /** 自定义高对比度颜色 */
  customColors?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    focusColor?: string;
    selectedColor?: string;
  };
}

export interface HighContrastThemeState {
  /** 是否启用高对比度模式 */
  enabled: boolean;
  /** 当前主题类型 */
  theme: 'light' | 'dark' | 'system';
  /** 系统是否处于高对比度模式 */
  systemHighContrast: boolean;
  /** 当前颜色方案 */
  colors: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    borderColor: string;
    focusColor: string;
    selectedColor: string;
  };
}

export function useHighContrastTheme(
  options: Ref<HighContrastThemeOptions> | HighContrastThemeOptions = {}
) {
  // 将选项转换为响应式引用
  const optionsRef = ref(options) as Ref<HighContrastThemeOptions>;
  
  // 高对比度主题状态
  const themeState = reactive<HighContrastThemeState>({
    enabled: false,
    theme: 'system',
    systemHighContrast: false,
    colors: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      accentColor: '#FFFF00',
      borderColor: '#FFFFFF',
      focusColor: '#FFFF00',
      selectedColor: '#FFFF00'
    }
  });

  // 默认高对比度颜色方案
  const defaultColors = {
    light: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      accentColor: '#FFFF00',
      borderColor: '#FFFFFF',
      focusColor: '#FFFF00',
      selectedColor: '#FFFF00'
    },
    dark: {
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      accentColor: '#0000FF',
      borderColor: '#000000',
      focusColor: '#0000FF',
      selectedColor: '#0000FF'
    }
  };

  // 计算当前是否启用高对比度模式
  const isHighContrastEnabled = computed(() => {
    const { enabled, theme } = optionsRef.value;
    const systemEnabled = theme === 'system' ? themeState.systemHighContrast : enabled;
    return systemEnabled || themeState.enabled;
  });

  // 计算当前主题类型
  const currentTheme = computed(() => {
    const { theme } = optionsRef.value;
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme || 'light';
  });

  // 计算当前颜色方案
  const currentColors = computed(() => {
    const { customColors } = optionsRef.value;
    const baseColors = defaultColors[currentTheme.value];
    
    return {
      ...baseColors,
      ...customColors,
      ...themeState.colors
    };
  });

  // 计算CSS变量
  const cssVariables = computed(() => {
    const colors = currentColors.value;
    
    return {
      '--gdg-high-contrast-bg': colors.backgroundColor,
      '--gdg-high-contrast-text': colors.textColor,
      '--gdg-high-contrast-accent': colors.accentColor,
      '--gdg-high-contrast-border': colors.borderColor,
      '--gdg-high-contrast-focus': colors.focusColor,
      '--gdg-high-contrast-selected': colors.selectedColor,
      '--gdg-high-contrast-enabled': isHighContrastEnabled.value ? '1' : '0'
    };
  });

  // 应用主题到DOM
  const applyTheme = () => {
    const root = document.documentElement;
    const body = document.body;
    
    // 应用CSS变量
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // 设置高对比度模式属性
    if (isHighContrastEnabled.value) {
      body.setAttribute('data-high-contrast', 'true');
      root.setAttribute('data-high-contrast', 'true');
    } else {
      body.removeAttribute('data-high-contrast');
      root.removeAttribute('data-high-contrast');
    }
    
    // 设置主题类型属性
    body.setAttribute('data-theme', currentTheme.value);
    root.setAttribute('data-theme', currentTheme.value);
  };

  // 检测系统高对比度模式
  const checkSystemHighContrast = () => {
    // 检测Windows高对比度模式
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    themeState.systemHighContrast = mediaQuery.matches;
    
    // 检测强制颜色模式
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    if (forcedColorsQuery.matches) {
      themeState.systemHighContrast = true;
    }
  };

  // 切换高对比度模式
  const toggleHighContrast = () => {
    themeState.enabled = !themeState.enabled;
    applyTheme();
  };

  // 启用高对比度模式
  const enableHighContrast = () => {
    themeState.enabled = true;
    applyTheme();
  };

  // 禁用高对比度模式
  const disableHighContrast = () => {
    themeState.enabled = false;
    applyTheme();
  };

  // 设置主题类型
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    optionsRef.value.theme = theme;
    applyTheme();
  };

  // 设置自定义颜色
  const setCustomColors = (colors: Partial<HighContrastThemeOptions['customColors']>) => {
    optionsRef.value.customColors = {
      ...optionsRef.value.customColors,
      ...colors
    };
    applyTheme();
  };

  // 重置为默认主题
  const resetTheme = () => {
    themeState.enabled = false;
    optionsRef.value.theme = 'system';
    optionsRef.value.customColors = undefined;
    applyTheme();
  };

  // 监听系统主题变化
  const setupThemeWatchers = () => {
    // 监听系统颜色方案变化
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = () => {
      if (optionsRef.value.theme === 'system') {
        applyTheme();
      }
    };
    
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);
    
    // 监听系统高对比度模式变化
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      themeState.systemHighContrast = e.matches;
      if (optionsRef.value.theme === 'system' || optionsRef.value.enabled === undefined) {
        applyTheme();
      }
    };
    
    contrastQuery.addEventListener('change', handleContrastChange);
    
    // 监听强制颜色模式变化
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    const handleForcedColorsChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        themeState.systemHighContrast = true;
        applyTheme();
      }
    };
    
    forcedColorsQuery.addEventListener('change', handleForcedColorsChange);
    
    // 返回清理函数
    return () => {
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      forcedColorsQuery.removeEventListener('change', handleForcedColorsChange);
    };
  };

  // 监听选项变化
  watch(() => optionsRef.value, () => {
    applyTheme();
  }, { deep: true });

  // 监听主题状态变化
  watch(() => themeState.enabled, () => {
    applyTheme();
  });

  // 生命周期
  onMounted(() => {
    checkSystemHighContrast();
    applyTheme();
    
    const cleanup = setupThemeWatchers();
    
    onUnmounted(() => {
      cleanup();
    });
  });

  return {
    // 状态
    themeState,
    
    // 计算属性
    isHighContrastEnabled,
    currentTheme,
    currentColors,
    cssVariables,
    
    // 方法
    toggleHighContrast,
    enableHighContrast,
    disableHighContrast,
    setTheme,
    setCustomColors,
    resetTheme,
    applyTheme,
    checkSystemHighContrast
  };
}