<template>
    <div
        ref="rootEl"
        class="gdg-vue-grid"
        :style="gridStyle"
        :data-first-header-x="sampleBounds?.x ?? 0"
        :data-first-header-width="sampleBounds?.width ?? 0"
        @pointermove="handlePointerMove"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
        @contextmenu="handleContextMenu"
        tabindex="0"
        @keydown="handleKeyDown"
        @keyup="handleKeyUp"
    >
        <div
            v-if="enableGroups && groupHeaderHeight > 0"
            class="gdg-vue-grid-group-header"
            :style="{ height: `${groupHeaderHeight}px` }"
        >
            <div class="gdg-vue-grid-group-header-placeholder">
                Group headers pending migration
            </div>
        </div>
        <div class="gdg-vue-grid-header" role="row" :style="{ height: `${headerHeight}px` }">
            <div
                v-for="col in headerColumns"
                :key="col.id ?? col.sourceIndex"
                class="gdg-vue-grid-header-cell"
                role="columnheader"
                :style="{ width: `${col.width}px` }"
            >
                <span class="gdg-vue-grid-header-title">{{ col.title }}</span>
            </div>
            <div v-if="headerColumns.length === 0" class="gdg-vue-grid-header-empty">
                No columns mapped yet.
            </div>
        </div>
        <div class="gdg-vue-grid-body" role="presentation" :style="{ height: `${bodyHeight}px` }">
            <canvas ref="gridCanvas" class="gdg-vue-grid-canvas"></canvas>
            <canvas ref="overlayCanvas" class="gdg-vue-grid-overlay-canvas"></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRefs, watch, watchEffect } from "vue";
import type { CustomRenderer, GetCellRendererCallback, InternalCellRenderer } from "../../cells/cell-types.js";
import { AllCellRenderers } from "../../cells/index.js";
import { RenderStateProvider } from "../../common/render-state-provider.js";
import { getDataEditorTheme, makeCSSStyle, mergeAndRealizeTheme, type FullTheme, type Theme } from "../../common/styles.js";
import { getMouseEventArgs } from "../../shared/mouse.js";
import type { GridMouseEventArgs } from "../../internal/data-grid/event-args.js";
import type { GridKeyEventArgs } from "../../internal/data-grid/event-args.js";
import { drawGrid } from "../../internal/data-grid/render/data-grid-render.js";
import type { HoverValues } from "../../internal/data-grid/animation-manager.js";
import { SpriteManager, type SpriteMap } from "../../internal/data-grid/data-grid-sprites.js";
import { CompactSelection, DEFAULT_FILL_HANDLE, GridCellKind, type GridSelection, type Highlight, type InnerGridCell, type InnerGridColumn, type Item } from "../../internal/data-grid/data-grid-types.js";
import type { ImageWindowLoader } from "../../internal/data-grid/image-window-loader-interface.js";
import type { HoverInfo } from "../../internal/data-grid/render/draw-grid-arg.js";
import { useGridGeometry } from "../composables/useGridGeometry.js";
import { useMappedColumns } from "../composables/useMappedColumns.js";

