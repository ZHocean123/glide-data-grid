<template>
  <div>
    <canvas
      ref="canvasRef"
      data-testid="data-grid-canvas"
      tabindex="0"
      @keydown="onKeyDownImpl"
      @keyup="onKeyUpImpl"
      @focus="onCanvasFocused"
      @blur="onCanvasBlur"
      :style="style"
    >
      <component :is="accessibilityTree" />
    </canvas>
    <canvas ref="overlayRef" :style="overlayStyle" />
    <component :is="stickyShadow" />
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
    type MappedGridColumn,
} from "./render/data-grid-lib.js";
import {
    type Rectangle,
    type GridSelection,
    type InnerGridCell,
    type InnerGridColumn,
    CompactSelection,
    type Item,
    type DrawHeaderCallback,
    isReadWriteCell,
    isInnerOnlyCell,
    booleanCellIsEditable,
    type DrawCellCallback,
    type FillHandle,
    DEFAULT_FILL_HANDLE,
} from "./data-grid-types.js";
import { CellSet } from "./cell-set.js";
import { SpriteManager, type SpriteMap } from "./data-grid-sprites.js";
import { direction } from "../../common/utils.js";
import { clamp } from "../../common/utils.js";
import { drawGrid } from "./render/data-grid-render.js";
import { AnimationManager, type StepCallback } from "./animation-manager.js";
import { packColRowToNumber } from "../../common/render-state-provider.js";
import { browserIsFirefox, browserIsSafari } from "../../common/browser-detect.js";
import { useAnimationQueue, type EnqueueCallback } from "./use-animation-queue.js";
import { assert } from "../../common/support.js";
import type { CellRenderer, GetCellRendererCallback } from "../../cells/cell-types.js";
import type { DrawGridArg } from "./render/draw-grid-arg.js";
import type { ImageWindowLoader } from "./image-window-loader-interface.js";
import {
    type GridMouseEventArgs,
    type GridKeyEventArgs,
    type GridDragEventArgs,
    type BaseGridMouseEventArgs,
} from "./event-args.js";
import { pointInRect } from "../../common/math.js";
import {
    drawCells,
} from "./render/data-grid-render.cells.js";
import { drawHeader } from "./render/data-grid-render.header.js";
import type { Theme } from "../../common/styles.js";

// Helper functions
const makeRange = (start: number, end: number) => {
    const result: number[] = [];
    for (let i = start; i < end; i++) {
        result.push(i);
    }
    return result;
};

const getScrollBarWidth = () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '-9999px';
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.overflow = 'scroll';
    document.body.appendChild(el);
    const width = el.offsetWidth - el.clientWidth;
    document.body.removeChild(el);
    return width;
};

const useDebouncedMemo = <T>(fn: () => T, deps: any[], delay: number) => {
    const value = ref<T>(fn());
    let timeoutId: number | undefined;

    watch(deps, () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            value.value = fn();
        }, delay) as any;
    }, { deep: true });

    return value;
};

const useEventListener = (
    event: string,
    handler: (e: any) => void,
    target: EventTarget | null,
    options?: boolean | AddEventListenerOptions
) => {
    onMounted(() => {
        if (target) {
            target.addEventListener(event, handler, options);
        }
    });

    onUnmounted(() => {
        if (target) {
            target.removeEventListener(event, handler, options);
        }
    });
};

const getRowData = (cell: InnerGridCell, getCellRenderer?: GetCellRendererCallback) => {
    if (cell.kind === "custom") return cell.copyData;
    const r = getCellRenderer?.(cell);
    return (r && "getAccessibilityString" in r) ? r.getAccessibilityString(cell) : "";
};

type DamageUpdateList = readonly {
    cell: Item;
}[];

// Define RenderStateProvider class
class RenderStateProvider {
    getCellRenderer: (cell: InnerGridCell) => { kind: string; prep: (ctx: CanvasRenderingContext2D, theme: Theme) => void; draw: (ctx: CanvasRenderingContext2D, theme: Theme) => void; } | undefined;
    getValue: (item: Item) => any;
    setValue: (item: Item, value: any) => void;
    
    constructor() {
        this.getCellRenderer = () => undefined;
        this.getValue = () => undefined;
        this.setValue = () => {};
    }
}

// Define useMappedColumns function
const useMappedColumns = (columns: readonly InnerGridColumn[], freezeColumns: number): readonly MappedGridColumn[] => {
    return columns.map((col, index) => ({
        ...col,
        sourceIndex: index,
        sticky: index < freezeColumns,
        id: col.id || `col-${index}`,
        title: col.title,
        width: col.width,
        group: col.group || "",
        icon: col.icon || "",
        overlayIcon: col.overlayIcon || "",
        menuIcon: col.menuIcon || "",
        indicatorIcon: col.indicatorIcon || "",
        hasMenu: col.hasMenu || false,
        grow: col.grow || 0,
        growOffset: col.growOffset || 0,
        align: (col as any).align || "left",
        contentAlign: (col as any).contentAlign || "left",
        trailingRowOptions: col.trailingRowOptions || {
            hint: undefined,
            addIcon: undefined,
            targetColumn: undefined,
            themeOverride: undefined,
            disabled: undefined,
        },
        headerRowMarkerDisabled: col.headerRowMarkerDisabled || false,
        headerRowMarkerAlwaysVisible: col.headerRowMarkerAlwaysVisible || false,
        style: col.style || "normal",
        themeOverride: col.themeOverride || {} as Partial<Theme>,
        rowMarker: col.rowMarker || "circle",
        rowMarkerChecked: col.rowMarkerChecked || false,
        headerRowMarkerTheme: col.headerRowMarkerTheme || {} as Partial<Theme>,
    }));
};

interface DataGridProps {
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

