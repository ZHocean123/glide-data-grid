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

// -----------------------------
// Migrated logic from React core
// -----------------------------

/**
 * 计算指定单元格的屏幕边界矩形。
 * 对齐 React 版本逻辑，考虑缩放与冻结列等因素。
 */
const getBoundsForItem = (
    canvas: HTMLCanvasElement,
    col: number,
    row: number
): Rectangle | undefined => {
    const rect = canvas.getBoundingClientRect();
    if (col >= mappedColumns.value.length || row >= props.rows) return undefined;

    const scale = rect.width / props.width;

    const result = computeBounds(
        col,
        row,
        props.width,
        props.height,
        props.groupHeaderHeight,
        totalHeaderHeight.value,
        cellXOffset.value,
        props.cellYOffset,
        translateX.value,
        translateY.value,
        props.rows,
        props.freezeColumns,
        props.freezeTrailingRows,
        mappedColumns.value,
        props.rowHeight
    );

    if (scale !== 1) {
        result.x *= scale;
        result.y *= scale;
        result.width *= scale;
        result.height *= scale;
    }
    result.x += rect.x;
    result.y += rect.y;
    return result;
};

/**
 * 依据鼠标/触摸位置构造 GridMouseEventArgs。
 * 与 React 版本保持一致，包含边缘检测与填充柄识别。
 */