interface DataGridProps {
    width: number;
    height: number;
    columns: readonly InnerGridColumn[];
    rows: number;
    freezeColumns?: number;
    freezeTrailingRows?: number;
    cellXOffset?: number;
    cellYOffset?: number;
    translateX?: number;
    translateY?: number;
    viewportWidth?: number;
    groupHeaderHeight?: number;
    headerHeight?: number;
    rowHeight?: number | ((index: number) => number);
    enableGroups?: boolean;
    themeOverrides?: Partial<Theme>;
    selection?: GridSelection;
    getCellContent?: (cell: Item) => InnerGridCell;
    getCellRenderer?: GetCellRendererCallback;
    renderers?: readonly InternalCellRenderer<InnerGridCell>[];
    additionalRenderers?: readonly CustomRenderer[];
    headerIcons?: SpriteMap;
    spriteManager?: SpriteManager;
    imageWindowLoader?: ImageWindowLoader;
    hoverValues?: HoverValues;
    hoverInfo?: HoverInfo;
    highlightRegions?: readonly Highlight[];
    onMouseMove?: (args: GridMouseEventArgs) => void;
    onMouseMoveRaw?: (event: MouseEvent) => void;
    onMouseDown?: (args: GridMouseEventArgs) => void;
    onMouseUp?: (args: GridMouseEventArgs, isOutside: boolean) => void;
    onContextMenu?: (args: GridMouseEventArgs, preventDefault: () => void) => void;
    /**
     * 键盘按下事件回调（Vue 版本迁移新增）
     * 提供与 React 端一致的 GridKeyEventArgs 参数结构
     */
    onKeyDown?: (args: GridKeyEventArgs) => void;
    /**
     * 键盘弹起事件回调（Vue 版本迁移新增）
     * 提供与 React 端一致的 GridKeyEventArgs 参数结构
     */
    onKeyUp?: (args: GridKeyEventArgs) => void;
}

const props = withDefaults(defineProps<DataGridProps>(), {
    freezeColumns: 0,
    freezeTrailingRows: 0,
    cellXOffset: 0,
    cellYOffset: 0,
    translateX: 0,
    translateY: 0,
    groupHeaderHeight: 0,
    headerHeight: 36,
    rowHeight: 24,
    enableGroups: false,
    themeOverrides: undefined,
    selection: undefined,
    getCellContent: undefined,
    getCellRenderer: undefined,
    renderers: undefined,
    additionalRenderers: undefined,
    headerIcons: undefined,
    spriteManager: undefined,
    imageWindowLoader: undefined,
    hoverValues: undefined,
    hoverInfo: undefined,
    highlightRegions: undefined,
    onMouseDown: undefined,
    onMouseUp: undefined,
    onContextMenu: undefined,
    onKeyDown: undefined,
    onKeyUp: undefined,
});

const {
    width,
    height,
    columns,
    rows,
    freezeColumns,
    freezeTrailingRows,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    viewportWidth,
    groupHeaderHeight,
    headerHeight,
    rowHeight,
    enableGroups,
    headerIcons,
} = toRefs(props);

const viewport = computed(() => viewportWidth.value ?? width.value);
const translateXValue = computed(() => translateX.value ?? 0);

const rootEl = ref<HTMLDivElement | null>(null);
const gridCanvas = ref<HTMLCanvasElement | null>(null);
const overlayCanvas = ref<HTMLCanvasElement | null>(null);
const devicePixelRatio = ref(getDevicePixelRatio());

const renderStateProvider = new RenderStateProvider();
const hoverValuesStub: HoverValues = [] as HoverValues;
const spriteManagerStub = { drawSprite: () => {} } as unknown as SpriteManager;
const imageLoaderStub: ImageWindowLoader = {
    setWindow() {},
    loadOrGetImage() {
        return undefined;
    },
    setCallback() {},
};
const overrideCursor = () => {};
const enqueueStub = () => {};
const getGroupDetailsStub = () => undefined;
const verticalBorderStub = () => false;
const lastBlitData = { current: undefined } as { current: undefined };
const theme = computed<FullTheme>(() => mergeAndRealizeTheme(getDataEditorTheme(), props.themeOverrides));
const selection = computed<GridSelection>(() => props.selection ?? emptySelection());
const spriteManagerVersion = ref(0);
const defaultSpriteManager = shallowRef<SpriteManager | undefined>(undefined);

watch(
    () => [headerIcons.value, props.spriteManager] as const,
    ([icons, provided]) => {
        if (provided !== undefined) {
            spriteManagerVersion.value++;
            return;
        }

        if (typeof window === "undefined" || typeof document === "undefined") {
            defaultSpriteManager.value = undefined;
            spriteManagerVersion.value++;
            return;
        }

        defaultSpriteManager.value = new SpriteManager(icons, () => {
            spriteManagerVersion.value++;
        });
        spriteManagerVersion.value++;
    },
    { immediate: true }
);

