/**
 * Vue3 主题系统组合式函数
 * 替代 React 的 Context 系统
 */

import {
  inject,
  provide,
  readonly,
  ref,
  computed,
  watchEffect,
  type Ref,
  type InjectionKey,
} from 'vue';
import type { Theme, FullTheme } from '../types/theme.js';
import { defaultTheme, mergeTheme, makeCSSStyle } from '../types/theme.js';

// 主题注入键
const THEME_KEY: InjectionKey<Ref<FullTheme>> = Symbol('glide-theme');

// 提供主题的组合式函数
export function provideTheme(theme: Ref<Partial<Theme>> | Partial<Theme> = {}) {
  // 创建一个内部的响应式主题引用
  const internalThemeRef = ref<Partial<Theme>>({});

  // 如果传入的是 ref，则监听它的变化
  if (typeof theme === 'object' && 'value' in theme) {
    // 是 ref 对象，监听变化
    watchEffect(() => {
      internalThemeRef.value = theme.value;
    });
  } else {
    // 是普通对象，直接设置
    internalThemeRef.value = theme;
  }

  const mergedTheme = computed(() => {
    return mergeTheme(defaultTheme, internalThemeRef.value);
  });

  // CSS 变量计算
  const cssVariables = computed(() => makeCSSStyle(mergedTheme.value));

  // 提供给子组件
  provide(THEME_KEY, readonly(mergedTheme));

  return {
    theme: readonly(mergedTheme),
    cssVariables: readonly(cssVariables),
    updateTheme: (newTheme: Partial<Theme>) => {
      internalThemeRef.value = newTheme;
    },
    mergeTheme: (updates: Partial<Theme>) => {
      internalThemeRef.value = {
        ...internalThemeRef.value,
        ...updates,
      };
    },
  };
}

// 使用主题的组合式函数
export function useTheme(): {
  theme: Ref<FullTheme>;
  cssVariables: Ref<Record<string, string>>;
} {
  const theme = inject(THEME_KEY);

  if (!theme) {
    console.warn('Theme not provided, using default theme');
    const defaultThemeRef = readonly(ref(defaultTheme));
    const defaultCssVars = readonly(ref(makeCSSStyle(defaultTheme)));

    return {
      theme: defaultThemeRef,
      cssVariables: defaultCssVars,
    };
  }

  const cssVariables = computed(() => makeCSSStyle(theme.value));

  return {
    theme,
    cssVariables: readonly(cssVariables),
  };
}

// 主题切换组合式函数
export function useThemeSwitch(initialTheme: Partial<Theme> = {}) {
  const currentTheme = ref<Partial<Theme>>(initialTheme);

  const switchTheme = (newTheme: Partial<Theme>) => {
    currentTheme.value = newTheme;
  };

  const toggleDarkMode = () => {
    const isDark = currentTheme.value.bgCell === '#1F2937';
    if (isDark) {
      currentTheme.value = defaultTheme;
    } else {
      currentTheme.value = {
        ...currentTheme.value,
        bgCell: '#1F2937',
        textDark: '#F9FAFB',
        bgHeader: '#374151',
        borderColor: '#4B5563',
      };
    }
  };

  return {
    currentTheme: readonly(currentTheme),
    switchTheme,
    toggleDarkMode,
  };
}

// 主题动画组合式函数
export function useThemeAnimation() {
  const isAnimating = ref(false);

  const animateThemeChange = async (fromTheme: FullTheme, toTheme: FullTheme, duration = 300) => {
    isAnimating.value = true;

    // 简化的主题动画实现
    // 实际项目中可以使用更复杂的颜色插值
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        isAnimating.value = false;
        resolve();
      }, duration);
    });
  };

  return {
    isAnimating: readonly(isAnimating),
    animateThemeChange,
  };
}
