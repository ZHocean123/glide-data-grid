/**
 * 事件类型定义
 * 从 React 版本迁移并适配 Vue3 事件系统
 */

import type { GridCell } from './grid-cell.js';
import type { GridColumn } from './grid-column.js';
import type { Rectangle, Item, GridSelection } from './base.js';

// 基础鼠标事件参数
export interface BaseGridMouseEventArgs {
  readonly kind: string;
  readonly location: Item;
  readonly bounds: Rectangle;
  readonly localEventX: number;
  readonly localEventY: number;
  readonly isTouch: boolean;
  readonly isLongTouch?: boolean;
  readonly isEdge: boolean;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly scrollEdge: readonly [number, number];
  readonly preventDefault: () => void;
}

// 可定位的鼠标事件参数
export interface PositionableMouseEventArgs extends BaseGridMouseEventArgs {
  readonly button: number;
  readonly clickCount?: number;
}

// 可阻止的事件
export interface PreventableEvent {
  preventDefault(): void;
}

// 单元格点击事件
export interface CellClickedEventArgs extends PositionableMouseEventArgs {
  readonly kind: 'cell';
  readonly cell: GridCell;
}

// 单元格激活事件
export interface CellActivatedEventArgs {
  readonly location: Item;
  readonly bounds: Rectangle;
  readonly cell: GridCell;
}

// 键盘激活的单元格事件
export interface KeyboardCellActivatedEvent extends CellActivatedEventArgs {
  readonly kind: 'keyboard';
}

// 指针激活的单元格事件
export interface PointerCellActivatedEvent extends CellActivatedEventArgs {
  readonly kind: 'pointer';
  readonly localEventX: number;
  readonly localEventY: number;
}

// 标题点击事件
export interface HeaderClickedEventArgs extends PositionableMouseEventArgs {
  readonly kind: 'header';
  readonly column: GridColumn;
  readonly columnIndex: number;
}

// 组标题点击事件
export interface GroupHeaderClickedEventArgs extends PositionableMouseEventArgs {
  readonly kind: 'group-header';
  readonly group: string;
  readonly bounds: Rectangle;
}

// 超出边界区域轴
export enum OutOfBoundsRegionAxis {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

// 超出边界事件
export interface GridMouseOutOfBoundsEventArgs extends BaseGridMouseEventArgs {
  readonly kind: 'out-of-bounds';
  readonly region: OutOfBoundsRegionAxis;
}

// 网格鼠标事件联合类型
export type GridMouseEventArgs =
  | CellClickedEventArgs
  | HeaderClickedEventArgs
  | GroupHeaderClickedEventArgs
  | GridMouseOutOfBoundsEventArgs;

// 网格鼠标单元格事件
export type GridMouseCellEventArgs = CellClickedEventArgs;

// 网格鼠标标题事件
export type GridMouseHeaderEventArgs = HeaderClickedEventArgs;

// 网格鼠标组标题事件
export type GridMouseGroupHeaderEventArgs = GroupHeaderClickedEventArgs;

// 拖拽处理函数类型
export type DragHandler = (args: GridDragEventArgs) => void;

// 拖拽事件参数
export interface GridDragEventArgs {
  readonly kind: 'drag';
  readonly startLocation: Item;
  readonly currentLocation: Item;
  readonly lastLocation: Item;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly localEventX: number;
  readonly localEventY: number;
  readonly isTouch: boolean;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly preventDefault: () => void;
}

// 键盘事件参数
export interface GridKeyEventArgs {
  readonly kind: 'keydown' | 'keyup';
  readonly key: string;
  readonly code: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly location: Item | undefined;
  readonly bounds: Rectangle | undefined;
  readonly preventDefault: () => void;
  readonly stopPropagation: () => void;
}

// 填充模式事件参数
export interface FillPatternEventArgs {
  readonly kind: 'fill';
  readonly startLocation: Item;
  readonly endLocation: Item;
  readonly direction: 'horizontal' | 'vertical';
  readonly pattern: readonly GridCell[];
}

// 事件类型常量
export const cellKind = 'cell' as const;
export const headerKind = 'header' as const;
export const groupHeaderKind = 'group-header' as const;
export const outOfBoundsKind = 'out-of-bounds' as const;

// 事件工具函数
export function mouseEventArgsAreEqual(
  a: GridMouseEventArgs | undefined,
  b: GridMouseEventArgs | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.kind === b.kind &&
    a.location[0] === b.location[0] &&
    a.location[1] === b.location[1] &&
    a.localEventX === b.localEventX &&
    a.localEventY === b.localEventY
  );
}

