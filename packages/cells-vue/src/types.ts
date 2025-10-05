// Simplified types to avoid dependency on @glideapps/glide-data-grid
// These will be replaced with proper imports when available
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Item {
    x: number;
    y: number;
}

export interface InnerGridCell {
    readonly kind: string;
    readonly allowOverlay?: boolean;
    readonly contentAlign?: "left" | "center" | "right";
    readonly cursor?: string;
    readonly data?: any;
    readonly displayData?: string;
    readonly readonly?: boolean;
    readonly style?: "normal" | "faded";
    readonly themeOverride?: Partial<any>;
}

// Base interfaces for Vue cell renderers
export interface BaseDrawArgs {
    ctx: CanvasRenderingContext2D;
    theme: any; // Simplified theme type for now
    col: number;
    row: number;
    rect: Rectangle;
    highlighted: boolean;
    hoverAmount: number;
    hoverX: number | undefined;
    hoverY: number | undefined;
    cellFillColor: string;
    hyperWrapping: boolean;
    cell: InnerGridCell;
}

export interface DrawArgs<T extends InnerGridCell> extends BaseDrawArgs {
    cell: T;
    requestAnimationFrame: (state?: any) => void;
    drawState: [any, (state: any) => void];
    frameTime: number;
    overrideCursor: ((cursor: string) => void) | undefined;
}

export interface PrepResult {
    font: string | undefined;
    fillStyle: string | undefined;
    renderer: {};
    deprep: ((args: Pick<BaseDrawArgs, "ctx">) => void) | undefined;
}

export type DrawCallback<T extends InnerGridCell> = (args: DrawArgs<T>, cell: T) => void;
export type PrepCallback = (args: BaseDrawArgs, lastPrep?: PrepResult) => Partial<PrepResult>;

// Vue-specific cell renderer interface
export interface VueCellRenderer<T extends InnerGridCell> {
    // Canvas drawing
    readonly kind: T["kind"];
    readonly draw: DrawCallback<T>;
    readonly drawPrep?: PrepCallback;
    readonly needsHover?: boolean | ((cell: T) => boolean);
    readonly needsHoverPosition?: boolean;
    readonly measure?: (ctx: CanvasRenderingContext2D, cell: T, theme: any) => number;

    // Vue component for editing (optional)
    readonly editorComponent?: any; // Vue component type
    readonly editorProps?: Record<string, any>;