const spriteManager = computed<SpriteManager>(() => props.spriteManager ?? defaultSpriteManager.value ?? spriteManagerStub);
const imageWindowLoader = computed<ImageWindowLoader>(() => props.imageWindowLoader ?? imageLoaderStub);
const hoverValues = computed<HoverValues>(() => props.hoverValues ?? hoverValuesStub);
const hoverInfo = computed<HoverInfo | undefined>(() => props.hoverInfo);
const highlightRegions = computed(() => props.highlightRegions);

const rendererList = computed(() => props.renderers ?? AllCellRenderers);
const rendererMap = computed(() => {
    const map = new Map<GridCellKind, InternalCellRenderer<InnerGridCell>>();
    for (const renderer of rendererList.value) {
        map.set(renderer.kind as GridCellKind, renderer as InternalCellRenderer<InnerGridCell>);
    }
    return map;
});
const customRenderers = computed(() => props.additionalRenderers ?? []);

const resolveCellRenderer: GetCellRendererCallback = cell => {
    const provided = props.getCellRenderer?.(cell);
    if (provided !== undefined) {
        return provided;
    }
    if (cell.kind === GridCellKind.Custom) {
        for (const renderer of customRenderers.value) {
            if (renderer.isMatch(cell)) {
                return renderer as any;
            }
        }
        return undefined;
    }
    return rendererMap.value.get(cell.kind as GridCellKind) as any;
};

const defaultCell = (cell: Item): InnerGridCell => ({
    kind: GridCellKind.Text,
    allowOverlay: false,
    data: `${cell[0]},${cell[1]}`,
    displayData: `${cell[0]},${cell[1]}`,
});

const getCellContent = (cell: Item): InnerGridCell => props.getCellContent?.(cell) ?? defaultCell(cell);

const freezeRows = computed(() => {
    const trailing = freezeTrailingRows.value;
    if (trailing <= 0 || rows.value <= 0) return [] as number[];
    const start = Math.max(rows.value - trailing, 0);
    const result: number[] = [];
    for (let r = start; r < rows.value; r++) {
        result.push(r);
    }
    return result;
});

watchEffect(() => {
    const el = rootEl.value;
    if (el === null) return;
    const cssVars = makeCSSStyle(theme.value);
    for (const [key, value] of Object.entries(cssVars)) {
        el.style.setProperty(key, value);
    }
});

const { mappedColumns, effectiveColumns, stickyWidth } = useMappedColumns({
    columns,
    freezeColumns,
    cellXOffset,
    viewportWidth: viewport,
    translateX: translateXValue,
});

const totalHeaderHeight = computed(() =>
    enableGroups.value ? groupHeaderHeight.value + headerHeight.value : headerHeight.value
);

const { boundsForCell } = useGridGeometry({
    mappedColumns,
    freezeColumns,
    freezeTrailingRows,
    groupHeaderHeight,
    totalHeaderHeight,
    rowHeight,
});

const headerColumns = computed(() => effectiveColumns.value);

const sampleBounds = computed(() => {
    if (mappedColumns.value.length === 0) {
        return undefined;
    }
    return boundsForCell(
        0,
        -1,
        width.value,
        height.value,
        cellXOffset.value,
        cellYOffset.value,
        translateXValue.value,
        translateY.value ?? 0,
        rows.value
    );
});

let lastPointerUpTime = 0;
let lastTouchDownTime = 0;
let activePointerId: number | undefined;

