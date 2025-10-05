import { computed, ref, type Ref } from 'vue';

export { useCollapsingGroups } from './use-collapsing-groups';
export { useMoveableColumns } from './use-movable-columns';
export { useColumnSort, compareSmart, compareRaw } from './use-column-sort';
export { useUndoRedo } from './use-undo-redo';
export { useAsyncDataSource } from './use-async-data-source';

export interface UseStaticDataSourceOptions<Row> {
    readonly initialRows?: readonly Row[];
}

export interface StaticDataSource<Row> {
    readonly rows: Ref<Row[]>;
    readonly rowCount: Ref<number>;
    replaceRows(rows: Row[]): void;
}

export const useStaticDataSource = <Row>(
    options: UseStaticDataSourceOptions<Row> = {}
): StaticDataSource<Row> => {
    const initialRows = options.initialRows ? [...options.initialRows] : [];
    const rowsRef = ref<Row[]>(initialRows);

    const rowCount = computed<number>(() => rowsRef.value.length);

    const replaceRows = (rows: Row[]) => {
        rowsRef.value = [...rows];
    };

    return {
        rows: rowsRef as Ref<Row[]>,
        rowCount,
        replaceRows
    };
};
