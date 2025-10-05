import {
    type CellArray,
    CompactSelection,
    type DataEditorProps,
    type DataEditorRef,
    type EditableGridCell,
    type GridCell,
    GridCellKind,
    type Item,
    type Rectangle,
} from '@glideapps/glide-data-grid';
import range from 'lodash/range';
import chunk from 'lodash/chunk';
import { ref, computed, watch, type Ref } from 'vue';

type Range = readonly [startIndex: number, endIndex: number];
export type RowCallback<T> = (range: Range) => Promise<readonly T[]>;
export type RowToCell<T> = (row: T, col: number) => GridCell;
export type RowEditedCallback<T> = (cell: Item, newVal: EditableGridCell, rowData: T) => T | undefined;

export function useAsyncDataSource<TRowType>(
    pageSize: number,
    maxConcurrency: number,
    getRowData: RowCallback<TRowType>,
    toCell: RowToCell<TRowType>,
    onEdited: RowEditedCallback<TRowType>,
    gridRef: Ref<DataEditorRef | null>
): Pick<DataEditorProps, 'getCellContent' | 'onVisibleRegionChanged' | 'onCellEdited' | 'getCellsForSelection'> {
    pageSize = Math.max(pageSize, 1);
    const loadingRef = ref(CompactSelection.empty());
    const dataRef = ref<TRowType[]>([]);

    const visiblePages = ref<Rectangle>({ x: 0, y: 0, width: 0, height: 0 });

    const onVisibleRegionChanged: NonNullable<DataEditorProps['onVisibleRegionChanged']> = (r) => {
        const current = visiblePages.value;
        if (r.x === current.x && r.y === current.y && r.width === current.width && r.height === current.height) return;
        visiblePages.value = r;
    };

    const getCellContent = (cell: [number, number]): GridCell => {
        const [col, row] = cell;
        const rowData: TRowType | undefined = dataRef.value[row];
        if (rowData !== undefined) {
            return toCell(rowData, col);
        }
        return {
            kind: GridCellKind.Loading,
            allowOverlay: false,
        };
    };

    const loadPage = async (page: number) => {
        loadingRef.value = loadingRef.value.add(page);
        const startIndex = page * pageSize;
        const d = await getRowData([startIndex, (page + 1) * pageSize]);

        const vr = visiblePages.value;

        const damageList: { cell: [number, number] }[] = [];
        const data = dataRef.value;
        for (let i = 0; i < d.length; i++) {
            data[i + startIndex] = d[i];
            for (let col = vr.x; col <= vr.x + vr.width; col++) {
                damageList.push({
                    cell: [col, i + startIndex],
                });
            }
        }
        gridRef.value?.updateCells(damageList);
    };

    const getCellsForSelection = (r: Rectangle): (() => Promise<CellArray>) => {
        return async () => {
            const firstPage = Math.max(0, Math.floor(r.y / pageSize));
            const lastPage = Math.floor((r.y + r.height) / pageSize);

            for (const pageChunk of chunk(
                range(firstPage, lastPage + 1).filter(i => !loadingRef.value.hasIndex(i)),
                maxConcurrency
            )) {
                await Promise.all(pageChunk.map(loadPage));
            }

            const result: GridCell[][] = [];

            for (let y = r.y; y < r.y + r.height; y++) {
                const row: GridCell[] = [];
                for (let x = r.x; x < r.x + r.width; x++) {
                    row.push(getCellContent([x, y]));
                }
                result.push(row);
            }

            return result;
        };
    };

    watch(visiblePages, (newVisiblePages) => {
        const r = newVisiblePages;
        const firstPage = Math.max(0, Math.floor((r.y - pageSize / 2) / pageSize));
        const lastPage = Math.floor((r.y + r.height + pageSize / 2) / pageSize);
        for (const page of range(firstPage, lastPage + 1)) {
            if (loadingRef.value.hasIndex(page)) continue;
            void loadPage(page);
        }
    }, { immediate: true });

    const onCellEdited = (cell: Item, newVal: EditableGridCell) => {
        const [, row] = cell;
        const current = dataRef.value[row];
        if (current === undefined) return;

        const result = onEdited(cell, newVal, current);
        if (result !== undefined) {
            dataRef.value[row] = result;
        }
    };

    return {
        getCellContent,
        onVisibleRegionChanged,
        onCellEdited,
        getCellsForSelection,
    };
}
