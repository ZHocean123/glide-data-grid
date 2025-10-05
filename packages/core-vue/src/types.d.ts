export type GridItem = readonly [number, number];
export interface Rectangle {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface CompactSelection {
    hasIndex(index: number): boolean;
}
export interface GridSelection {
    readonly current?: {
        readonly cell: GridItem;
        readonly range: Readonly<Rectangle>;
        readonly rangeStack: readonly Readonly<Rectangle>[];
    };
    readonly columns: CompactSelection;
    readonly rows: CompactSelection;
}
export interface BaseGridColumn {
    readonly title: string;
    readonly group?: string;
    readonly icon?: string;
    readonly overlayIcon?: string;
    readonly menuIcon?: string;
    readonly indicatorIcon?: string;
    readonly hasMenu?: boolean;
    readonly grow?: number;
    readonly style?: "normal" | "highlight";
    readonly themeOverride?: any;
    readonly trailingRowOptions?: {
        readonly hint?: string;
        readonly addIcon?: string;
        readonly targetColumn?: number;
        readonly themeOverride?: any;
        readonly disabled?: boolean;
    };
}
export interface SizedGridColumn extends BaseGridColumn {
    readonly width: number;
    readonly id?: string;
}
export type InnerGridColumn = SizedGridColumn;
export interface BaseGridCell {
    readonly allowOverlay: boolean;
    readonly lastUpdated?: number;
    readonly style?: "normal" | "faded";
    readonly themeOverride?: any;
    readonly span?: readonly [number, number];
    readonly contentAlign?: "left" | "right" | "center";
    readonly cursor?: string;
    readonly copyData?: string;
}
export type InnerGridCell = BaseGridCell & {
    readonly kind: string;
    readonly data?: any;
    readonly displayData?: string;
    readonly readonly?: boolean;
};
export interface GridMouseEventArgs {
    readonly location: GridItem;
    readonly bounds: Rectangle;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly isTouch: boolean;
    readonly isEdge: boolean;
    readonly isFillHandle: boolean;
    readonly button: number;
    readonly buttons: number;
}
export interface GridKeyEventArgs {
    readonly bounds?: Rectangle;
    readonly stopPropagation: () => void;
    readonly preventDefault: () => void;
    readonly cancel: () => void;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly key: string;
    readonly keyCode: number;
    readonly rawEvent: KeyboardEvent;
    readonly location?: any;
}
export interface GridDragEventArgs {
    readonly location: GridItem;
    readonly bounds: Rectangle;
    readonly dataTransfer: DataTransfer | null;
}
export type DrawHeaderCallback = (args: any, drawContent: () => void) => void;
export type DrawCellCallback = (args: any, drawContent: () => void) => void;
export type GroupDetailsCallback = (groupName: string) => any;
export type GetRowThemeCallback = (row: number) => any;
export interface Highlight {
    readonly color: string;
    readonly range: Rectangle;
    readonly style?: "solid" | "dashed" | "dotted";
}
export type FillHandle = boolean | any;
export type FullTheme = any;
export type ImageWindowLoader = any;
export type CellRenderer = any;
