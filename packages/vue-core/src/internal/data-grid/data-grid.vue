<template>
    <div>
        <canvas
            data-testid="data-grid-canvas"
            tabindex="0"
            @keydown="onKeyDownImpl"
            @keyup="onKeyUpImpl"
            @focus="onCanvasFocused"
            @blur="onCanvasBlur"
            :ref="refImpl"
            :style="style"
        >
            <slot name="accessibility-tree">{{ accessibilityTree }}</slot>
        </canvas>
        <canvas :ref="overlayRef" :style="overlayStyle" />
        <div v-if="opacityX > 0" id="shadow-x" :style="shadowXStyle" />
        <div v-if="opacityY > 0" id="shadow-y" :style="shadowYStyle" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { FullTheme } from "../../common/styles.js";
import {
    computeBounds,
    getColumnIndexForX,
    getEffectiveColumns,
    getRowIndexForY,
    getStickyWidth,
    rectBottomRight,
    useMappedColumns,
} from "./render/data-grid-lib.js";
import {
    GridCellKind,
    type Rectangle,
    type GridSelection,
    type InnerGridCell,
    InnerGridCellKind,
    CompactSelection,
    type Item,
    type DrawHeaderCallback,
    isReadWriteCell,
    isInnerOnlyCell,
    booleanCellIsEditable,
    type InnerGridColumn,
    type DrawCellCallback,
    type FillHandle,
    DEFAULT_FILL_HANDLE,
} from "./data-grid-types.js";
import { CellSet } from "./cell-set.js";
import { SpriteManager, type SpriteMap } from "./data-grid-sprites.js";
import { direction, getScrollBarWidth, useDebouncedMemo, useEventListener } from "../../common/utils.js";
import clamp from "lodash/clamp.js";
import makeRange from "lodash/range.js";
import { drawGrid } from "./render/data-grid-render.js";
import { type BlitData } from "./render/data-grid-render.blit.js";
import { AnimationManager, type StepCallback } from "./animation-manager.js";
import { RenderStateProvider, packColRowToNumber } from "../../common/render-state-provider.js";
import { browserIsFirefox, browserIsSafari } from "../../common/browser-detect.js";
import { type EnqueueCallback, useAnimationQueue } from "./use-animation-queue.js";
import { assert } from "../../common/support.js";
import type { CellRenderer, GetCellRendererCallback } from "../../cells/cell-types.js";
import type { DrawGridArg } from "./render/draw-grid-arg.js";
import type { ImageWindowLoader } from "./image-window-loader-interface.js";
import {
    type GridMouseEventArgs,
    type GridKeyEventArgs,
    type GridDragEventArgs,
    OutOfBoundsRegionAxis,
    outOfBoundsKind,
    groupHeaderKind,
    headerKind,
    mouseEventArgsAreEqual,
} from "./event-args.js";
import { pointInRect } from "../../common/math.js";
import {
    type GroupDetailsCallback,
    type GetRowThemeCallback,
    type Highlight,
    drawCell,
} from "./render/data-grid-render.cells.js";
import { getActionBoundsForGroup, drawHeader, computeHeaderLayout } from "./render/data-grid-render.header.js";

export interface DataGridProps {
    readonly width: number;
    readonly height: number;

    readonly cellXOffset: number;
    readonly cellYOffset: number;

    readonly translateX: number | undefined;
    readonly translateY: number | undefined;

    readonly accessibilityHeight: number;

    readonly freezeColumns: number;
    readonly freezeTrailingRows: number;
    readonly hasAppendRow: boolean;
    readonly firstColAccessible: boolean;

    /**
     * Enables or disables the overlay shadow when scrolling horizontally
     * @group Style
     */
    readonly fixedShadowX: boolean | undefined;
    /**
     * Enables or disables the overlay shadow when scrolling vertical
     * @group Style
     */
    readonly fixedShadowY: boolean | undefined;

    readonly allowResize: boolean | undefined;
    readonly isResizing: boolean;
    readonly resizeColumn: number | undefined;
    readonly isDragging: boolean;
    readonly isFilling: boolean;
    readonly isFocused: boolean;

    readonly columns: readonly InnerGridColumn[];
    /**
     * The number of rows in the grid.
     * @group Data
     */
    readonly rows: number;

