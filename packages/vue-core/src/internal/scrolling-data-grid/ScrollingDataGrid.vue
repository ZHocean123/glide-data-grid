<template>
  <InfiniteScroller
    ref="infiniteScrollerRef"
    :class="className"
    :client-height="clientHeight"
    :scroll-width="scrollWidth"
    :scroll-height="scrollHeight"
    :right-element="rightElement"
    :right-element-props="rightElementProps"
    :padding-bottom="paddingBottom"
    :padding-right="paddingRight"
    :draggable="isDraggable === true || typeof isDraggable === 'string'"
    :prevent-diagonal-scrolling="preventDiagonalScrolling"
    :kinetic-scroll-perf-hack="experimental?.kineticScrollPerfHack"
    :initial-size="initialSize"
    @update="onScrollUpdate"
  >
    <DataGridDnd
      :event-target-ref="infiniteScrollerRef?.scrollerRef"
      :width="clientWidth"
      :height="clientHeight"
      :accessibility-height="accessibilityHeight"
      :canvas-ref="canvasRef"
      :cell-x-offset="cellXOffset"
      :cell-y-offset="cellYOffset"
      :columns="columns"
      :disabled-rows="disabledRows"
      :enable-groups="enableGroups"
      :fill-handle="fillHandle"
      :first-col-accessible="firstColAccessible"
      :fixed-shadow-x="fixedShadowX"
      :fixed-shadow-y="fixedShadowY"
      :freeze-columns="freezeColumns"
      :get-cell-content="getCellContent"
      :get-cell-renderer="getCellRenderer"
      :get-group-details="getGroupDetails"
      :get-row-theme-override="getRowThemeOverride"
      :group-header-height="groupHeaderHeight"
      :header-height="headerHeight"
      :highlight-regions="highlightRegions"
      :image-window-loader="imageWindowLoader"
      :is-filling="isFilling"
      :is-focused="isFocused"
      :lock-columns="lockColumns"
      :max-column-width="maxColumnWidth"
      :min-column-width="minColumnWidth"
      :on-header-menu-click="onHeaderMenuClick"
      :on-header-indicator-click="onHeaderIndicatorClick"
      :on-mouse-move="onMouseMove"
      :prelight-cells="prelightCells"
      :row-height="rowHeight"
      :rows="rows"
      :selection="selection"
      :theme="theme"
      :freeze-trailing-rows="freezeTrailingRows"
      :has-append-row="hasAppendRow"
      :translate-x="translateX"
      :translate-y="translateY"
      :on-column-propose-move="onColumnProposeMove"
      :vertical-border="verticalBorder"
      :draw-focus-ring="drawFocusRing"
      :draw-header="drawHeader"
      :draw-cell="drawCell"
      :experimental="experimental"
      :grid-ref="gridRef"
      :header-icons="headerIcons"
      :is-draggable="isDraggable"
      :on-canvas-blur="onCanvasBlur"
      :on-canvas-focused="onCanvasFocused"
      :on-cell-focused="onCellFocused"
      :on-column-moved="onColumnMoved"
      :on-column-resize="onColumnResize"
      :on-column-resize-end="onColumnResizeEnd"
      :on-column-resize-start="onColumnResizeStart"
      :on-context-menu="onContextMenu"
      :on-drag-end="onDragEnd"
      :on-drag-leave="onDragLeave"
      :on-drag-over-cell="onDragOverCell"
      :on-drag-start="onDragStart"
      :on-drop="onDrop"
      :on-item-hovered="onItemHovered"
      :on-key-down="onKeyDown"
      :on-key-up="onKeyUp"
      :on-mouse-down="onMouseDown"
      :on-mouse-up="onMouseUp"
      :on-row-moved="onRowMoved"
      :smooth-scroll-x="smoothScrollX"
      :smooth-scroll-y="smoothScrollY"
      :resize-indicator="resizeIndicator"
    />
  </InfiniteScroller>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import InfiniteScroller from "./InfiniteScroller.vue";
import DataGridDnd from "../data-grid-dnd/DataGridDnd.vue";
import type { Rectangle } from "../data-grid/data-grid-types.js";

