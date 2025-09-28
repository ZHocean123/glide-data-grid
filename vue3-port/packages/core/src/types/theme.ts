/**
 * 主题系统类型定义
 * 从 React 版本迁移并适配 Vue3
 */

// 主题接口
export interface Theme {
  accentColor: string;
  accentFg: string;
  accentLight: string;

  textDark: string;
  textMedium: string;
  textLight: string;
  textBubble: string;

  bgIconHeader: string;
  fgIconHeader: string;
  textHeader: string;
  textGroupHeader?: string;
  bgGroupHeader?: string;
  bgGroupHeaderHovered?: string;
  textHeaderSelected: string;

  bgCell: string;
  bgCellMedium: string;
  bgHeader: string;
  bgHeaderHovered: string;
  bgHeaderHasFocus: string;

  bgBubble: string;
  bgBubbleSelected: string;

  bgSearchResult: string;

  borderColor: string;
  horizontalBorderColor?: string;
  drilldownBorder: string;

  linkColor: string;

  cellHorizontalPadding: number;
  cellVerticalPadding: number;

  headerFontStyle: string;
  baseFontStyle: string;
  markerFontStyle: string;
  fontFamily: string;
  editorFontSize: string;

  bubbleHeight: number;
  bubblePadding: number;
  bubbleMargin: number;

  checkboxMaxSize: number;

  resizeIndicatorColor?: string;
  headerBottomBorderColor?: string;
  roundingRadius?: number;
  lineHeight: number;

  // 高级主题属性
  cellVerticalAlignment?: 'top' | 'center' | 'bottom';
  textCellOverflowBehavior?: 'truncate' | 'wrap';

  // 动画相关
  animationDuration?: number;

  // 阴影和效果
  shadowColor?: string;
  shadowBlur?: number;

  // 自定义CSS属性
  customProperties?: Record<string, string>;
}

// 完整主题类型 (所有属性都必填)
export type FullTheme = Required<Theme>;

// 默认主题
export const defaultTheme: FullTheme = {
  accentColor: '#4F5DFD',
  accentFg: '#FFFFFF',
  accentLight: 'rgba(79, 93, 253, 0.1)',

  textDark: '#313139',
  textMedium: '#737383',
  textLight: '#B2B2C0',
  textBubble: '#313139',

  bgIconHeader: '#737383',
  fgIconHeader: '#FFFFFF',
  textHeader: '#313139',
  textGroupHeader: '#313139',
  bgGroupHeader: '#F7F7F8',
  bgGroupHeaderHovered: '#EFEFEF',
  textHeaderSelected: '#FFFFFF',

  bgCell: '#FFFFFF',
  bgCellMedium: '#FAFAFB',
  bgHeader: '#F7F7F8',
  bgHeaderHovered: '#EFEFEF',
  bgHeaderHasFocus: '#E0E0E0',

  bgBubble: '#EDEDF3',
  bgBubbleSelected: '#FFFFFF',

  bgSearchResult: '#FFFF88',

  borderColor: '#E1E2E5',
  horizontalBorderColor: '#E1E2E5',
  drilldownBorder: '#E1E2E5',

  linkColor: '#4F5DFD',

  cellHorizontalPadding: 8,
  cellVerticalPadding: 3,

  headerFontStyle: '600 13px Inter, sans-serif',
  baseFontStyle: '13px Inter, sans-serif',
  markerFontStyle: '9px Inter, sans-serif',
  fontFamily: 'Inter, sans-serif',
  editorFontSize: '13px',

  bubbleHeight: 20,
  bubblePadding: 8,
  bubbleMargin: 2,

  checkboxMaxSize: 18,

  resizeIndicatorColor: '#4F5DFD',
  headerBottomBorderColor: '#E1E2E5',
  roundingRadius: 3,
  lineHeight: 1.4,

  cellVerticalAlignment: 'center',
  textCellOverflowBehavior: 'truncate',

  animationDuration: 150,

  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: 4,

  customProperties: {},
};

// 暗色主题
export const darkTheme: FullTheme = {
  ...defaultTheme,

  accentColor: '#6366F1',
  accentFg: '#FFFFFF',
  accentLight: 'rgba(99, 102, 241, 0.1)',

  textDark: '#F9FAFB',
  textMedium: '#D1D5DB',
  textLight: '#9CA3AF',
  textBubble: '#F9FAFB',

  bgIconHeader: '#9CA3AF',
  fgIconHeader: '#1F2937',
  textHeader: '#F9FAFB',
  textGroupHeader: '#F9FAFB',
  bgGroupHeader: '#374151',
  bgGroupHeaderHovered: '#4B5563',
  textHeaderSelected: '#FFFFFF',

  bgCell: '#1F2937',
  bgCellMedium: '#111827',
  bgHeader: '#374151',
  bgHeaderHovered: '#4B5563',
  bgHeaderHasFocus: '#6B7280',

  bgBubble: '#4B5563',
  bgBubbleSelected: '#6B7280',

  bgSearchResult: '#F59E0B',

  borderColor: '#4B5563',
  horizontalBorderColor: '#4B5563',
  drilldownBorder: '#4B5563',

  linkColor: '#6366F1',

  shadowColor: 'rgba(0, 0, 0, 0.3)',
};

// 主题工具函数
export function mergeTheme(base: FullTheme, override: Partial<Theme>): FullTheme {
  return {
    ...base,
    ...override,
    customProperties: {
      ...base.customProperties,
      ...override.customProperties,
    },
  };
}

export function createTheme(overrides: Partial<Theme>): FullTheme {
  return mergeTheme(defaultTheme, overrides);
}