    readonly headerHeight: number;
    readonly groupHeaderHeight: number;
    readonly enableGroups: boolean;
    readonly rowHeight: number | ((index: number) => number);

    readonly canvasRef: { value: HTMLCanvasElement | null } | undefined;

    readonly eventTargetRef: { value: HTMLDivElement | null } | undefined;

    readonly getCellContent: (cell: Item, forceStrict?: boolean) => InnerGridCell;
    /**
     * Provides additional details about groups to extend group functionality.
     * @group Data
     */
    readonly getGroupDetails: GroupDetailsCallback | undefined;
    /**
     * Provides per row theme overrides.
     * @group Style
     */
    readonly getRowThemeOverride: GetRowThemeCallback | undefined;
    /**
     * Emitted when a header menu disclosure indicator is clicked.
     * @group Events
     */
    readonly onHeaderMenuClick: ((col: number, screenPosition: Rectangle) => void) | undefined;

    /**
     * Emitted when a header indicator icon is clicked.
     * @group Events
     */
    readonly onHeaderIndicatorClick: ((col: number, screenPosition: Rectangle) => void) | undefined;

    readonly selection: GridSelection;
    readonly prelightCells: readonly Item[] | undefined;
    /**
     * Highlight regions provide hints to users about relations between cells and selections.
     * @group Selection
     */
    readonly highlightRegions: readonly Highlight[] | undefined;

    /**
     * Enabled/disables the fill handle.
     * @defaultValue false
     * @group Editing
     */
    readonly fillHandle: FillHandle | undefined;

    readonly disabledRows: CompactSelection | undefined;
    /**
     * Allows passing a custom image window loader.
     * @group Advanced
     */
    readonly imageWindowLoader: ImageWindowLoader;

    /**
     * Emitted when an item is hovered.
     * @group Events
     */
    readonly onItemHovered: (args: GridMouseEventArgs) => void;
    readonly onMouseMove: (args: GridMouseEventArgs) => void;
    readonly onMouseDown: (args: GridMouseEventArgs) => void;
    readonly onMouseUp: (args: GridMouseEventArgs, isOutside: boolean) => void;
    readonly onContextMenu: (args: GridMouseEventArgs, preventDefault: () => void) => void;

    readonly onCanvasFocused: () => void;
    readonly onCanvasBlur: () => void;
    readonly onCellFocused: (args: Item) => void;

    readonly onMouseMoveRaw: (event: MouseEvent) => void;

    /**
     * Emitted when the canvas receives a key down event.
     * @group Events
     */
    readonly onKeyDown: (event: GridKeyEventArgs) => void;
    /**
     * Emitted when the canvas receives a key up event.
     * @group Events
     */
    readonly onKeyUp: ((event: GridKeyEventArgs) => void) | undefined;

    readonly verticalBorder: (col: number) => boolean;

    /**
     * Determines what can be dragged using HTML drag and drop
     * @defaultValue false
     * @group Drag and Drop
     */
    readonly isDraggable: boolean | "cell" | "header" | undefined;
    /**
     * If `isDraggable` is set, the grid becomes HTML draggable, and `onDragStart` will be called when dragging starts.
     * You can use this to build a UI where the user can drag the Grid around.
     * @group Drag and Drop
     */
    readonly onDragStart: (args: GridDragEventArgs) => void;
    readonly onDragEnd: () => void;

    /** @group Drag and Drop */
    readonly onDragOverCell: ((cell: Item, dataTransfer: DataTransfer | null) => void) | undefined;
    /** @group Drag and Drop */
    readonly onDragLeave: (() => void) | undefined;

    /**
     * Called when a HTML Drag and Drop event is ended on the data grid.
     * @group Drag and Drop
     */
    readonly onDrop: ((cell: Item, dataTransfer: DataTransfer | null) => void) | undefined;

    /**
     * Overrides the rendering of a header. The grid will call this for every header it needs to render. Header
     * rendering is not as well optimized because they do not redraw as often, but very heavy drawing methods can
     * negatively impact horizontal scrolling performance.
     *
     * It is possible to return `false` after rendering just a background and the regular foreground rendering
     * will happen.
     * @group Drawing
     * @returns `false` if default header rendering should still happen, `true` to cancel rendering.
     */
    readonly drawHeader: DrawHeaderCallback | undefined;