export function isCellClickedEvent(args: GridMouseEventArgs): args is CellClickedEventArgs {
  return args.kind === cellKind;
}

export function isHeaderClickedEvent(args: GridMouseEventArgs): args is HeaderClickedEventArgs {
  return args.kind === headerKind;
}

export function isGroupHeaderClickedEvent(args: GridMouseEventArgs): args is GroupHeaderClickedEventArgs {
  return args.kind === groupHeaderKind;
}

export function isOutOfBoundsEvent(args: GridMouseEventArgs): args is GridMouseOutOfBoundsEventArgs {
  return args.kind === outOfBoundsKind;
}

// Vue3 特有的事件 Emits 类型定义
export interface DataGridEmits {
  // 单元格事件
  'cell-click': [args: CellClickedEventArgs];
  'cell-double-click': [args: CellClickedEventArgs];
  'cell-context-menu': [args: CellClickedEventArgs];
  'cell-activated': [args: CellActivatedEventArgs];
  'cell-editing-started': [args: CellActivatedEventArgs];
  'cell-editing-stopped': [args: { location: Item; newValue: GridCell | undefined }];

  // 标题事件
  'header-click': [args: HeaderClickedEventArgs];
  'header-double-click': [args: HeaderClickedEventArgs];
  'header-context-menu': [args: HeaderClickedEventArgs];
  'group-header-click': [args: GroupHeaderClickedEventArgs];

  // 选择事件
  'selection-change': [selection: GridSelection];
  'selection-cleared': [];

  // 拖拽事件
  'drag-start': [args: GridDragEventArgs];
  'drag-move': [args: GridDragEventArgs];
  'drag-end': [args: GridDragEventArgs];

  // 键盘事件
  'key-down': [args: GridKeyEventArgs];
  'key-up': [args: GridKeyEventArgs];

  // 滚动事件
  'scroll': [args: { scrollX: number; scrollY: number }];
  'scroll-to': [args: { col: number; row: number }];

  // 填充事件
  'fill-pattern': [args: FillPatternEventArgs];

  // 列事件
  'column-resize': [args: { column: GridColumn; newWidth: number }];
  'column-move': [args: { fromIndex: number; toIndex: number }];
  'column-sort': [args: { column: GridColumn; direction: 'asc' | 'desc' | null }];

  // 行事件
  'row-move': [args: { fromIndex: number; toIndex: number }];
  'rows-delete': [args: { rows: readonly number[] }];

  // 复制粘贴事件
  'copy': [args: { selection: GridSelection; data: string }];
  'paste': [args: { target: Item; data: string }];

  // 搜索事件
  'search': [args: { query: string; results: readonly Item[] }];
  'search-close': [];

  // 菜单事件
  'header-menu': [args: { column: GridColumn; bounds: Rectangle }];
  'cell-menu': [args: { cell: GridCell; location: Item; bounds: Rectangle }];

  // 其他事件
  'focus': [];
  'blur': [];
  'ready': [];
}

// 事件监听器类型
export type EventListener<T extends keyof DataGridEmits> = (...args: DataGridEmits[T]) => void;

// 事件订阅器接口
export interface EventSubscriber {
  subscribe<T extends keyof DataGridEmits>(
    event: T,
    listener: EventListener<T>
  ): () => void;

  unsubscribe<T extends keyof DataGridEmits>(
    event: T,
    listener: EventListener<T>
  ): void;

  emit<T extends keyof DataGridEmits>(
    event: T,
    ...args: DataGridEmits[T]
  ): void;
}
