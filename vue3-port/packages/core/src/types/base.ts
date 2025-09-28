/**
 * 基础数据类型定义
 * 从 React 版本迁移的核心类型
 */

// 二维坐标点
export interface Point {
  readonly x: number;
  readonly y: number;
}

// 矩形区域
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// 尺寸
export interface Size {
  readonly width: number;
  readonly height: number;
}

// 网格项 [列索引, 行索引]
export type Item = readonly [number, number];

// 切片范围
export interface Slice {
  readonly start: number;
  readonly end: number;
}

// 压缩选择区域 (用于性能优化)
export class CompactSelection {
  private _ranges: readonly Slice[] = [];

  constructor(ranges?: readonly Slice[]) {
    if (ranges) {
      this._ranges = ranges;
    }
  }

  get ranges(): readonly Slice[] {
    return this._ranges;
  }

  get length(): number {
    return this._ranges.reduce((acc, range) => acc + (range.end - range.start), 0);
  }

  has(index: number): boolean {
    return this._ranges.some(range => index >= range.start && index < range.end);
  }

  add(index: number): CompactSelection {
    // 简化实现，实际需要更复杂的合并逻辑
    if (this.has(index)) return this;
    const newRanges = [...this._ranges, { start: index, end: index + 1 }];
    return new CompactSelection(newRanges);
  }

  remove(index: number): CompactSelection {
    // 简化实现
    const newRanges = this._ranges.filter(range => !(index >= range.start && index < range.end));
    return new CompactSelection(newRanges);
  }

  static empty(): CompactSelection {
    return new CompactSelection([]);
  }

  static fromSingleSelection(index: number): CompactSelection {
    return new CompactSelection([{ start: index, end: index + 1 }]);
  }
}

// 方向枚举
export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right'
}

// 混合模式
export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay'
}

// 网格选择
export interface GridSelection {
  readonly current?: {
    readonly cell: Item;
    readonly range: Rectangle;
    readonly rangeStack: readonly Rectangle[];
  };
  readonly columns: CompactSelection;
  readonly rows: CompactSelection;
}

// 空选择
export const emptyGridSelection: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty()
};

// 工具函数
export function itemsAreEqual(a: Item, b: Item): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function rectanglesAreEqual(a: Rectangle, b: Rectangle): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function pointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

export function rectIntersection(a: Rectangle, b: Rectangle): Rectangle | undefined {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (left < right && top < bottom) {
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }
  return undefined;
}
