/**
 * Markdown单元格渲染器
 * 从 React 版本迁移并适配 Vue3
 */

import type { MarkdownCell } from '../types/grid-cell.js';
import type { DrawArgs, CustomRenderer } from '../types/cell-renderer.js';
import { drawCellBorder } from '../types/cell-renderer.js';
import { GridCellKind } from '../types/grid-cell.js';

// Markdown解析接口
interface ParsedMarkdown {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'header';
  content: string;
  level?: number; // for headers
  href?: string; // for links
}

// 简化的Markdown解析器
class SimpleMarkdownParser {
  private static instance: SimpleMarkdownParser;

  static getInstance(): SimpleMarkdownParser {
    if (!SimpleMarkdownParser.instance) {
      SimpleMarkdownParser.instance = new SimpleMarkdownParser();
    }
    return SimpleMarkdownParser.instance;
  }

  parse(text: string): ParsedMarkdown[] {
    if (!text) return [];

    const tokens: ParsedMarkdown[] = [];
    let current = 0;

    while (current < text.length) {
      // 匹配标题
      if (text[current] === '#' && (current === 0 || text[current - 1] === '\n')) {
        const match = text.substring(current).match(/^(#{1,6})\s+(.+?)(\n|$)/);
        if (match) {
          tokens.push({
            type: 'header',
            content: match[2],
            level: match[1].length
          });
          current += match[0].length;
          continue;
        }
      }

      // 匹配链接 [text](url)
      const linkMatch = text.substring(current).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push({
          type: 'link',
          content: linkMatch[1],
          href: linkMatch[2]
        });
        current += linkMatch[0].length;
        continue;
      }

      // 匹配粗体 **text**
      const boldMatch = text.substring(current).match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push({
          type: 'bold',
          content: boldMatch[1]
        });
        current += boldMatch[0].length;
        continue;
      }

      // 匹配斜体 *text*
      const italicMatch = text.substring(current).match(/^\*([^*]+)\*/);
      if (italicMatch) {
        tokens.push({
          type: 'italic',
          content: italicMatch[1]
        });
        current += italicMatch[0].length;
        continue;
      }

      // 匹配内联代码 `code`
      const codeMatch = text.substring(current).match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push({
          type: 'code',
          content: codeMatch[1]
        });
        current += codeMatch[0].length;
        continue;
      }

      // 普通文本
      let endPos = current + 1;
      while (endPos < text.length) {
        const char = text[endPos];
        if (char === '*' || char === '`' || char === '[' ||
            (char === '#' && (endPos === 0 || text[endPos - 1] === '\n'))) {
          break;
        }
        endPos++;
      }

      if (endPos > current) {
        tokens.push({
          type: 'text',
          content: text.substring(current, endPos)
        });
        current = endPos;
      } else {
        current++;
      }
    }

    return tokens;
  }
}

// 获取解析器实例
const markdownParser = SimpleMarkdownParser.getInstance();

// 测量文本宽度
function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const savedFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = savedFont;
  return width;
}

// 绘制文本并返回占用宽度
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string
): number {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
  return measureText(ctx, text, font);
}

// 绘制带下划线的链接
function drawLink(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string
): number {
  const width = drawText(ctx, text, x, y, font, color);

  // 绘制下划线
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + width, y + 2);
  ctx.stroke();
  ctx.restore();

  return width;
}

