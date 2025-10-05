import { ref, computed, onMounted, onUnmounted } from "vue";
import type { EditableGridCell, GridCell, GridSelection, Item, DataEditorRef } from "@glideapps/glide-data-grid";

interface Edit {
    cell: Item;
    newValue: EditableGridCell;
}

interface Batch {
    edits: Edit[];
    selection: GridSelection;
}

export function useUndoRedo(
    gridRef: { value: DataEditorRef | null },
    getCellContent: (cell: Item) => GridCell,
    onCellEdited: (cell: Item, newValue: EditableGridCell) => void,
    onGridSelectionChange?: (newVal: GridSelection) => void
) {
    const undoHistory = ref<Batch[]>([]);
    const redoHistory = ref<Batch[]>([]);
    const currentBatch = ref<Batch | null>(null);
    const timeout = ref<any>(null);
    const isApplyingUndo = ref(false);
    const isApplyingRedo = ref(false);
    const gridSelection = ref<GridSelection | null>(null);

    const canUndo = computed(() => undoHistory.value.length > 0);
    const canRedo = computed(() => redoHistory.value.length > 0);

    const onGridSelectionChangedEdited = (newVal: GridSelection) => {
        if (onGridSelectionChange) {
            onGridSelectionChange(newVal);
        }
        gridSelection.value = newVal;
    };

    const wrappedOnCellEdited = (cell: Item, newValue: EditableGridCell) => {
        const isApplyingUpdate = isApplyingUndo.value || isApplyingRedo.value;

        if (!isApplyingUpdate && gridSelection.value) {
            clearTimeout(timeout.value);
            const previousValue = getCellContent(cell) as EditableGridCell;

            if (currentBatch.value === null) {
                currentBatch.value = {
                    edits: [],
                    selection: gridSelection.value,
                };
            }
            currentBatch.value.edits.push({ cell, newValue: previousValue });

            // When pasting lots of edits arrive sequentially. Undo/redo should replay in a batch so using a timeout to kick to the end of the event loop
            timeout.value = setTimeout(() => {
                if (currentBatch.value) {
                    undoHistory.value.push(currentBatch.value);
                    redoHistory.value = [];
                    currentBatch.value = null;
                }
            }, 0);
        }

        // Continue with the edit
        onCellEdited(cell, newValue);
    };

    const undo = () => {
        if (!canUndo.value) return;

        const operation = undoHistory.value.pop();
        if (!operation) return;

        isApplyingUndo.value = true;

        const cells: { cell: Item }[] = [];
        const previousState: Batch = {
            edits: [],
            selection: gridSelection.value!,
        };

        for (const edit of operation.edits) {
            const prevValue = getCellContent(edit.cell) as EditableGridCell;
            previousState.edits.push({ cell: edit.cell, newValue: prevValue });
            onCellEdited(edit.cell, edit.newValue);
            cells.push({ cell: edit.cell });
        }

        gridSelection.value = operation.selection;
        onGridSelectionChangedEdited(operation.selection);
        gridRef.value?.updateCells(cells);

        redoHistory.value.push(previousState);
        isApplyingUndo.value = false;
    };

    const redo = () => {
        if (!canRedo.value) return;

        const operation = redoHistory.value.pop();
        if (!operation) return;

        isApplyingRedo.value = true;

        const cells: { cell: Item }[] = [];
        const previousState: Batch = {
            edits: [],
            selection: gridSelection.value!,
        };

        for (const edit of operation.edits) {
            const prevValue = getCellContent(edit.cell) as EditableGridCell;
            previousState.edits.push({ cell: edit.cell, newValue: prevValue });
            onCellEdited(edit.cell, edit.newValue);
            cells.push({ cell: edit.cell });
        }

        gridSelection.value = operation.selection;
        onGridSelectionChangedEdited(operation.selection);
        gridRef.value?.updateCells(cells);

        undoHistory.value.push(previousState);
        isApplyingRedo.value = false;
    };

    // Attach the keyboard shortcuts. CMD+Z and CMD+SHIFT+Z on mac, CTRL+Z and CTRL+Y on windows.
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }

        if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
            redo();
        }
    };

    onMounted(() => {
        window.addEventListener("keydown", onKeyDown);
    });

    onUnmounted(() => {
        window.removeEventListener("keydown", onKeyDown);
    });

    return {
        undo,
        redo,
        canUndo,
        canRedo,
        onCellEdited: wrappedOnCellEdited,
        onGridSelectionChange: onGridSelectionChangedEdited,
        gridSelection,
    };
}