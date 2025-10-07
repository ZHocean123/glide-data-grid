import type { CSSProperties } from 'vue';
import type { Theme } from '../common/styles.js';
import { assertNever, proveType } from '../common/support.js';
import type { OverlayImageEditorProps } from '../internal/data-grid-overlay-editor/private/image-overlay-editor.js';
import type { SpriteManager } from '../internal/data-grid/data-grid-sprites.js';
import type { BaseGridMouseEventArgs, CellActivatedEventArgs } from '../internal/data-grid/event-args.js';
import type { ImageWindowLoader } from '../internal/data-grid/image-window-loader-interface.js';

// Thoughts:
// rows/columns are called out as selected, but when selected they must also be added
// to the range. Handling delete events may have different desired outcomes depending on
// how the range came to be selected. The rows/columns properties retain this essential
// information.
/** @category Selection */
export interface GridSelection {
    readonly current?: {
        readonly cell: Item;
        readonly range: Readonly<Rectangle>;
        readonly rangeStack: readonly Readonly<Rectangle>[]; // lowest to highest, does not include range
    };
    readonly columns: CompactSelection;
    readonly rows: CompactSelection;
}

/** @category Types */
export type ImageEditorType = any; // Vue component type

/** @category Types */
export const BooleanEmpty = null;
/** @category Types */
export const BooleanIndeterminate = undefined;

/** @category Types */
export type BooleanEmpty = null;
/** @category Types */
export type BooleanIndeterminate = undefined;

/** @category Types */
export type DrawHeaderCallback = (
    args: {
        ctx: CanvasRenderingContext2D;
        column: GridColumn;
        columnIndex: number;
        theme: Theme;
        rect: Rectangle;
        hoverAmount: number;
        isSelected: boolean;
        isHovered: boolean;
        hasSelectedCell: boolean;
        spriteManager: SpriteManager;
        menuBounds: Rectangle;
        hoverX: number | undefined;
        hoverY: number | undefined;
    },
    drawContent: () => void
) => void;

/** @category Types */
export type DrawCellCallback = (
    args: {
        ctx: CanvasRenderingContext2D;
        cell: GridCell;
        theme: Theme;
        rect: Rectangle;
        col: number;
        row: number;
        hoverAmount: number;
        hoverX: number | undefined;
        hoverY: number | undefined;
        highlighted: boolean;
        imageLoader: ImageWindowLoader;
    },
    drawContent: () => void
) => void;

/** @category Cells */
export enum GridCellKind {
    Uri = "uri",
    Text = "text",
    Image = "image",
    RowID = "row-id",
    Number = "number",
    Bubble = "bubble",
    Boolean = "boolean",
    Loading = "loading",
    Markdown = "markdown",
    Drilldown = "drilldown",
    Protected = "protected",
    Custom = "custom",
}

/** @category Columns */
export enum GridColumnIcon {
    HeaderRowID = "headerRowID",
    HeaderCode = "headerCode",
    HeaderNumber = "headerNumber",
    HeaderString = "headerString",
    HeaderBoolean = "headerBoolean",
    HeaderAudioUri = "headerAudioUri",
    HeaderVideoUri = "headerVideoUri",
    HeaderEmoji = "headerEmoji",
    HeaderImage = "headerImage",
    HeaderUri = "headerUri",
    HeaderPhone = "headerPhone",
    HeaderMarkdown = "headerMarkdown",
    HeaderDate = "headerDate",
    HeaderTime = "headerTime",
    HeaderEmail = "headerEmail",
    HeaderReference = "headerReference",
    HeaderIfThenElse = "headerIfThenElse",
    HeaderSingleValue = "headerSingleValue",
    HeaderLookup = "headerLookup",
    HeaderTextTemplate = "headerTextTemplate",
    HeaderMath = "headerMath",
    HeaderRollup = "headerRollup",
    HeaderJoinStrings = "headerJoinStrings",
    HeaderSplitString = "headerSplitString",
    HeaderGeoDistance = "headerGeoDistance",
    HeaderArray = "headerArray",
    RowOwnerOverlay = "rowOwnerOverlay",
    ProtectedColumnOverlay = "protectedColumnOverlay",
}

/** @category Columns */
export enum GridColumnMenuIcon {
    Triangle = "triangle",
    Dots = "dots",
}

/** @category Types */
export type CellArray = readonly (readonly GridCell[])[];

