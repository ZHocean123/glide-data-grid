import type {
    InnerGridCell,
    Rectangle,
    CustomCell,
    Item,
} from "../internal/data-grid/data-grid-types.js";
import type { FullTheme } from "../common/styles.js";
import type { BaseGridMouseEventArgs } from "../internal/data-grid/event-args.js";

// 类型定义
export type ProvideEditorCallback<T extends InnerGridCell> = (cell: T) => {
    readonly disablePadding?: boolean;
    readonly editor: (props: any) => any;
};

export type SpriteManager = any;
export type ImageWindowLoader = any;

// 布尔值类型
export type BooleanEmpty = undefined;
export type BooleanIndeterminate = null;

export interface BaseDrawArgs {
    ctx: CanvasRenderingContext2D;
    theme: FullTheme;
    col: number;
    row: number;
    rect: Rectangle;
    highlighted: boolean;
    hoverAmount: number;
    hoverX: number | undefined;
    hoverY: number | undefined;
    cellFillColor: string;
    imageLoader: ImageWindowLoader;
    spriteManager: SpriteManager;
    hyperWrapping: boolean;
    cell: InnerGridCell;
}

/** @category Drawing */

export type DrawStateTuple = [any, (state: any) => void];

export interface DrawArgs<T extends InnerGridCell> extends BaseDrawArgs {
    cell: T;
    requestAnimationFrame: (state?: any) => void;
    drawState: DrawStateTuple;
    frameTime: number;
    overrideCursor: ((cursor: string) => void) | undefined;
}

// intentionally mutable
/** @category Drawing */
export interface PrepResult {
    font: string | undefined;
    fillStyle: string | undefined;
    renderer: {};
    deprep: ((args: Pick<BaseDrawArgs, "ctx">) => void) | undefined;
}

/** @category Renderers */
export type DrawCallback<T extends InnerGridCell> = (args: DrawArgs<T>, cell: T) => void;
type PrepCallback = (args: BaseDrawArgs, lastPrep?: PrepResult) => Partial<PrepResult>;

interface BaseCellRenderer<T extends InnerGridCell> {
    // drawing
    readonly kind: T["kind"];
    readonly draw: DrawCallback<T>;
    readonly drawPrep?: PrepCallback;
    readonly needsHover?: boolean | ((cell: T) => boolean);
    readonly needsHoverPosition?: boolean;
    readonly measure?: (ctx: CanvasRenderingContext2D, cell: T, theme: FullTheme) => number;

    // editing
    readonly provideEditor?: ProvideEditorCallback<T>;

    // event callbacks
    readonly onClick?: (
        args: {
            readonly cell: T;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly location: Item;
            readonly theme: FullTheme;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => T | undefined;

    readonly onSelect?: (
        args: {
            readonly cell: T;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly theme: FullTheme;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => void;
    readonly onDelete?: (cell: T) => T | undefined;
}

/** @category Renderers */
export interface InternalCellRenderer<T extends InnerGridCell> extends BaseCellRenderer<T> {
    readonly useLabel?: boolean;
    readonly getAccessibilityString: (cell: T) => string;
    readonly onPaste: (
        val: string,
        cell: T,
        details: {
            // fixme this should become the only argument
            readonly rawValue: string | string[] | number | boolean | undefined | null;
            readonly formatted?: string | string[];
            readonly formattedString?: string; // convenience
        }
    ) => T | undefined;
}

/** @category Renderers */
export interface CustomRenderer {
    // drawing
    readonly kind: string;
    readonly draw: DrawCallback<any>;
    readonly drawPrep?: PrepCallback;
    readonly needsHover?: boolean | ((cell: any) => boolean);
    readonly needsHoverPosition?: boolean;
    readonly measure?: (ctx: CanvasRenderingContext2D, cell: any, theme: FullTheme) => number;

    // editing
    readonly provideEditor?: ProvideEditorCallback<any>;

    // event callbacks
    readonly onClick?: (
        args: {
            readonly cell: any;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly location: Item;
            readonly theme: FullTheme;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => any | undefined;

    readonly onSelect?: (
        args: {
            readonly cell: any;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly theme: FullTheme;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => void;
    readonly onDelete?: (cell: any) => any | undefined;
    
    readonly isMatch: (cell: CustomCell) => boolean;
    readonly onPaste?: (val: string, cellData: any) => any | undefined;
}

/** @category Renderers */
export type CellRenderer<T extends InnerGridCell> = InternalCellRenderer<T> | CustomRenderer;

/** @category Renderers */
export type GetCellRendererCallback = <T extends InnerGridCell>(cell: T) => CellRenderer<T> | undefined;