const getMouseArgsForPositionImpl = (
    canvas: HTMLCanvasElement,
    posX: number,
    posY: number,
    ev?: PointerEvent | MouseEvent | TouchEvent
): GridMouseEventArgs => {
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / props.width;
    const x = (posX - rect.left) / scale;
    const y = (posY - rect.top) / scale;
    const edgeDetectionBuffer = 5;

    const effectiveCols = getEffectiveColumns(
        mappedColumns.value,
        cellXOffset.value,
        props.width,
        undefined,
        translateX.value
    );

    let button = 0;
    let buttons = 0;

    const isMouse =
        (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "mouse") ||
        (typeof MouseEvent !== "undefined" && ev instanceof MouseEvent);
    const isTouch =
        (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "touch") ||
        (typeof TouchEvent !== "undefined" && ev instanceof TouchEvent);

    if (isMouse) {
        // @ts-expect-error button/buttons 在 PointerEvent/MouseEvent 上存在
        button = ev.button;
        // @ts-expect-error
        buttons = ev.buttons;
    }

    const col = getColumnIndexForX(x, effectiveCols, translateX.value);
    const row = getRowIndexForY(
        y,
        props.height,
        props.enableGroups,
        props.headerHeight,
        props.groupHeaderHeight,
        props.rows,
        props.rowHeight,
        props.cellYOffset,
        translateY.value,
        props.freezeTrailingRows
    );

    const shiftKey = (ev as any)?.shiftKey === true;
    const ctrlKey = (ev as any)?.ctrlKey === true;
    const metaKey = (ev as any)?.metaKey === true;

    const scrollEdge: GridMouseEventArgs["scrollEdge"] = [
        x < 0 ? -1 : props.width < x ? 1 : 0,
        y < totalHeaderHeight.value ? -1 : props.height < y ? 1 : 0,
    ];

    let result: GridMouseEventArgs;
    if (col === -1 || y < 0 || x < 0 || row === undefined || x > props.width || y > props.height) {
        const horizontal = x > props.width ? 1 : x < 0 ? -1 : 0;
        const vertical = y > props.height ? 1 : y < 0 ? -1 : 0;

        let innerHorizontal: OutOfBoundsRegionAxis = horizontal * 2;
        let innerVertical: OutOfBoundsRegionAxis = vertical * 2;
        if (horizontal === 0)
            innerHorizontal = col === -1 ? OutOfBoundsRegionAxis.EndPadding : OutOfBoundsRegionAxis.Center;
        if (vertical === 0)
            innerVertical = row === undefined ? OutOfBoundsRegionAxis.EndPadding : OutOfBoundsRegionAxis.Center;

        let isEdge = false;
        if (col === -1 && row === -1) {
            const b = getBoundsForItem(canvas, mappedColumns.value.length - 1, -1);
            assert(b !== undefined);
            isEdge = posX < (b!.x + b!.width + edgeDetectionBuffer);
        }

        const isMaybeScrollbar =
            (x > props.width && x < props.width + getScrollBarWidth()) ||
            (y > props.height && y < props.height + getScrollBarWidth());

        result = {
            kind: outOfBoundsKind,
            location: [col !== -1 ? col : x < 0 ? 0 : mappedColumns.value.length - 1, row ?? props.rows - 1],
            region: [innerHorizontal, innerVertical],
            shiftKey,
            ctrlKey,
            metaKey,
            isEdge,
            isTouch,
            button,
            buttons,
            scrollEdge,
            isMaybeScrollbar,
        } as any;
    } else if (row <= -1) {
        let bounds = getBoundsForItem(canvas, col, row);
        assert(bounds !== undefined);
        let isEdge = bounds !== undefined && bounds.x + bounds.width - posX <= edgeDetectionBuffer;

        const previousCol = col - 1;
        if (posX - (bounds?.x ?? 0) <= edgeDetectionBuffer && previousCol >= 0) {
            isEdge = true;
            bounds = getBoundsForItem(canvas, previousCol, row);
            assert(bounds !== undefined);
            result = {
                kind: props.enableGroups && row === -2 ? groupHeaderKind : headerKind,
                location: [previousCol, row] as any,
                bounds: bounds!,
                group: mappedColumns.value[previousCol].group ?? "",
                isEdge,
                shiftKey,
                ctrlKey,
                metaKey,
                isTouch,
                localEventX: posX - bounds!.x,
                localEventY: posY - bounds!.y,
                button,
                buttons,
                scrollEdge,
            } as any;
        } else {
            result = {
                kind: props.enableGroups && row === -2 ? groupHeaderKind : headerKind,
                group: mappedColumns.value[col].group ?? "",
                location: [col, row] as any,
                bounds: bounds!,
                isEdge,
                shiftKey,
                ctrlKey,
                metaKey,
                isTouch,
                localEventX: posX - bounds!.x,
                localEventY: posY - bounds!.y,
                button,
                buttons,
                scrollEdge,
            } as any;
        }
    } else {
        const bounds = getBoundsForItem(canvas, col, row);
        assert(bounds !== undefined);
        const isEdge = bounds !== undefined && bounds.x + bounds.width - posX < edgeDetectionBuffer;

        let isFillHandle = false;
        const drawFill = props.fillHandle !== false && props.fillHandle !== undefined;
        if (drawFill && props.selection.current !== undefined) {
            const fill = typeof props.fillHandle === "object" ? { ...DEFAULT_FILL_HANDLE, ...props.fillHandle } : DEFAULT_FILL_HANDLE;
            const fillHandleClickSize = fill.size;
            const half = fillHandleClickSize / 2;
            const fillHandleLocation = rectBottomRight(props.selection.current.range);
            const fillBounds = getBoundsForItem(canvas, fillHandleLocation[0], fillHandleLocation[1]);
            if (fillBounds !== undefined) {
                const centerX = fillBounds.x + fillBounds.width + fill.offsetX - half + 0.5;
                const centerY = fillBounds.y + fillBounds.height + fill.offsetY - half + 0.5;
                isFillHandle = Math.abs(centerX - posX) < fillHandleClickSize && Math.abs(centerY - posY) < fillHandleClickSize;
            }
        }

        result = {
            kind: "cell",
            location: [col, row],
            bounds: bounds!,
            isEdge,
            shiftKey,
            ctrlKey,
            isFillHandle,
            metaKey,
            isTouch,
            localEventX: posX - bounds!.x,
            localEventY: posY - bounds!.y,
            button,
            buttons,
            scrollEdge,
        } as any;
    }
    return result;
};

/**
 * 将损坏区域（需重绘的单元格）入队并触发重绘。
 */
const damageInternal = (locations: CellSet) => {
    damageRegion.value = locations;
    lastDrawRef.value();
    damageRegion.value = undefined;
};

// 动画队列（Hover 等）
const enqueue = useAnimationQueue(damageInternal);
enqueueRef.value = enqueue;

