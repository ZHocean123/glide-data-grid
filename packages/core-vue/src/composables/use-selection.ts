import { ref, computed, type Ref } from 'vue';
import { CompactSelection } from '../types/data-grid-types.js';
import type { GridSelection, Item } from '../types/data-grid-types.js';

export function useSelection() {
    const selection = ref<GridSelection>({
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty()
    });

    const selectedCells = computed(() => {
        const cells: Item[] = [];
        const sel = selection.value;
        
        if (sel.current) {
            const { range } = sel.current;
            for (let col = range.x; col < range.x + range.width; col++) {
                for (let row = range.y; row < range.y + range.height; row++) {
                    cells.push([col, row]);
                }
            }
        }
        
        return cells;
    });

    const hasSelection = computed(() => {
        const sel = selection.value;
        return sel.current !== undefined || sel.columns.length > 0 || sel.rows.length > 0;
    });

    const setSelection = (newSelection: GridSelection) => {
        selection.value = newSelection;
    };

    const clearSelection = () => {
        selection.value = {
            columns: CompactSelection.empty(),
            rows: CompactSelection.empty()
        };
    };

    return {
        selection,
        selectedCells,
        hasSelection,
        setSelection,
        clearSelection
    };
}