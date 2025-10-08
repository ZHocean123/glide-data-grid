/**
 * Vue版本的Glide Data Grid核心类型定义
 * 与React版本保持一致，但使用Vue的响应式系统
 */

// 基础类型定义
export type Item = readonly [number, number];
export type Slice = readonly [number, number];

// 矩形区域
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

// 紧凑选择
export class CompactSelection {
    private constructor(
        private readonly offsets: number[],
        private readonly counts: number[]
    ) {}

    static empty(): CompactSelection {
        return new CompactSelection([], []);
    }

    static fromSingleSelection(index: number | Slice): CompactSelection {
        if (typeof index === "number") {
            return new CompactSelection([index], [1]);
        }
        return new CompactSelection([index[0]], [index[1] - index[0]]);
    }

    get length(): number {
        return this.counts.reduce((a, b) => a + b, 0);
    }

    hasIndex(index: number): boolean {
        for (let i = 0; i < this.offsets.length; i++) {
            const offset = this.offsets[i];
            const count = this.counts[i];
            if (index >= offset && index < offset + count) {
                return true;
            }
        }
        return false;
    }

    first(): number | undefined {
        return this.offsets[0];
    }

    add(index: number | Slice): CompactSelection {
        if (typeof index === "number") {
            return this.add([index, index + 1]);
        }

        const [start, end] = index;
        if (start >= end) return this;

        const newOffsets = [...this.offsets];
        const newCounts = [...this.counts];

        // 简化实现，实际需要更复杂的合并逻辑
        newOffsets.push(start);
        newCounts.push(end - start);

        return new CompactSelection(newOffsets, newCounts);
    }

    remove(index: number): CompactSelection {
        // 简化实现，实际需要更复杂的移除逻辑
        const newOffsets: number[] = [];
        const newCounts: number[] = [];

        for (let i = 0; i < this.offsets.length; i++) {
            const offset = this.offsets[i];
            const count = this.counts[i];
            
            if (index < offset || index >= offset + count) {
                newOffsets.push(offset);
                newCounts.push(count);
            } else {
                // 需要分割
                if (index > offset) {
                    newOffsets.push(offset);
                    newCounts.push(index - offset);
                }
                if (index < offset + count - 1) {
                    newOffsets.push(index + 1);
                    newCounts.push(offset + count - index - 1);
                }
            }
        }

        return new CompactSelection(newOffsets, newCounts);
    }

    hasAll(slice: Slice): boolean {
        const [start, end] = slice;
        for (let i = start; i < end; i++) {
            if (!this.hasIndex(i)) {
                return false;
            }
        }
        return true;
    }

    offset(offset: number): CompactSelection {
        const newOffsets = this.offsets.map(o => o + offset);
        return new CompactSelection(newOffsets, [...this.counts]);
    }
}

// 复制粘贴项类型
export interface CopyPasteItem {
    readonly rawValue: string | boolean | string[] | number | boolean;
    readonly formatted?: string | string[];
}

// 复制缓冲区类型
export type CopyBuffer = readonly (readonly CopyPasteItem[])[];

// 网格选择类型
export interface GridSelection {
    readonly current?: {
        readonly cell: Item;
        readonly range: Readonly<Rectangle>;
        readonly rangeStack: readonly Readonly<Rectangle>[];
    };
    readonly columns: CompactSelection;
    readonly rows: CompactSelection;
}

// 单元格类型
export enum GridCellKind {
    Text = "text",
    Number = "number",
    Boolean = "boolean",
    Image = "image",
    Uri = "uri",
    Markdown = "markdown",
    Custom = "custom",
    Loading = "loading",
    Protected = "protected",
    Bubble = "bubble",
    Drilldown = "drilldown",
    RowID = "row-id",
}

// 基础单元格接口
export interface GridCell {
    readonly kind: GridCellKind;
    readonly allowOverlay: boolean;
    readonly copyData?: string;
    readonly themeOverride?: any;
    readonly span?: readonly [number, number];
    readonly activationBehaviorOverride?: CellActivationBehavior;
}

