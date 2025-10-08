import { ref, computed, watch } from "vue";
import type { GridColumn } from "../internal/data-grid/data-grid-types.js";
import type { VisibleRegion } from "./visible-region.js";

export interface ViewportOptions {
  width: number;
  height: number;
  columns: GridColumn[];
  rows: number;
  rowHeight: number | ((row: number) => number);
  freezeColumns?: number;
  freezeTrailingRows?: number;
  headerHeight?: number;
  groupHeaderHeight?: number;
  enableGroups?: boolean;
  smoothScrollX?: boolean;
  smoothScrollY?: boolean;
}

export function useViewport(options: ViewportOptions) {
  const scrollOffset = ref({ x: 0, y: 0 });
  const visibleRegion = ref<VisibleRegion>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    tx: 0,
    ty: 0,
  });

  // Calculate the total height of the grid content
  const totalHeight = computed(() => {
    let h = options.enableGroups && options.groupHeaderHeight
      ? (options.headerHeight || 0) + options.groupHeaderHeight
      : options.headerHeight || 0;
      
    if (typeof options.rowHeight === "number") {
      h += options.rows * options.rowHeight;
    } else {
      for (let r = 0; r < options.rows; r++) {
        h += options.rowHeight(r);
      }
    }
    return h;
  });

  // Calculate the total width of the grid content
  const totalWidth = computed(() => {
    return options.columns.reduce((sum, col) => sum + col.width, 0);
  });

  // Calculate the width of frozen columns
  const frozenColumnsWidth = computed(() => {
    let width = 0;
    for (let i = 0; i < (options.freezeColumns || 0); i++) {
      width += options.columns[i]?.width || 0;
    }
    return width;
  });

  // Calculate the height of frozen trailing rows
  const frozenTrailingRowsHeight = computed(() => {
    if (!options.freezeTrailingRows || options.freezeTrailingRows <= 0) {
      return 0;
    }
    
    let height = 0;
    const startRow = Math.max(0, options.rows - options.freezeTrailingRows);
    
    if (typeof options.rowHeight === "number") {
      height = options.freezeTrailingRows * options.rowHeight;
    } else {
      for (let r = startRow; r < options.rows; r++) {
        height += options.rowHeight(r);
      }
    }
    return height;
  });

  // Calculate the visible region based on scroll offset
  const calculateVisibleRegion = (scrollX: number, scrollY: number) => {
    let x = 0;
    let tx = scrollX < 0 ? -scrollX : 0;
    let cellRight = 0;
    let cellX = 0;

    const adjustedScrollX = scrollX < 0 ? 0 : scrollX;

    // Calculate visible columns
    for (const c of options.columns) {
      const cx = x - frozenColumnsWidth.value;
      if (adjustedScrollX >= cx + c.width) {
        x += c.width;
        cellX++;
        cellRight++;
      } else if (adjustedScrollX > cx) {
        x += c.width;
        if (options.smoothScrollX) {
          tx += cx - adjustedScrollX;
        } else {
          cellX++;
        }
        cellRight++;
      } else if (adjustedScrollX + options.width > cx) {
        x += c.width;
        cellRight++;
      } else {
        break;
      }
    }

    let ty = 0;
    let cellY = 0;
    let cellBottom = 0;
    
    // Calculate visible rows
    if (typeof options.rowHeight === "number") {
      if (options.smoothScrollY) {
        cellY = Math.floor(scrollY / options.rowHeight);
        ty = cellY * options.rowHeight - scrollY;
      } else {
        cellY = Math.ceil(scrollY / options.rowHeight);
      }
      cellBottom = Math.ceil(options.height / options.rowHeight) + cellY;
      if (ty < 0) cellBottom++;
    } else {
      let y = 0;
      for (let row = 0; row < options.rows; row++) {
        const rh = options.rowHeight(row);
        const cy = y + (options.smoothScrollY ? 0 : rh / 2);
        if (scrollY >= y + rh) {
          y += rh;
          cellY++;
          cellBottom++;
        } else if (scrollY > cy) {
          y += rh;
          if (options.smoothScrollY) {
            ty += cy - scrollY;
          } else {
            cellY++;
          }
          cellBottom++;
        } else if (scrollY + options.height > rh / 2 + y) {
          y += rh;
          cellBottom++;
        } else {
          break;
        }
      }
    }

    // Ensure cellY and cellBottom never exceed the actual row count
    cellY = Math.max(0, Math.min(cellY, options.rows - 1));
    cellBottom = Math.max(cellY, Math.min(cellBottom, options.rows));

    return {
      x: cellX,
      y: cellY,
      width: cellRight - cellX,
      height: cellBottom - cellY,
      tx,
      ty,
    };
  };

  // Update visible region when scroll offset changes
  const updateVisibleRegion = () => {
    const region = calculateVisibleRegion(scrollOffset.value.x, scrollOffset.value.y);
    visibleRegion.value = {
      ...region,
      extras: {
        freezeRegions: [
          // Frozen columns region
          {
            x: 0,
            y: region.y,
            width: options.freezeColumns || 0,
            height: region.height,
          },
          // Frozen trailing rows region
          ...(options.freezeTrailingRows && options.freezeTrailingRows > 0
            ? [
                {
                  x: region.x,
                  y: Math.max(0, options.rows - options.freezeTrailingRows),
                  width: region.width,
                  height: options.freezeTrailingRows,
                },
              ]
            : []),
        ],
      },
    };
  };

  // Watch for scroll offset changes
  watch(scrollOffset, updateVisibleRegion, { immediate: true });

  // Watch for options changes
  watch(
    [
      () => options.width,
      () => options.height,
      () => options.columns,
      () => options.rows,
      () => options.rowHeight,
      () => options.freezeColumns,
      () => options.freezeTrailingRows,
      () => options.headerHeight,
      () => options.groupHeaderHeight,
      () => options.enableGroups,
      () => options.smoothScrollX,
      () => options.smoothScrollY,
    ],
    updateVisibleRegion,
    { deep: true, immediate: true }
  );

  // Scroll to a specific cell
  const scrollToCell = (col: number, row: number, alignment: "start" | "center" | "end" = "start") => {
    let scrollX = 0;
    let scrollY = 0;

    // Calculate horizontal scroll position
    for (let i = 0; i < col && i < options.columns.length; i++) {
      scrollX += options.columns[i].width;
    }

    // Adjust for alignment
    if (alignment === "center") {
      const cellWidth = options.columns[col]?.width || 0;
      scrollX = Math.max(0, scrollX - (options.width - cellWidth) / 2);
    } else if (alignment === "end") {
      const cellWidth = options.columns[col]?.width || 0;
      scrollX = Math.max(0, scrollX - options.width + cellWidth);
    }

    // Calculate vertical scroll position
    if (typeof options.rowHeight === "number") {
      scrollY = row * options.rowHeight;
      
      // Adjust for alignment
      if (alignment === "center") {
        scrollY = Math.max(0, scrollY - (options.height - options.rowHeight) / 2);
      } else if (alignment === "end") {
        scrollY = Math.max(0, scrollY - options.height + options.rowHeight);
      }
    } else {
      for (let i = 0; i < row; i++) {
        scrollY += options.rowHeight(i);
      }
      
      // Adjust for alignment
      if (alignment !== "start") {
        const cellHeight = options.rowHeight(row);
        if (alignment === "center") {
          scrollY = Math.max(0, scrollY - (options.height - cellHeight) / 2);
        } else if (alignment === "end") {
          scrollY = Math.max(0, scrollY - options.height + cellHeight);
        }
      }
    }

    // Ensure we don't scroll beyond the content bounds
    scrollX = Math.min(scrollX, Math.max(0, totalWidth.value - options.width));
    scrollY = Math.min(scrollY, Math.max(0, totalHeight.value - options.height));

    scrollOffset.value = { x: scrollX, y: scrollY };
  };

  // Scroll by a specific amount
  const scrollBy = (deltaX: number, deltaY: number) => {
    const newX = Math.max(0, Math.min(scrollOffset.value.x + deltaX, totalWidth.value - options.width));
    const newY = Math.max(0, Math.min(scrollOffset.value.y + deltaY, totalHeight.value - options.height));
    scrollOffset.value = { x: newX, y: newY };
  };

  return {
    scrollOffset,
    visibleRegion,
    totalHeight,
    totalWidth,
    frozenColumnsWidth,
    frozenTrailingRowsHeight,
    scrollToCell,
    scrollBy,
    updateVisibleRegion,
  };
}