// 初始化离屏缓冲区（双缓冲）
onMounted(() => {
    const a = document.createElement("canvas");
    const b = document.createElement("canvas");
    a.style.display = "none";
    a.style.opacity = "0";
    a.style.position = "fixed";
    b.style.display = "none";
    b.style.opacity = "0";
    b.style.position = "fixed";
    bufferACtx.value = a.getContext("2d", { alpha: false });
    bufferBCtx.value = b.getContext("2d", { alpha: false });
    if (bufferACtx.value !== null && bufferBCtx.value !== null) {
        document.documentElement.append(bufferACtx.value.canvas);
        document.documentElement.append(bufferBCtx.value.canvas);
    }
});

onUnmounted(() => {
    bufferACtx.value?.canvas.remove();
    bufferBCtx.value?.canvas.remove();
});

// 渲染状态提供者
const renderStateProvider = new RenderStateProvider();

// Firefox/Safari 滚动模式下的缩放上限
const maxDPR = computed(() => (enableFirefoxRescaling && scrolling.value ? 1 : enableSafariRescaling && scrolling.value ? 2 : 5));
const minimumCellWidth = computed(() => (props.experimental?.disableMinimumCellWidth === true ? 1 : 10));

/**
 * 核心绘制方法：准备上下文与参数，再调用 drawGrid。
 */
const draw = () => {
    const canvas = canvasRef.value;
    const overlay = overlayRef.value;
    if (canvas === null || overlay === null) return;

    if (canvasCtx.value === null) {
        canvasCtx.value = canvas.getContext("2d", { alpha: false });
        canvas.width = 0;
        canvas.height = 0;
    }
    if (overlayCtx.value === null) {
        overlayCtx.value = overlay.getContext("2d", { alpha: false });
        overlay.width = 0;
        overlay.height = 0;
    }
    if (canvasCtx.value === null || overlayCtx.value === null || bufferACtx.value === null || bufferBCtx.value === null) return;

    let didOverride = false;
    const overrideCursor = (cursor: string) => {
        didOverride = true;
        drawCursorOverride.value = cursor;
    };

    const last = lastArgsRef.value;
    const current: DrawGridArg = {
        headerCanvasCtx: overlayCtx.value,
        canvasCtx: canvasCtx.value!,
        bufferACtx: bufferACtx.value!,
        bufferBCtx: bufferBCtx.value!,
        width: props.width,
        height: props.height,
        cellXOffset: cellXOffset.value,
        cellYOffset: props.cellYOffset,
        translateX: Math.round(translateX.value),
        translateY: Math.round(translateY.value),
        mappedColumns: mappedColumns.value,
        enableGroups: props.enableGroups,
        freezeColumns: props.freezeColumns,
        dragAndDropState: props.dragAndDropState,
        theme: props.theme,
        headerHeight: props.headerHeight,
        groupHeaderHeight: props.groupHeaderHeight,
        disabledRows: props.disabledRows ?? CompactSelection.empty(),
        rowHeight: props.rowHeight,
        verticalBorder: props.verticalBorder,
        isResizing: props.isResizing,
        resizeCol: props.resizeColumn,
        isFocused: props.isFocused,
        selection: props.selection,
        fillHandle: props.fillHandle,
        drawCellCallback: props.drawCell,
        hasAppendRow: props.hasAppendRow,
        overrideCursor,
        maxScaleFactor: maxDPR.value,
        freezeTrailingRows: props.freezeTrailingRows,
        rows: props.rows,
        drawFocus: props.drawFocusRing,
        getCellContent: props.getCellContent,
        getGroupDetails: props.getGroupDetails ?? (name => ({ name })),
        getRowThemeOverride: props.getRowThemeOverride,
        drawHeaderCallback: props.drawHeader,
        prelightCells: props.prelightCells,
        highlightRegions: props.highlightRegions,
        imageLoader: imageLoader,
        lastBlitData,
        damage: damageRegion.value,
        hoverValues: hoverValues.value,
        hoverInfo: hoveredItemInfo.value,
        spriteManager: spriteManager.value,
        scrolling: scrolling.value,
        hyperWrapping: props.experimental?.hyperWrapping ?? false,
        touchMode: lastWasTouch.value,
        enqueue: enqueueRef.value,
        renderStateProvider,
        renderStrategy: props.experimental?.renderStrategy ?? (browserIsSafari.value ? "double-buffer" : "single-buffer"),
        getCellRenderer: props.getCellRenderer,
        minimumCellWidth: minimumCellWidth.value,
        resizeIndicator: props.resizeIndicator,
    } as any;

    if (current.damage === undefined) {
        lastArgsRef.value = current;
        drawGrid(current, last);
    } else {
        drawGrid(current, undefined);
    }

    if (!didOverride && (current.damage === undefined || current.damage.has(hoveredItemInfo.value?.[0]))) {
        drawCursorOverride.value = undefined;
    }
};