function resolveMouseArgs(event: PointerEvent | MouseEvent) {
    const canvas = gridCanvas.value;
    if (canvas === null || mappedColumns.value.length === 0 || width.value === 0) {
        return undefined;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) {
        return undefined;
    }

    const scale = rect.width / width.value;
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const pointerEvent =
        typeof PointerEvent !== "undefined" && event instanceof PointerEvent ? event : undefined;
    const pointerType = pointerEvent?.pointerType;
    const isTouch = pointerType === "touch";
    const isMouse = pointerType === "mouse" || event instanceof MouseEvent;

    const button = isMouse && "button" in event ? event.button ?? 0 : 0;
    const buttons = isMouse && "buttons" in event ? event.buttons ?? 0 : 0;

    const toClientBounds = (col: number, row: number) => {
        if (col < 0 || col >= mappedColumns.value.length) return undefined;
        if (row >= rows.value) return undefined;

        const base = boundsForCell(
            col,
            row,
            width.value,
            height.value,
            cellXOffset.value,
            cellYOffset.value,
            translateXValue.value,
            translateY.value ?? 0,
            rows.value
        );

        return {
            x: rect.left + base.x * scale,
            y: rect.top + base.y * scale,
            width: base.width * scale,
            height: base.height * scale,
        };
    };

    return getMouseEventArgs({
        x,
        y,
        clientX: event.clientX,
        clientY: event.clientY,
        width: width.value,
        height: height.value,
        enableGroups: enableGroups.value,
        headerHeight: headerHeight.value,
        groupHeaderHeight: groupHeaderHeight.value,
        totalHeaderHeight: totalHeaderHeight.value,
        rows: rows.value,
        rowHeight: rowHeight.value,
        cellXOffset: cellXOffset.value,
        cellYOffset: cellYOffset.value,
        translateX: translateXValue.value,
        translateY: translateY.value ?? 0,
        freezeTrailingRows: freezeTrailingRows.value,
        mappedColumns: mappedColumns.value,
        effectiveColumns: effectiveColumns.value,
        selection: selection.value,
        fillHandle: DEFAULT_FILL_HANDLE,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        isTouch: Boolean(isTouch),
        button,
        buttons,
        getBounds: toClientBounds,
    });
}

function handlePointerMove(event: PointerEvent | MouseEvent) {
    props.onMouseMoveRaw?.(event as MouseEvent);
    const result = resolveMouseArgs(event);
    if (result === undefined) {
        return;
    }

    props.onMouseMove?.(result.args);
}

function handlePointerDown(event: PointerEvent | MouseEvent) {
    // 在指针按下时尝试聚焦根元素，确保后续能接收键盘事件
    try {
        rootEl.value?.focus?.({ preventScroll: true } as any);
    } catch {
        // 忽略聚焦失败
    }
    const result = resolveMouseArgs(event);
    if (result === undefined) {
        return;
    }

    const pointerEvent =
        typeof PointerEvent !== "undefined" && event instanceof PointerEvent ? event : undefined;
    if (pointerEvent !== undefined) {
        try {
            gridCanvas.value?.setPointerCapture?.(pointerEvent.pointerId);
            activePointerId = pointerEvent.pointerId;
        } catch {
            activePointerId = undefined;
        }
    }

    if (result.args.isTouch) {
        lastTouchDownTime = Date.now();
    } else {
        lastTouchDownTime = 0;
    }

    if (!result.args.isTouch && "button" in event && event.cancelable) {
        const button = (event as MouseEvent).button;
        if (button < 3 && button !== 1) {
            event.preventDefault();
        }
    }

    props.onMouseDown?.(result.args);
}

