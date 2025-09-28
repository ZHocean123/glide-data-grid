/**
 * 图片单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { ImageCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer, ImageWindowLoader } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// 图片加载状态
enum ImageLoadState {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  NotFound = 'not-found'
}

// 图片缓存接口
interface ImageCacheEntry {
  image: HTMLImageElement | ImageBitmap;
  state: ImageLoadState;
  timestamp: number;
}

// 简化的图片窗口加载器实现
class SimpleImageWindowLoader implements ImageWindowLoader {
  private cache = new Map<string, ImageCacheEntry>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private maxCacheSize = 100;
  private cacheTimeout = 5 * 60 * 1000; // 5分钟

  loadOrGetImage(url: string, col: number, row: number): HTMLImageElement | ImageBitmap | undefined {
    // 清理过期缓存
    this.cleanExpiredCache();

    const cached = this.cache.get(url);
    if (cached && cached.state === ImageLoadState.Loaded) {
      return cached.image;
    }

    // 如果正在加载，返回undefined
    if (this.loadingPromises.has(url)) {
      return undefined;
    }

    // 开始加载图片
    this.loadImage(url);
    return undefined;
  }

  setWindow(window: { x: number; y: number; width: number; height: number }): void {
    // 简化实现，实际可以根据可见窗口优化加载
  }

  private async loadImage(url: string): Promise<void> {
    if (this.loadingPromises.has(url)) return;

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 支持跨域图片

      img.onload = () => {
        this.cache.set(url, {
          image: img,
          state: ImageLoadState.Loaded,
          timestamp: Date.now()
        });
        resolve(img);
      };

      img.onerror = () => {
        this.cache.set(url, {
          image: img,
          state: ImageLoadState.Error,
          timestamp: Date.now()
        });
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });

    this.loadingPromises.set(url, loadPromise);

    try {
      await loadPromise;
    } catch (error) {
      console.warn('Failed to load image:', url, error);
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private cleanExpiredCache(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const now = Date.now();
    const entries = Array.from(this.cache.entries())
      .filter(([_, entry]) => now - entry.timestamp < this.cacheTimeout)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, this.maxCacheSize);

    this.cache.clear();
    entries.forEach(([url, entry]) => {
      this.cache.set(url, entry);
    });
  }
}

// 全局图片加载器实例
const globalImageLoader = new SimpleImageWindowLoader();

// 绘制图片
function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | ImageBitmap,
  rect: { x: number; y: number; width: number; height: number },
  padding = 4
) {
  const imageRect = {
    x: rect.x + padding,
    y: rect.y + padding,
    width: rect.width - 2 * padding,
    height: rect.height - 2 * padding
  };

  if (imageRect.width <= 0 || imageRect.height <= 0) return;

  ctx.save();

  // 计算图片缩放比例，保持宽高比
  const imageAspect = image.width / image.height;
  const containerAspect = imageRect.width / imageRect.height;

  let drawWidth, drawHeight, drawX, drawY;

  if (imageAspect > containerAspect) {
    // 图片比容器更宽，以宽度为准
    drawWidth = imageRect.width;
    drawHeight = imageRect.width / imageAspect;
    drawX = imageRect.x;
    drawY = imageRect.y + (imageRect.height - drawHeight) / 2;
  } else {
    // 图片比容器更高，以高度为准
    drawHeight = imageRect.height;
    drawWidth = imageRect.height * imageAspect;
    drawX = imageRect.x + (imageRect.width - drawWidth) / 2;
    drawY = imageRect.y;
  }

  // 圆角裁剪
  const radius = 3;
  ctx.beginPath();
  ctx.roundRect(drawX, drawY, drawWidth, drawHeight, radius);
  ctx.clip();

  // 绘制图片
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  ctx.restore();
}

// 绘制加载占位符
function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  theme: any,
  state: 'loading' | 'error'
) {
  const padding = 4;
  const placeholderRect = {
    x: rect.x + padding,
    y: rect.y + padding,
    width: rect.width - 2 * padding,
    height: rect.height - 2 * padding
  };

  ctx.save();

  // 背景
  ctx.fillStyle = state === 'error' ? '#fee' : '#f5f5f5';
  ctx.fillRect(placeholderRect.x, placeholderRect.y, placeholderRect.width, placeholderRect.height);

  // 边框
  ctx.strokeStyle = state === 'error' ? '#f87171' : '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(placeholderRect.x, placeholderRect.y, placeholderRect.width, placeholderRect.height);

  // 图标和文字
  const centerX = placeholderRect.x + placeholderRect.width / 2;
  const centerY = placeholderRect.y + placeholderRect.height / 2;

  ctx.fillStyle = state === 'error' ? '#ef4444' : '#9ca3af';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (state === 'loading') {
    // 绘制加载图标 (简化的旋转点)
    const time = Date.now() * 0.01;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + time;
      const x = centerX + Math.cos(angle) * 8;
      const y = centerY + Math.sin(angle) * 8;
      const alpha = (i + 4) / 8;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // 绘制错误图标
    ctx.fillText('⚠', centerX, centerY - 6);
    ctx.fillText('Error', centerX, centerY + 8);
  }

  ctx.restore();
}

// 图片单元格渲染器实现
export const imageCellRenderer: CustomRenderer<ImageCell> = {
  draw: (args: DrawArgs<ImageCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    // 处理图片数据
    const urls = Array.isArray(cell.data) ? cell.data : [cell.data];
    const displayUrls = cell.displayData || urls;

    if (urls.length === 0 || !urls[0]) {
      // 空图片
      ctx.fillStyle = theme.textLight;
      ctx.font = theme.baseFontStyle;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No image', rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
      return;
    }

    if (urls.length === 1) {
      // 单张图片
      const url = urls[0];
      const image = globalImageLoader.loadOrGetImage(url, args.col, args.row);

      if (image) {
        drawImage(ctx, image, rect);
      } else {
        drawImagePlaceholder(ctx, rect, theme, 'loading');
      }
    } else {
      // 多张图片 - 网格布局
      const gridSize = Math.ceil(Math.sqrt(urls.length));
      const cellWidth = (rect.width - 8) / gridSize;
      const cellHeight = (rect.height - 8) / gridSize;

      for (let i = 0; i < Math.min(urls.length, gridSize * gridSize); i++) {
        const gridX = i % gridSize;
        const gridY = Math.floor(i / gridSize);
        const imageRect = {
          x: rect.x + 4 + gridX * cellWidth,
          y: rect.y + 4 + gridY * cellHeight,
          width: cellWidth - 2,
          height: cellHeight - 2
        };

        const url = urls[i];
        const image = globalImageLoader.loadOrGetImage(url, args.col, args.row);

        if (image) {
          drawImage(ctx, image, imageRect, 1);
        } else {
          drawImagePlaceholder(ctx, imageRect, theme, 'loading');
        }
      }

      // 显示更多指示器
      if (urls.length > gridSize * gridSize) {
        const moreCount = urls.length - gridSize * gridSize;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(rect.x + rect.width - 30, rect.y + rect.height - 20, 26, 16);
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${moreCount}`, rect.x + rect.width - 17, rect.y + rect.height - 12);
        ctx.restore();
      }
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    // 图片单元格建议的最小宽度
    return Math.max(80, theme.cellHorizontalPadding * 2);
  },

  hitTest: (cell, pos, bounds) => {
    // 整个单元格都可点击
    return pos.x >= bounds.x &&
           pos.x <= bounds.x + bounds.width &&
           pos.y >= bounds.y &&
           pos.y <= bounds.y + bounds.height;
  },

  provideEditor: (cell) => {
    if (!cell.allowOverlay) return undefined;

    // 返回图片编辑器组件 (稍后实现)
    return {
      editor: {} as any, // ImageEditor component
      disablePadding: true,
      deletedValue: () => ({
        ...cell,
        data: [],
        displayData: [],
      }),
    };
  },

  getCursor: () => 'pointer',

  onPaste: (val, cell) => {
    // 处理粘贴的图片URL
    const urls = val.split('\n').filter(url => {
      try {
        new URL(url);
        return url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      } catch {
        return false;
      }
    });

    return {
      ...cell,
      data: urls,
      displayData: urls,
    };
  },
};

// 内部渲染器导出
export const internalImageCellRenderer = {
  ...imageCellRenderer,
  kind: GridCellKind.Image,
};

// 创建图片单元格的工厂函数
export function createImageCell(
  data: string | readonly string[],
  options: Partial<Omit<ImageCell, 'kind' | 'data'>> = {}
): ImageCell {
  const urls = Array.isArray(data) ? data : [data];

  return {
    kind: GridCellKind.Image,
    data: urls,
    allowOverlay: false,
    displayData: urls,
    allowAdd: false,
    ...options,
  };
}

// 图片单元格工具函数
export function isImageEmpty(cell: ImageCell): boolean {
  return !cell.data || cell.data.length === 0 || cell.data.every(url => !url);
}

export function getImageCount(cell: ImageCell): number {
  return cell.data?.length || 0;
}

export function addImageToCell(cell: ImageCell, url: string): ImageCell {
  if (!cell.allowAdd) return cell;

  const newData = [...(cell.data || []), url];
  return {
    ...cell,
    data: newData,
    displayData: newData,
  };
}

export function removeImageFromCell(cell: ImageCell, index: number): ImageCell {
  if (!cell.data || index < 0 || index >= cell.data.length) return cell;

  const newData = cell.data.filter((_, i) => i !== index);
  return {
    ...cell,
    data: newData,
    displayData: newData,
  };
}

export function validateImageUrl(url: string): boolean {
  try {
    new URL(url);
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) !== null;
  } catch {
    return false;
  }
}

// 图片预处理工具
export function optimizeImageUrl(url: string, maxWidth = 200, maxHeight = 200): string {
  // 简化的图片优化，实际项目中可以集成图片CDN服务
  if (url.includes('unsplash.com')) {
    return `${url}?w=${maxWidth}&h=${maxHeight}&fit=crop`;
  }

  if (url.includes('images.google.com') || url.includes('googleusercontent.com')) {
    return `${url}=w${maxWidth}-h${maxHeight}-c`;
  }

  return url;
}

// 导出图片加载器以供外部使用
export { globalImageLoader as imageLoader };