// 初次与依赖变更时重绘
onMounted(() => {
    draw();
    lastDrawRef.value = draw;
});

watch(
    [
        () => props.width,
        () => props.height,
        () => cellXOffset.value,
        () => props.cellYOffset,
        () => translateX.value,
        () => translateY.value,
        () => props.columns,
        () => props.rows,
        () => props.isResizing,
        () => props.resizeColumn,
        () => props.selection,
        () => props.dragAndDropState,
        () => props.theme,
        () => props.headerHeight,
        () => props.groupHeaderHeight,
        () => props.rowHeight,
        () => props.freezeColumns,
        () => props.freezeTrailingRows,
        () => props.drawFocusRing,
        () => props.getCellContent,
        () => props.getGroupDetails,
        () => props.getRowThemeOverride,
        () => props.drawCell,
        () => props.drawHeader,
        () => props.prelightCells,
        () => props.highlightRegions,
        () => props.experimental?.hyperWrapping,
        () => props.experimental?.renderStrategy,
        () => props.getCellRenderer,
        () => minimumCellWidth.value,
        () => props.resizeIndicator,
        () => scrolling.value,
    ],
    () => lastDrawRef.value(),
    { deep: false }
);

// 处理字体加载完成后的重绘
onMounted(() => {
    const fn = async () => {
        // @ts-expect-error fonts 可能不存在
        if (document?.fonts?.ready === undefined) return;
        await (document as any).fonts.ready;
        lastArgsRef.value = undefined;
        lastDrawRef.value();
    };
    void fn();
});

// 滚动缩放效果，避免重绘闪烁
watch([
    () => props.cellYOffset,
    () => cellXOffset.value,
    () => translateX.value,
    () => translateY.value,
    () => enableFirefoxRescaling,
    () => enableSafariRescaling,
], () => {
    if (window.devicePixelRatio === 1 || (!enableFirefoxRescaling && !enableSafariRescaling)) return;
    if (scrollingStopRef.value !== -1) scrolling.value = true;
    window.clearTimeout(scrollingStopRef.value);
    scrollingStopRef.value = window.setTimeout(() => {
        scrolling.value = false;
        scrollingStopRef.value = -1;
    }, 200);
});

// 光标同步到自定义事件目标（若提供）
watch(
    () => computedCursor.value,
    cursor => {
        const target = props.eventTargetRef?.value;
        if (target !== null && target !== undefined) {
            (target as HTMLElement).style.cursor = cursor;
        }
    }
);

// 图片加载窗口回调：损坏单元格触发重绘
imageLoader.setCallback(damageInternal);

// 组头动作区域识别
const groupHeaderActionForEvent = (
    group: string,
    bounds: Rectangle,
    localEventX: number,
    localEventY: number
) => {
    if (props.getGroupDetails === undefined) return undefined;
    const groupDesc = props.getGroupDetails(group);
    if (groupDesc.actions !== undefined) {
        const boxes = getActionBoundsForGroup(bounds, groupDesc.actions);
        for (const [i, box] of boxes.entries()) {
            if (pointInRect(box, localEventX + bounds.x, localEventY + box.y)) {
                return groupDesc.actions[i];
            }
        }
    }
    return undefined;
};

