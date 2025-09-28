/**
 * 网格列类型定义
 * 从 React 版本迁移并适配 Vue3
 */

import type { GridCell } from './grid-cell.js';

// 列图标枚举
export enum GridColumnIcon {
  HeaderRowID = 'headerRowID',
  HeaderCode = 'headerCode',
  HeaderNumber = 'headerNumber',
  HeaderString = 'headerString',
  HeaderBoolean = 'headerBoolean',
  HeaderAudioUri = 'headerAudioUri',
  HeaderVideoUri = 'headerVideoUri',
  HeaderEmoji = 'headerEmoji',
  HeaderImage = 'headerImage',
  HeaderUri = 'headerUri',
  HeaderPhone = 'headerPhone',
  HeaderMarkdown = 'headerMarkdown',
  HeaderDate = 'headerDate',
  HeaderTime = 'headerTime',
  HeaderEmail = 'headerEmail',
  HeaderReference = 'headerReference',
  HeaderIfThenElse = 'headerIfThenElse',
  HeaderSingleValue = 'headerSingleValue',
  HeaderLookup = 'headerLookup',
  HeaderTextTemplate = 'headerTextTemplate',
  HeaderMath = 'headerMath',
  HeaderRollup = 'headerRollup',
  HeaderJoinStrings = 'headerJoinStrings',
  HeaderSplitString = 'headerSplitString',
  HeaderGeoDistance = 'headerGeoDistance',
  HeaderArray = 'headerArray',
  RowOwnerOverlay = 'rowOwnerOverlay',
  ProtectedColumnOverlay = 'protectedColumnOverlay',
}

// 列菜单图标枚举
export enum GridColumnMenuIcon {
  Triangle = 'triangle',
  Dots = 'dots',
}

// 基础列接口
export interface BaseGridColumn {
  readonly title: string;
  readonly group?: string;
  readonly icon?: GridColumnIcon | string;
  readonly overlayIcon?: GridColumnIcon | string;
  readonly menuIcon?: GridColumnMenuIcon | string;
  readonly indicatorIcon?: GridColumnIcon | string;
  readonly hasMenu?: boolean;
  readonly grow?: number;
  readonly style?: 'normal' | 'highlight';
  readonly themeOverride?: Record<string, any>;
  readonly trailingRowOptions?: {
    readonly hint?: string;
    readonly addIcon?: string;
    readonly targetColumn?: number | GridColumn;
    readonly themeOverride?: Record<string, any>;
    readonly disabled?: boolean;
  };
}

// 固定宽度列
export interface SizedGridColumn extends BaseGridColumn {
  readonly width: number;
  readonly id?: string;
  readonly minWidth?: number;
  readonly maxWidth?: number;
}

// 自动宽度列
export interface AutoGridColumn extends BaseGridColumn {
  readonly id: string;
  readonly minWidth?: number;
  readonly maxWidth?: number;
}

// 列联合类型
export type GridColumn = SizedGridColumn | AutoGridColumn;

// 内部列扩展 (用于内部处理)
export interface InnerGridColumn extends SizedGridColumn {
  readonly growOffset?: number;
  readonly rowMarker?: 'square' | 'circle';
  readonly rowMarkerChecked?: boolean | null | undefined;
  readonly headerRowMarkerTheme?: Record<string, any>;
  readonly sourceIndex: number;
  readonly sticky: boolean;
}

// 类型守卫函数
export function isSizedGridColumn(c: GridColumn): c is SizedGridColumn {
  return 'width' in c && typeof c.width === 'number';
}

export function isAutoGridColumn(c: GridColumn): c is AutoGridColumn {
  return !('width' in c) && 'id' in c;
}

// 列组相关类型
export interface ColumnGroup {
  readonly title: string;
  readonly columns: readonly GridColumn[];
  readonly icon?: GridColumnIcon | string;
  readonly actions?: readonly ColumnGroupAction[];
}

export interface ColumnGroupAction {
  readonly title: string;
  readonly icon?: GridColumnIcon | string;
  readonly onClick: (group: ColumnGroup) => void;
}

// 列配置选项
export interface ColumnConfig {
  readonly resizable?: boolean;
  readonly sortable?: boolean;
  readonly reorderable?: boolean;
  readonly freezable?: boolean;
  readonly hideable?: boolean;
}

// 列事件类型
export interface ColumnEvent {
  readonly column: GridColumn;
  readonly columnIndex: number;
}

export interface ColumnResizeEvent extends ColumnEvent {
  readonly newWidth: number;
  readonly finished: boolean;
}

export interface ColumnMoveEvent extends ColumnEvent {
  readonly newIndex: number;
}

export interface ColumnSortEvent extends ColumnEvent {
  readonly direction: 'asc' | 'desc' | null;
}

// 列宽度计算相关
export interface ColumnMeasureInfo {
  readonly column: GridColumn;
  readonly columnIndex: number;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly idealWidth?: number;
}

// 列自动宽度配置
export interface AutoSizeConfig {
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly extraPadding?: number;
  readonly exactWidthColumns?: readonly number[];
}

// 工具函数
export function getColumnWidth(column: GridColumn, defaultWidth = 150): number {
  if (isSizedGridColumn(column)) {
    return column.width;
  }
  return defaultWidth;
}

export function setColumnWidth(column: GridColumn, width: number): SizedGridColumn {
  return {
    ...column,
    width,
  };
}

export function createColumn(
  title: string,
  width: number,
  options: Partial<SizedGridColumn> = {}
): SizedGridColumn {
  return {
    title,
    width,
    ...options,
  };
}

export function createAutoColumn(
  title: string,
  id: string,
  options: Partial<AutoGridColumn> = {}
): AutoGridColumn {
  return {
    title,
    id,
    ...options,
  };
}

// 默认列配置
export const defaultColumnConfig: ColumnConfig = {
  resizable: true,
  sortable: false,
  reorderable: true,
  freezable: true,
  hideable: true,
};

// 验证列配置
export function validateColumn(column: GridColumn): boolean {
  if (!column.title || column.title.trim() === '') {
    return false;
  }

  if (isSizedGridColumn(column)) {
    return column.width > 0;
  }

  if (isAutoGridColumn(column)) {
    return column.id.trim() !== '';
  }

  return false;
}