    readonly getCellContent: (cell: Item, forceStrict?: boolean) => InnerGridCell;
    /**
     * Provides additional details about groups to extend group functionality.
     * @group Data
     */
    readonly getGroupDetails: ((name: string) => { name: string; actions?: any[] }) | undefined;
    /**
     * Provides per row theme overrides.
     * @group Style
     */
    readonly getRowThemeOverride: ((index: number) => Partial<FullTheme> | undefined) | undefined;
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
    readonly highlightRegions: readonly { color: string; range: Rectangle }[] | undefined;

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
    // Define any emits here if needed
}>();

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);
const windowEventTargetRef = ref<HTMLElement | Window | Document>(window);
const damageRegion = ref<CellSet | undefined>();
const scrolling = ref<boolean>(false);
const hoverValues = ref<readonly { item: Item; hoverAmount: number }[]>([]);
const lastBlitData = ref<{ x: number; y: number; width: number; height: number } | undefined>();
const hoveredItemInfo = ref<[Item, readonly [number, number]] | undefined>();
const hoveredOnEdge = ref<boolean>();
const overlayStyleRef = ref<string | undefined>();
const lastWasTouch = ref(false);
const lastWasTouchRef = ref(lastWasTouch.value);
const downTime = ref(0);
const downPosition = ref<Item>();
const mouseDown = ref(false);
const hoveredRef = ref<GridMouseEventArgs>();
const lastUpTime = ref(0);
const selectionRef = ref(props.selection);
const focusRef = ref<HTMLElement | null>(null);
const lastFocusedSubdomNode = ref<Item>();
const activeDropTarget = ref<Item | undefined>();

// Computed
const translateX = computed(() => props.translateX ?? 0);
const translateY = computed(() => props.translateY ?? 0);
const cellXOffset = computed(() => Math.max(props.freezeColumns, Math.min(props.columns.length - 1, props.cellXOffset)));
const windowEventTarget = computed(() => windowEventTargetRef.value);
const imageLoader = computed(() => props.imageWindowLoader);
const spriteManager = computed(() => 
    new SpriteManager(props.headerIcons, () => {
        lastArgsRef.value = undefined;
        lastDrawRef.value();
    })
);
const totalHeaderHeight = computed(() => props.enableGroups ? props.groupHeaderHeight + props.headerHeight : props.headerHeight);
const bufferACtxBCtx = computed(() => {
    const a = document.createElement("canvas");
    const b = document.createElement("canvas");
    a.style["display"] = "none";
    a.style["opacity"] = "0";
    a.style["position"] = "fixed";
    b.style["display"] = "none";
    b.style["opacity"] = "0";
    b.style["position"] = "fixed";
    return [a.getContext("2d", { alpha: false }), b.getContext("2d", { alpha: false })] as [CanvasRenderingContext2D | null, CanvasRenderingContext2D | null];
});
const renderStateProvider = computed(() => new RenderStateProvider());
const enableFirefoxRescaling = computed(() => 
    (props.experimental?.enableFirefoxRescaling ?? false) && browserIsFirefox.value
);
const enableSafariRescaling = computed(() => 
    (props.experimental?.enableSafariRescaling ?? false) && browserIsSafari.value
);
const maxDPR = computed(() => 
    enableFirefoxRescaling.value && scrolling.value ? 1 : enableSafariRescaling.value && scrolling.value ? 2 : 5
);
const minimumCellWidth = computed(() => props.experimental?.disableMinimumCellWidth === true ? 1 : 10);
const lastArgsRef = ref<DrawGridArg>();
const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
const overlayCtx = ref<CanvasRenderingContext2D | null>(null);
const lastDrawRef = ref(() => {});
const mappedColumns = computed(() => useMappedColumns(props.columns, props.freezeColumns));
const stickyX = computed(() => 
    (props.fixedShadowX ? getStickyWidth(mappedColumns.value, props.dragAndDropState) : 0)
);
const hoveredItem = computed(() => hoveredItemInfo.value?.[0]);
const headerHovered = computed(() => {
    const hCol = hoveredItem.value?.[0];
    const hRow = hoveredItem.value?.[1];
    return hCol !== undefined &&
    hRow === -1 &&
    hCol >= 0 &&
    hCol < mappedColumns.value.length &&
    mappedColumns.value[hCol].headerRowMarkerDisabled !== true;
});
const groupHeaderHovered = computed(() => {
    const hCol = hoveredItem.value?.[0];
    const hRow = hoveredItem.value?.[1];
    return hCol !== undefined && hRow === -2;
});
const clickableInnerCellHovered = computed(() => {
    const hCol = hoveredItem.value?.[0];
    const hRow = hoveredItem.value?.[1];
    if (hCol === undefined || hRow === undefined || hRow <= -1 || hRow >= props.rows) return false;
    const cell = props.getCellContent([hCol, hRow], true);
    return cell.kind === "new-row" ||
        (cell.kind === "marker" && cell.markerKind !== "number");
});
const editableBoolHovered = computed(() => {
    const hCol = hoveredItem.value?.[0];
    const hRow = hoveredItem.value?.[1];
    if (hCol === undefined || hRow === undefined || hRow <= -1 || hRow >= props.rows) return false;
    const cell = props.getCellContent([hCol, hRow], true);
    return cell.kind === "boolean" && booleanCellIsEditable(cell);
});
const cursorOverride = computed(() => {
    const hCol = hoveredItem.value?.[0];
    const hRow = hoveredItem.value?.[1];
    if (hCol === undefined || hRow === undefined || hRow <= -1 || hRow >= props.rows) return undefined;
    const cell = props.getCellContent([hCol, hRow], true);
    return cell.cursor;
});
const canDrag = computed(() => hoveredOnEdge.value ?? false);
const overFill = ref(false);
const cursor = computed(() => 
    props.isDragging
        ? "grabbing"
        : canDrag.value || props.isResizing
          ? "col-resize"
          : overFill.value || props.isFilling
            ? "crosshair"
            : cursorOverride.value !== undefined
              ? cursorOverride.value
              : headerHovered.value || clickableInnerCellHovered.value || editableBoolHovered.value || groupHeaderHovered.value
                ? "pointer"
                : "default"
);
const style = computed(() => ({
    // width,
    // height,
    contain: "strict",
    display: "block",
    cursor: cursor.value,
}));
const overlayStyle = computed(() => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
}));
const opacityX = computed(() => 
    props.freezeColumns === 0 || !props.fixedShadowX ? 0 : cellXOffset.value > props.freezeColumns ? 1 : clamp(-translateX.value / 100, 0, 1)
);
const absoluteOffsetY = computed(() => -props.cellYOffset * 32 + translateY.value);
const opacityY = computed(() => 
    !props.fixedShadowY ? 0 : clamp(-absoluteOffsetY.value / 100, 0, 1)
);
const stickyShadow = computed(() => {
    if (!opacityX.value && !opacityY.value) {
        return null;
    }

    const styleX = {
        position: "absolute" as const,
        top: 0,
        left: stickyX.value,
        width: props.width - stickyX.value,
        height: props.height,
        opacity: opacityX.value,
        pointerEvents: "none" as const,
        transition: !props.smoothScrollX ? "opacity 0.2s" : undefined,
        boxShadow: "inset 13px 0 10px -13px rgba(0, 0, 0, 0.2)",
    };

    const styleY = {
        position: "absolute" as const,
        top: totalHeaderHeight.value,
        left: 0,
        width: props.width,
        height: props.height,
        opacity: opacityY.value,
        pointerEvents: "none" as const,
        transition: !props.smoothScrollY ? "opacity 0.2s" : undefined,
        boxShadow: "inset 0 13px 10px -13px rgba(0, 0, 0, 0.2)",
    };

    return {
        components: [
            opacityX.value > 0 ? { component: "div", id: "shadow-x", style: styleX } : null,
            opacityY.value > 0 ? { component: "div", id: "shadow-y", style: styleY } : null,
        ].filter(Boolean),
    };
});