function handlePointerUp(event: PointerEvent | MouseEvent) {
    const result = resolveMouseArgs(event);
    if (result === undefined) {
        return;
    }

    const pointerEvent =
        typeof PointerEvent !== "undefined" && event instanceof PointerEvent ? event : undefined;
    if (pointerEvent !== undefined && activePointerId === pointerEvent.pointerId) {
        try {
            gridCanvas.value?.releasePointerCapture?.(pointerEvent.pointerId);
        } catch {
            // ignore
        }
        activePointerId = undefined;
    }

    if (props.onMouseUp === undefined) {
        lastPointerUpTime = Date.now();
        lastTouchDownTime = 0;
        return;
    }

    let args = result.args;
    const now = Date.now();

    if (args.isTouch && lastTouchDownTime !== 0 && now - lastTouchDownTime > 500) {
        args = { ...args, isLongTouch: true };
    }

    if (lastPointerUpTime !== 0) {
        const threshold = args.isTouch ? 1000 : 500;
        if (now - lastPointerUpTime < threshold) {
            args = { ...args, isDoubleClick: true };
        }
    }

    lastPointerUpTime = now;
    lastTouchDownTime = 0;

    const root = rootEl.value;
    const target = event.target;
    const isInside = root !== null && target instanceof Node && root.contains(target);
    const isOutside = !isInside;

    if (!isOutside && event.cancelable) {
        const canCancel = pointerEvent?.pointerType === "mouse" ? pointerEvent.button < 3 : true;
        if (canCancel) {
            event.preventDefault();
        }
    }

    props.onMouseUp?.(args, isOutside);
}

function handleContextMenu(event: MouseEvent) {
    if (props.onContextMenu === undefined) {
        return;
    }

    const result = resolveMouseArgs(event);
    if (result === undefined) {
        return;
    }

    props.onContextMenu(result.args, () => {
        if (event.cancelable) {
            event.preventDefault();
        }
    });
}

const gridStyle = computed<Record<string, string>>(() => ({
    width: `${width.value}px`,
    height: `${height.value}px`,
    "--gdg-sticky-width": `${stickyWidth.value}px`,
}));

const bodyHeight = computed(() => Math.max(height.value - totalHeaderHeight.value, 0));

function getDevicePixelRatio() {
    return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}

function handleWindowDprChange() {
    devicePixelRatio.value = getDevicePixelRatio();
}

function emptySelection(): GridSelection {
    return {
        current: undefined,
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
    };
}



function renderPlaceholder(ctx: CanvasRenderingContext2D, dpr: number) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width.value, bodyHeight.value);

    const gradient = ctx.createLinearGradient(0, 0, width.value, bodyHeight.value);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.08)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.12)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width.value, bodyHeight.value);

    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Canvas renderer coming soon", width.value / 2, bodyHeight.value / 2);

    ctx.restore();
}

