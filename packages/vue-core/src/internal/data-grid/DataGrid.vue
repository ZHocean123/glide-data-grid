<template>
    <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="canvasStyle"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @keydown="handleKeyDown"
        @keyup="handleKeyUp"
        @contextmenu="handleContextMenu"
        tabindex="0"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { Ref } from "vue";
import {
    type InnerGridColumn,
    type GridSelection,
    type GridMouseEventArgs,
    type GridKeyEventArgs,
    type GridDragEventArgs,
    type CellActivatedEventArgs,
    type FillHandleDirection,
    type Highlight,
    type VisibleRegion,
    type ImageWindowLoader,
    type ProvideEditorCallback,
    type CellRenderer,
    type InnerGridCell,
} from "./data-grid-types.js";
import { type FullTheme } from "../../common/styles.js";
import { drawDataGrid } from "./render/data-grid-render.js";
import { getMouseArgsForPosition } from "./render/data-grid-lib.js";

interface Props {
    // Data
    columns: InnerGridColumn[];
    rows: number;
    getCellContent: (location: [number, number]) => InnerGridCell;

    // Style
    theme: FullTheme;
    rowHeight: number;
    headerHeight: number;
    groupHeaderHeight: number;
    minColumnWidth?: number;
    maxColumnWidth?: number;
    allowResize?: boolean;
    resizeIndicator?: "full" | "header" | "none";

    // State
    selection?: GridSelection;
    isFocused?: boolean;
    isResizing?: boolean;
    resizeColumn?: number;
    isDragging?: boolean;
    isFilling?: boolean;

    // Events
    onMouseDown?: (args: GridMouseEventArgs) => void;
    onMouseMove?: (args: GridMouseEventArgs) => void;
    onMouseUp?: (args: GridMouseEventArgs, isOutside: boolean) => void;
    onKeyDown?: (args: GridKeyEventArgs) => void;
    onKeyUp?: (args: GridKeyEventArgs) => void;
    onContextMenu?: (args: GridMouseEventArgs, preventDefault: () => void) => void;
    onCellFocused?: (location: [number, number]) => void;
    onColumnResize?: (column: InnerGridColumn, newSize: number, colIndex: number, newSizeWithGroup: number) => void;
    onColumnResizeStart?: (
        column: InnerGridColumn,
        newSize: number,
        colIndex: number,
        newSizeWithGroup: number
    ) => void;
    onColumnResizeEnd?: (column: InnerGridColumn, newSize: number, colIndex: number, newSizeWithGroup: number) => void;

    // Advanced
    imageWindowLoader?: ImageWindowLoader;
    getCellRenderer?: <T extends InnerGridCell>(cell: T) => CellRenderer<T> | undefined;
}

const emit = defineEmits<{
    "mouse-down": [args: GridMouseEventArgs];
    "mouse-move": [args: GridMouseEventArgs];
    "mouse-up": [args: GridMouseEventArgs, isOutside: boolean];
    "key-down": [args: GridKeyEventArgs];
    "key-up": [args: GridKeyEventArgs];
    "context-menu": [args: GridMouseEventArgs, preventDefault: () => void];
    "cell-focused": [location: [number, number]];
    "column-resize": [column: InnerGridColumn, newSize: number, colIndex: number, newSizeWithGroup: number];
    "column-resize-start": [column: InnerGridColumn, newSize: number, colIndex: number, newSizeWithGroup: number];
    "column-resize-end": [column: InnerGridColumn, newSize: number, colIndex: number, newSizeWithGroup: number];
}>();

