import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { computeBounds } from "../../shared/bounds.js";
import { getColumnIndexForX, getRowIndexForY } from "../../shared/geometry.js";
import type { MappedGridColumn } from "../../shared/mapped-columns.js";

export interface UseGridGeometryArgs {
    mappedColumns: MaybeRefOrGetter<readonly MappedGridColumn[]>;
    freezeColumns: MaybeRefOrGetter<number>;
    freezeTrailingRows: MaybeRefOrGetter<number>;
    groupHeaderHeight: MaybeRefOrGetter<number>;
    totalHeaderHeight: MaybeRefOrGetter<number>;
    rowHeight: MaybeRefOrGetter<number | ((index: number) => number)>;
}

export function useGridGeometry(args: UseGridGeometryArgs) {
    const columns = computed(() => toValue(args.mappedColumns));
    const freezeColumns = computed(() => toValue(args.freezeColumns));
    const freezeTrailingRows = computed(() => toValue(args.freezeTrailingRows));
    const groupHeaderHeight = computed(() => toValue(args.groupHeaderHeight));
    const totalHeaderHeight = computed(() => toValue(args.totalHeaderHeight));
    const rowHeight = computed(() => toValue(args.rowHeight));

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
            groupHeaderHeight.value,
            totalHeaderHeight.value,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            rows,
            freezeColumns.value,
            freezeTrailingRows.value,
            columns.value,
            rowHeight.value
        );

    return {
        columns,
        boundsForCell,
        getColumnIndexForX,
        getRowIndexForY,
    };
}
