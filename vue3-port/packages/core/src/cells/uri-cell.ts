/**
 * URI单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { UriCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// URI类型枚举
export enum UriType {
  Http = 'http',
  Https = 'https',
  Email = 'email',
  Phone = 'phone',
  File = 'file',
  Ftp = 'ftp',
  Unknown = 'unknown'
}

// URI信息接口
interface UriInfo {
  type: UriType;
  displayText: string;
  fullUri: string;
  isValid: boolean;
  domain?: string;
  path?: string;
}

// URI解析工具类
class UriParser {
  private static instance: UriParser;

  static getInstance(): UriParser {
    if (!UriParser.instance) {
      UriParser.instance = new UriParser();
    }
    return UriParser.instance;
  }

  parse(uri: string): UriInfo {
    if (!uri || typeof uri !== 'string') {
      return {
        type: UriType.Unknown,
        displayText: uri || '',
        fullUri: uri || '',
        isValid: false
      };
    }

    const trimmedUri = uri.trim();

    // 检测邮箱
    if (this.isEmail(trimmedUri)) {
      return {
        type: UriType.Email,
        displayText: trimmedUri,
        fullUri: `mailto:${trimmedUri}`,
        isValid: true
      };
    }

    // 检测电话
    if (this.isPhone(trimmedUri)) {
      return {
        type: UriType.Phone,
        displayText: trimmedUri,
        fullUri: `tel:${trimmedUri.replace(/[^\d+]/g, '')}`,
        isValid: true
      };
    }

    // 尝试解析为URL
    try {
      let urlString = trimmedUri;

      // 如果没有协议，尝试添加https://
      if (!urlString.includes('://')) {
        if (urlString.includes('@')) {
          return this.parse(`mailto:${urlString}`);
        }
        urlString = `https://${urlString}`;
      }

      const url = new URL(urlString);
      const type = this.getUrlType(url.protocol);

      return {
        type,
        displayText: this.getDisplayText(url, trimmedUri),
        fullUri: url.toString(),
        isValid: true,
        domain: url.hostname,
        path: url.pathname
      };
    } catch (error) {
      return {
        type: UriType.Unknown,
        displayText: trimmedUri,
        fullUri: trimmedUri,
        isValid: false
      };
    }
  }

  private isEmail(text: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  }

  private isPhone(text: string): boolean {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(text);
  }

  private getUrlType(protocol: string): UriType {
    switch (protocol) {
      case 'https:':
        return UriType.Https;
      case 'http:':
        return UriType.Http;
      case 'mailto:':
        return UriType.Email;
      case 'tel:':
        return UriType.Phone;
      case 'file:':
        return UriType.File;
      case 'ftp:':
        return UriType.Ftp;
      default:
        return UriType.Unknown;
    }
  }

  private getDisplayText(url: URL, originalText: string): string {
    // 如果原始文本已经是完整的URL，使用简化显示
    if (originalText.includes('://')) {
      if (url.hostname && url.pathname && url.pathname !== '/') {
        return `${url.hostname}${url.pathname}`;
      }
      return url.hostname || originalText;
    }
    return originalText;
  }
}

// 获取解析器实例
const uriParser = UriParser.getInstance();

// 获取URI类型对应的图标
function getUriIcon(type: UriType): string {
  switch (type) {
    case UriType.Http:
    case UriType.Https:
      return '🌐';
    case UriType.Email:
      return '✉️';
    case UriType.Phone:
      return '📞';
    case UriType.File:
      return '📁';
    case UriType.Ftp:
      return '📂';
    default:
      return '🔗';
  }
}

// 获取URI类型对应的颜色
function getUriColor(type: UriType, theme: any): string {
  switch (type) {
    case UriType.Http:
    case UriType.Https:
      return theme.linkColor || '#0066cc';
    case UriType.Email:
      return theme.linkColor || '#0066cc';
    case UriType.Phone:
      return '#10b981'; // green
    case UriType.File:
      return '#8b5cf6'; // purple
    case UriType.Ftp:
      return '#f59e0b'; // amber
    default:
      return theme.textMedium || '#666666';
  }
}

// 测量文本宽度
function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const savedFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = savedFont;
  return width;
}

// 绘制带下划线的链接文本
function drawLinkText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  showUnderline = true
): number {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  const width = ctx.measureText(text).width;

  if (showUnderline) {
    // 绘制下划线
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + width, y + 2);
    ctx.stroke();
  }

  ctx.restore();
  return width;
}

// 绘制图标
function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  size = 12
): number {
  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y);
  ctx.restore();
  return size + 2; // 图标宽度 + 间距
}

// URI单元格渲染器实现
export const uriCellRenderer: CustomRenderer<UriCell> = {
  draw: (args: DrawArgs<UriCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    const uri = cell.data || '';
    if (!uri.trim()) {
      // 空URI提示
      ctx.fillStyle = theme.textLight || '#999999';
      ctx.font = theme.baseFontStyle || '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No URI', rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
      return;
    }

    // 解析URI
    const uriInfo = uriParser.parse(uri);
    const padding = theme.cellHorizontalPadding || 8;
    const iconSize = 14;

    let currentX = rect.x + padding;
    const textY = rect.y + rect.height / 2;

    // 绘制图标
    if (cell.showIcon !== false) {
      const icon = getUriIcon(uriInfo.type);
      const iconWidth = drawIcon(ctx, icon, currentX, textY, iconSize);
      currentX += iconWidth;
    }

    // 设置文本样式
    const font = theme.baseFontStyle || '12px sans-serif';
    const color = uriInfo.isValid
      ? getUriColor(uriInfo.type, theme)
      : (theme.textMedium || '#666666');

    // 计算可用宽度
    const availableWidth = rect.x + rect.width - currentX - padding;
    const displayText = uriInfo.displayText;

    // 检查文本是否需要截断
    const textWidth = measureText(ctx, displayText, font);
    let finalText = displayText;

    if (textWidth > availableWidth) {
      // 截断文本并添加省略号
      const ellipsis = '...';
      const ellipsisWidth = measureText(ctx, ellipsis, font);
      let truncatedText = displayText;

      while (truncatedText.length > 0) {
        const currentWidth = measureText(ctx, truncatedText + ellipsis, font);
        if (currentWidth <= availableWidth) {
          finalText = truncatedText + ellipsis;
          break;
        }
        truncatedText = truncatedText.slice(0, -1);
      }
    }

    // 绘制文本
    const showUnderline = uriInfo.isValid && cell.underline !== false;
    drawLinkText(ctx, finalText, currentX, textY, font, color, showUnderline);

    // 绘制状态指示器
    if (!uriInfo.isValid && cell.showValidation !== false) {
      const warningX = rect.x + rect.width - padding - 12;
      ctx.fillStyle = '#ef4444'; // red
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', warningX, textY);
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    const uri = cell.data || '';
    if (!uri.trim()) return (theme.cellHorizontalPadding || 8) * 2 + 60;

    const uriInfo = uriParser.parse(uri);
    const font = theme.baseFontStyle || '12px sans-serif';
    const padding = (theme.cellHorizontalPadding || 8) * 2;

    let width = padding;

    // 图标宽度
    if (cell.showIcon !== false) {
      width += 16; // 图标 + 间距
    }

    // 文本宽度
    width += measureText(ctx, uriInfo.displayText, font);

    // 验证指示器宽度
    if (!uriInfo.isValid && cell.showValidation !== false) {
      width += 16;
    }

    return Math.max(width, 80);
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

    // 返回URI编辑器组件 (稍后实现)
    return {
      editor: {} as any, // UriEditor component
      disablePadding: false,
      deletedValue: () => ({
        ...cell,
        data: '',
      }),
    };
  },

  getCursor: (cell) => {
    const uri = cell.data || '';
    const uriInfo = uriParser.parse(uri);
    return uriInfo.isValid ? 'pointer' : 'default';
  },

  onPaste: (val, cell) => {
    // 处理粘贴的URI文本
    return {
      ...cell,
      data: val.trim(),
    };
  },

  onClick: (cell, pos, bounds) => {
    const uri = cell.data || '';
    const uriInfo = uriParser.parse(uri);

    if (uriInfo.isValid && cell.onClick) {
      cell.onClick(uriInfo.fullUri, uriInfo);
      return true;
    }

    return false;
  },
};

// 内部渲染器导出
export const internalUriCellRenderer = {
  ...uriCellRenderer,
  kind: GridCellKind.Uri,
};

// 创建URI单元格的工厂函数
export function createUriCell(
  data: string,
  options: Partial<Omit<UriCell, 'kind' | 'data'>> = {}
): UriCell {
  return {
    kind: GridCellKind.Uri,
    data,
    allowOverlay: false,
    showIcon: true,
    underline: true,
    showValidation: true,
    ...options,
  };
}

// URI单元格工具函数
export function isUriEmpty(cell: UriCell): boolean {
  return !cell.data || cell.data.trim().length === 0;
}

export function isUriValid(cell: UriCell): boolean {
  const uri = cell.data || '';
  const uriInfo = uriParser.parse(uri);
  return uriInfo.isValid;
}

export function getUriInfo(cell: UriCell): UriInfo {
  const uri = cell.data || '';
  return uriParser.parse(uri);
}

export function getUriDomain(cell: UriCell): string | undefined {
  const uriInfo = getUriInfo(cell);
  return uriInfo.domain;
}

export function normalizeUri(uri: string): string {
  const uriInfo = uriParser.parse(uri);
  return uriInfo.isValid ? uriInfo.fullUri : uri;
}

// URI验证工具
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
  return phoneRegex.test(phone.trim());
}

export function validateUrl(url: string): boolean {
  try {
    let urlString = url.trim();
    if (!urlString.includes('://')) {
      urlString = `https://${urlString}`;
    }
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// URI格式化工具
export function formatUri(uri: string, type?: UriType): string {
  const trimmed = uri.trim();

  if (!type) {
    const uriInfo = uriParser.parse(trimmed);
    type = uriInfo.type;
  }

  switch (type) {
    case UriType.Email:
      return trimmed.toLowerCase();

    case UriType.Phone:
      return trimmed.replace(/[^\d+\-\(\)\s]/g, '');

    case UriType.Http:
    case UriType.Https:
      if (!trimmed.includes('://')) {
        return `https://${trimmed}`;
      }
      return trimmed.toLowerCase();

    default:
      return trimmed;
  }
}

export function extractDomain(uri: string): string | null {
  try {
    let urlString = uri.trim();
    if (!urlString.includes('://')) {
      urlString = `https://${urlString}`;
    }
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return null;
  }
}

// 导出解析器供外部使用
export { uriParser };