// Methods
const getBoundsForItem = (canvas: HTMLCanvasElement, col: number, row: number): Rectangle | undefined => {
    const rect = canvas.getBoundingClientRect();

    if (col >= mappedColumns.value.length || row >= props.rows) {
        return undefined;
    }

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

const getMouseArgsForPosition = (
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

    const effectiveCols = getEffectiveColumns(mappedColumns.value, cellXOffset.value, props.width, undefined, translateX.value);

    let button = 0;
    let buttons = 0;

    const isMouse =
        (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "mouse") ||
        (typeof MouseEvent !== "undefined" && ev instanceof MouseEvent);

    const isTouch =
        (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "touch") ||
        (typeof TouchEvent !== "undefined" && ev instanceof TouchEvent);

    if (isMouse) {
        button = ev.button;
        buttons = ev.buttons;
    }

    // -1 === off right edge
    const col = getColumnIndexForX(x, effectiveCols, translateX.value);

    // -1: header or above
    // undefined: offbottom
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

    const shiftKey = ev?.shiftKey === true;
    const ctrlKey = ev?.ctrlKey === true;
    const metaKey = ev?.metaKey === true;

    let result: GridMouseEventArgs;
    
    if (col === -1 || y < 0 || x < 0 || row === undefined || x > props.width || y > props.height) {
        const horizontal = x > props.width ? 1 : x < 0 ? -1 : 0;
        const vertical = y > props.height ? 1 : y < 0 ? -1 : 0;

        let isEdge = false;
        if (col === -1 && row === -1) {
            const b = getBoundsForItem(canvas, mappedColumns.value.length - 1, -1);
            assert(b !== undefined);
            isEdge = posX < b.x + b.width + edgeDetectionBuffer;
        }

        // This is used to ensure that clicking on the scrollbar doesn't unset the selection.
        // Unfortunately this doesn't work for overlay scrollbars because they are just a broken interaction
        // by design.
        const isMaybeScrollbar =
            (x > props.width && x < props.width + getScrollBarWidth()) || (y > props.height && y < props.height + getScrollBarWidth());

        result = {
            kind: "mouse",
            location: [col !== -1 ? col : x < 0 ? 0 : mappedColumns.value.length - 1, row ?? props.rows - 1],
            button,
            shiftKey,
            ctrlKey,
            metaKey,
            altKey: false,
            localEventX: posX,
            localEventY: posY,
            screenX: posX,
            screenY: posY,
            preventDefault: () => {},
            cell: undefined,
            column: undefined,
            columnIndex: col,
            bounds: { x: 0, y: 0, width: 0, height: 0 },
        };
    } else if (row <= -1) {
        let bounds = getBoundsForItem(canvas, col, row);
        assert(bounds !== undefined);
        let isEdge = bounds !== undefined && bounds.x + bounds.width - posX <= edgeDetectionBuffer;

        const previousCol = col - 1;
        if (posX - bounds.x <= edgeDetectionBuffer && previousCol >= 0) {
            isEdge = true;
            bounds = getBoundsForItem(canvas, previousCol, row);
            assert(bounds !== undefined);
            result = {
                kind: "mouse",
                location: [previousCol, row] as any,
                button,
                shiftKey,
                ctrlKey,
                metaKey,
                altKey: false,
                localEventX: posX - bounds.x,
                localEventY: posY - bounds.y,
                screenX: posX,
                screenY: posY,
                preventDefault: () => {},
                cell: undefined,
                column: mappedColumns.value[previousCol],
                columnIndex: previousCol,
                bounds: bounds,
                group: mappedColumns.value[previousCol].group ?? "",
                isEdge,
            } as any;
        } else {
            result = {
                kind: "mouse",
                location: [col, row] as any,
                button,
                shiftKey,
                ctrlKey,
                metaKey,
                altKey: false,
                localEventX: posX - bounds.x,
                localEventY: posY - bounds.y,
                screenX: posX,
                screenY: posY,
                preventDefault: () => {},
                cell: undefined,
                column: mappedColumns.value[col],
                columnIndex: col,
                bounds: bounds,
                group: mappedColumns.value[col].group ?? "",
                isEdge,
            } as any;
        }
    } else {
        const bounds = getBoundsForItem(canvas, col, row);
        assert(bounds !== undefined);
        const isEdge = bounds !== undefined && bounds.x + bounds.width - posX < edgeDetectionBuffer;

        let isFillHandle = false;
        const drawFill = props.fillHandle !== false && props.fillHandle !== undefined;
        if (drawFill && props.selection.current !== undefined) {
            const fill =
                typeof props.fillHandle === "object"
                    ? { ...DEFAULT_FILL_HANDLE, ...props.fillHandle }
                    : DEFAULT_FILL_HANDLE;

            const fillHandleClickSize = fill.size;
            const half = fillHandleClickSize / 2;

            const fillHandleLocation = rectBottomRight(props.selection.current.range);
            const fillBounds = getBoundsForItem(canvas, fillHandleLocation[0], fillHandleLocation[1]);

            if (fillBounds !== undefined) {
                // Handle center sits exactly on the bottom-right corner of the cell.
                // Offset by half pixel to align with grid lines.
                const centerX = fillBounds.x + fillBounds.width + fill.offsetX - half + 0.5;
                const centerY = fillBounds.y + fillBounds.height + fill.offsetY - half + 0.5;

                // Check if posX and posY are within fillHandleClickSize from handleLogicalCenter
                isFillHandle =
                    Math.abs(centerX - posX) < fillHandleClickSize &&
                    Math.abs(centerY - posY) < fillHandleClickSize;
            }
        }

        result = {
            kind: "mouse",
            location: [col, row],
            button,
            shiftKey,
            ctrlKey,
            metaKey,
            altKey: false,
            localEventX: posX - bounds.x,
            localEventY: posY - bounds.y,
            screenX: posX,
            screenY: posY,
            preventDefault: () => {},
            cell: props.getCellContent([col, row]),
            column: mappedColumns.value[col],
            columnIndex: col,
            bounds: bounds,
            isEdge,
            isFillHandle,
        } as any;
    }
    return result;
};

const groupHeaderActionForEvent = (group: string, bounds: Rectangle, localEventX: number, localEventY: number) => {
    if (props.getGroupDetails === undefined) return undefined;
    const groupDesc = props.getGroupDetails(group);
    if (groupDesc.actions !== undefined) {
        // Simplified implementation
        for (const action of groupDesc.actions) {
            // In a real implementation, we would check if the action is within the bounds
            return action;
        }
    }
    return undefined;
};

const isOverHeaderElement = (
    canvas: HTMLCanvasElement,
    col: number,
    clientX: number,
    clientY: number
):
    | {
          area: "menu" | "indicator";
          bounds: Rectangle;
      }
    | undefined => {
    const header = mappedColumns.value[col];

    if (!props.isDragging && !props.isResizing && !(hoveredOnEdge.value ?? false)) {
        const headerBounds = getBoundsForItem(canvas, col, -1);
        assert(headerBounds !== undefined);
        // Simplified implementation
        if (header.hasMenu === true) {
            const menuBounds = { ...headerBounds, width: 20, height: 20 };
            if (pointInRect(clientX, clientY, menuBounds)) {
                return {
                    area: "menu",
                    bounds: menuBounds,
                };
            }
        } else if (header.indicatorIcon !== undefined) {
            const indicatorBounds = { ...headerBounds, width: 20, height: 20 };
            if (pointInRect(clientX, clientY, indicatorBounds)) {
                return {
                    area: "indicator",
                    bounds: indicatorBounds,
                };
            }
        }
    }
    return undefined;
};

const onAnimationFrame: StepCallback = (values) => {
    damageRegion.value = new CellSet(values.map(x => x.item));
    hoverValues.value = values;
    lastDrawRef.value();
    damageRegion.value = undefined;
};

const animManagerValue = computed(() => new AnimationManager(onAnimationFrame));
const animationManager = ref(animManagerValue.value);

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

    const [bufferACtx, bufferBCtx] = bufferACtxBCtx.value;

    if (canvasCtx.value === null || overlayCtx.value === null || bufferACtx === null || bufferBCtx === null) {
        return;
    }

    let didOverride = false;
    const overrideCursor = (cursor: string) => {
        didOverride = true;
        overlayStyleRef.value = cursor;
    };

    const last = lastArgsRef.value;
    
    // Create prelightCells Map
    const prelightCellsMap = new Map<Item, number>();
    if (props.prelightCells) {
        for (const cell of props.prelightCells) {
            prelightCellsMap.set(cell, 1);
        }
    }
    
    // Create hoverValues Map
    const hoverValuesMap = new Map<Item, string>();
    for (const hv of hoverValues.value) {
        hoverValuesMap.set(hv.item, "hovered");
    }
    
    // Create lastBlitData with required structure
    const lastBlitDataWithRef = {
        current: lastBlitData.value ? {
            lastBuffer: undefined,
            aBufferScroll: [false, false] as [boolean, boolean],
            bBufferScroll: [false, false] as [boolean, boolean],
            cellXOffset: props.cellXOffset,
            cellYOffset: props.cellYOffset,
            translateX: translateX.value,
            translateY: translateY.value,
            mustDrawFocusOnHeader: false,
            mustDrawHighlightRingsOnHeader: false,
        } : undefined,
    };
    
    // Create disabledRows Set
    const disabledRowsSet = new Set<number>();
    if (props.disabledRows) {
        for (const row of props.disabledRows) {
            disabledRowsSet.add(row);
        }
    }

    // Create drawRegions array
    const drawRegions: Rectangle[] = [];
    if (props.highlightRegions) {
        for (const region of props.highlightRegions) {
            drawRegions.push(region.range);
        }
    }

    // Create hoverValues array
    const hoverValuesArray = Array.from(hoverValuesMap.entries()).map(([item, value]) => ({
        item,
        hoverAmount: 1,
    }));

    const current: DrawGridArg = {
        canvasCtx: canvasCtx.value,
        headerCanvasCtx: overlayCtx.value,
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
        drawFocus: props.drawFocusRing,
        headerHeight: props.headerHeight,
        groupHeaderHeight: props.groupHeaderHeight,
        disabledRows: props.disabledRows || CompactSelection.empty(),
        rowHeight: props.rowHeight,
        verticalBorder: props.verticalBorder,
        overrideCursor: didOverride ? overrideCursor : () => {},
        isResizing: props.isResizing,
        selection: props.selection,
        fillHandle: props.fillHandle,
        freezeTrailingRows: props.freezeTrailingRows,
        rows: props.rows,
        getCellContent: props.getCellContent,
        getGroupDetails: props.getGroupDetails ?? (name => ({ name })),
        getRowThemeOverride: props.getRowThemeOverride ?? (() => undefined),
        isFocused: props.isFocused,
        drawHeaderCallback: props.drawHeader,
        prelightCells: Array.from(prelightCellsMap.keys()),
        drawCellCallback: props.drawCell,
        highlightRegions: props.highlightRegions,
        resizeCol: props.resizeColumn ?? 0,
        imageLoader: props.imageWindowLoader,
        lastBlitData: lastBlitDataWithRef,
        hoverValues: hoverValuesArray,
        hyperWrapping: props.experimental?.hyperWrapping ?? false,
        hoverInfo: hoveredItemInfo.value,
        spriteManager: spriteManager.value,
        maxScaleFactor: maxDPR.value,
        hasAppendRow: props.hasAppendRow,
        touchMode: lastWasTouch.value,
        enqueue: enqueueRef.value,
        renderStateProvider: new class {
            getValue(item: Item) {
                return renderStateProvider.value.getValue(item);
            }
            
            setValue(item: Item, value: any) {
                return renderStateProvider.value.setValue(item, value);
            }
            
            getCellRenderer(cell: InnerGridCell) {
                return renderStateProvider.value.getCellRenderer(cell);
            }
        }(),
        getCellRenderer: props.getCellRenderer,
        renderStrategy: props.experimental?.renderStrategy ?? "single-buffer",
        bufferACtx: bufferACtx,
        bufferBCtx: bufferBCtx,
        damage: damageRegion.value,
        minimumCellWidth: minimumCellWidth.value,
        resizeIndicator: props.resizeIndicator ?? "full",
    };

    // This confusing bit of code due to some poor design. Long story short, the damage property is only used
    // with what is effectively the "last args" for the last normal draw anyway. We don't want the drawing code
    // to look at this and go "shit dawg, nothing changed" so we force it to draw frash, but the damage restricts
    // the draw anyway.
    if (current.damage === undefined) {
        lastArgsRef.value = current;
        drawGrid(current, last);
    } else {
        drawGrid(current, last);
    }

    // don't reset on damage events
    if (!didOverride && (current.damage === undefined || (current.damage as any).has(hoveredItemInfo.value?.[0]))) {
        overlayStyleRef.value = undefined;
    }
};

