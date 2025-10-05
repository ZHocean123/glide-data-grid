import { ref, computed, watch } from "vue";
import type { DataEditorProps, GridColumn } from "@glideapps/glide-data-grid";
import orderBy from "lodash/orderBy";

function colToKey(c: GridColumn) {
    return c.id ?? `${c.group ?? ""}/${c.title}`;
}

function looseCompareCol(a: GridColumn, b: GridColumn | string): boolean {
    if (typeof b === "string") {
        return colToKey(a) === b;
    }
    return colToKey(a) === colToKey(b);
}

function getSortIndexByKey(needle: GridColumn, current: readonly GridColumn[], keys: readonly string[]) {
    const index = current.indexOf(needle);
    if (index === -1) return Number.MAX_SAFE_INTEGER; // should never happen

    // if we can directly remap we will
    const remapped = keys.findIndex(key => looseCompareCol(needle, key));
    if (remapped !== -1) return remapped;

    // look for its nearlest lefthand neighbor we can remap, and give a partial index
    for (let n = index; n >= 0; n--) {
        const ind = keys.findIndex(key => looseCompareCol(current[n], key));
        if (ind !== -1) return ind + 0.5;
    }

    return -1;
}

type Props = Pick<DataEditorProps, "columns" | "onColumnMoved" | "getCellContent">;

// this cannot actually be made transparent to the user. Doing so would break things like
// selection rnages being rectangular. The mangled columns need to actually be returned to the
// user so they can be referenced and understood correctly in other callbacks they may provide

// Darn
export function useMoveableColumns(p: Props): Required<Props> {
    const { columns: columnsIn, getCellContent: getCellContentIn, onColumnMoved: onColumnMovedIn } = p;

    const keys = ref<string[]>(columnsIn.map(colToKey));

    const columns = computed(() => {
        return orderBy(columnsIn, c => getSortIndexByKey(c, columnsIn, keys.value));
    });

    const onColumnMoved = (startIndex: number, endIndex: number) => {
        const newCols = [...keys.value];
        const [toMove] = newCols.splice(startIndex, 1);
        newCols.splice(endIndex, 0, toMove);
        keys.value = newCols;
        onColumnMovedIn?.(startIndex, endIndex);
    };

    watch(
        () => columnsIn,
        () => {
            keys.value = orderBy(columnsIn, x => getSortIndexByKey(x, columnsIn, keys.value)).map(colToKey);
        },
        { deep: true }
    );

    const getCellContent = ([col, row]: [number, number]) => {
        const needle = columns.value[col];
        const index = columnsIn.indexOf(needle);
        return getCellContentIn([index, row]);
    };

    return {
        columns: columns.value,
        onColumnMoved,
        getCellContent,
    };
}