    // Event callbacks
    readonly onClick?: (
        args: {
            readonly cell: T;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly location: Item;
            readonly theme: any;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => T | undefined;

    readonly onSelect?: (
        args: {
            readonly cell: T;
            readonly posX: number;
            readonly posY: number;
            readonly bounds: Rectangle;
            readonly theme: any;
            readonly preventDefault: () => void;
        } & BaseGridMouseEventArgs
    ) => void;

    readonly onDelete?: (cell: T) => T | undefined;
    readonly getAccessibilityString: (cell: T) => string;
    readonly onPaste: (val: string, cell: T) => T | undefined;
    readonly isMatch: (cell: InnerGridCell, val: string, col: number, row: number) => boolean;
}

// Simplified mouse event args for Vue
export interface BaseGridMouseEventArgs {
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

// Cell type definitions
export interface StarCellProps {
    readonly kind: "star-cell";
    readonly rating: number;
}

export interface SparklineCellProps {
    readonly kind: "sparkline-cell";
    readonly values: readonly number[];
    readonly graphColor?: string;
    readonly graphKind?: "line" | "bar";
}

export interface TagsCellProps {
    readonly kind: "tags-cell";
    readonly tags: readonly string[];
    readonly possibleTags?: readonly string[];
}

export interface UserProfileCellProps {
    readonly kind: "user-profile-cell";
    readonly image: string;
    readonly initial: string;
    readonly tint: string;
    readonly name?: string;
}

export interface DropdownCellProps {
    readonly kind: "dropdown-cell";
    readonly value: string | undefined | null;
    readonly allowedValues: readonly (string | { value: string; label: string } | undefined | null)[];
}

export interface RangeCellProps {
    readonly kind: "range-cell";
    readonly value: number;
    readonly min: number;
    readonly max: number;
    readonly step?: number;
    readonly label?: string;
    readonly measureLabel?: string;
}

export interface SpinnerCellProps {
    readonly kind: "spinner-cell";
    readonly value: number;
}

export interface DatePickerCellProps {
    readonly kind: "date-picker-cell";
    /* The current value of the datetime cell. */
    readonly date: Date | undefined | null;
    /* The current display value of the datetime cell. */
    readonly displayDate: string;
    /* Defines the type of the HTML input element. */
    readonly format: DateKind;
    /* Timezone offset in minutes.
    This can be used to adjust the date by a given timezone offset. */
    readonly timezoneOffset?: number;
    /* Minimum value that can be entered by the user.
    This is passed to the min attribute of the HTML input element. */
    readonly min?: string | Date;
    /* Maximum value that can be entered by the user.
    This is passed to the max attribute of the HTML input element. */
    readonly max?: string | Date;
    /* Granularity that the date must adhere.
    This is passed to the step attribute of the HTML input element. */
    readonly step?: string;
}

export type DateKind = "date" | "time" | "datetime-local";

export interface LinksCellProps {
    readonly kind: "links-cell";
    /**
     * Used to hand tune the position of the underline as this is not a native canvas capability, it can need tweaking
     * for different fonts.
     */
    readonly underlineOffset?: number;
    readonly maxLinks?: number;
    readonly navigateOn?: "click" | "control-click";
    readonly links: readonly {
        readonly title: string;
        readonly href?: string;
        readonly onClick?: () => void;
    }[];
}

type PackedColor = string | readonly [normal: string, hover: string];

export interface ButtonCellProps {
    readonly kind: "button-cell";
    readonly title: string;
    readonly onClick?: () => void;
    readonly backgroundColor?: PackedColor;
    readonly color?: PackedColor;
    readonly borderColor?: PackedColor;
    readonly borderRadius?: number;
}

export interface TreeViewCellProps {
    readonly kind: "tree-view-cell";
    readonly text: string;
    readonly isOpen: boolean;
    readonly canOpen: boolean;
    readonly depth: number;
    readonly onClickOpener?: (cell: TreeViewCell) => TreeViewCell | undefined;
}

export type SelectOption = { value: string; label?: string; color?: string };

export interface MultiSelectCellProps {
    readonly kind: "multi-select-cell";
    /* The list of values of this cell. */
    readonly values: string[] | undefined | null;
    /* The list of possible options that can be selected.
    The options can be provided as a list of strings
    or as a list of objects with the following properties:
    - value: The value of this option.
    - label: The label of this option. If not provided, the value will be used as the label.
    - color: The color of this option. If not provided, the default color will be used. */
    readonly options?: readonly (SelectOption | string)[];
    /* If true, users can create new values that are not part of the configured options. */
    readonly allowCreation?: boolean;
    /* If true, users can select the same value multiple times. */
    readonly allowDuplicates?: boolean;
}

// Export cell types
export type StarCell = InnerGridCell & StarCellProps;
export type SparklineCell = InnerGridCell & SparklineCellProps;
export type TagsCell = InnerGridCell & TagsCellProps;
export type UserProfileCell = InnerGridCell & UserProfileCellProps;
export type DropdownCell = InnerGridCell & DropdownCellProps;
export type RangeCell = InnerGridCell & RangeCellProps;
export type SpinnerCell = InnerGridCell & SpinnerCellProps;
export type DatePickerCell = InnerGridCell & DatePickerCellProps;
export type LinksCell = InnerGridCell & LinksCellProps;
export type ButtonCell = InnerGridCell & ButtonCellProps;
export type TreeViewCell = InnerGridCell & TreeViewCellProps;
export type MultiSelectCell = InnerGridCell & MultiSelectCellProps;

// Union type for all custom cells
export type CustomCell =
    | StarCell
    | SparklineCell
    | TagsCell
    | UserProfileCell
    | DropdownCell
    | RangeCell
    | SpinnerCell
    | DatePickerCell
    | LinksCell
    | ButtonCell
    | TreeViewCell
    | MultiSelectCell;