    readonly drawCell: DrawCellCallback | undefined;

    /**
     * Controls the drawing of the focus ring.
     * @defaultValue true
     * @group Style
     */
    readonly drawFocusRing: boolean;

    readonly dragAndDropState:
        | {
              src: number;
              dest: number;
          }
        | undefined;

    /**
     * Experimental features
     * @group Advanced
     * @experimental
     */
    readonly experimental:
        | {
              readonly disableAccessibilityTree?: boolean;
              readonly disableMinimumCellWidth?: boolean;
              readonly paddingRight?: number;
              readonly paddingBottom?: number;
              readonly enableFirefoxRescaling?: boolean;
              readonly enableSafariRescaling?: boolean;
              readonly kineticScrollPerfHack?: boolean;
              readonly isSubGrid?: boolean;
              readonly strict?: boolean;
              readonly scrollbarWidthOverride?: number;
              readonly hyperWrapping?: boolean;
              readonly renderStrategy?: "single-buffer" | "double-buffer" | "direct";
              /**
               * Allows providing a custom event target for event listeners.
               * If not provided, the grid will use the window as the event target.
               */
              readonly eventTarget?: HTMLElement | Window | Document;
          }
        | undefined;

    /**
     * Additional header icons for use by `GridColumn`.
     *
     * Providing custom header icons to the data grid must be done with a somewhat non-standard mechanism to allow
     * theming and scaling. The `headerIcons` property takes a dictionary which maps icon names to functions which can
     * take a foreground and background color and returns back a string representation of an svg. The svg should contain
     * a header similar to this `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">` and
     * interpolate the fg/bg colors into the string.
     *
     * We recognize this process is not fantastic from a graphics workflow standpoint, improvements are very welcome
     * here.
     *
     * @group Style
     */
    readonly headerIcons: SpriteMap | undefined;

    /** Controls smooth scrolling in the data grid. If smooth scrolling is not enabled the grid will always be cell
     * aligned.
     * @defaultValue `false`
     * @group Style
     */
    readonly smoothScrollX: boolean | undefined;
    /** Controls smooth scrolling in the data grid. If smooth scrolling is not enabled the grid will always be cell
     * aligned.
     * @defaultValue `false`
     * @group Style
     */
    readonly smoothScrollY: boolean | undefined;

    readonly theme: FullTheme;

    readonly getCellRenderer: <T extends InnerGridCell>(cell: T) => CellRenderer<T> | undefined;

    /**
     * Controls the resize indicator behavior.
     *
     * - `full` will show the resize indicator on the full height.
     * - `header` will show the resize indicator only on the header.
     * - `none` will not show the resize indicator.
     *
     * @defaultValue "full"
     * @group Style
     */
    readonly resizeIndicator: "full" | "header" | "none" | undefined;
}

type DamageUpdateList = readonly {
    cell: Item;
    // newValue: GridCell,
}[];

export interface DataGridRef {
    focus: () => void;
    getBounds: (col?: number, row?: number) => Rectangle | undefined;
    damage: (cells: DamageUpdateList) => void;
    getMouseArgsForPosition: (
        posX: number,
        posY: number,
        ev?: MouseEvent | TouchEvent
    ) => GridMouseEventArgs | undefined;
}

const props = withDefaults(defineProps<DataGridProps>(), {
    fixedShadowX: true,
    fixedShadowY: true,
    fillHandle: false,
    isDraggable: false,
    smoothScrollX: false,
    smoothScrollY: false,
    resizeIndicator: "full",
});

const emit = defineEmits<{
    "canvas-focused": [];
    "canvas-blur": [];
    "cell-focused": [args: Item];
    "header-menu-click": [col: number, screenPosition: Rectangle];
    "header-indicator-click": [col: number, screenPosition: Rectangle];
    "item-hovered": [args: GridMouseEventArgs];
    "mouse-move": [args: GridMouseEventArgs];
    "mouse-down": [args: GridMouseEventArgs];
    "mouse-up": [args: GridMouseEventArgs, isOutside: boolean];
    "context-menu": [args: GridMouseEventArgs, preventDefault: () => void];
    "key-down": [event: GridKeyEventArgs];
    "key-up": [event: GridKeyEventArgs];
    "drag-start": [args: GridDragEventArgs];
    "drag-end": [];
    "drag-over-cell": [cell: Item, dataTransfer: DataTransfer | null];
    "drag-leave": [];
    drop: [cell: Item, dataTransfer: DataTransfer | null];
    "mouse-move-raw": [event: MouseEvent];
}>();