const damageInternal = (locations: CellSet) => {
    damageRegion.value = locations;
    lastDrawRef.value();
    damageRegion.value = undefined;
};

const enqueue = useAnimationQueue(damageInternal);
const enqueueRef = ref(enqueue);

const damage = (cells: DamageUpdateList) => {
    damageInternal(new CellSet(cells.map(x => x.cell)));
};

const focusElement = (el: HTMLElement | null) => {
    // We don't want to steal the focus if we don't currently own the focus.
    if (canvasRef.value === null || !canvasRef.value.contains(document.activeElement)) return;
    if (el === null && selectionRef.value.current !== undefined) {
        canvasRef.value?.focus({
            preventScroll: true,
        });
    } else if (el !== null) {
        el.focus({
            preventScroll: true,
        });
    }
    focusRef.value = el;
};

const accessibilityTree = useDebouncedMemo(
    () => {
        if (props.width < 50 || props.experimental?.disableAccessibilityTree === true) return null;
        let effectiveCols = getEffectiveColumns(mappedColumns.value, cellXOffset.value, props.width, props.dragAndDropState, translateX.value);
        const colOffset = props.firstColAccessible ? 0 : -1;
        if (!props.firstColAccessible && effectiveCols[0]?.sourceIndex === 0) {
            effectiveCols = effectiveCols.slice(1);
        }

        const [fCol, fRow] = props.selection.current?.cell ?? [];
        const range = props.selection.current?.range;

        const visibleCols = effectiveCols.map(c => c.sourceIndex);
        const visibleRows = makeRange(props.cellYOffset, Math.min(props.rows, props.cellYOffset + props.accessibilityHeight));

        // Maintain focus within grid if we own it but focused cell is outside visible viewport
        // and not rendered.
        if (
            fCol !== undefined &&
            fRow !== undefined &&
            !(visibleCols.includes(fCol) && visibleRows.includes(fRow))
        ) {
            focusElement(null);
        }

        return {
            components: [
                {
                    component: "table",
                    props: {
                        key: "access-tree",
                        role: "grid",
                        "aria-rowcount": props.rows + 1,
                        "aria-multiselectable": "true",
                        "aria-colcount": mappedColumns.value.length + colOffset,
                    },
                    children: [
                        {
                            component: "thead",
                            props: { role: "rowgroup" },
                            children: [
                                {
                                    component: "tr",
                                    props: { role: "row", "aria-rowindex": 1 },
                                    children: effectiveCols.map(c => ({
                                        component: "th",
                                        props: {
                                            role: "columnheader",
                                            "aria-selected": props.selection.columns.hasIndex(c.sourceIndex),
                                            "aria-colindex": c.sourceIndex + 1 + colOffset,
                                            tabIndex: -1,
                                            key: c.sourceIndex,
                                            onFocus: (e: FocusEvent) => {
                                                if (e.target === focusRef.value) return;
                                                return props.onCellFocused?.([c.sourceIndex, -1]);
                                            },
                                        },
                                        children: [c.title],
                                    })),
                                },
                            ],
                        },
                        {
                            component: "tbody",
                            props: { role: "rowgroup" },
                            children: visibleRows.map(row => ({
                                component: "tr",
                                props: {
                                    role: "row",
                                    "aria-selected": props.selection.rows.hasIndex(row),
                                    key: row,
                                    "aria-rowindex": row + 2,
                                },
                                children: effectiveCols.map(c => {
                                    const col = c.sourceIndex;
                                    const key = packColRowToNumber(col, row);
                                    const focused = fCol === col && fRow === row;
                                    const selected =
                                        range !== undefined &&
                                        col >= range.x &&
                                        col < range.x + range.width &&
                                        row >= range.y &&
                                        row < range.y + range.height;
                                    const id = `glide-cell-${col}-${row}`;
                                    const location: Item = [col, row];
                                    const cellContent = props.getCellContent(location, true);
                                    return {
                                        component: "td",
                                        props: {
                                            key,
                                            role: "gridcell",
                                            "aria-colindex": col + 1 + colOffset,
                                            "aria-selected": selected,
                                            "aria-readonly":
                                                isInnerOnlyCell(cellContent) || !isReadWriteCell(cellContent),
                                            id,
                                            "data-testid": id,
                                            onClick: () => {
                                                const canvas = canvasRef.value;
                                                if (canvas === null || canvas === undefined) return;
                                                return props.onKeyDown?.({
                                                    kind: "keyboard",
                                                    preventDefault: () => undefined,
                                                    ctrlKey: false,
                                                    key: "Enter",
                                                    keyCode: 13,
                                                    metaKey: false,
                                                    shiftKey: false,
                                                    altKey: false,
                                                });
                                            },
                                            onFocusCapture: (e: FocusEvent) => {
                                                if (
                                                    e.target === focusRef.value ||
                                                    (lastFocusedSubdomNode.value?.[0] === col &&
                                                        lastFocusedSubdomNode.value?.[1] === row)
                                                )
                                                    return;
                                                lastFocusedSubdomNode.value = location;
                                                return props.onCellFocused?.(location);
                                            },
                                            ref: focused ? focusElement : undefined,
                                            tabIndex: -1,
                                        },
                                        children: [getRowData(cellContent, props.getCellRenderer)],
                                    };
                                }),
                            })),
                        },
                    ],
                },
            ],
        };
    },
    [
        props.width,
        mappedColumns,
        cellXOffset,
        props.dragAndDropState,
        translateX,
        props.rows,
        props.cellYOffset,
        props.accessibilityHeight,
        props.selection,
        focusElement,
        props.getCellContent,
        canvasRef,
        props.onKeyDown,
        getBoundsForItem,
        props.onCellFocused,
    ],
    200
);