watchEffect(() => {
    const canvas = gridCanvas.value;
    const overlay = overlayCanvas.value;
    spriteManagerVersion.value;
    if (canvas === null || overlay === null) return;

    const dpr = devicePixelRatio.value;
    const canvasWidth = Math.max(Math.floor(width.value * dpr), 1);
    const canvasHeight = Math.max(Math.floor(bodyHeight.value * dpr), 1);

    // 设置主canvas尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${width.value}px`;
    canvas.style.height = `${bodyHeight.value}px`;

    // 设置overlay canvas尺寸 - overlay只需要覆盖header区域
    const overlayCanvasWidth = Math.max(Math.floor(width.value * dpr), 1);
    const overlayCanvasHeight = Math.max(Math.floor(totalHeaderHeight.value * dpr), 1);
    
    overlay.width = overlayCanvasWidth;
    overlay.height = overlayCanvasHeight;
    overlay.style.width = `${width.value}px`;
    overlay.style.height = `${totalHeaderHeight.value}px`;

    let ctx: CanvasRenderingContext2D | null = null;
    let overlayCtx: CanvasRenderingContext2D | null = null;
    
    try {
        ctx = canvas.getContext("2d", { alpha: false });
        overlayCtx = overlay.getContext("2d", { alpha: false });
    } catch {
        ctx = null;
        overlayCtx = null;
    }

    if (ctx === null || overlayCtx === null) {
        return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    overlayCtx.clearRect(0, 0, overlayCanvasWidth, overlayCanvasHeight);

    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent ?? "")) {
        renderPlaceholder(ctx, dpr);
        return;
    }

    if (mappedColumns.value.length === 0) {
        renderPlaceholder(ctx, dpr);
        return;
    }

    try {
        renderStateProvider.setWindow(
            {
                x: cellXOffset.value,
                y: cellYOffset.value,
                width: effectiveColumns.value.length,
                height: Math.max(rows.value - cellYOffset.value, 0),
            },
            freezeColumns.value,
            freezeRows.value
        );

        const drawArgs = {
            canvasCtx: ctx,
            headerCanvasCtx: overlayCtx,
            bufferACtx: ctx,
            bufferBCtx: ctx,
            width: width.value,
            height: height.value,
            cellXOffset: cellXOffset.value,
            cellYOffset: cellYOffset.value,
            translateX: Math.round(translateXValue.value),
            translateY: Math.round(translateY.value ?? 0),
            mappedColumns: mappedColumns.value,
            enableGroups: enableGroups.value,
            freezeColumns: freezeColumns.value,
            dragAndDropState: undefined,
            theme: theme.value,
            headerHeight: headerHeight.value,
            groupHeaderHeight: groupHeaderHeight.value,
            disabledRows: CompactSelection.empty(),
            rowHeight: rowHeight.value,
            verticalBorder: verticalBorderStub,
            isResizing: false,
            resizeCol: undefined,
            isFocused: false,
            drawFocus: false,
            selection: selection.value,
            fillHandle: DEFAULT_FILL_HANDLE,
            freezeTrailingRows: freezeTrailingRows.value,
            hasAppendRow: false,
            hyperWrapping: false,
            rows: rows.value,
            getCellContent,
            overrideCursor,
            getGroupDetails: getGroupDetailsStub,
            getRowThemeOverride: undefined,
            drawHeaderCallback: undefined,
            drawCellCallback: undefined,
            prelightCells: undefined,
            highlightRegions: highlightRegions.value,
            imageLoader: imageWindowLoader.value,
            lastBlitData,
            damage: undefined,
            hoverValues: hoverValues.value,
            hoverInfo: hoverInfo.value,
            spriteManager: spriteManager.value,
            maxScaleFactor: 1,
            touchMode: false,
            renderStrategy: "direct",
            enqueue: enqueueStub,
            renderStateProvider,
            getCellRenderer: resolveCellRenderer,
            minimumCellWidth: 0,
            resizeIndicator: "none",
        } as Parameters<typeof drawGrid>[0];

        drawGrid(drawArgs, undefined);
    } catch {
        renderPlaceholder(ctx, dpr);
    }
});

onMounted(() => {
    if (typeof window !== "undefined") {
        window.addEventListener("resize", handleWindowDprChange, { passive: true });
        window.addEventListener("pointerup", handlePointerUp, { passive: false });
    }
});

onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleWindowDprChange);
        window.removeEventListener("pointerup", handlePointerUp);
    }
});
// 键盘事件 keyCode 兼容处理：在现代浏览器中 keyCode 已废弃，这里提供向后兼容的映射
function normalizeKeyCode(e: KeyboardEvent): number {
    const kc = (e as any).keyCode as number | undefined;
    if (typeof kc === "number" && kc !== 0) return kc;
    switch (e.key) {
        case "Enter":
            return 13;
        case "Escape":
            return 27;
        case "Tab":
            return 9;
        case "ArrowLeft":
            return 37;
        case "ArrowUp":
            return 38;
        case "ArrowRight":
            return 39;
        case "ArrowDown":
            return 40;
        case "Delete":
            return 46;
        case "Backspace":
            return 8;
        case " ":
        case "Spacebar":
            return 32;
        default:
            return 0;
    }
}