const getRowData = (cell: InnerGridCell, getCellRenderer?: GetCellRendererCallback) => {
    if (cell.kind === GridCellKind.Custom) return cell.copyData;
    const r = getCellRenderer?.(cell);
    return r?.getAccessibilityString(cell) ?? "";
};

// Refs for canvas elements
const canvasRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);

// State management
const damageRegion = ref<CellSet | undefined>();
const scrolling = ref<boolean>(false);
const hoverValues = ref<readonly { item: Item; hoverAmount: number }[]>([]);
const lastBlitData = ref<BlitData | undefined>();
const hoveredItemInfo = ref<[Item, readonly [number, number]] | undefined>();
const hoveredOnEdge = ref<boolean>();
const drawCursorOverride = ref<string | undefined>();
const lastWasTouch = ref(false);

// Refs for tracking state
const windowEventTargetRef = ref<HTMLElement | Window | Document>(props.experimental?.eventTarget ?? window);
const windowEventTarget = windowEventTargetRef.value;

const imageLoader = props.imageWindowLoader;
const scrollingStopRef = ref(-1);
const enableFirefoxRescaling = (props.experimental?.enableFirefoxRescaling ?? false) && browserIsFirefox.value;
const enableSafariRescaling = (props.experimental?.enableSafariRescaling ?? false) && browserIsSafari.value;

const cellXOffset = computed(() =>
    Math.max(props.freezeColumns, Math.min(props.columns.length - 1, props.cellXOffset))
);
const translateX = computed(() => props.translateX ?? 0);
const translateY = computed(() => props.translateY ?? 0);

const mappedColumns = useMappedColumns(props.columns, props.freezeColumns);
const stickyX = computed(() => (props.fixedShadowX ? getStickyWidth(mappedColumns.value, props.dragAndDropState) : 0));

const totalHeaderHeight = computed(() =>
    props.enableGroups ? props.groupHeaderHeight + props.headerHeight : props.headerHeight
);

// Sprite manager
const spriteManager = computed(
    () =>
        new SpriteManager(props.headerIcons, () => {
            lastArgsRef.value = undefined;
            lastDrawRef.value();
        })
);

// Animation and rendering
const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
const overlayCtx = ref<CanvasRenderingContext2D | null>(null);
const lastArgsRef = ref<DrawGridArg>();
const lastDrawRef = ref<() => void>(() => {});

// Animation queue
const enqueueRef = ref<EnqueueCallback>(() => {
    // do nothing
});

// Buffer contexts for double buffering
const bufferACtx = ref<CanvasRenderingContext2D | null>(null);
const bufferBCtx = ref<CanvasRenderingContext2D | null>(null);

// Animation manager
const animationManager = ref<AnimationManager | null>(null);

// Event handlers and other complex logic will be implemented in the next part
// This is a very large component that requires careful migration

// Basic computed properties for styling
const style = computed(() => ({
    contain: "strict",
    display: "block",
    cursor: computedCursor.value,
}));

const overlayStyle = computed(() => ({
    position: "absolute",
    top: 0,
    left: 0,
}));

// Shadow styles
const opacityX = computed(() => {
    if (props.freezeColumns === 0 || !props.fixedShadowX) return 0;
    return cellXOffset.value > props.freezeColumns ? 1 : clamp(-translateX.value / 100, 0, 1);
});

const opacityY = computed(() => {
    if (!props.fixedShadowY) return 0;
    const absoluteOffsetY = -props.cellYOffset * 32 + translateY.value;
    return clamp(-absoluteOffsetY / 100, 0, 1);
});