// 判断是否位于 Header 的菜单/指示器元素
const isOverHeaderElement = (
    canvas: HTMLCanvasElement,
    col: number,
    clientX: number,
    clientY: number
): { area: "menu" | "indicator"; bounds: Rectangle } | undefined => {
    const header = mappedColumns.value[col];
    if (!props.isDragging && !props.isResizing && !(hoveredOnEdge.value ?? false)) {
        const headerBounds = getBoundsForItem(canvas, col, -1);
        assert(headerBounds !== undefined);
        const headerLayout = computeHeaderLayout(
            undefined,
            header,
            headerBounds!.x,
            headerBounds!.y,
            headerBounds!.width,
            headerBounds!.height,
            props.theme,
            direction(header.title) === "rtl"
        );
        if (header.hasMenu === true && headerLayout.menuBounds !== undefined && pointInRect(headerLayout.menuBounds, clientX, clientY)) {
            return { area: "menu", bounds: headerLayout.menuBounds };
        } else if (header.indicatorIcon !== undefined && headerLayout.indicatorIconBounds !== undefined && pointInRect(headerLayout.indicatorIconBounds, clientX, clientY)) {
            return { area: "indicator", bounds: headerLayout.indicatorIconBounds };
        }
    }
    return undefined;
};

// 指针事件状态
const downTime = ref(0);
const downPosition = ref<Item>();
const mouseDown = ref(false);
const lastWasTouchRef = ref(lastWasTouch.value);
watch(() => lastWasTouch.value, v => (lastWasTouchRef.value = v));

// pointerdown
const onPointerDown = (ev: PointerEvent) => {
    const canvas = canvasRef.value;
    const eventTarget = props.eventTargetRef?.value ?? null;
    if (canvas === null || (ev.target !== canvas && ev.target !== eventTarget)) return;
    mouseDown.value = true;

    const clientX = ev.clientX;
    const clientY = ev.clientY;
    if (ev.target === eventTarget && eventTarget !== null) {
        const bounds = (eventTarget as HTMLElement).getBoundingClientRect();
        if (clientX > bounds.right || clientY > bounds.bottom) return;
    }

    const args = getMouseArgsForPositionImpl(canvas, clientX, clientY, ev);
    downPosition.value = args.location;

    if (args.isTouch) downTime.value = Date.now();
    if (lastWasTouchRef.value !== args.isTouch) lastWasTouch.value = args.isTouch;

    if (args.kind === headerKind && isOverHeaderElement(canvas, args.location[0], clientX, clientY) !== undefined) {
        return;
    } else if (args.kind === groupHeaderKind) {
        const action = groupHeaderActionForEvent(args.group!, args.bounds!, args.localEventX!, args.localEventY!);
        if (action !== undefined) return;
    }

    emit("mouse-down", args);
    if (!args.isTouch && props.isDraggable !== true && props.isDraggable !== (args.kind as any) && ev.button < 3 && ev.button !== 1) {
        ev.preventDefault();
    }
};
useEventListener("pointerdown", onPointerDown, windowEventTarget, false);

// pointerup
const lastUpTime = ref(0);
const onPointerUp = (ev: PointerEvent) => {
    const lastUpTimeValue = lastUpTime.value;
    lastUpTime.value = Date.now();
    const canvas = canvasRef.value;
    mouseDown.value = false;
    if (canvas === null) return;
    const eventTarget = props.eventTargetRef?.value ?? null;
    const isOutside = ev.target !== canvas && ev.target !== eventTarget;
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const canCancel = ev.pointerType === "mouse" ? ev.button < 3 : true;

    let args = getMouseArgsForPositionImpl(canvas, clientX, clientY, ev);
    if (args.isTouch && downTime.value !== 0 && Date.now() - downTime.value > 500) {
        args = { ...args, isLongTouch: true } as any;
    }
    if (lastUpTimeValue !== 0 && Date.now() - lastUpTimeValue < (args.isTouch ? 1000 : 500)) {
        args = { ...args, isDoubleClick: true } as any;
    }
    if (lastWasTouchRef.value !== args.isTouch) lastWasTouch.value = args.isTouch;
    if (!isOutside && ev.cancelable && canCancel) ev.preventDefault();

    const [col] = args.location;
    const headerBounds = isOverHeaderElement(canvas, col, clientX, clientY);
    if (args.kind === headerKind && headerBounds !== undefined) {
        if (ev.button !== 0 || downPosition.value?.[0] !== col || downPosition.value?.[1] !== -1) {
            emit("mouse-up", args, true);
        }
        return;
    } else if (args.kind === groupHeaderKind) {
        const action = groupHeaderActionForEvent(args.group!, args.bounds!, args.localEventX!, args.localEventY!);
        if (action !== undefined) {
            if (ev.button === 0) action.onClick(args as any);
            return;
        }
    }
    emit("mouse-up", args, isOutside);
};
useEventListener("pointerup", onPointerUp, windowEventTarget, false);

