import type { Rectangle, Item, GridSelection, GridColumn, InnerGridCell } from "../data-grid-types.js";
import type { Theme } from "../../../common/styles.js";
import type { SpriteManager } from "../data-grid-sprites.js";
import type { ImageWindowLoader } from "../image-window-loader-interface.js";
import type { DrawCellCallback, DrawHeaderCallback } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import type { CellSet } from "../cell-set.js";

export interface DrawGridArg {
    canvasCtx: CanvasRenderingContext2D;
    headerCanvasCtx: CanvasRenderingContext2D;
    width: number;
    height: number;
    cellXOffset: number;
    cellYOffset: number;
    translateX: number;
    translateY: number;
    mappedColumns: readonly MappedGridColumn[];
    enableGroups: boolean;
    freezeColumns: number;
    dragAndDropState?: {
        src: number;
        dest: number;
    };
    theme: Theme;
    drawFocus: boolean;
    headerHeight: number;
    groupHeaderHeight: number;
    disabledRows: Set<number>;
    rowHeight: number | ((row: number) => number);
    verticalBorder: boolean;
    overrideCursor: string | undefined;
    isResizing: boolean;
    selection: GridSelection;
    fillHandle: boolean;
    freezeTrailingRows: number;
    rows: number;
    getCellContent: (cell: Item) => InnerGridCell;
    getGroupDetails: (group: string) => { name: string; icon?: string };
    getRowThemeOverride: (row: number) => Partial<Theme> | undefined;
    isFocused: boolean;
    drawHeaderCallback?: DrawHeaderCallback;
    prelightCells: Map<Item, number>;
    drawCellCallback?: DrawCellCallback;
    highlightRegions?: Array<{
        range: Rectangle;
        style: "normal" | "no-outline" | "solid";
        color: string;
    }>;
    imageLoader: ImageWindowLoader | undefined;
    lastBlitData: { current: undefined | { lastBuffer?: "a" | "b"; aBufferScroll?: [boolean, boolean]; bBufferScroll?: [boolean, boolean]; cellXOffset: number; cellYOffset: number; translateX: number; translateY: number; mustDrawFocusOnHeader: boolean; mustDrawHighlightRingsOnHeader: boolean; } };
    hoverValues: Map<Item, string>;
    hyperWrapping: boolean;
    hoverInfo?: {
        cell: Item;
        x: number;
        y: number;
        width: number;
        height: number;
    };
    spriteManager: SpriteManager;
    maxScaleFactor: number;
    hasAppendRow: boolean;
    touchMode: boolean;
    enqueue: (cb: () => void) => void;
    renderStateProvider: {
        getCellRenderer: (cell: InnerGridCell) => { kind: string; prep: (ctx: CanvasRenderingContext2D, theme: Theme) => void; draw: (ctx: CanvasRenderingContext2D, theme: Theme) => void; } | undefined;
    };
    getCellRenderer: (cell: InnerGridCell) => { kind: string; prep: (ctx: CanvasRenderingContext2D, theme: Theme) => void; draw: (ctx: CanvasRenderingContext2D, theme: Theme) => void; } | undefined;
    renderStrategy: "direct" | "double-buffer";
    bufferACtx: CanvasRenderingContext2D;
    bufferBCtx: CanvasRenderingContext2D;
    damage: CellSet | undefined;
    minimumCellWidth: number;
    resizeIndicator: "none" | "full" | "header";
    resizeCol: number;
}