// Event handlers
const onPointerDown = (ev: PointerEvent) => {
    const canvas = canvasRef.value;
    const eventTarget = windowEventTargetRef.value;
    if (canvas === null || (ev.target !== canvas && ev.target !== eventTarget)) return;
    mouseDown.value = true;

    const clientX = ev.clientX;
    const clientY = ev.clientY;

    if (ev.target === eventTarget && eventTarget !== null && 'getBoundingClientRect' in eventTarget) {
        const bounds = (eventTarget as HTMLElement).getBoundingClientRect();
        if (clientX > bounds.right || clientY > bounds.bottom) return;
    }

    const args = getMouseArgsForPosition(canvas, clientX, clientY, ev);
    downPosition.value = args.location;

    const isTouch = (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "touch") ||
        (typeof TouchEvent !== "undefined" && ev instanceof TouchEvent);

    if (isTouch) {
        downTime.value = Date.now();
    }
    if (lastWasTouchRef.value !== isTouch) {
        lastWasTouch.value = isTouch;
    }

    if (
        args.kind === "mouse" && args.column !== undefined &&
        isOverHeaderElement(canvas, args.columnIndex, clientX, clientY) !== undefined
    ) {
        return;
    } else if (args.kind === "mouse" && (args as any).group !== undefined) {
        const action = groupHeaderActionForEvent((args as any).group, args.bounds, args.localEventX, args.localEventY);
        if (action !== undefined) {
            return;
        }
    }

    props.onMouseDown?.(args);
    if (
        !isTouch &&
        props.isDraggable !== true &&
        (props.isDraggable !== "cell" && props.isDraggable !== "header") &&
        args.button < 3 &&
        args.button !== 1
    ) {
        // preventing default in touch events stops scroll
        ev.preventDefault();
    }
};

