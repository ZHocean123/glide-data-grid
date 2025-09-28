/**
 * 加载状态单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { LoadingCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 加载动画类型
export enum LoadingAnimationType {
  Spinner = 'spinner',
  Dots = 'dots',
  Pulse = 'pulse',
  Wave = 'wave',
  Skeleton = 'skeleton',
}

// 加载状态
export enum LoadingState {
  Loading = 'loading',
  Error = 'error',
  Empty = 'empty',
}

// 动画参数接口
interface AnimationConfig {
  speed: number; // 动画速度倍数
  color: string; // 主颜色
  secondaryColor?: string; // 次要颜色
  size: number; // 尺寸
}

// 获取当前时间戳用于动画
function getAnimationTime(): number {
  return Date.now() * 0.01; // 减慢动画速度
}

// 绘制旋转加载器
function drawSpinner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  config: AnimationConfig
): void {
  const time = getAnimationTime() * config.speed;
  const centerX = x + config.size / 2;
  const centerY = y + config.size / 2;
  const radius = config.size * 0.3;

  ctx.save();

  // 绘制8个点的旋转加载器
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + time;
    const dotX = centerX + Math.cos(angle) * radius;
    const dotY = centerY + Math.sin(angle) * radius;

    // 根据位置调整透明度，创建拖尾效果
    const alpha = (i + 4) / 8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, config.size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// 绘制点状加载器
function drawDots(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  config: AnimationConfig
): void {
  const time = getAnimationTime() * config.speed;
  const centerY = y + config.size / 2;
  const dotSize = config.size * 0.08;
  const spacing = config.size * 0.15;
  const startX = x + config.size / 2 - spacing;

  ctx.save();
  ctx.fillStyle = config.color;

  // 绘制3个跳动的点
  for (let i = 0; i < 3; i++) {
    const dotX = startX + i * spacing;
    const bounce = Math.sin(time + i * 0.5) * 0.3 + 0.7; // 0.4 到 1.0 之间

    ctx.save();
    ctx.globalAlpha = bounce;
    ctx.beginPath();
    ctx.arc(dotX, centerY, dotSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// 绘制脉冲加载器
function drawPulse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  config: AnimationConfig
): void {
  const time = getAnimationTime() * config.speed;
  const centerX = x + config.size / 2;
  const centerY = y + config.size / 2;
  const baseRadius = config.size * 0.15;

  ctx.save();

  // 绘制多个同心圆脉冲
  for (let i = 0; i < 3; i++) {
    const phase = time + i * 0.6;
    const scale = (Math.sin(phase) * 0.5 + 0.5) * 0.8 + 0.2; // 0.2 到 1.0
    const alpha = 1 - scale * 0.7; // 反向透明度
    const radius = baseRadius + scale * config.size * 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// 绘制波浪加载器
function drawWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  config: AnimationConfig
): void {
  const time = getAnimationTime() * config.speed;
  const centerY = y + config.size / 2;
  const amplitude = config.size * 0.1;
  const frequency = 4;
  const width = config.size * 0.8;

  ctx.save();
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // 绘制正弦波
  ctx.beginPath();
  for (let i = 0; i <= width; i += 2) {
    const waveX = x + config.size * 0.1 + i;
    const waveY = centerY + Math.sin((i / width) * Math.PI * frequency + time) * amplitude;

    if (i === 0) {
      ctx.moveTo(waveX, waveY);
    } else {
      ctx.lineTo(waveX, waveY);
    }
  }
  ctx.stroke();

  ctx.restore();
}

// 绘制骨架屏加载器
function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  config: AnimationConfig
): void {
  const time = getAnimationTime() * config.speed;
  const shimmerWidth = width * 0.3;
  const shimmerX = ((time % 2) / 2) * (width + shimmerWidth) - shimmerWidth;

  ctx.save();

  // 绘制背景
  ctx.fillStyle = config.secondaryColor || '#f3f4f6';
  ctx.fillRect(x, y, width, height);

  // 绘制闪光效果
  const gradient = ctx.createLinearGradient(x + shimmerX, y, x + shimmerX + shimmerWidth, y);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  ctx.restore();
}

// 绘制错误状态
function drawError(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: any
): void {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const iconSize = size * 0.4;

  ctx.save();

  // 绘制错误图标背景
  ctx.fillStyle = '#fee2e2';
  ctx.beginPath();
  ctx.arc(centerX, centerY, iconSize, 0, Math.PI * 2);
  ctx.fill();

  // 绘制X符号
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const crossSize = iconSize * 0.5;
  ctx.beginPath();
  ctx.moveTo(centerX - crossSize, centerY - crossSize);
  ctx.lineTo(centerX + crossSize, centerY + crossSize);
  ctx.moveTo(centerX + crossSize, centerY - crossSize);
  ctx.lineTo(centerX - crossSize, centerY + crossSize);
  ctx.stroke();

  ctx.restore();
}

// 绘制空状态
function drawEmpty(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: any
): void {
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  ctx.save();

  // 绘制虚线圆圈
  ctx.strokeStyle = theme.textLight || '#d1d5db';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // 绘制减号
  ctx.fillStyle = theme.textLight || '#d1d5db';
  ctx.fillRect(centerX - size * 0.1, centerY - 1, size * 0.2, 2);

  ctx.restore();
}

// 加载单元格渲染器实现
export const loadingCellRenderer: CustomRenderer<LoadingCell> = {
  draw: (args: DrawArgs<LoadingCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    const state = cell.state || LoadingState.Loading;
    const animationType = cell.animationType || LoadingAnimationType.Spinner;
    const size = Math.min(rect.width, rect.height) * 0.4;
    const animationSize = Math.min(size, 32);

    // 动画配置
    const config: AnimationConfig = {
      speed: cell.speed || 1,
      color: cell.color || theme.accentColor || '#3b82f6',
      secondaryColor: cell.secondaryColor || '#f3f4f6',
      size: animationSize,
    };

    const centerX = rect.x + rect.width / 2 - animationSize / 2;
    const centerY = rect.y + rect.height / 2 - animationSize / 2;

    // 根据状态绘制不同内容
    switch (state) {
      case LoadingState.Loading:
        switch (animationType) {
          case LoadingAnimationType.Spinner:
            drawSpinner(ctx, centerX, centerY, config);
            break;
          case LoadingAnimationType.Dots:
            drawDots(ctx, centerX, centerY, config);
            break;
          case LoadingAnimationType.Pulse:
            drawPulse(ctx, centerX, centerY, config);
            break;
          case LoadingAnimationType.Wave:
            drawWave(ctx, centerX, centerY, config);
            break;
          case LoadingAnimationType.Skeleton:
            const skeletonHeight = rect.height * 0.6;
            const skeletonY = rect.y + (rect.height - skeletonHeight) / 2;
            drawSkeleton(ctx, rect.x + 8, skeletonY, rect.width - 16, skeletonHeight, config);
            break;
        }
        break;

      case LoadingState.Error:
        drawError(ctx, centerX, centerY, animationSize, theme);
        break;

      case LoadingState.Empty:
        drawEmpty(ctx, centerX, centerY, animationSize, theme);
        break;
    }

    // 绘制加载文本（如果有）
    if (cell.text) {
      const textY = rect.y + rect.height - 16;
      ctx.fillStyle = theme.textMedium || '#666666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.text, rect.x + rect.width / 2, textY);
    }

    ctx.restore();

    // 如果是加载状态，请求重绘以继续动画
    if (state === LoadingState.Loading) {
      // 在实际应用中，这里会触发重绘
      // 例如通过回调或事件通知需要更新
    }
  },

  measure: (ctx, cell, theme) => {
    // 加载单元格使用固定尺寸
    return Math.max(60, theme.cellHorizontalPadding * 2);
  },

  hitTest: (cell, pos, bounds) => {
    // 加载单元格通常不需要交互
    return false;
  },

  // 加载单元格不提供编辑器，直接省略该属性

  getCursor: () => 'default',

  onPaste: (val, cell) => {
    // 加载单元格不处理粘贴
    return cell;
  },
};

// 内部渲染器导出
export const internalLoadingCellRenderer = {
  ...loadingCellRenderer,
  kind: GridCellKind.Loading,
};

// 创建加载单元格的工厂函数
export function createLoadingCell(options: Partial<Omit<LoadingCell, 'kind'>> = {}): LoadingCell {
  return {
    kind: GridCellKind.Loading,
    state: LoadingState.Loading,
    animationType: LoadingAnimationType.Spinner,
    allowOverlay: false,
    ...options,
  };
}

// 预定义的加载单元格创建函数
export function createSpinnerCell(options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    animationType: LoadingAnimationType.Spinner,
    ...options,
  });
}

export function createDotsCell(options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    animationType: LoadingAnimationType.Dots,
    ...options,
  });
}

export function createPulseCell(options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    animationType: LoadingAnimationType.Pulse,
    ...options,
  });
}

export function createWaveCell(options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    animationType: LoadingAnimationType.Wave,
    ...options,
  });
}

export function createSkeletonCell(options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    animationType: LoadingAnimationType.Skeleton,
    ...options,
  });
}

export function createErrorCell(text?: string, options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    state: LoadingState.Error,
    text,
    ...options,
  });
}

export function createEmptyCell(text?: string, options: Partial<LoadingCell> = {}): LoadingCell {
  return createLoadingCell({
    state: LoadingState.Empty,
    text,
    ...options,
  });
}

// 加载状态工具函数
export function isLoading(cell: LoadingCell): boolean {
  return cell.state === LoadingState.Loading;
}

export function isError(cell: LoadingCell): boolean {
  return cell.state === LoadingState.Error;
}

export function isEmpty(cell: LoadingCell): boolean {
  return cell.state === LoadingState.Empty;
}

export function setLoadingState(
  cell: LoadingCell,
  state: LoadingState,
  text?: string
): LoadingCell {
  return {
    ...cell,
    state,
    text: text !== undefined ? text : cell.text,
  };
}

export function setLoadingAnimation(
  cell: LoadingCell,
  animationType: LoadingAnimationType,
  speed?: number
): LoadingCell {
  return {
    ...cell,
    animationType,
    speed: speed !== undefined ? speed : cell.speed,
  };
}

// 加载状态转换工具
export function startLoading(
  cell: LoadingCell,
  text?: string,
  animationType?: LoadingAnimationType
): LoadingCell {
  return {
    ...cell,
    state: LoadingState.Loading,
    text: text !== undefined ? text : cell.text,
    animationType: animationType !== undefined ? animationType : cell.animationType,
  };
}

export function finishLoading(cell: LoadingCell): LoadingCell {
  // 加载完成后，通常会替换为实际的数据单元格
  // 这里返回一个空单元格作为示例
  return {
    ...cell,
    state: LoadingState.Empty,
    text: undefined,
  };
}

export function errorLoading(cell: LoadingCell, errorText?: string): LoadingCell {
  return {
    ...cell,
    state: LoadingState.Error,
    text: errorText || 'Failed to load',
  };
}

// 动画配置工具
export function createAnimationConfig(
  color: string,
  speed = 1,
  secondaryColor?: string
): Partial<LoadingCell> {
  return {
    color,
    speed,
    secondaryColor,
  };
}

// 注意：LoadingAnimationType 和 LoadingState 已在文件顶部导出