// click
const onClickImplVue = (ev: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;
    const eventTarget = props.eventTargetRef?.value ?? null;
    const isOutside = ev.target !== canvas && ev.target !== eventTarget;

    let clientX: number;
    let clientY: number;
    let canCancel = true;
    if (ev instanceof MouseEvent) {
        clientX = ev.clientX;
        clientY = ev.clientY;
        canCancel = ev.button < 3;
    } else {
        clientX = (ev as TouchEvent).changedTouches[0].clientX;
        clientY = (ev as TouchEvent).changedTouches[0].clientY;
    }

    const args = getMouseArgsForPositionImpl(canvas, clientX, clientY, ev as any);
    if (lastWasTouchRef.value !== args.isTouch) lastWasTouch.value = args.isTouch;
    if (!isOutside && (ev as any).cancelable && canCancel) (ev as any).preventDefault();

    const [col] = args.location;
    if (args.kind === headerKind) {
        const headerBounds = isOverHeaderElement(canvas, col, clientX, clientY);
        if (headerBounds !== undefined && args.button === 0 && downPosition.value?.[0] === col && downPosition.value?.[1] === -1) {
            if (headerBounds.area === "menu") {
                emit("header-menu-click", col, headerBounds.bounds);
            } else if (headerBounds.area === "indicator") {
                emit("header-indicator-click", col, headerBounds.bounds);
            }
        }
    }
};
useEventListener("click", onClickImplVue, windowEventTarget, false);

// contextmenu
const onContextMenuImplVue = (ev: MouseEvent) => {
    const canvas = canvasRef.value;
    const eventTarget = props.eventTargetRef?.value ?? null;
    if (canvas === null || (ev.target !== canvas && ev.target !== eventTarget)) return;
    const args = getMouseArgsForPositionImpl(canvas, ev.clientX, ev.clientY, ev);
    emit("context-menu", args, () => {
        if (ev.cancelable) ev.preventDefault();
    });
};
useEventListener("contextmenu", onContextMenuImplVue, props.eventTargetRef?.value ?? null, false);

// 动画帧回调：Hover 动画
const onAnimationFrame: StepCallback = values => {
    damageRegion.value = new CellSet(values.map(x => x.item));
    hoverValues.value = values;
    lastDrawRef.value();
    damageRegion.value = undefined;
};
animationManager.value = new AnimationManager(onAnimationFrame);

// hover 更新逻辑（根据单元格渲染器是否需要 hover）
watch(
    () => hoveredItemInfo.value,
    val => {
        const am = animationManager.value!;
        const hoveredItem = val?.[0];
        if (hoveredItem === undefined || hoveredItem[1] < 0) {
            am.setHovered(hoveredItem as any);
            return;
        }
        const cell = props.getCellContent(hoveredItem as [number, number], true);
        const r = props.getCellRenderer(cell);
        const cellNeedsHover =
            (r === undefined && cell.kind === GridCellKind.Custom) ||
            (r?.needsHover !== undefined && (typeof r.needsHover === "boolean" ? r.needsHover : (r as any).needsHover(cell)));
        am.setHovered(cellNeedsHover ? (hoveredItem as any) : undefined);
    }
);

