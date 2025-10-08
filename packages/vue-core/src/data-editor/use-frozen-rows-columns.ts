import { ref, computed, watch } from "vue";
import type { Rectangle, GridColumn } from "../internal/data-grid/data-grid-types.js";

export interface FrozenRowsColumnsOptions {
  columns: GridColumn[];
  rows: number;
  freezeColumns?: number;
  freezeTrailingRows?: number;
  rowHeight: number | ((row: number) => number);
  headerHeight?: number;
  groupHeaderHeight?: number;
  enableGroups?: boolean;
  width: number;
  height: number;
  scrollOffset: { x: number; y: number };
}

export function useFrozenRowsColumns(options: FrozenRowsColumnsOptions) {
  // State
  const frozenRegions = ref<Rectangle[]>([]);
  const freezeColumnsWidth = ref(0);
  const freezeTrailingRowsHeight = ref(0);

  // Calculate frozen columns width
  const calculateFreezeColumnsWidth = () => {
    let width = 0;
    for (let i = 0; i < (options.freezeColumns || 0); i++) {
      width += options.columns[i]?.width || 0;
    }
    freezeColumnsWidth.value = width;
  };

  // Calculate frozen trailing rows height
  const calculateFreezeTrailingRowsHeight = () => {
    if (!options.freezeTrailingRows || options.freezeTrailingRows <= 0) {
      freezeTrailingRowsHeight.value = 0;
      return;
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

    freezeTrailingRowsHeight.value = height;
  };

  // Calculate frozen regions
  const calculateFrozenRegions = () => {
    const regions: Rectangle[] = [];
    const headerHeight = options.enableGroups && options.groupHeaderHeight 
      ? (options.headerHeight || 0) + options.groupHeaderHeight 
      : options.headerHeight || 0;

    // Frozen columns region (excluding headers)
    if (options.freezeColumns && options.freezeColumns > 0) {
      regions.push({
        x: 0,
        y: headerHeight,
        width: freezeColumnsWidth.value,
        height: options.height - headerHeight - freezeTrailingRowsHeight.value,
      });
    }

    // Frozen trailing rows region
    if (options.freezeTrailingRows && options.freezeTrailingRows > 0) {
      const frozenRowsStartY = Math.max(0, options.rows - options.freezeTrailingRows);
      let frozenRowsPixelY = headerHeight;

      // Calculate pixel position of frozen rows
      if (typeof options.rowHeight === "number") {
        frozenRowsPixelY += frozenRowsStartY * options.rowHeight;
      } else {
        for (let r = 0; r < frozenRowsStartY; r++) {
          frozenRowsPixelY += options.rowHeight(r);
        }
      }

      regions.push({
        x: freezeColumnsWidth.value,
        y: frozenRowsPixelY,
        width: options.width - freezeColumnsWidth.value,
        height: freezeTrailingRowsHeight.value,
      });
    }

    // Corner region (intersection of frozen columns and frozen trailing rows)
    if (options.freezeColumns && options.freezeColumns > 0 && 
        options.freezeTrailingRows && options.freezeTrailingRows > 0) {
      const frozenRowsStartY = Math.max(0, options.rows - options.freezeTrailingRows);
      let frozenRowsPixelY = headerHeight;

      // Calculate pixel position of frozen rows
      if (typeof options.rowHeight === "number") {
        frozenRowsPixelY += frozenRowsStartY * options.rowHeight;
      } else {
        for (let r = 0; r < frozenRowsStartY; r++) {
          frozenRowsPixelY += options.rowHeight(r);
        }
      }

      regions.push({
        x: 0,
        y: frozenRowsPixelY,
        width: freezeColumnsWidth.value,
        height: freezeTrailingRowsHeight.value,
      });
    }

    frozenRegions.value = regions;
  };

  // Check if a cell is in a frozen region
  const isCellFrozen = (col: number, row: number): boolean => {
    // Check if column is frozen
    if (options.freezeColumns && col < options.freezeColumns) {
      return true;
    }

    // Check if row is in frozen trailing rows
    if (options.freezeTrailingRows && options.freezeTrailingRows > 0) {
      const frozenRowsStart = Math.max(0, options.rows - options.freezeTrailingRows);
      if (row >= frozenRowsStart) {
        return true;
      }
    }

    return false;
  };

  // Get the frozen region for a cell
  const getCellFrozenRegion = (col: number, row: number): Rectangle | null => {
    for (const region of frozenRegions.value) {
      // This is a simplified check - in a real implementation,
      // we'd need to convert cell coordinates to pixel coordinates
      if (isCellFrozen(col, row)) {
        return region;
      }
    }
    return null;
  };

  // Get the scroll offset for frozen columns
  const getFrozenColumnsScrollOffset = computed(() => {
    return {
      x: 0, // Frozen columns don't scroll horizontally
      y: options.scrollOffset.y, // But they do scroll vertically
    };
  });

  // Get the scroll offset for frozen trailing rows
  const getFrozenTrailingRowsScrollOffset = computed(() => {
    return {
      x: options.scrollOffset.x, // Frozen trailing rows scroll horizontally
      y: 0, // But they don't scroll vertically
    };
  });

  // Get the scroll offset for the corner region
  const getCornerRegionScrollOffset = computed(() => {
    return {
      x: 0, // Corner region doesn't scroll
      y: 0,
    };
  });

  // Calculate visible area for frozen columns
  const getFrozenColumnsVisibleArea = computed((): Rectangle => {
    const headerHeight = options.enableGroups && options.groupHeaderHeight 
      ? (options.headerHeight || 0) + options.groupHeaderHeight 
      : options.headerHeight || 0;

    return {
      x: 0,
      y: headerHeight + options.scrollOffset.y,
      width: freezeColumnsWidth.value,
      height: options.height - headerHeight - freezeTrailingRowsHeight.value,
    };
  });

  // Calculate visible area for frozen trailing rows
  const getFrozenTrailingRowsVisibleArea = computed((): Rectangle => {
    const frozenRowsStartY = Math.max(0, options.rows - (options.freezeTrailingRows || 0));
    let frozenRowsPixelY = 0;

    // Calculate pixel position of frozen rows
    if (typeof options.rowHeight === "number") {
      frozenRowsPixelY = frozenRowsStartY * options.rowHeight;
    } else {
      for (let r = 0; r < frozenRowsStartY; r++) {
        frozenRowsPixelY += options.rowHeight(r);
      }
    }

    return {
      x: freezeColumnsWidth.value + options.scrollOffset.x,
      y: frozenRowsPixelY,
      width: options.width - freezeColumnsWidth.value,
      height: freezeTrailingRowsHeight.value,
    };
  });

  // Calculate visible area for corner region
  const getCornerRegionVisibleArea = computed((): Rectangle => {
    const frozenRowsStartY = Math.max(0, options.rows - (options.freezeTrailingRows || 0));
    let frozenRowsPixelY = 0;

    // Calculate pixel position of frozen rows
    if (typeof options.rowHeight === "number") {
      frozenRowsPixelY = frozenRowsStartY * options.rowHeight;
    } else {
      for (let r = 0; r < frozenRowsStartY; r++) {
        frozenRowsPixelY += options.rowHeight(r);
      }
    }

    return {
      x: 0,
      y: frozenRowsPixelY,
      width: freezeColumnsWidth.value,
      height: freezeTrailingRowsHeight.value,
    };
  });

  // Update calculations when options change
  watch(
    [
      () => options.columns,
      () => options.freezeColumns,
      () => options.freezeTrailingRows,
      () => options.rowHeight,
      () => options.rows,
      () => options.width,
      () => options.height,
      () => options.scrollOffset,
    ],
    () => {
      calculateFreezeColumnsWidth();
      calculateFreezeTrailingRowsHeight();
      calculateFrozenRegions();
    },
    { immediate: true, deep: true }
  );

  return {
    // State
    frozenRegions,
    freezeColumnsWidth,
    freezeTrailingRowsHeight,

    // Computed
    getFrozenColumnsScrollOffset,
    getFrozenTrailingRowsScrollOffset,
    getCornerRegionScrollOffset,
    getFrozenColumnsVisibleArea,
    getFrozenTrailingRowsVisibleArea,
    getCornerRegionVisibleArea,

    // Methods
    isCellFrozen,
    getCellFrozenRegion,
    calculateFrozenRegions,
  };
}