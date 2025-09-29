import { computed } from "vue";
import { computeBounds } from "../../shared/bounds.js";
import { getColumnIndexForX, getRowIndexForY } from "../../shared/geometry.js";
import type { MappedGridColumn } from "../../shared/mapped-columns.js";

export interface UseGridGeometryArgs {
    mappedColumns: Readonly<MappedGridColumn[]>;
    freezeColumns: number;
    freezeTrailingRows: number;
    groupHeaderHeight: number;
    totalHeaderHeight: number;
    rowHeight: number | ((index: number) => number);
}

export function useGridGeometry(args: UseGridGeometryArgs) {
    const columns = computed(() => args.mappedColumns);

    const boundsForCell = (
        col: number,
        row: number,
        width: number,
        height: number,
        cellXOffset: number,
        cellYOffset: number,
        translateX: number,
        translateY: number,
        rows: number
    ) =>
        computeBounds(
            col,
            row,
            width,
            height,
            args.groupHeaderHeight,
            args.totalHeaderHeight,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            rows,
            args.freezeColumns,
            args.freezeTrailingRows,
            columns.value,
            args.rowHeight
        );

    return {
        columns,
        boundsForCell,
        getColumnIndexForX,
        getRowIndexForY,
    };
}
