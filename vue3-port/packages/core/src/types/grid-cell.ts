/**
 * 网格单元格类型定义
 * 从 React 版本迁移并适配 Vue3
 */

import type { Component } from 'vue';
import type { Rectangle, Item } from './base.js';
import { BlendMode, Direction } from './base.js';
import { GridColumnIcon, GridColumnMenuIcon } from './grid-column.js';
import { OutOfBoundsRegionAxis } from './events.js';

// 单元格种类枚举
export enum GridCellKind {
  Uri = 'uri',
  Text = 'text',
  Image = 'image',
  RowID = 'row-id',
  Number = 'number',
  Bubble = 'bubble',
  Boolean = 'boolean',
  Loading = 'loading',
  Markdown = 'markdown',
  Drilldown = 'drilldown',
  Protected = 'protected',
  Custom = 'custom',
}

// 布尔值特殊状态
export const BooleanEmpty = null;
export const BooleanIndeterminate = undefined;
export type BooleanEmpty = null;
export type BooleanIndeterminate = undefined;

// 基础单元格接口
export interface BaseGridCell {
  readonly kind: GridCellKind;
  readonly allowOverlay: boolean;
  readonly readonly?: boolean;
  readonly span?: readonly [number, number];
  readonly style?: 'normal' | 'faded';
  readonly themeOverride?: Record<string, any>;
  readonly cursor?: string;
  readonly copyData?: string;
}

// 可编辑单元格接口
export interface EditableGridCell extends BaseGridCell {
  readonly allowOverlay: true;
}

// 文本单元格
export interface TextCell extends BaseGridCell {
  readonly kind: GridCellKind.Text;
  readonly data: string;
  readonly displayData?: string;
  readonly allowWrapping?: boolean;
  readonly hyperlink?: string;
}

// 数字单元格
export interface NumberCell extends BaseGridCell {
  readonly kind: GridCellKind.Number;
  readonly data: number | undefined;
  readonly displayData?: string;
  readonly formatHint?: string;
  readonly fixedDecimals?: number;
  readonly allowNegative?: boolean;
}

// 布尔单元格
export interface BooleanCell extends BaseGridCell {
  readonly kind: GridCellKind.Boolean;
  readonly data: boolean | BooleanEmpty | BooleanIndeterminate;
  readonly showUnchecked?: boolean;
  readonly allowEdit?: boolean;
}

// 图片单元格
export interface ImageCell extends BaseGridCell {
  readonly kind: GridCellKind.Image;
  readonly data: readonly string[];
  readonly displayData?: readonly string[];
  readonly allowAdd?: boolean;
  readonly allowOverlay?: boolean;
}

// URI单元格
export interface UriCell extends BaseGridCell {
  readonly kind: GridCellKind.Uri;
  readonly data: string;
  readonly displayData?: string;
  readonly onClickUri?: (uri: string) => void;
}

// Markdown单元格
export interface MarkdownCell extends BaseGridCell {
  readonly kind: GridCellKind.Markdown;
  readonly data: string;
  readonly allowOverlay?: boolean;
}

// 气泡单元格
export interface BubbleCell extends BaseGridCell {
  readonly kind: GridCellKind.Bubble;
  readonly data: readonly string[];
}

// 下钻单元格
export interface DrilldownCell extends BaseGridCell {
  readonly kind: GridCellKind.Drilldown;
  readonly data: readonly { text: string; img?: string }[];
}

// 行ID单元格
export interface RowIDCell extends BaseGridCell {
  readonly kind: GridCellKind.RowID;
  readonly data: string;
}

// 加载单元格
export interface LoadingCell extends BaseGridCell {
  readonly kind: GridCellKind.Loading;
  readonly skeletonWidth?: number;
  readonly skeletonWidthVariability?: number;
}

// 受保护单元格
export interface ProtectedCell extends BaseGridCell {
  readonly kind: GridCellKind.Protected;
}

// 自定义单元格
export interface CustomCell<T = any> extends BaseGridCell {
  readonly kind: GridCellKind.Custom;
  readonly data: T;
  readonly copyData?: string;
  readonly themeOverride?: Record<string, any>;
}

// 联合类型：所有单元格类型
export type GridCell =
  | TextCell
  | NumberCell
  | BooleanCell
  | ImageCell
  | UriCell
  | MarkdownCell
  | BubbleCell
  | DrilldownCell
  | RowIDCell
  | LoadingCell
  | ProtectedCell
  | CustomCell;

// 可编辑单元格类型
export type EditableGridCell = Extract<GridCell, { allowOverlay: true }>;

// 只读单元格类型
export type ReadonlyGridCell = Exclude<GridCell, EditableGridCell>;

// 单元格数组类型
export type CellArray = readonly (readonly GridCell[])[];

// 获取单元格数据的异步函数
export type GetCellsThunk = () => Promise<CellArray>;

// 类型守卫函数
export function isEditableGridCell(cell: GridCell): cell is EditableGridCell {
  return cell.allowOverlay === true;
}

export function isReadWriteCell(cell: GridCell): cell is EditableGridCell {
  return cell.allowOverlay === true && cell.readonly !== true;
}

export function isTextCell(cell: GridCell): cell is TextCell {
  return cell.kind === GridCellKind.Text;
}

export function isNumberCell(cell: GridCell): cell is NumberCell {
  return cell.kind === GridCellKind.Number;
}

export function isBooleanCell(cell: GridCell): cell is BooleanCell {
  return cell.kind === GridCellKind.Boolean;
}

export function isImageCell(cell: GridCell): cell is ImageCell {
  return cell.kind === GridCellKind.Image;
}

export function isCustomCell(cell: GridCell): cell is CustomCell {
  return cell.kind === GridCellKind.Custom;
}

// 单元格激活行为
export enum CellActivationBehavior {
  /** 单击激活 */
  SingleClick = 'single-click',
  /** 双击激活 */
  DoubleClick = 'double-click',
  /** 第二次单击激活 */
  SecondClick = 'second-click',
}

// 填充手柄方向
export enum FillHandleDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

// 验证过的单元格类型
export interface ValidatedGridCell extends GridCell {
  readonly valid: boolean;
  readonly validationMessage?: string;
}

// 解析单元格异步函数
export async function resolveCellsThunk(thunk: GetCellsThunk | CellArray): Promise<CellArray> {
  if (typeof thunk === 'object') return thunk;
  return await thunk();
}

// 创建空单元格的工厂函数
export function createEmptyTextCell(): TextCell {
  return {
    kind: GridCellKind.Text,
    data: '',
    allowOverlay: false,
    displayData: '',
  };
}

export function createEmptyNumberCell(): NumberCell {
  return {
    kind: GridCellKind.Number,
    data: undefined,
    allowOverlay: false,
  };
}

export function createLoadingCell(): LoadingCell {
  return {
    kind: GridCellKind.Loading,
    allowOverlay: false,
  };
}

// Re-export grid column types
export { GridColumnIcon, GridColumnMenuIcon };

// Re-export event types
export { OutOfBoundsRegionAxis };

// Re-export base types
export { BlendMode, Direction };
