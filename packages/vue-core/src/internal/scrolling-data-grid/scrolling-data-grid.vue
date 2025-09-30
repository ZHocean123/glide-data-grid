<template>
    <InfiniteScroller
        :scrollRef="scrollRef"
        :className="className"
        :kineticScrollPerfHack="experimental?.kineticScrollPerfHack"
        :preventDiagonalScrolling="preventDiagonalScrolling"
        :draggable="isDraggable === true || typeof isDraggable === 'string'"
        :scrollWidth="width + (experimental?.paddingRight ?? 0)"
        :scrollHeight="height + (experimental?.paddingBottom ?? 0)"
        :clientHeight="clientHeight"
        :rightElement="rightElement"
        :paddingBottom="experimental?.paddingBottom"
        :paddingRight="experimental?.paddingRight"
        :rightElementProps="rightElementProps"
        :update="onScrollUpdate"
        :initialSize="initialSize">
        <DataGridDnd
            :eventTargetRef="scrollRef"
            :width="clientWidth"
            :height="clientHeight"
            :accessibilityHeight="accessibilityHeight"
            :canvasRef="canvasRef"
            :cellXOffset="cellXOffset"
            :cellYOffset="cellYOffset"
            :columns="columns"
            :disabledRows="disabledRows"
            :enableGroups="enableGroups"
            :fillHandle="fillHandle"
            :firstColAccessible="firstColAccessible"
            :fixedShadowX="fixedShadowX"
            :fixedShadowY="fixedShadowY"
            :freezeColumns="freezeColumns"
            :getCellContent="getCellContent"
            :getCellRenderer="getCellRenderer"
            :getGroupDetails="getGroupDetails"
            :getRowThemeOverride="getRowThemeOverride"
            :groupHeaderHeight="groupHeaderHeight"
            :headerHeight="headerHeight"
            :highlightRegions="highlightRegions"
            :imageWindowLoader="imageWindowLoader"
            :isFilling="isFilling"
            :isFocused="isFocused"
            :lockColumns="lockColumns"
            :maxColumnWidth="maxColumnWidth"
            :minColumnWidth="minColumnWidth"
            :onHeaderMenuClick="onHeaderMenuClick"
            :onHeaderIndicatorClick="onHeaderIndicatorClick"
            :onMouseMove="onMouseMove"
            :prelightCells="prelightCells"
            :rowHeight="rowHeight"
            :rows="rows"
            :selection="selection"
            :theme="theme"
            :freezeTrailingRows="freezeTrailingRows"
            :hasAppendRow="hasAppendRow"
            :translateX="translateX"
            :translateY="translateY"
            :onColumnProposeMove="onColumnProposeMove"
            :verticalBorder="verticalBorder"
            :drawFocusRing="drawFocusRing"
            :drawHeader="drawHeader"
            :drawCell="drawCell"
            :experimental="experimental"
            :gridRef="gridRef"
            :headerIcons="headerIcons"
            :isDraggable="isDraggable"
            :onCanvasBlur="onCanvasBlur"
            :onCanvasFocused="onCanvasFocused"
            :onCellFocused="onCellFocused"
            :onColumnMoved="onColumnMoved"
            :onColumnResize="onColumnResize"
            :onColumnResizeEnd="onColumnResizeEnd"
            :onColumnResizeStart="onColumnResizeStart"
            :onContextMenu="onContextMenu"
            :onDragEnd="onDragEnd"
            :onDragLeave="onDragLeave"
            :onDragOverCell="onDragOverCell"
            :onDragStart="onDragStart"
            :onDrop="onDrop"
            :onItemHovered="onItemHovered"
            :onKeyDown="onKeyDown"
            :onKeyUp="onKeyUp"
            :onMouseDown="onMouseDown"
            :onMouseUp="onMouseUp"
            :onRowMoved="onRowMoved"
            :smoothScrollX="smoothScrollX"
            :smoothScrollY="smoothScrollY"
            :resizeIndicator="resizeIndicator" />
    </InfiniteScroller>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import InfiniteScroller from './infinite-scroller.vue';
import DataGridDnd from '../data-grid-dnd/data-grid-dnd.vue';
import type { Rectangle } from '../data-grid/data-grid-types.js';
import type { DataGridDndProps } from '../data-grid-dnd/data-grid-dnd.js';

export interface ScrollingDataGridProps extends Omit<DataGridDndProps, 'width' | 'height' | 'eventTargetRef'> {
    readonly className: string | undefined;
    readonly onVisibleRegionChanged:
        | ((
              range: Rectangle,
              clientWidth: number,
              clientHeight: number,
              rightElWidth: number,
              tx: number,
              ty: number
          ) => void)
        | undefined;
    readonly scrollRef: { value: HTMLDivElement | null } | undefined;

    /**
     * The overscroll properties are used to allow the grid to scroll past the logical end of the content by a fixed
     * number of pixels. This is useful particularly on the X axis if you allow for resizing columns as it can make
     * resizing the final column significantly easier.
     *
     * @group Advanced
     */
    readonly overscrollX: number | undefined;
    /** {@inheritDoc overscrollX}
     * @group Advanced
     */
    readonly overscrollY: number | undefined;
    /**
     * Provides an initial size for the grid which can prevent a flicker on load if the initial size is known prior to
     * layout.
     *
     * @group Advanced
     */
    readonly initialSize: readonly [width: number, height: number] | undefined;
    /**
     * Set to true to prevent any diagonal scrolling.
     * @group Advanced
     */
    readonly preventDiagonalScrolling: boolean | undefined;