/**
 * This type is used to specify the coordinates of
 * a cell or header within the dataset: positive row
 * numbers identify cells.
 *
 * - `-1`: Header
 * - `-2`: Group header
 * - `0 and higher`: Row index
 *
 * @category Types
 */
export type Item = readonly [col: number, row: number];

export interface BaseGridColumn {
    readonly title: string;
    readonly group?: string;
    readonly icon?: GridColumnIcon | string;
    readonly overlayIcon?: GridColumnIcon | string;
    readonly menuIcon?: GridColumnMenuIcon | string;
    readonly indicatorIcon?: GridColumnIcon | string;
    readonly hasMenu?: boolean;
    readonly grow?: number;
    readonly style?: "normal" | "highlight";
    readonly themeOverride?: Partial<Theme>;
    readonly trailingRowOptions?: {
        readonly hint?: string;
        readonly addIcon?: string;
        readonly targetColumn?: number | GridColumn;
        readonly themeOverride?: Partial<Theme>;
        readonly disabled?: boolean;
    };
}

/** @category Columns */
export function isSizedGridColumn(c: GridColumn): c is SizedGridColumn {
    return "width" in c && typeof c.width === "number";
}

/** @category Columns */
export interface SizedGridColumn extends BaseGridColumn {
    readonly width: number;
    readonly id?: string;
}

/** @category Columns */
export interface AutoGridColumn extends BaseGridColumn {
    readonly id: string;
}

/** @category Types */
export async function resolveCellsThunk(thunk: GetCellsThunk | CellArray): Promise<CellArray> {
    if (typeof thunk === "object") return thunk;
    return await thunk();
}

/** @category Types */
export type GetCellsThunk = () => Promise<CellArray>;

/** @category Columns */
export type GridColumn = SizedGridColumn | AutoGridColumn;

export type InnerColumnExtension = {
    growOffset?: number;
    rowMarker?: "square" | "circle";
    rowMarkerChecked?: BooleanIndeterminate | boolean;
    headerRowMarkerTheme?: Partial<Theme>;
    headerRowMarkerAlwaysVisible?: boolean;
    headerRowMarkerDisabled?: boolean;
};

/** @category Columns */
export type InnerGridColumn = SizedGridColumn & InnerColumnExtension;

// export type SizedGridColumn = Omit<GridColumn, "width"> & { readonly width: number };

/** @category Cells */
export type ReadWriteGridCell = TextCell | NumberCell | MarkdownCell | UriCell | CustomCell | BooleanCell;

/** @category Cells */
export type EditableGridCell = TextCell | ImageCell | BooleanCell | MarkdownCell | UriCell | NumberCell | CustomCell;

/** @category Cells */
export type EditableGridCellKind = EditableGridCell["kind"];

// All EditableGridCells are inherently ValidatedGridCells, and this is more specific and thus more useful.
/** @category Cells */
export function isEditableGridCell(cell: GridCell): cell is ValidatedGridCell {
    if (
        cell.kind === GridCellKind.Loading ||
        cell.kind === GridCellKind.Bubble ||
        cell.kind === GridCellKind.RowID ||
        cell.kind === GridCellKind.Protected ||
        cell.kind === GridCellKind.Drilldown
    ) {
        return false;
    }

    proveType<EditableGridCell>(cell);
    return true;
}

/** @category Cells */
export function isTextEditableGridCell(cell: GridCell): cell is ReadWriteGridCell {
    if (
        cell.kind === GridCellKind.Loading ||
        cell.kind === GridCellKind.Bubble ||
        cell.kind === GridCellKind.RowID ||
        cell.kind === GridCellKind.Protected ||
        cell.kind === GridCellKind.Drilldown ||
        cell.kind === GridCellKind.Boolean ||
        cell.kind === GridCellKind.Image ||
        cell.kind === GridCellKind.Custom
    ) {
        return false;
    }

    proveType<ReadWriteGridCell>(cell);
    return true;
}

/** @category Cells */
export function isInnerOnlyCell(cell: InnerGridCell): cell is InnerOnlyGridCell {
    return cell.kind === InnerGridCellKind.Marker || cell.kind === InnerGridCellKind.NewRow;
}