/**
 * 将原生 KeyboardEvent 解析为 GridKeyEventArgs
 * - location：来自当前 selection.current.cell
 * - bounds：通过 boundsForCell 计算得到网格坐标系矩形
 */
function resolveKeyArgs(event: KeyboardEvent): GridKeyEventArgs {
    let bounds: any | undefined = undefined;
    let location: any | undefined = undefined;

    const sel = selection.value?.current;
    if (sel !== undefined) {
        const [col, row] = sel.cell;
        location = sel.cell;
        try {
            bounds = boundsForCell(
                col,
                row,
                width.value,
                height.value,
                cellXOffset.value,
                cellYOffset.value,
                translateXValue.value,
                translateY.value ?? 0,
                rows.value
            );
        } catch {
            bounds = undefined;
        }
    }

    const preventDefault = () => {
        try {
            if (event.cancelable) event.preventDefault();
        } catch {}
    };
    const stopPropagation = () => {
        try {
            event.stopPropagation();
        } catch {}
    };
    const cancel = () => {
        preventDefault();
        stopPropagation();
    };

    return {
        bounds,
        key: event.key,
        keyCode: normalizeKeyCode(event),
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        cancel,
        stopPropagation,
        preventDefault,
        rawEvent: undefined,
        location,
    };
}

/**
 * 键盘按下事件处理
 * - 解析为 GridKeyEventArgs
 * - 调用用户提供的 onKeyDown 回调
 * - 具备基础错误处理与日志
 */
function handleKeyDown(event: KeyboardEvent) {
    try {
        const args = resolveKeyArgs(event);
        props.onKeyDown?.(args);
    } catch (err) {
        // 在测试与生产环境中避免抛出到全局
        console.error("DataGrid.vue handleKeyDown 调用失败:", err);
    }
}

/**
 * 键盘弹起事件处理
 */
function handleKeyUp(event: KeyboardEvent) {
    try {
        const args = resolveKeyArgs(event);
        props.onKeyUp?.(args);
    } catch (err) {
        console.error("DataGrid.vue handleKeyUp 调用失败:", err);
    }
}
</script>

<style scoped>
.gdg-vue-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--gdg-border-color, #d1d5e5);
    border-radius: 8px;
    overflow: hidden;
    background: var(--gdg-bg-surface, #ffffff);
    color: var(--gdg-text-dark, #1f2933);
    font-family: var(--gdg-font-family, 'Inter', sans-serif);
}

.gdg-vue-grid-group-header {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    background: var(--gdg-bg-group-header, #eef2ff);
    border-bottom: 1px solid var(--gdg-border-color, #d1d5e5);
}

.gdg-vue-grid-group-header-placeholder {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gdg-text-muted, #6b7280);
}

.gdg-vue-grid-header {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--gdg-border-color, #d1d5e5);
    background: var(--gdg-bg-header, #f3f4f6);
    padding-left: var(--gdg-sticky-width, 0px);
}

.gdg-vue-grid-header-cell {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 0.75rem;
    border-right: 1px solid var(--gdg-border-color, #e5e7eb);
    background: inherit;
    white-space: nowrap;
}

.gdg-vue-grid-header-cell:last-of-type {
    border-right: none;
}

.gdg-vue-grid-header-title {
    font-size: 0.82rem;
    font-weight: 600;
}

.gdg-vue-grid-header-empty {
    padding: 0.5rem;
    font-size: 0.8rem;
    color: var(--gdg-text-muted, #6b7280);
}

.gdg-vue-grid-body {
    position: relative;
    flex: 1 1 auto;
    background: var(--gdg-bg-cell, #f8fafc);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gdg-text-muted, #6b7280);
    font-size: 0.85rem;
}

.gdg-vue-grid-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 1;
}

.gdg-vue-grid-overlay-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 2;
    pointer-events: none;
}

.gdg-vue-grid-body-placeholder {
    position: relative;
    padding: 1rem;
    text-align: center;
    pointer-events: none;
}
</style>