interface Props {
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
  readonly overscrollX: number | undefined;
  readonly overscrollY: number | undefined;
  readonly initialSize: readonly [width: number, height: number] | undefined;
  readonly preventDiagonalScrolling: boolean | undefined;
  readonly rightElementProps:
    | {
        readonly sticky?: boolean;
        readonly fill?: boolean;
      }
    | undefined;
  readonly rightElement: any;
  readonly clientSize: readonly [number, number, number]; // [width, height, rightElSize]
  readonly nonGrowWidth: number;
  readonly columns: any[];
  readonly rows: number;
  readonly rowHeight: number | ((row: number) => number);
  readonly headerHeight: number;
  readonly groupHeaderHeight: number;
  readonly enableGroups: boolean;
  readonly freezeColumns: number;
  readonly experimental?: {
    readonly paddingRight?: number;
    readonly paddingBottom?: number;
    readonly kineticScrollPerfHack?: boolean;
  };
  readonly smoothScrollX?: boolean;
  readonly smoothScrollY?: boolean;
  readonly isDraggable?: boolean | string;
  readonly accessibilityHeight?: number;
  readonly canvasRef?: { value: HTMLCanvasElement | null };
  readonly cellXOffset?: number;
  readonly cellYOffset?: number;
  readonly disabledRows?: readonly number[];
  readonly fillHandle?: any;
  readonly firstColAccessible?: boolean;
  readonly fixedShadowX?: number;
  readonly fixedShadowY?: number;
  readonly getCellContent?: any;
  readonly getCellRenderer?: any;
  readonly getGroupDetails?: any;
  readonly getRowThemeOverride?: any;
  readonly highlightRegions?: any[];
  readonly imageWindowLoader?: any;
  readonly isFilling?: boolean;
  readonly isFocused?: boolean;
  readonly lockColumns?: number;
  readonly maxColumnWidth?: number;
  readonly minColumnWidth?: number;
  readonly onHeaderMenuClick?: any;
  readonly onHeaderIndicatorClick?: any;
  readonly onMouseMove?: any;
  readonly prelightCells?: any[];
  readonly selection?: any;
  readonly theme?: any;
  readonly freezeTrailingRows?: number;
  readonly hasAppendRow?: boolean;
  readonly translateX?: number;
  readonly translateY?: number;
  readonly onColumnProposeMove?: any;
  readonly verticalBorder?: any;
  readonly drawFocusRing?: boolean;
  readonly drawHeader?: any;
  readonly drawCell?: any;
  readonly gridRef?: { value: any };
  readonly headerIcons?: any;
  readonly onCanvasBlur?: any;
  readonly onCanvasFocused?: any;
  readonly onCellFocused?: any;
  readonly onColumnMoved?: any;
  readonly onColumnResize?: any;
  readonly onColumnResizeEnd?: any;
  readonly onColumnResizeStart?: any;
  readonly onContextMenu?: any;
  readonly onDragEnd?: any;
  readonly onDragLeave?: any;
  readonly onDragOverCell?: any;
  readonly onDragStart?: any;
  readonly onDrop?: any;
  readonly onItemHovered?: any;
  readonly onKeyDown?: any;
  readonly onKeyUp?: any;
  readonly onMouseDown?: any;
  readonly onMouseUp?: any;
  readonly onRowMoved?: any;
  readonly resizeIndicator?: any;
}

const props = withDefaults(defineProps<Props>(), {
  smoothScrollX: false,
  smoothScrollY: false,
});

// Refs
const infiniteScrollerRef = ref<InstanceType<typeof InfiniteScroller> | null>(null);
const last = ref<Rectangle | undefined>();
const lastX = ref<number | undefined>();
const lastY = ref<number | undefined>();
const lastSize = ref<readonly [number, number] | undefined>();
const lastArgs = ref<Rectangle & { paddingRight: number }>();

// Computed properties
const clientWidth = computed(() => props.clientSize[0]);
const clientHeight = computed(() => props.clientSize[1]);
const paddingRight = computed(() => props.experimental?.paddingRight);
const paddingBottom = computed(() => props.experimental?.paddingBottom);

const width = computed(() => props.nonGrowWidth + Math.max(0, props.overscrollX ?? 0));

const height = computed(() => {
  let h = props.enableGroups ? props.headerHeight + props.groupHeaderHeight : props.headerHeight;
  if (typeof props.rowHeight === "number") {
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

const scrollWidth = computed(() => width.value + (paddingRight.value ?? 0));
const scrollHeight = computed(() => height.value + (paddingBottom.value ?? 0));

// Process scroll args
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
  if (typeof props.rowHeight === "number") {
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

// Event handlers
const onScrollUpdate = (args: Rectangle & { paddingRight: number }) => {
  lastArgs.value = args;
  processArgs();
};

// Watch for changes
watch(
  [
    () => props.columns,
    () => props.rowHeight,
    () => props.rows,
    () => props.onVisibleRegionChanged,
    () => props.freezeColumns,
    () => props.smoothScrollX,
    () => props.smoothScrollY,
  ],
  () => {
    processArgs();
  },
  { immediate: true }
);

// Expose ref
defineExpose({
  infiniteScrollerRef,
});
</script>