const onPointerUp = (ev: PointerEvent) => {
    const lastUpTimeValue = lastUpTime.value;
    lastUpTime.value = Date.now();
    const canvas = canvasRef.value;
    mouseDown.value = false;
    if (props.onMouseUp === undefined || canvas === null) return;
    const eventTarget = windowEventTargetRef.value;

    const isOutside = ev.target !== canvas && ev.target !== eventTarget;
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const canCancel = ev.pointerType === "mouse" ? ev.button < 3 : true;

    let args = getMouseArgsForPosition(canvas, clientX, clientY, ev);

    const isTouch = (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "touch") ||
        (typeof TouchEvent !== "undefined" && ev instanceof TouchEvent);

    if (isTouch && downTime.value !== 0 && Date.now() - downTime.value > 500) {
        args = {
            ...args,
            isLongTouch: true,
        } as any;
    }

    if (lastUpTimeValue !== 0 && Date.now() - lastUpTimeValue < (isTouch ? 1000 : 500)) {
        args = {
            ...args,
            isDoubleClick: true,
        } as any;
    }

    if (lastWasTouchRef.value !== isTouch) {
        lastWasTouch.value = isTouch;
    }

    if (!isOutside && ev.cancelable && canCancel) {
        ev.preventDefault();
    }

    const [col] = args.location;
    const headerBounds = isOverHeaderElement(canvas, col, clientX, clientY);
    if (args.kind === "mouse" && args.column !== undefined && headerBounds !== undefined) {
        if (args.button !== 0 || downPosition.value?.[0] !== col || downPosition.value?.[1] !== -1) {
            // force outside so that click will not process
            props.onMouseUp(args, true);
        }
        return;
    } else if (args.kind === "mouse" && (args as any).group !== undefined) {
        const action = groupHeaderActionForEvent((args as any).group, args.bounds, args.localEventX, args.localEventY);
        if (action !== undefined) {
            if (args.button === 0) {
                action.onClick(args);
            }
            return;
        }
    }

    props.onMouseUp(args, isOutside);
};