// 文本单元格
export interface TextCell extends GridCell {
    readonly kind: GridCellKind.Text;
    readonly data: string;
    readonly displayData?: string;
}

// 数字单元格
export interface NumberCell extends GridCell {
    readonly kind: GridCellKind.Number;
    readonly data: number;
    readonly displayData?: string;
    readonly allowOverlay: true;
}

// 布尔单元格
export interface BooleanCell extends GridCell {
    readonly kind: GridCellKind.Boolean;
    readonly data: boolean | null | undefined;
    readonly allowOverlay: false;
    readonly readonly?: boolean;
}

// 图像单元格
export interface ImageCell extends GridCell {
    readonly kind: GridCellKind.Image;
    readonly data: string[];
    readonly allowOverlay: true;
}

// URI单元格
export interface UriCell extends GridCell {
    readonly kind: GridCellKind.Uri;
    readonly data: string;
    readonly displayData?: string;
    readonly allowOverlay: true;
}

// Markdown单元格
export interface MarkdownCell extends GridCell {
    readonly kind: GridCellKind.Markdown;
    readonly data: string;
    readonly allowOverlay: true;
}

// 自定义单元格
export interface CustomCell<T = any> extends GridCell {
    readonly kind: GridCellKind.Custom;
    readonly data: T;
    readonly copyData: string;
}

// 加载单元格
export interface LoadingCell extends GridCell {
    readonly kind: GridCellKind.Loading;
}

// 受保护单元格
export interface ProtectedCell extends GridCell {
    readonly kind: GridCellKind.Protected;
}

// 气泡单元格
export interface BubbleCell extends GridCell {
    readonly kind: GridCellKind.Bubble;
    readonly data: string[];
}

// 下钻单元格
export interface DrilldownCell extends GridCell {
    readonly kind: GridCellKind.Drilldown;
    readonly data: readonly { text: string; img?: string }[];
}

// 行ID单元格
export interface RowIDCell extends GridCell {
    readonly kind: GridCellKind.RowID;
    readonly data: string;
}

// 可编辑单元格类型
export type EditableGridCell = TextCell | NumberCell | UriCell | MarkdownCell | CustomCell | BooleanCell;

// 布尔值枚举
export const BooleanEmpty = undefined;
export const BooleanIndeterminate = null;

// 选择混合类型
export type SelectionBlending = "exclusive" | "mixed" | "additive";

// 选择触发类型
export type SelectionTrigger = "click" | "drag" | "keyboard-nav" | "keyboard-select" | "edit";

// 填充手柄方向
export type FillHandleDirection = "horizontal" | "vertical" | "orthogonal" | "any";

// 填充手柄配置
export interface FillHandleConfig {
    readonly shape: "square" | "circle";
    readonly size: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly outline: number;
}

// 填充手柄类型
export type FillHandle = boolean | Partial<FillHandleConfig>;

// 单元格激活行为
export type CellActivationBehavior = "single-click" | "second-click" | "double-click";

// 行选择模式
export type RowSelectionMode = "auto" | "multi";

// 列选择模式
export type ColumnSelectionMode = "auto" | "multi";

// 范围选择类型
export type RangeSelectType = "none" | "cell" | "rect" | "multi-cell" | "multi-rect";

// 选择类型
export type SelectType = "none" | "single" | "multi";

// 编辑列表项
export interface EditListItem {
    readonly location: Item;
    readonly value: EditableGridCell;
}

// 验证单元格结果
export type ValidatedGridCell = EditableGridCell;

// 内部网格单元格类型
export enum InnerGridCellKind {
    Marker = "marker",
    NewRow = "new-row",
}

// 内部网格单元格
export interface InnerGridCell {
    readonly kind: InnerGridCellKind;
    readonly allowOverlay: boolean;
}