// 指针移动与悬停逻辑
const hoveredRef = ref<GridMouseEventArgs>();
const onPointerMove = (ev: MouseEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;
    const eventTarget = props.eventTargetRef?.value ?? null;
    const isIndirect = ev.target !== canvas && ev.target !== eventTarget;
    const args = getMouseArgsForPositionImpl(canvas, ev.clientX, ev.clientY, ev);
    if (args.kind !== "out-of-bounds" && isIndirect && !mouseDown.value && !args.isTouch) return;

    const maybeSetHoveredInfo = (newVal: typeof hoveredItemInfo.value, needPosition: boolean) => {
        const cv = hoveredItemInfo.value;
        if (cv === newVal) return;
        if (
            cv?.[0][0] === newVal?.[0][0] &&
            cv?.[0][1] === newVal?.[0][1] &&
            ((cv?.[1][0] === newVal?.[1][0] && cv?.[1][1] === newVal?.[1][1]) || !needPosition)
        ) {
            return;
        }
        hoveredItemInfo.value = newVal;
    };

    if (!mouseEventArgsAreEqual(args, hoveredRef.value)) {
        drawCursorOverride.value = undefined;
        emit("item-hovered", args);
        maybeSetHoveredInfo(args.kind === outOfBoundsKind ? undefined : [args.location, [args.localEventX!, args.localEventY!]], true);
        hoveredRef.value = args;
    } else if (args.kind === "cell" || args.kind === headerKind || args.kind === groupHeaderKind) {
        let needsDamageCell = false;
        let needsHoverPosition = true;
        if (args.kind === "cell") {
            const toCheck = props.getCellContent(args.location);
            const rendererNeeds = props.getCellRenderer(toCheck)?.needsHoverPosition;
            needsHoverPosition = rendererNeeds ?? toCheck.kind === GridCellKind.Custom;
            needsDamageCell = needsHoverPosition;
        } else {
            needsDamageCell = true;
        }
        const newInfo: typeof hoveredItemInfo.value = [args.location, [args.localEventX!, args.localEventY!]];
        maybeSetHoveredInfo(newInfo, needsHoverPosition);
        if (needsDamageCell) damageInternal(new CellSet([args.location]));
    }

    const notRowMarkerCol = args.location[0] >= (props.firstColAccessible ? 0 : 1);
    hoveredOnEdge.value = args.kind === headerKind && args.isEdge && notRowMarkerCol && props.allowResize === true;
    overFill.value = args.kind === "cell" && (args as any).isFillHandle;
    emit("mouse-move-raw", ev);
    emit("mouse-move", args);
};
useEventListener("pointermove", onPointerMove, windowEventTarget, true);

// Drag & Drop 相关
const activeDropTarget = ref<Item | undefined>();
const onDragStartImpl = (event: DragEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null || props.isDraggable === false || props.isResizing) {
        event.preventDefault();
        return;
    }
    let dragMime: string | undefined;
    let dragData: string | undefined;
    const args = getMouseArgsForPositionImpl(canvas, event.clientX, event.clientY);
    if (props.isDraggable !== true && args.kind !== props.isDraggable) {
        event.preventDefault();
        return;
    }
    const setData = (mime: string, payload: string) => { dragMime = mime; dragData = payload; };
    let dragImage: Element | undefined; let dragImageX: number | undefined; let dragImageY: number | undefined;
    const setDragImage = (image: Element, x: number, y: number) => { dragImage = image; dragImageX = x; dragImageY = y; };
    let prevented = false;
    emit("drag-start", { ...args, setData, setDragImage, preventDefault: () => (prevented = true), defaultPrevented: () => prevented } as any);
    if (!prevented && dragMime !== undefined && dragData !== undefined && event.dataTransfer !== null) {
        event.dataTransfer.setData(dragMime, dragData);
        event.dataTransfer.effectAllowed = "copyLink";
        if (dragImage !== undefined && dragImageX !== undefined && dragImageY !== undefined) {
            event.dataTransfer.setDragImage(dragImage, dragImageX, dragImageY);
        } else {
            const [col, row] = args.location;
            if (row !== undefined) {
                const offscreen = document.createElement("canvas");
                const boundsForDragTarget = getBoundsForItem(canvas, col, row)!;
                const dpr = Math.ceil(window.devicePixelRatio ?? 1);
                offscreen.width = boundsForDragTarget.width * dpr;
                offscreen.height = boundsForDragTarget.height * dpr;
                const ctx = offscreen.getContext("2d");
                if (ctx !== null) {
                    ctx.scale(dpr, dpr);
                    ctx.textBaseline = "middle";
                    if (row === -1) {
                        ctx.font = props.theme.headerFontFull;
                        ctx.fillStyle = props.theme.bgHeader;
                        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
                        drawHeader(
                            ctx,
                            0,
                            0,
                            boundsForDragTarget.width,
                            boundsForDragTarget.height,
                            mappedColumns.value[col],
                            false,
                            props.theme,
                            false,
                            undefined,
                            undefined,
                            false,
                            0,
                            spriteManager.value,
                            props.drawHeader,
                            false
                        );
                    } else {
                        ctx.font = props.theme.baseFontFull;
                        ctx.fillStyle = props.theme.bgCell;
                        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
                        drawCell(
                            ctx,
                            props.getCellContent([col, row]),
                            0,
                            row,
                            false,
                            false,
                            0,
                            0,
                            boundsForDragTarget.width,
                            boundsForDragTarget.height,
                            false,
                            props.theme,
                            props.theme.bgCell,
                            imageLoader,
                            spriteManager.value,
                            1,
                            undefined,
                            false,
                            0,
                            undefined,
                            undefined,
                            undefined,
                            renderStateProvider,
                            props.getCellRenderer,
                            () => undefined
                        );
                    }
                }
                offscreen.style.left = "-100%";
                offscreen.style.position = "absolute";
                offscreen.style.width = `${boundsForDragTarget.width}px`;
                offscreen.style.height = `${boundsForDragTarget.height}px`;
                document.body.append(offscreen);
                event.dataTransfer.setDragImage(offscreen, boundsForDragTarget.width / 2, boundsForDragTarget.height / 2);
                window.setTimeout(() => offscreen.remove(), 0);
            }
        }
    } else {
        event.preventDefault();
    }
};
useEventListener("dragstart", onDragStartImpl, props.eventTargetRef?.value ?? null, false, false);

