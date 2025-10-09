import type { Item, GridCell, GridColumn } from "./data-grid-types.js";

/**
 * Base arguments for grid mouse events
 * @category Events
 */
export interface BaseGridMouseEventArgs {
    readonly kind: "mouse";
    readonly location: Item;
    readonly button: number;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly localEventX: number;
    readonly localEventY: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly preventDefault: () => void;
}

/**
 * Arguments for cell activation events
 * @category Events
 */
export interface CellActivatedEventArgs {
    readonly location: Item;
    readonly cell: GridCell;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
    readonly isEdge: boolean;
    readonly touch: boolean;
}

/**
 * Arguments for cell clicked events
 * @category Events
 */
export interface CellClickedEventArgs extends BaseGridMouseEventArgs {
    readonly cell: GridCell;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for header clicked events
 * @category Events
 */
export interface HeaderClickedEventArgs extends BaseGridMouseEventArgs {
    readonly column: GridColumn;
    readonly columnIndex: number;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for group header clicked events
 * @category Events
 */
export interface GroupHeaderClickedEventArgs extends BaseGridMouseEventArgs {
    readonly group: string;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for fill pattern events
 * @category Events
 */
export interface FillPatternEventArgs {
    readonly location: Item;
    readonly pattern: "vertical" | "horizontal" | "orthogonal" | "any";
}

/**
 * Arguments for grid mouse events
 * @category Events
 */
export interface GridMouseEventArgs extends BaseGridMouseEventArgs {
    readonly cell: GridCell | undefined;
    readonly column: GridColumn | undefined;
    readonly columnIndex: number;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for grid mouse events on cells
 * @category Events
 */
export interface GridMouseCellEventArgs extends BaseGridMouseEventArgs {
    readonly cell: GridCell;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for grid mouse events on headers
 * @category Events
 */
export interface GridMouseHeaderEventArgs extends BaseGridMouseEventArgs {
    readonly column: GridColumn;
    readonly columnIndex: number;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for grid mouse events on group headers
 * @category Events
 */
export interface GridMouseGroupHeaderEventArgs extends BaseGridMouseEventArgs {
    readonly group: string;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for grid mouse events out of bounds
 * @category Events
 */
export interface GridMouseOutOfBoundsEventArgs {
    readonly kind: "mouse";
    readonly location: Item;
    readonly bounds: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

/**
 * Arguments for grid drag events
 * @category Events
 */
export interface GridDragEventArgs {
    readonly kind: "drag";
    readonly location: Item;
    readonly button: number;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly localEventX: number;
    readonly localEventY: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly preventDefault: () => void;
}

/**
 * Arguments for grid key events
 * @category Events
 */
export interface GridKeyEventArgs {
    readonly kind: "keyboard";
    readonly key: string;
    readonly keyCode: number;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly preventDefault: () => void;
}