// 标记单元格
export interface MarkerCell extends InnerGridCell {
    readonly kind: InnerGridCellKind.Marker;
    readonly checked?: boolean;
    readonly markerKind: string;
    readonly row: number;
    readonly drawHandle?: boolean;
    readonly cursor?: string;
    readonly checkboxStyle?: "circle" | "square";
}

// 新行单元格
export interface NewRowCell extends InnerGridCell {
    readonly kind: InnerGridCellKind.NewRow;
    readonly hint?: string;
    readonly icon?: string;
}

// 网格列
export interface GridColumn {
    readonly title: string;
    readonly width: number;
    readonly icon?: string;
    readonly hasMenu?: boolean;
    readonly style?: "normal" | "highlight";
    readonly themeOverride?: any;
    readonly overlayIcon?: string;
    readonly readonly?: boolean;
    readonly group?: string;
    readonly trailingRowOptions?: {
        readonly hint?: string;
        readonly disabled?: boolean;
        readonly addIcon?: string;
        readonly targetColumn?: number | GridColumn;
    };
}

// 事件参数类型
export interface GridMouseEventArgs {
    readonly kind: string;
    readonly location: Item;
    readonly bounds: Rectangle;
    readonly localEventX: number;
    readonly localEventY: number;
    readonly button: number;
    readonly buttons: number;
    readonly isEdge: boolean;
    readonly isTouch: boolean;
    readonly isLongTouch: boolean;
    readonly isDoubleClick: boolean;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly scrollEdge: readonly [number, number];
    readonly preventDefault: () => void;
    readonly stopPropagation: () => void;
}

export interface GridKeyEventArgs {
    readonly key: string;
    readonly keyCode: number;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly bounds?: Rectangle;
    readonly location?: Item;
    readonly cancel: () => void;
    readonly stopPropagation: () => void;
    readonly preventDefault: () => void;
    readonly rawEvent?: KeyboardEvent;
}

export interface CellClickedEventArgs extends GridMouseEventArgs {
    readonly preventDefault: () => void;
}

export interface CellActivatedEventArgs {
    readonly inputType: "pointer" | "keyboard";
    readonly pointerActivation?: "single-click" | "second-click" | "double-click";
    readonly pointerType?: "mouse" | "touch";
    readonly key?: string;
}

export interface HeaderClickedEventArgs extends GridMouseEventArgs {
    readonly preventDefault: () => void;
}

export interface GroupHeaderClickedEventArgs extends GridMouseEventArgs {
    readonly preventDefault: () => void;
}

export interface FillPatternEventArgs {
    readonly fillDestination: Rectangle;
    readonly patternSource: Rectangle;
    readonly preventDefault: () => void;
}

// 工具函数
export function isEditableGridCell(cell: GridCell): cell is EditableGridCell {
    return (
        cell.kind === GridCellKind.Text ||
        cell.kind === GridCellKind.Number ||
        cell.kind === GridCellKind.Uri ||
        cell.kind === GridCellKind.Markdown ||
        cell.kind === GridCellKind.Custom ||
        cell.kind === GridCellKind.Boolean
    );
}

export function isReadWriteCell(cell: GridCell): boolean {
    return isEditableGridCell(cell) && (cell as any).readonly !== true;
}

export function isInnerOnlyCell(cell: InnerGridCell): boolean {
    return cell.kind === InnerGridCellKind.Marker || cell.kind === InnerGridCellKind.NewRow;
}

// 空选择
export const emptyGridSelection: GridSelection = {
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
    current: undefined,
};

// 数据网格搜索属性
export interface DataGridSearchProps {
    getCellsForSelection?: (
        selection: Rectangle,
        abortSignal: AbortSignal
    ) => readonly (readonly GridCell[])[] | Promise<readonly (readonly GridCell[])[]> | (() => readonly (readonly GridCell[])[] | Promise<readonly (readonly GridCell[])[]>);
}