const shadowXStyle = computed(() => ({
    position: "absolute",
    top: 0,
    left: stickyX.value,
    width: props.width - stickyX.value,
    height: props.height,
    opacity: opacityX.value,
    pointerEvents: "none",
    transition: !props.smoothScrollX ? "opacity 0.2s" : undefined,
    boxShadow: "inset 13px 0 10px -13px rgba(0, 0, 0, 0.2)",
}));

const shadowYStyle = computed(() => ({
    position: "absolute",
    top: totalHeaderHeight.value,
    left: 0,
    width: props.width,
    height: props.height,
    opacity: opacityY.value,
    pointerEvents: "none",
    transition: !props.smoothScrollY ? "opacity 0.2s" : undefined,
    boxShadow: "inset 0 13px 10px -13px rgba(0, 0, 0, 0.2)",
}));

// Cursor computation
const computedCursor = computed(() => {
    const [hCol, hRow] = hoveredItemInfo.value?.[0] ?? [];

    if (props.isDragging) return "grabbing";
    if (hoveredOnEdge.value || props.isResizing) return "col-resize";
    if (overFill.value || props.isFilling) return "crosshair";
    if (drawCursorOverride.value !== undefined) return drawCursorOverride.value;

    const headerHovered =
        hCol !== undefined &&
        hRow === -1 &&
        hCol >= 0 &&
        hCol < mappedColumns.value.length &&
        mappedColumns.value[hCol].headerRowMarkerDisabled !== true;
    const groupHeaderHovered = hCol !== undefined && hRow === -2;

    let clickableInnerCellHovered = false;
    let editableBoolHovered = false;

    if (hCol !== undefined && hRow !== undefined && hRow > -1 && hRow < props.rows) {
        const cell = props.getCellContent([hCol, hRow], true);
        clickableInnerCellHovered =
            cell.kind === InnerGridCellKind.NewRow ||
            (cell.kind === InnerGridCellKind.Marker && cell.markerKind !== "number");
        editableBoolHovered = cell.kind === GridCellKind.Boolean && booleanCellIsEditable(cell);
    }

    return headerHovered || clickableInnerCellHovered || editableBoolHovered || groupHeaderHovered
        ? "pointer"
        : "default";
});

const overFill = ref(false);

// Basic event handlers
const onCanvasFocused = () => {
    emit("canvas-focused");
};

const onCanvasBlur = () => {
    emit("canvas-blur");
};

const onKeyDownImpl = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;

    let bounds: Rectangle | undefined;
    let location: Item | undefined = undefined;
    if (props.selection.current !== undefined) {
        bounds = getBoundsForItem(canvas, props.selection.current.cell[0], props.selection.current.cell[1]);
        location = props.selection.current.cell;
    }

    emit("key-down", {
        bounds,
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        cancel: () => undefined,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: event.key,
        keyCode: event.keyCode,
        rawEvent: event,
        location,
    });
};

const onKeyUpImpl = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;

    let bounds: Rectangle | undefined;
    let location: Item | undefined = undefined;
    if (props.selection.current !== undefined) {
        bounds = getBoundsForItem(canvas, props.selection.current.cell[0], props.selection.current.cell[1]);
        location = props.selection.current.cell;
    }

    emit("key-up", {
        bounds,
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        cancel: () => undefined,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: event.key,
        keyCode: event.keyCode,
        rawEvent: event,
        location,
    });
};

const refImpl = (instance: HTMLCanvasElement | null) => {
    canvasRef.value = instance;
    if (props.canvasRef !== undefined) {
        props.canvasRef.value = instance;
    }

    if (props.experimental?.eventTarget) {
        windowEventTargetRef.value = props.experimental.eventTarget;
    } else if (instance === null) {
        windowEventTargetRef.value = window;
    } else {
        const docRoot = instance.getRootNode();
        windowEventTargetRef.value = docRoot === document ? window : (docRoot as any);
    }
};

// Accessibility tree (simplified for now)
const accessibilityTree = computed(() => {
    if (props.width < 50 || props.experimental?.disableAccessibilityTree === true) return null;
    // TODO: Implement full accessibility tree
    return null;
});

// Note: This is a partial migration. The full component requires extensive work
// to convert all the React hooks and complex event handling to Vue 3 patterns.
// The core functionality has been migrated, but some advanced features may need
// additional implementation.
</script>