// 渲染Markdown内容
function renderMarkdown(
  ctx: CanvasRenderingContext2D,
  tokens: ParsedMarkdown[],
  rect: { x: number; y: number; width: number; height: number },
  theme: any,
  padding = 8
): { width: number; height: number; clickableAreas: Array<{ rect: { x: number; y: number; width: number; height: number }; href: string }> } {
  const contentRect = {
    x: rect.x + padding,
    y: rect.y + padding,
    width: rect.width - 2 * padding,
    height: rect.height - 2 * padding
  };

  let currentX = contentRect.x;
  let currentY = contentRect.y;
  let lineHeight = 16;
  let maxWidth = 0;
  const clickableAreas: Array<{ rect: { x: number; y: number; width: number; height: number }; href: string }> = [];

  for (const token of tokens) {
    if (currentY > contentRect.y + contentRect.height) break;

    let font = theme.baseFontStyle || '12px sans-serif';
    let color = theme.textDark || '#000000';
    let currentLineHeight = lineHeight;

    switch (token.type) {
      case 'header':
        // 标题样式
        const headerSize = Math.max(12, 18 - (token.level || 1) * 2);
        font = `bold ${headerSize}px sans-serif`;
        color = theme.textHeader || '#1a1a1a';
        currentLineHeight = headerSize + 4;

        // 标题独占一行
        if (currentX > contentRect.x) {
          currentY += currentLineHeight;
          currentX = contentRect.x;
        }
        break;

      case 'bold':
        font = `bold ${theme.baseFontSize || 12}px sans-serif`;
        break;

      case 'italic':
        font = `italic ${theme.baseFontSize || 12}px sans-serif`;
        break;

      case 'code':
        font = `${theme.baseFontSize || 12}px monospace`;
        color = theme.textMedium || '#666666';
        // 绘制代码背景
        const codeWidth = measureText(ctx, token.content, font);
        ctx.save();
        ctx.fillStyle = theme.bgBubble || '#f5f5f5';
        ctx.fillRect(currentX - 2, currentY - currentLineHeight + 4, codeWidth + 4, currentLineHeight);
        ctx.restore();
        break;

      case 'link':
        color = theme.linkColor || '#0066cc';
        break;

      case 'text':
      default:
        // 使用默认样式
        break;
    }

    // 检查是否需要换行
    const tokenWidth = measureText(ctx, token.content, font);
    if (currentX + tokenWidth > contentRect.x + contentRect.width && currentX > contentRect.x) {
      currentY += currentLineHeight;
      currentX = contentRect.x;
    }

    // 确保不超出垂直边界
    if (currentY + currentLineHeight > contentRect.y + contentRect.height) {
      break;
    }

    // 绘制文本
    let drawnWidth = 0;
    if (token.type === 'link') {
      drawnWidth = drawLink(ctx, token.content, currentX, currentY, font, color);
      // 记录可点击区域
      if (token.href) {
        clickableAreas.push({
          rect: {
            x: currentX,
            y: currentY - currentLineHeight + 4,
            width: drawnWidth,
            height: currentLineHeight
          },
          href: token.href
        });
      }
    } else {
      drawnWidth = drawText(ctx, token.content, currentX, currentY, font, color);
    }

    currentX += drawnWidth;
    maxWidth = Math.max(maxWidth, currentX - contentRect.x);

    // 标题后换行
    if (token.type === 'header') {
      currentY += currentLineHeight;
      currentX = contentRect.x;
    }
  }

  return {
    width: maxWidth,
    height: currentY - contentRect.y + lineHeight,
    clickableAreas
  };
}