// CSS变量生成
export function makeCSSStyle(theme: Theme): Record<string, string> {
  const cssVars: Record<string, string> = {
    '--gdg-accent-color': theme.accentColor,
    '--gdg-accent-fg': theme.accentFg,
    '--gdg-accent-light': theme.accentLight,

    '--gdg-text-dark': theme.textDark,
    '--gdg-text-medium': theme.textMedium,
    '--gdg-text-light': theme.textLight,
    '--gdg-text-bubble': theme.textBubble,

    '--gdg-bg-icon-header': theme.bgIconHeader,
    '--gdg-fg-icon-header': theme.fgIconHeader,
    '--gdg-text-header': theme.textHeader,
    '--gdg-text-group-header': theme.textGroupHeader ?? theme.textHeader,
    '--gdg-bg-group-header': theme.bgGroupHeader ?? theme.bgHeader,
    '--gdg-bg-group-header-hovered': theme.bgGroupHeaderHovered ?? theme.bgHeaderHovered,
    '--gdg-text-header-selected': theme.textHeaderSelected,

    '--gdg-bg-cell': theme.bgCell,
    '--gdg-bg-cell-medium': theme.bgCellMedium,
    '--gdg-bg-header': theme.bgHeader,
    '--gdg-bg-header-has-focus': theme.bgHeaderHasFocus,
    '--gdg-bg-header-hovered': theme.bgHeaderHovered,

    '--gdg-bg-bubble': theme.bgBubble,
    '--gdg-bg-bubble-selected': theme.bgBubbleSelected,
    '--gdg-bubble-height': `${theme.bubbleHeight}px`,
    '--gdg-bubble-padding': `${theme.bubblePadding}px`,
    '--gdg-bubble-margin': `${theme.bubbleMargin}px`,

    '--gdg-bg-search-result': theme.bgSearchResult,

    '--gdg-border-color': theme.borderColor,
    '--gdg-horizontal-border-color': theme.horizontalBorderColor ?? theme.borderColor,
    '--gdg-drilldown-border': theme.drilldownBorder,

    '--gdg-link-color': theme.linkColor,

    '--gdg-cell-horizontal-padding': `${theme.cellHorizontalPadding}px`,
    '--gdg-cell-vertical-padding': `${theme.cellVerticalPadding}px`,

    '--gdg-header-font-style': theme.headerFontStyle,
    '--gdg-base-font-style': theme.baseFontStyle,
    '--gdg-marker-font-style': theme.markerFontStyle,
    '--gdg-font-family': theme.fontFamily,
    '--gdg-editor-font-size': theme.editorFontSize,

    '--gdg-checkbox-max-size': `${theme.checkboxMaxSize}px`,
    '--gdg-line-height': theme.lineHeight.toString(),
  };

  // 可选属性
  if (theme.resizeIndicatorColor) {
    cssVars['--gdg-resize-indicator-color'] = theme.resizeIndicatorColor;
  }
  if (theme.headerBottomBorderColor) {
    cssVars['--gdg-header-bottom-border-color'] = theme.headerBottomBorderColor;
  }
  if (theme.roundingRadius !== undefined) {
    cssVars['--gdg-rounding-radius'] = `${theme.roundingRadius}px`;
  }
  if (theme.animationDuration !== undefined) {
    cssVars['--gdg-animation-duration'] = `${theme.animationDuration}ms`;
  }
  if (theme.shadowColor) {
    cssVars['--gdg-shadow-color'] = theme.shadowColor;
  }
  if (theme.shadowBlur !== undefined) {
    cssVars['--gdg-shadow-blur'] = `${theme.shadowBlur}px`;
  }

  // 自定义属性
  if (theme.customProperties) {
    Object.entries(theme.customProperties).forEach(([key, value]) => {
      cssVars[key] = value;
    });
  }

  return cssVars;
}

// 主题验证
export function validateTheme(theme: Partial<Theme>): string[] {
  const errors: string[] = [];

  // 检查必需的颜色属性
  const requiredColors = ['accentColor', 'textDark', 'bgCell', 'borderColor'];
  for (const color of requiredColors) {
    if (!theme[color as keyof Theme]) {
      errors.push(`Missing required color: ${color}`);
    }
  }

  // 检查数值属性
  if (theme.cellHorizontalPadding !== undefined && theme.cellHorizontalPadding < 0) {
    errors.push('cellHorizontalPadding must be non-negative');
  }
  if (theme.cellVerticalPadding !== undefined && theme.cellVerticalPadding < 0) {
    errors.push('cellVerticalPadding must be non-negative');
  }

  return errors;
}

// 主题预设
export const themePresets = {
  default: defaultTheme,
  dark: darkTheme,

  // 蓝色主题
  blue: createTheme({
    accentColor: '#2563EB',
    accentLight: 'rgba(37, 99, 235, 0.1)',
    linkColor: '#2563EB',
  }),

  // 绿色主题
  green: createTheme({
    accentColor: '#059669',
    accentLight: 'rgba(5, 150, 105, 0.1)',
    linkColor: '#059669',
  }),

  // 紫色主题
  purple: createTheme({
    accentColor: '#7C3AED',
    accentLight: 'rgba(124, 58, 237, 0.1)',
    linkColor: '#7C3AED',
  }),

  // 高对比度主题
  highContrast: createTheme({
    textDark: '#000000',
    textMedium: '#333333',
    textLight: '#666666',
    bgCell: '#FFFFFF',
    borderColor: '#000000',
    accentColor: '#0000FF',
  }),
} as const;

export type ThemePreset = keyof typeof themePresets;