const onClickImpl = (ev: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;
    const eventTarget = windowEventTargetRef.value;

    const isOutside = ev.target !== canvas && ev.target !== eventTarget;

    let clientX: number;
    let clientY: number;
    let canCancel = true;
    if (ev instanceof MouseEvent) {
        clientX = ev.clientX;
        clientY = ev.clientY;
        canCancel = ev.button < 3;
    } else {
        clientX = ev.changedTouches[0].clientX;
        clientY = ev.changedTouches[0].clientY;
    }

    const args = getMouseArgsForPosition(canvas, clientX, clientY, ev);

    const isTouch = (typeof PointerEvent !== "undefined" && ev instanceof PointerEvent && ev.pointerType === "touch") ||
        (typeof TouchEvent !== "undefined" && ev instanceof TouchEvent);

    if (lastWasTouchRef.value !== isTouch) {
        lastWasTouch.value = isTouch;
    }

    if (!isOutside && ev.cancelable && canCancel) {
        ev.preventDefault();
    }

    const [col] = args.location;
    if (args.kind === "mouse" && args.column !== undefined) {
        const headerBounds = isOverHeaderElement(canvas, col, clientX, clientY);
        if (
            headerBounds !== undefined &&
            args.button === 0 &&
            downPosition.value?.[0] === col &&
            downPosition.value?.[1] === -1
        ) {
            if (headerBounds.area === "menu") {
                props.onHeaderMenuClick?.(col, headerBounds.bounds);
            } else if (headerBounds.area === "indicator") {
                props.onHeaderIndicatorClick?.(col, headerBounds.bounds);
            }
        }
    }
};

const onContextMenuImpl = (ev: MouseEvent) => {
    const canvas = canvasRef.value;
    const eventTarget = windowEventTargetRef.value;
    if (canvas === null || (ev.target !== canvas && ev.target !== eventTarget) || props.onContextMenu === undefined)
        return;
    const args = getMouseArgsForPosition(canvas, ev.clientX, ev.clientY, ev);
    props.onContextMenu(args, () => {
        if (ev.cancelable) ev.preventDefault();
    });
};

const onPointerMove = (ev: MouseEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;

    const eventTarget = windowEventTargetRef.value;
    const isIndirect = ev.target !== canvas && ev.target !== eventTarget;

    const args = getMouseArgsForPosition(canvas, ev.clientX, ev.clientY, ev);
    if (args.kind !== "mouse" && isIndirect && !mouseDown.value && !(args as any).isTouch) {
        // we are obscured by something else, so we want to not register events if we are not doing anything
        // important already
        return;
    }

    // the point here is not to trigger re-renders every time the mouse moves over a cell
    // that doesn't care about the mouse positon.
    const maybeSetHoveredInfo = (newVal: typeof hoveredItemInfo.value, needPosition: boolean) => {
        hoveredItemInfo.value = (cv => {
            if (cv === newVal) return cv;
            if (
                cv?.[0][0] === newVal?.[0][0] &&
                cv?.[0][1] === newVal?.[0][1] &&
                ((cv?.[1][0] === newVal?.[1][0] && cv?.[1][1] === newVal?.[1][1]) || !needPosition)
            ) {
                return cv;
            }
            return newVal;
        })();
    };

    if (hoveredRef.value === undefined || !mouseEventArgsAreEqual(args, hoveredRef.value)) {
        overlayStyleRef.value = undefined;
        props.onItemHovered?.(args);
        maybeSetHoveredInfo(
            args.kind !== "mouse" ? undefined : [args.location, [args.localEventX, args.localEventY]],
            true
        );
        hoveredRef.value = args;
    } else if (args.kind === "mouse") {
        let needsDamageCell = false;
        let needsHoverPosition = true;

        if (args.cell !== undefined) {
            const toCheck = args.cell;
            const rendererNeeds = props.getCellRenderer(toCheck)?.needsHoverPosition;
            // custom cells we will assume need the position if they don't explicitly say they don't, everything
            // else we will assume doesn't need it.
            needsHoverPosition = rendererNeeds ?? toCheck.kind === "custom";
            needsDamageCell = needsHoverPosition;
        } else {
            needsDamageCell = true;
        }

        const newInfo: typeof hoveredItemInfo.value = [args.location, [args.localEventX, args.localEventY]];
        maybeSetHoveredInfo(newInfo, needsHoverPosition);
        if (needsDamageCell) {
            damageInternal(new CellSet([args.location]));
        }
    }

    const notRowMarkerCol = args.location[0] >= (props.firstColAccessible ? 0 : 1);
    hoveredOnEdge.value = args.kind === "mouse" && args.column !== undefined && (args as any).isEdge && notRowMarkerCol && props.allowResize === true;

    overFill.value = args.kind === "mouse" && (args as any).isFillHandle;

    props.onMouseMoveRaw?.(ev);
    props.onMouseMove(args);
};

const onKeyDownImpl = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;

    let location: Item | undefined = undefined;
    if (props.selection.current !== undefined) {
        location = props.selection.current.cell;
    }

    props.onKeyDown?.({
        kind: "keyboard",
        preventDefault: () => event.preventDefault(),
        ctrlKey: event.ctrlKey,
        key: event.key,
        keyCode: event.keyCode,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
    });
};

const onKeyUpImpl = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (canvas === null) return;

    let location: Item | undefined = undefined;
    if (props.selection.current !== undefined) {
        location = props.selection.current.cell;
    }

    props.onKeyUp?.({
        kind: "keyboard",
        preventDefault: () => event.preventDefault(),
        ctrlKey: event.ctrlKey,
        key: event.key,
        keyCode: event.keyCode,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
    });
};

// Simplified version of mouseEventArgsAreEqual
const mouseEventArgsAreEqual = (a: GridMouseEventArgs, b: GridMouseEventArgs | undefined) => {
    if (b === undefined) return false;
    return a.kind === b.kind && a.location[0] === b.location[0] && a.location[1] === b.location[1];
};