    /**
     * If `rightElementProps.sticky` is set to true the right element will be visible at all times, otherwise the user
     * will need to scroll to the end to reveal it.
     *
     * If `rightElementProps.fill` is set, the right elements container will fill to consume all remaining space (if
     * any) at the end of the grid. This does not play nice with growing columns.
     *
     * @group Advanced
     */
    readonly rightElementProps:
        | {
              readonly sticky?: boolean;
              readonly fill?: boolean;
          }
        | undefined;
    /**
     * The right element is a DOM node which can be inserted at the end of the horizontal scroll region. This can be
     * used to create a right handle panel, make a big add button, or display messages.
     * @group Advanced
     */
    readonly rightElement: any | undefined;
    readonly clientSize: readonly [number, number, number]; // [width, height, rightElSize]
    readonly nonGrowWidth: number;
}

const props = defineProps<ScrollingDataGridProps>();

const last = ref<Rectangle | undefined>();
const lastX = ref<number | undefined>();
const lastY = ref<number | undefined>();
const lastSize = ref<readonly [number, number] | undefined>();
const lastArgs = ref<Rectangle & { paddingRight: number }>();

const [clientWidth, clientHeight] = props.clientSize;

const width = computed(() => props.nonGrowWidth + Math.max(0, props.overscrollX ?? 0));

const height = computed(() => {
    let h = props.enableGroups ? props.headerHeight + props.groupHeaderHeight : props.headerHeight;
    if (typeof props.rowHeight === 'number') {
        h += props.rows * props.rowHeight;
    } else {
        for (let r = 0; r < props.rows; r++) {
            h += props.rowHeight(r);
        }
    }
    if (props.overscrollY !== undefined) {
        h += props.overscrollY;
    }
    return h;
});

const processArgs = () => {
    if (lastArgs.value === undefined) return;
    const args = { ...lastArgs.value };

    let x = 0;
    let tx = args.x < 0 ? -args.x : 0;
    let cellRight = 0;
    let cellX = 0;

    args.x = args.x < 0 ? 0 : args.x;

    let stickyColWidth = 0;
    for (let i = 0; i < props.freezeColumns; i++) {
        stickyColWidth += props.columns[i].width;
    }

    for (const c of props.columns) {
        const cx = x - stickyColWidth;
        if (args.x >= cx + c.width) {
            x += c.width;
            cellX++;
            cellRight++;
        } else if (args.x > cx) {
            x += c.width;
            if (props.smoothScrollX) {
                tx += cx - args.x;
            } else {
                cellX++;
            }
            cellRight++;
        } else if (args.x + args.width > cx) {
            x += c.width;
            cellRight++;
        } else {
            break;
        }
    }

    let ty = 0;
    let cellY = 0;
    let cellBottom = 0;
    if (typeof props.rowHeight === 'number') {
        if (props.smoothScrollY) {
            cellY = Math.floor(args.y / props.rowHeight);
            ty = cellY * props.rowHeight - args.y;
        } else {
            cellY = Math.ceil(args.y / props.rowHeight);
        }
        cellBottom = Math.ceil(args.height / props.rowHeight) + cellY;
        if (ty < 0) cellBottom++;
    } else {
        let y = 0;
        for (let row = 0; row < props.rows; row++) {
            const rh = props.rowHeight(row);
            const cy = y + (props.smoothScrollY ? 0 : rh / 2);
            if (args.y >= y + rh) {
                y += rh;
                cellY++;
                cellBottom++;
            } else if (args.y > cy) {
                y += rh;
                if (props.smoothScrollY) {
                    ty += cy - args.y;
                } else {
                    cellY++;
                }
                cellBottom++;
            } else if (args.y + args.height > rh / 2 + y) {
                y += rh;
                cellBottom++;
            } else {
                break;
            }
        }
    }

    // Ensure cellY and cellBottom never exceed the actual row count
    // This is a safeguard to prevent unexpected out-of-bounds access with large datasets
    cellY = Math.max(0, Math.min(cellY, props.rows - 1));
    cellBottom = Math.max(cellY, Math.min(cellBottom, props.rows));

    const rect: Rectangle = {
        x: cellX,
        y: cellY,
        width: cellRight - cellX,
        height: cellBottom - cellY,
    };

    const oldRect = last.value;

    if (
        oldRect === undefined ||
        oldRect.y !== rect.y ||
        oldRect.x !== rect.x ||
        oldRect.height !== rect.height ||
        oldRect.width !== rect.width ||
        lastX.value !== tx ||
        lastY.value !== ty ||
        args.width !== lastSize.value?.[0] ||
        args.height !== lastSize.value?.[1]
    ) {
        props.onVisibleRegionChanged?.(
            {
                x: cellX,
                y: cellY,
                width: cellRight - cellX,
                height: cellBottom - cellY,
            },
            args.width,
            args.height,
            args.paddingRight ?? 0,
            tx,
            ty
        );
        last.value = rect;
        lastX.value = tx;
        lastY.value = ty;
        lastSize.value = [args.width, args.height];
    }
};

const onScrollUpdate = (args: Rectangle & { paddingRight: number }) => {
    lastArgs.value = args;
    processArgs();
};

watch(() => [props.columns, props.rowHeight, props.rows, props.freezeColumns, props.smoothScrollX, props.smoothScrollY], () => {
    processArgs();
});

onMounted(() => {
    processArgs();
});
</script>