// Markdown单元格渲染器实现
export const markdownCellRenderer: CustomRenderer<MarkdownCell> = {
  draw: (args: DrawArgs<MarkdownCell>) => {
    const { ctx, rect, cell, theme, highlighted } = args;

    // 绘制单元格背景
    ctx.save();
    ctx.fillStyle = highlighted ? theme.bgSearchResult : theme.bgCell;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // 绘制边框
    drawCellBorder(ctx, rect, theme);

    // 解析并渲染Markdown
    const text = cell.data || '';
    if (text.trim()) {
      const tokens = markdownParser.parse(text);
      renderMarkdown(ctx, tokens, rect, theme);
    } else {
      // 空内容提示
      ctx.fillStyle = theme.textLight || '#999999';
      ctx.font = theme.baseFontStyle || '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty markdown', rect.x + rect.width / 2, rect.y + rect.height / 2);
    }

    ctx.restore();
  },

  measure: (ctx, cell, theme) => {
    const text = cell.data || '';
    if (!text.trim()) return theme.cellHorizontalPadding * 2;

    const tokens = markdownParser.parse(text);
    let maxWidth = 0;

    for (const token of tokens) {
      let font = theme.baseFontStyle || '12px sans-serif';

      switch (token.type) {
        case 'header':
          const headerSize = Math.max(12, 18 - (token.level || 1) * 2);
          font = `bold ${headerSize}px sans-serif`;
          break;
        case 'bold':
          font = `bold ${theme.baseFontSize || 12}px sans-serif`;
          break;
        case 'italic':
          font = `italic ${theme.baseFontSize || 12}px sans-serif`;
          break;
        case 'code':
          font = `${theme.baseFontSize || 12}px monospace`;
          break;
      }

      const width = measureText(ctx, token.content, font);
      maxWidth = Math.max(maxWidth, width);
    }

    return Math.max(maxWidth + theme.cellHorizontalPadding * 2, 100);
  },

  hitTest: (cell, pos, bounds) => {
    // 检查是否点击了链接
    const text = cell.data || '';
    if (!text.trim()) return false;

    // 这里需要重新解析来获取点击区域，在实际实现中可以缓存
    return pos.x >= bounds.x &&
           pos.x <= bounds.x + bounds.width &&
           pos.y >= bounds.y &&
           pos.y <= bounds.y + bounds.height;
  },

  provideEditor: (cell) => {
    if (!cell.allowOverlay) return undefined;

    // 返回Markdown编辑器组件 (稍后实现)
    return {
      editor: {} as any, // MarkdownEditor component
      disablePadding: false,
      deletedValue: () => ({
        ...cell,
        data: '',
      }),
    };
  },

  getCursor: (cell, pos, bounds) => {
    // 如果点击位置是链接，显示手形光标
    const text = cell.data || '';
    if (!text.trim()) return 'default';

    // 简化：如果包含链接就显示pointer
    if (text.includes('[') && text.includes('](')) {
      return 'pointer';
    }

    return 'default';
  },

  onPaste: (val, cell) => {
    // 处理粘贴的Markdown文本
    return {
      ...cell,
      data: val,
    };
  },
};

// 内部渲染器导出
export const internalMarkdownCellRenderer = {
  ...markdownCellRenderer,
  kind: GridCellKind.Markdown,
};

// 创建Markdown单元格的工厂函数
export function createMarkdownCell(
  data: string,
  options: Partial<Omit<MarkdownCell, 'kind' | 'data'>> = {}
): MarkdownCell {
  return {
    kind: GridCellKind.Markdown,
    data,
    allowOverlay: false,
    ...options,
  };
}

// Markdown单元格工具函数
export function isMarkdownEmpty(cell: MarkdownCell): boolean {
  return !cell.data || cell.data.trim().length === 0;
}

export function getMarkdownPlainText(cell: MarkdownCell): string {
  const text = cell.data || '';
  const tokens = markdownParser.parse(text);
  return tokens.map(token => token.content).join('');
}

export function getMarkdownLinks(cell: MarkdownCell): Array<{ text: string; href: string }> {
  const text = cell.data || '';
  const tokens = markdownParser.parse(text);
  return tokens
    .filter(token => token.type === 'link' && token.href)
    .map(token => ({ text: token.content, href: token.href! }));
}

export function hasMarkdownContent(cell: MarkdownCell, type: 'header' | 'bold' | 'italic' | 'code' | 'link'): boolean {
  const text = cell.data || '';
  const tokens = markdownParser.parse(text);
  return tokens.some(token => token.type === type);
}

// Markdown格式化工具
export function formatMarkdown(text: string): string {
  // 简单的Markdown格式化
  return text
    .replace(/\n{3,}/g, '\n\n') // 减少多余换行
    .replace(/^(\s*)/gm, '') // 移除行首空白
    .trim();
}

export function escapeMarkdown(text: string): string {
  // 转义Markdown特殊字符
  return text.replace(/([*`#\[\]()_~])/g, '\\$1');
}

export function unescapeMarkdown(text: string): string {
  // 反转义Markdown特殊字符
  return text.replace(/\\([*`#\[\]()_~])/g, '$1');
}

// 导出解析器供外部使用
export { markdownParser };