// Watchers
watch(() => props.cellYOffset, () => {
    if (window.devicePixelRatio === 1 || (!enableFirefoxRescaling.value && !enableSafariRescaling.value)) return;
    // We don't want to go into scroll mode for a single repaint
    if (scrollingStopRef.current !== -1) {
        scrolling.value = true;
    }
    window.clearTimeout(scrollingStopRef.current);
    scrollingStopRef.current = window.setTimeout(() => {
        scrolling.value = false;
        scrollingStopRef.current = -1;
    }, 200);
});

watch(() => props.cellXOffset, () => {
    if (window.devicePixelRatio === 1 || (!enableFirefoxRescaling.value && !enableSafariRescaling.value)) return;
    // We don't want to go into scroll mode for a single repaint
    if (scrollingStopRef.current !== -1) {
        scrolling.value = true;
    }
    window.clearTimeout(scrollingStopRef.current);
    scrollingStopRef.current = window.setTimeout(() => {
        scrolling.value = false;
        scrollingStopRef.current = -1;
    }, 200);
});

watch(() => translateX.value, () => {
    if (window.devicePixelRatio === 1 || (!enableFirefoxRescaling.value && !enableSafariRescaling.value)) return;
    // We don't want to go into scroll mode for a single repaint
    if (scrollingStopRef.current !== -1) {
        scrolling.value = true;
    }
    window.clearTimeout(scrollingStopRef.current);
    scrollingStopRef.current = window.setTimeout(() => {
        scrolling.value = false;
        scrollingStopRef.current = -1;
    }, 200);
});

watch(() => translateY.value, () => {
    if (window.devicePixelRatio === 1 || (!enableFirefoxRescaling.value && !enableSafariRescaling.value)) return;
    // We don't want to go into scroll mode for a single repaint
    if (scrollingStopRef.current !== -1) {
        scrolling.value = true;
    }
    window.clearTimeout(scrollingStopRef.current);
    scrollingStopRef.current = window.setTimeout(() => {
        scrolling.value = false;
        scrollingStopRef.current = -1;
    }, 200);
});

watch(() => hoveredItem.value, () => {
    if (hoveredItem.value === undefined || (hoveredItemInfo.value && hoveredItemInfo.value[1] && hoveredItemInfo.value[1][1] < 0)) {
        animationManager.value.setHovered(hoveredItem.value);
        return;
    }
    const cell = props.getCellContent(hoveredItem.value as [number, number], true);
    const r = props.getCellRenderer(cell);
    const cellNeedsHover =
        (r === undefined && cell.kind === "custom") ||
        (r?.needsHover !== undefined && (typeof r.needsHover === "boolean" ? r.needsHover : r.needsHover(cell)));
    animationManager.value.setHovered(cellNeedsHover ? hoveredItem.value : undefined);
});

watch(() => props.selection, () => {
    selectionRef.value = props.selection;
});

// Event listeners
let scrollingStopRef = { current: -1 };

// Setup event listeners
useEventListener("pointerdown", onPointerDown, windowEventTarget.value, false);
useEventListener("pointerup", onPointerUp, windowEventTarget.value, false);
useEventListener("click", onClickImpl, windowEventTarget.value, false);
useEventListener("contextmenu", onContextMenuImpl, windowEventTargetRef.value ?? null, false);
useEventListener("pointermove", onPointerMove, windowEventTarget.value, true);

// Lifecycle hooks
onMounted(() => {
    // Initialize canvas contexts
    const [bufferACtx, bufferBCtx] = bufferACtxBCtx.value;
    if (bufferACtx !== null && bufferBCtx !== null) {
        document.documentElement.append(bufferACtx.canvas);
        document.documentElement.append(bufferBCtx.canvas);
    }

    // Setup font loading
    const fn = async () => {
        if (document?.fonts?.ready === undefined) return;
        await document.fonts.ready;
        lastArgsRef.value = undefined;
        lastDrawRef.value();
    };
    void fn();

    // Setup image loader callback
    imageLoader.value.setCallback(damageInternal);

    // Initial draw
    draw();
    lastDrawRef.value = draw;

    // Setup event target
    if (props.experimental?.eventTarget) {
        windowEventTargetRef.value = props.experimental.eventTarget;
    } else if (canvasRef.value === null) {
        windowEventTargetRef.value = window;
    } else {
        const docRoot = canvasRef.value.getRootNode();

        if (docRoot === document) windowEventTargetRef.value = window;
        windowEventTargetRef.value = docRoot as any;
    }
});

onUnmounted(() => {
    // Clean up buffer canvases
    const [bufferACtx, bufferBCtx] = bufferACtxBCtx.value;
    if (bufferACtx !== null && bufferBCtx !== null) {
        bufferACtx.canvas.remove();
        bufferBCtx.canvas.remove();
    }

    // Clean up scrolling timeout
    if (scrollingStopRef.current !== -1) {
        window.clearTimeout(scrollingStopRef.current);
    }
});

// Expose methods via defineExpose
defineExpose({
    focus: () => {
        const el = focusRef.value;
        // The element in the ref may have been removed however our callback method ref
        // won't see the removal so bad things happen. Checking to see if the element is
        // no longer attached is enough to resolve the problem. In the future this
        // should be replaced with something much more robust.
        if (el === null || !document.contains(el)) {
            canvasRef.value?.focus({
                preventScroll: true,
            });
        } else {
            el.focus({
                preventScroll: true,
            });
        }
    },
    getBounds: (col?: number, row?: number) => {
        if (canvasRef.value === null) {
            return undefined;
        }

        return getBoundsForItem(canvasRef.value, col ?? 0, row ?? -1);
    },
    damage,
    getMouseArgsForPosition: (posX: number, posY: number, ev?: MouseEvent | TouchEvent) => {
        if (canvasRef.value === null) {
            return undefined;
        }

        return getMouseArgsForPosition(canvasRef.value, posX, posY, ev);
    },
});
</script>