const onDragOverImpl = (event: DragEvent) => {
    const canvas = canvasRef.value;
    if (props.onDrop !== undefined) event.preventDefault();
    if (canvas === null || props.onDragOverCell === undefined) return;
    const args = getMouseArgsForPositionImpl(canvas, event.clientX, event.clientY);
    const [rawCol, row] = args.location;
    const col = rawCol - (props.firstColAccessible ? 0 : 1);
    const [activeCol, activeRow] = activeDropTarget.value ?? [];
    if (activeCol !== col || activeRow !== row) {
        activeDropTarget.value = [col, row];
        props.onDragOverCell?.([col, row], event.dataTransfer);
    }
};
useEventListener("dragover", onDragOverImpl, props.eventTargetRef?.value ?? null, false, false);

const onDragEndImpl = () => {
    activeDropTarget.value = undefined;
    emit("drag-end");
};
useEventListener("dragend", onDragEndImpl, props.eventTargetRef?.value ?? null, false, false);

const onDropImpl = (event: DragEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null || props.onDrop === undefined) return;
    event.preventDefault();
    const args = getMouseArgsForPositionImpl(canvas, event.clientX, event.clientY);
    const [rawCol, row] = args.location;
    const col = rawCol - (props.firstColAccessible ? 0 : 1);
    props.onDrop([col, row], event.dataTransfer);
};
useEventListener("drop", onDropImpl, props.eventTargetRef?.value ?? null, false, false);

const onDragLeaveImpl = () => emit("drag-leave");
useEventListener("dragleave", onDragLeaveImpl, props.eventTargetRef?.value ?? null, false, false);

// 暴露组件方法（对齐 React 的 DataGridRef）
defineExpose<DataGridRef>({
    focus: () => {
        canvasRef.value?.focus({ preventScroll: true });
    },
    getBounds: (col?: number, row?: number) => {
        if (canvasRef.value === null) return undefined;
        return getBoundsForItem(canvasRef.value, col ?? 0, row ?? -1);
    },
    damage: (cells: DamageUpdateList) => {
        damageInternal(new CellSet(cells.map(x => x.cell)));
    },
    getMouseArgsForPosition: (posX: number, posY: number, ev?: MouseEvent | TouchEvent) => {
        if (canvasRef.value === null) return undefined;
        return getMouseArgsForPositionImpl(canvasRef.value, posX, posY, ev);
    },
});
</script>