const props = withDefaults(defineProps<Props>(), {
    rowHeight: 34,
    headerHeight: 36,
    groupHeaderHeight: 0,
    minColumnWidth: 50,
    maxColumnWidth: 500,
    allowResize: true,
    resizeIndicator: "full",
    isFocused: false,
    isResizing: false,
    isDragging: false,
    isFilling: false,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);

const canvasStyle = computed(() => ({
    outline: "none",
    cursor: getCursorStyle(),
    ...props.theme.style,
}));

// Mouse state
const mouseDown = ref(false);
const hoveredOnEdge = ref(false);
const overFill = ref(false);

// Drawing state
const dpr = ref(1);
const animationFrameId = ref<number | null>(null);

// Event handlers
const handlePointerDown = (event: PointerEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    mouseDown.value = true;

    const args = getMouseArgsForPosition(canvas, event.clientX, event.clientY, event);

    // Handle column resize start
    if (args.kind === "header" && args.isEdge && props.allowResize) {
        const columnIndex = args.location[0];
        const column = props.columns[columnIndex];
        const currentWidth = column.width;

        emit("column-resize-start", column, currentWidth, columnIndex, currentWidth);
    }

    emit("mouse-down", args);

    if (!args.isTouch && event.button < 3 && event.button !== 1) {
        event.preventDefault();
    }
};

const handlePointerMove = (event: PointerEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const args = getMouseArgsForPosition(canvas, event.clientX, event.clientY, event);

    // Update hover state for column resize
    const notRowMarkerCol = args.location[0] >= 0;
    hoveredOnEdge.value = args.kind === "header" && args.isEdge && notRowMarkerCol && props.allowResize;
    overFill.value = args.kind === "cell" && args.isFillHandle;

    emit("mouse-move", args);
};

const handlePointerUp = (event: PointerEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    mouseDown.value = false;

    const isOutside = event.target !== canvas;
    const args = getMouseArgsForPosition(canvas, event.clientX, event.clientY, event);

    // Handle column resize end
    if (props.isResizing) {
        const columnIndex = props.resizeColumn;
        if (columnIndex !== undefined) {
            const column = props.columns[columnIndex];
            const currentWidth = column.width;
            emit("column-resize-end", column, currentWidth, columnIndex, currentWidth);
        }
    }

    emit("mouse-up", args, isOutside);
};

const handleKeyDown = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    let bounds: any = undefined;
    let location: [number, number] | undefined = undefined;

    if (props.selection?.current) {
        // TODO: Implement getBoundsForItem
        bounds = undefined;
        location = props.selection.current.cell;
    }

    const keyArgs: GridKeyEventArgs = {
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
    };

    emit("key-down", keyArgs);
};

const handleKeyUp = (event: KeyboardEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    let bounds: any = undefined;
    let location: [number, number] | undefined = undefined;

    if (props.selection?.current) {
        // TODO: Implement getBoundsForItem
        bounds = undefined;
        location = props.selection.current.cell;
    }

    const keyArgs: GridKeyEventArgs = {
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
    };

    emit("key-up", keyArgs);
};

const handleContextMenu = (event: MouseEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const args = getMouseArgsForPosition(canvas, event.clientX, event.clientY, event);
    let prevented = false;

    const preventDefault = () => {
        prevented = true;
        event.preventDefault();
    };

    emit("context-menu", args, preventDefault);

    if (!prevented && event.cancelable) {
        event.preventDefault();
    }
};

const getCursorStyle = (): string => {
    if (props.isDragging) return "grabbing";
    if (hoveredOnEdge.value || props.isResizing) return "col-resize";
    if (overFill.value || props.isFilling) return "crosshair";
    return "default";
};

// Drawing
const draw = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawDataGrid({
        ctx,
        width: canvas.width,
        height: canvas.height,
        dpr: dpr.value,
        columns: props.columns,
        rows: props.rows,
        getCellContent: props.getCellContent,
        theme: props.theme,
        rowHeight: props.rowHeight,
        headerHeight: props.headerHeight,
        groupHeaderHeight: props.groupHeaderHeight,
        selection: props.selection,
        isFocused: props.isFocused,
        isResizing: props.isResizing,
        resizeColumn: props.resizeColumn,
        isDragging: props.isDragging,
        isFilling: props.isFilling,
        allowResize: props.allowResize,
        resizeIndicator: props.resizeIndicator,
        minColumnWidth: props.minColumnWidth,
        maxColumnWidth: props.maxColumnWidth,
        getCellRenderer: props.getCellRenderer,
    });
};

const scheduleDraw = () => {
    if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value);
    }
    animationFrameId.value = requestAnimationFrame(draw);
};

// Lifecycle
onMounted(() => {
    dpr.value = window.devicePixelRatio || 1;

    // Initial draw
    nextTick(() => {
        scheduleDraw();
    });

    // Watch for changes that require redraw
    watch(
        [
            () => props.columns,
            () => props.rows,
            () => props.selection,
            () => props.isFocused,
            () => props.isResizing,
            () => props.resizeColumn,
            () => props.theme,
        ],
        () => {
            scheduleDraw();
        },
        { deep: true }
    );
});

onUnmounted(() => {
    if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value);
    }
});

// Expose methods
defineExpose({
    focus: () => {
        canvasRef.value?.focus();
    },
    blur: () => {
        canvasRef.value?.blur();
    },
});
</script>
