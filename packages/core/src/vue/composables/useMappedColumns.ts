import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { mapColumns, type MappedGridColumn } from "../../shared/mapped-columns.js";
import { getEffectiveColumns, getStickyWidth, type ColumnDnDState } from "../../shared/columns.js";
import type { InnerGridColumn } from "../../internal/data-grid/data-grid-types.js";

export interface UseMappedColumnsArgs {
    columns: MaybeRefOrGetter<readonly InnerGridColumn[]>;
    freezeColumns: MaybeRefOrGetter<number>;
    dndState?: MaybeRefOrGetter<ColumnDnDState | undefined>;
    cellXOffset?: MaybeRefOrGetter<number>;
    viewportWidth?: MaybeRefOrGetter<number>;
    translateX?: MaybeRefOrGetter<number | undefined>;
}

function resolveMaybeRef<T>(value: MaybeRefOrGetter<T> | undefined): T | undefined {
    return value === undefined ? undefined : toValue(value);
}

export function useMappedColumns(args: UseMappedColumnsArgs) {
    const mappedColumns = computed<readonly MappedGridColumn[]>(() => {
        const columns = toValue(args.columns);
        const freeze = toValue(args.freezeColumns);
        return mapColumns(columns, freeze);
    });

    const stickyWidth = computed(() => getStickyWidth(mappedColumns.value, resolveMaybeRef(args.dndState)));

    const effectiveColumns = computed(() => {
        if (args.cellXOffset === undefined || args.viewportWidth === undefined) {
            return mappedColumns.value;
        }

        return getEffectiveColumns(
            mappedColumns.value,
            toValue(args.cellXOffset),
            toValue(args.viewportWidth),
            resolveMaybeRef(args.dndState),
            resolveMaybeRef(args.translateX)
        );
    });

    return {
        mappedColumns,
        stickyWidth,
        effectiveColumns,
    };
}
