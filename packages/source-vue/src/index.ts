import { computed, ref, readonly, type Ref } from "vue";

export interface UseStaticDataSourceOptions<Row> {
    readonly initialRows?: readonly Row[];
}

export interface StaticDataSource<Row> {
    readonly rows: Ref<readonly Row[]>;
    readonly rowCount: Ref<number>;
    replaceRows(rows: readonly Row[]): void;
}

export const useStaticDataSource = <Row>(
    options: UseStaticDataSourceOptions<Row> = {}
): StaticDataSource<Row> => {
    const rowsRef = ref<readonly Row[]>(options.initialRows ?? []);

    const rowCount = computed(() => rowsRef.value.length);

    const replaceRows = (rows: readonly Row[]) => {
        rowsRef.value = rows;
    };

    return {
        rows: readonly(rowsRef),
        rowCount: readonly(rowCount),
        replaceRows
    };
};