/** @category Cells */
export function isReadWriteCell(cell: GridCell): cell is ReadWriteGridCell {
    if (!isEditableGridCell(cell) || cell.kind === GridCellKind.Image) return false;

    switch (cell.kind) {
        case GridCellKind.Text:
        case GridCellKind.Number:
        case GridCellKind.Markdown:
        case GridCellKind.Uri:
        case GridCellKind.Custom:
        case GridCellKind.Boolean:
            return cell.readonly !== true;
        default:
            assertNever(cell, "A cell was passed with an invalid kind");
            return false;
    }
}

/** @category Cells */
export type GridCell =
    | EditableGridCell
    | BubbleCell
    | RowIDCell
    | LoadingCell
    | ProtectedCell
    | DrilldownCell
    | CustomCell;

type InnerOnlyGridCell = NewRowCell | MarkerCell;
/** @category Cells */
export type InnerGridCell = GridCell | InnerOnlyGridCell;

/** @category Cells */
export type CellList = readonly Item[];

/** @category Types */
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function isRectangleEqual(a: Rectangle | undefined, b: Rectangle | undefined): boolean {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export type CellActivationBehavior = "double-click" | "single-click" | "second-click";

/** @category Cells */
export interface BaseGridCell {
    readonly allowOverlay: boolean;
    readonly lastUpdated?: number;
    readonly style?: "normal" | "faded";
    readonly themeOverride?: Partial<Theme>;
    readonly span?: readonly [start: number, end: number];
    readonly contentAlign?: "left" | "right" | "center";
    readonly cursor?: CSSProperties["cursor"];
    readonly copyData?: string;
    readonly activationBehaviorOverride?: CellActivationBehavior;
}

/** @category Cells */
export interface LoadingCell extends BaseGridCell {
    readonly kind: GridCellKind.Loading;
    readonly skeletonWidth?: number;
    readonly skeletonHeight?: number;
    readonly skeletonWidthVariability?: number;
}

/** @category Cells */
export interface ProtectedCell extends BaseGridCell {
    readonly kind: GridCellKind.Protected;
}

export interface HoverEffectTheme {
    bgColor: string;
    fullSize: boolean;
}

/** @category Cells */
export interface TextCell extends BaseGridCell {
    readonly kind: GridCellKind.Text;
    readonly displayData: string;
    readonly data: string;
    readonly readonly?: boolean;
    readonly allowWrapping?: boolean;
    readonly hoverEffect?: boolean;
    readonly hoverEffectTheme?: HoverEffectTheme;
}

/** @category Cells */
export interface NumberCell extends BaseGridCell {
    readonly kind: GridCellKind.Number;
    readonly displayData: string;
    readonly data: number | undefined;
    readonly readonly?: boolean;
    readonly fixedDecimals?: number;
    readonly allowNegative?: boolean;
    readonly thousandSeparator?: boolean | string;
    readonly decimalSeparator?: string;
    readonly hoverEffect?: boolean;
    readonly hoverEffectTheme?: HoverEffectTheme;
}

/** @category Cells */
export interface ImageCell extends BaseGridCell {
    readonly kind: GridCellKind.Image;
    readonly data: string[];
    readonly rounding?: number;
    readonly displayData?: string[]; // used for small images for faster scrolling
    readonly readonly?: boolean;
}

/** @category Cells */
export interface BubbleCell extends BaseGridCell {
    readonly kind: GridCellKind.Bubble;
    readonly data: string[];
}

/** @category Renderers */
export type SelectionRange = number | readonly [number, number];

/** @category Renderers */
export type ProvideEditorComponent<T extends InnerGridCell> = any; // Vue component type

type ObjectEditorCallbackResult<T extends InnerGridCell> = {
    editor: ProvideEditorComponent<T>;
    deletedValue?: (toDelete: T) => T;
    styleOverride?: CSSProperties;
    disablePadding?: boolean;
    disableStyling?: boolean;
};

/** @category Renderers */
export type ProvideEditorCallbackResult<T extends InnerGridCell> =
    | (ProvideEditorComponent<T> & {
          disablePadding?: boolean;
          disableStyling?: boolean;
      })
    | ObjectEditorCallbackResult<T>
    | undefined;

/** @category Renderers */
export function isObjectEditorCallbackResult<T extends InnerGridCell>(
    obj: ProvideEditorCallbackResult<T>
): obj is ObjectEditorCallbackResult<T> {
    return obj !== undefined && typeof obj === 'object' && 'editor' in obj;
}

/** @category Renderers */
export type ProvideEditorCallback<T extends InnerGridCell> = (
    cell: T & { location?: Item; activation?: CellActivatedEventArgs }
) => ProvideEditorCallbackResult<T>;

/** @category Cells */
export type ValidatedGridCell = EditableGridCell & {
    selectionRange?: SelectionRange;
};

/** @category Cells */
export interface CustomCell<T extends {} = {}> extends BaseGridCell {
    readonly kind: GridCellKind.Custom;
    readonly data: T;
    readonly copyData: string;
    readonly readonly?: boolean;
}

/** @category Cells */
export interface DrilldownCellData {
    readonly text: string;
    readonly img?: string;
}

/** @category Cells */
export interface DrilldownCell extends BaseGridCell {
    readonly kind: GridCellKind.Drilldown;
    readonly data: readonly DrilldownCellData[];
}

/** @category Cells */
export interface BooleanCell extends BaseGridCell {
    readonly kind: GridCellKind.Boolean;
    readonly data: boolean | BooleanEmpty | BooleanIndeterminate;
    readonly readonly?: boolean;
    readonly allowOverlay: false;
    readonly maxSize?: number;
    readonly hoverEffectIntensity?: number;
}

// Can be written more concisely, not easier to read if more concise.
/** @category Cells */
export function booleanCellIsEditable(cell: BooleanCell): boolean {
    return !(cell.readonly ?? false);
}

/** @category Cells */
export interface RowIDCell extends BaseGridCell {
    readonly kind: GridCellKind.RowID;
    readonly data: string;
    readonly readonly?: boolean;
}

/** @category Cells */
export interface MarkdownCell extends BaseGridCell {
    readonly kind: GridCellKind.Markdown;
    readonly data: string;
    readonly readonly?: boolean;
}

/** @category Cells */
export interface UriCell extends BaseGridCell {
    readonly kind: GridCellKind.Uri;
    readonly data: string;
    readonly displayData?: string;
    readonly readonly?: boolean;
    readonly onClickUri?: (args: BaseGridMouseEventArgs & { readonly preventDefault: () => void }) => void;
    readonly hoverEffect?: boolean;
}

/** @category Cells */
export enum InnerGridCellKind {
    NewRow = "new-row",
    Marker = "marker",
}

export type EditListItem = { location: Item; value: EditableGridCell };

/** @category Cells */
export interface NewRowCell extends BaseGridCell {
    readonly kind: InnerGridCellKind.NewRow;
    readonly hint: string;
    readonly allowOverlay: false;
    readonly icon?: string;
}

/** @category Cells */
export interface MarkerCell extends BaseGridCell {
    readonly kind: InnerGridCellKind.Marker;
    readonly allowOverlay: false;
    readonly row: number;
    readonly drawHandle: boolean;
    readonly checked: boolean;
    readonly checkboxStyle: "square" | "circle";
    readonly markerKind: "checkbox" | "number" | "both" | "checkbox-visible";
}

/** @category Selection */
export type Slice = [start: number, end: number];
/** @category Selection */
export type CompactSelectionRanges = readonly Slice[];

export type FillHandleDirection = "horizontal" | "vertical" | "orthogonal" | "any";

/**
 * Configuration options for the fill-handle (the little drag square in the bottom-right of a selection).
 *
 *  `shape`   – Either a square or a circle. Default is `square`.
 *  `size`    – Width/height (or diameter) in CSS pixels. Default is `4`.
 *  `offsetX` – Horizontal offset from the bottom-right corner of the cell (positive is →). Default is `-2`.
 *  `offsetY` – Vertical offset from the bottom-right corner of the cell (positive is ↓). Default is `-2`.
 *  `outline` – Width of the outline stroke in CSS pixels. Default is `0`.
 */
export type FillHandleConfig = {
    readonly shape: "square" | "circle";
    readonly size: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly outline: number;
};

export type FillHandle = boolean | Partial<FillHandleConfig>;

/**
 * Default configuration used when `fillHandle` is simply `true`.
 */
export const DEFAULT_FILL_HANDLE: Readonly<FillHandleConfig> = {
    shape: "square",
    size: 4,
    offsetX: -2,
    offsetY: -2,
    outline: 0,
} as const;

function mergeRanges(input: CompactSelectionRanges) {
    if (input.length === 0) {
        return [];
    }
    const ranges = [...input];

    const stack: [number, number][] = [];

    ranges.sort(function (a, b) {
        return a[0] - b[0];
    });

    stack.push([...ranges[0]]);

    for (const range of ranges.slice(1)) {
        const top = stack[stack.length - 1];

        if (top[1] < range[0]) {
            stack.push([...range]);
        } else if (top[1] < range[1]) {
            top[1] = range[1];
        }
    }

    return stack;
}

let emptyCompactSelection: CompactSelection | undefined;

/** @category Selection */
export class CompactSelection {
    private constructor(public readonly items: CompactSelectionRanges) {}

    static create = (items: CompactSelectionRanges) => {
        return new CompactSelection(mergeRanges(items));
    };

    static empty = (): CompactSelection => {
        return emptyCompactSelection ?? (emptyCompactSelection = new CompactSelection([]));
    };

    static fromSingleSelection = (selection: number | Slice) => {
        return CompactSelection.empty().add(selection);
    };

    static fromArray = (items: readonly number[]): CompactSelection => {
        if (items.length === 0) return CompactSelection.empty();
        const slices = items.map(s => [s, s + 1] as Slice);
        const newItems = mergeRanges(slices);
        return new CompactSelection(newItems);
    };

    public offset(amount: number): CompactSelection {
        if (amount === 0) return this;
        const newItems = this.items.map(x => [x[0] + amount, x[1] + amount] as Slice);
        return new CompactSelection(newItems);
    }

    public add(selection: number | Slice): CompactSelection {
        const slice: Slice = typeof selection === "number" ? [selection, selection + 1] : selection;
        const newItems = mergeRanges([...this.items, slice]);
        return new CompactSelection(newItems);
    }

    public remove(selection: number | Slice): CompactSelection {
        const items = [...this.items];

        const selMin = typeof selection === "number" ? selection : selection[0];
        const selMax = typeof selection === "number" ? selection + 1 : selection[1];

        for (const [i, slice] of items.entries()) {
            const [start, end] = slice;
            // Remove part of slice that intersects removed selection.
            if (start <= selMax && selMin <= end) {
                const toAdd: Slice[] = [];
                if (start < selMin) {
                    toAdd.push([start, selMin]);
                }
                if (selMax < end) {
                    toAdd.push([selMax, end]);
                }
                items.splice(i, 1, ...toAdd);
            }
        }
        return new CompactSelection(items);
    }

    public first(): number | undefined {
        if (this.items.length === 0) return undefined;
        return this.items[0][0];
    }

    public last(): number | undefined {
        if (this.items.length === 0) return undefined;
        return this.items.slice(-1)[0][1] - 1;
    }

    public hasIndex(index: number): boolean {
        for (let i = 0; i < this.items.length; i++) {
            const [start, end] = this.items[i];
            if (index >= start && index < end) return true;
        }
        return false;
    }

    public hasAll(index: Slice): boolean {
        for (let x = index[0]; x < index[1]; x++) {
            if (!this.hasIndex(x)) return false;
        }
        return true;
    }

    public some(predicate: (index: number) => boolean): boolean {
        for (const i of this) {
            if (predicate(i)) return true;
        }
        return false;
    }

    public equals(other: CompactSelection): boolean {
        if (other === this) return true;

        if (other.items.length !== this.items.length) return false;

        for (let i = 0; i < this.items.length; i++) {
            const left = other.items[i];
            const right = this.items[i];

            if (left[0] !== right[0] || left[1] !== right[1]) return false;
        }

        return true;
    }

    // Really old JS wont have access to the iterator and babel will stop people using it
    // when trying to support browsers so old we don't support them anyway. What goes on
    // between an engineer and their bundler in the privacy of their CI server is none of
    // my business anyway.
    public toArray(): number[] {
        const result: number[] = [];
        for (const [start, end] of this.items) {
            for (let x = start; x < end; x++) {
                result.push(x);
            }
        }
        return result;
    }

    get length(): number {
        let len = 0;
        for (const [start, end] of this.items) {
            len += end - start;
        }

        return len;
    }

    *[Symbol.iterator]() {
        for (const [start, end] of this.items) {
            for (let x = start; x < end; x++) {
                yield x;
            }
        }
    }
}

/** @category DataEditor */
export interface DataEditorProps {
    /** The columns to display in the data grid. */
    readonly columns: readonly GridColumn[];
    /** The number of rows in the grid. */
    readonly rows: number;
    /** The primary callback for getting cell data into the data grid. */
    readonly getCellContent: (cell: Item) => GridCell;
    /** Sets the width of the data grid. */
    readonly width?: number | string;
    /** Sets the height of the data grid. */
    readonly height?: number | string;
    /** Custom classname for data grid wrapper. */
    readonly className?: string;
    /** The theme used by the data grid to get all color and font information */
    readonly theme?: Partial<Theme>;
    /** Controls the height of the header row */
    readonly headerHeight?: number;
    /** Controls the header of the group header row */
    readonly groupHeaderHeight?: number;
    /** Determins the height of each row. */
    readonly rowHeight?: number;
    /** The minimum width a column can be resized to. */
    readonly minColumnWidth?: number;
    /** The maximum width a column can be resized to. */
    readonly maxColumnWidth?: number;
    /** The number of columns which should remain in place when scrolling horizontally. */
    readonly freezeColumns?: number;
    /** Controls the drawing of the left hand vertical border of a column. */
    readonly verticalBorder?: boolean | ((col: number) => boolean);
    /** Controls the trailing row used to insert new data into the grid. */
    readonly trailingRowOptions?: {
        readonly tint?: boolean;
        readonly hint?: string;
        readonly sticky?: boolean;
        readonly addIcon?: string;
        readonly targetColumn?: number | GridColumn;
    };
    /** Determines if row markers should be automatically added to the grid. */
    readonly rowMarkers?: string | {
        readonly kind: string;
        readonly width?: number;
        readonly startIndex?: number;
        readonly theme?: Partial<Theme>;
    };
    /** Changes the theme of the row marker column */
    readonly rowMarkerTheme?: Partial<Theme>;
    /** Controls if focus will trap inside the data grid when doing tab and caret navigation. */
    readonly trapFocus?: boolean;
    /** Controls the grouping of rows to be drawn in the grid. */
    readonly rowGrouping?: any;
    /** Used to provide an override to the default image editor for the data grid. */
    readonly imageEditorOverride?: ImageEditorType;
    /** If specified, it will be used to render Markdown, instead of the default Markdown renderer used by the Grid. */
    readonly markdownDivCreateNode?: (content: string) => DocumentFragment;
    /** Callback for providing a custom editor for a cell. */
    readonly provideEditor?: ProvideEditorCallback<GridCell>;
    /** Allows overriding the theme of any row */
    readonly getRowThemeOverride?: (row: number) => Partial<Theme> | undefined;
    /** Used to fetch large amounts of cells at once. Used for copy/paste, if unset copy will not work. */
    readonly getCellsForSelection?: (selection: Rectangle, abortSignal: AbortSignal) => readonly (readonly GridCell[])[] | Promise<readonly (readonly GridCell[])[]>;
    /** Controls which directions fill is allowed in. */
    readonly allowedFillDirections?: string;
    /** Controls if the data editor should immediately begin editing when the user types on a selected cell */
    readonly editOnType?: boolean;
    /** Determines when a cell is considered activated and will emit the `onCellActivated` event. */
    readonly cellActivationBehavior?: string;
    /** An array of custom renderers which can be used to extend the data grid. */
    readonly customRenderers?: readonly any[];
    /** Scales most elements in the theme to match rem scaling automatically */
    readonly scaleToRem?: boolean;
    /** Custom predicate function to decide whether the click event occurred outside the grid */
    readonly isOutsideClick?: (e: MouseEvent | TouchEvent) => boolean;
    /** Controls the amount of bloom (the size growth of the overlay editor) */
    readonly editorBloom?: readonly [number, number];
    /** If set to true, the data grid will attempt to scroll to keep the selection in view */
    readonly scrollToActiveCell?: boolean;
    /** Controls if focus ring is drawn */
    readonly drawFocusRing?: boolean | "no-editor";
    /** Allows overriding the default portal element. */
    readonly portalElementRef?: RefObject<HTMLElement>;
    /** Experimental features */
    readonly experimental?: any;
    /** Fill handle configuration */
    readonly fillHandle?: any;
    /** Resize indicator configuration */
    readonly resizeIndicator?: any;
    /** Header icons */
    readonly headerIcons?: any;
    /** Image window loader */
    readonly imageWindowLoader?: any;
    /** Initial size */
    readonly initialSize?: any;
    /** Is draggable */
    readonly isDraggable?: boolean;
    /** On drag leave */
    readonly onDragLeave?: any;
    /** On row moved */
    readonly onRowMoved?: any;
    /** Overscroll X */
    readonly overscrollX?: number;
    /** Overscroll Y */
    readonly overscrollY?: number;
    /** Prevent diagonal scrolling */
    readonly preventDiagonalScrolling?: boolean;
    /** Right element */
    readonly rightElement?: any;
    /** Right element props */
    readonly rightElementProps?: any;
    /** Smooth scroll X */
    readonly smoothScrollX?: boolean;
    /** Smooth scroll Y */
    readonly smoothScrollY?: boolean;
    /** On column resize */
    readonly onColumnResize?: (col: GridColumn, width: number, colIndex: number, widthGroup: number) => void;
    /** On column resize end */
    readonly onColumnResizeEnd?: (col: GridColumn, width: number, colIndex: number, widthGroup: number) => void;
    /** On column resize start */
    readonly onColumnResizeStart?: (col: GridColumn, width: number, colIndex: number, widthGroup: number) => void;
    /** On column moved */
    readonly onColumnMoved?: (startIndex: number, endIndex: number) => void;
    /** On column propose move */
    readonly onColumnProposeMove?: (startIndex: number, endIndex: number) => boolean;
    /** On header menu click */
    readonly onHeaderMenuClick?: (colIndex: number, screenPosition: Rectangle) => void;
    /** On header indicator click */
    readonly onHeaderIndicatorClick?: (colIndex: number, screenPosition: Rectangle) => void;
    /** Get group details */
    readonly getGroupDetails?: (group: string) => any;
    /** On search results changed */
    readonly onSearchResultsChanged?: (results: readonly Item[], navIndex: number) => void;
    /** On search value change */
    readonly onSearchValueChange?: (value: string) => void;
    /** On search close */
    readonly onSearchClose?: () => void;
    /** Validate cell */
    readonly validateCell?: (cell: Item, newValue: EditableGridCell, prevValue: GridCell) => boolean | ValidatedGridCell;
    /** On delete */
    readonly onDelete?: (selection: GridSelection) => boolean | GridSelection;
    /** On cell edited */
    readonly onCellEdited?: (cell: Item, newValue: EditableGridCell) => void;
    /** On cells edited */
    readonly onCellsEdited?: (newValues: readonly EditListItem[]) => boolean | void;
    /** On cell clicked */
    readonly onCellClicked?: (cell: Item, event: any) => void;
    /** On cell activated */
    readonly onCellActivated?: (cell: Item, event: any) => void;
    /** On header clicked */
    readonly onHeaderClicked?: (colIndex: number, event: any) => void;
    /** On group header clicked */
    readonly onGroupHeaderClicked?: (colIndex: number, event: any) => void;
    /** On finished editing */
    readonly onFinishedEditing?: (newValue: GridCell | undefined, movement: readonly [-1 | 0 | 1, -1 | 0 | 1]) => void;
    /** On visible region changed */
    readonly onVisibleRegionChanged?: (range: Rectangle, tx: number, ty: number, extras: any) => void;
}

/** @category DataEditor */
export interface DataEditorRef {
    /** Programatically appends a row. */
    appendRow: (col: number, openOverlay?: boolean) => Promise<void>;
    /** Programatically appends a column. */
    appendColumn: (row: number, openOverlay?: boolean) => Promise<void>;
    /** Triggers cells to redraw. */
    updateCells: (damageList: readonly { readonly cell: Item }[]) => void;
    /** Gets the screen space bounds of the requested item. */
    getBounds: (col?: number, row?: number) => Rectangle | undefined;
    /** Triggers the data grid to focus itself or the correct accessibility element. */
    focus: () => void;
    /** Generic API for emitting events as if they had been triggered via user interaction. */
    emit: (eventName: string) => Promise<void>;
    /** Scrolls to the desired cell or location in the grid. */
    scrollTo: (col: number | { amount: number; unit: "cell" | "px" }, row: number | { amount: number; unit: "cell" | "px" }, dir?: "horizontal" | "vertical" | "both", paddingX?: number, paddingY?: number, options?: any) => void;
    /** Causes the columns in the selection to have their natural size recomputed and re-emitted as a resize event. */
    remeasureColumns: (cols: CompactSelection) => void;
    /** Gets the mouse args from pointer event position. */
    getMouseArgsForPosition: (posX: number, posY: number, ev?: MouseEvent | TouchEvent) => any | undefined;
}

// Vue specific types
export interface RefObject<T> {
    current: T | null;
}