import { ref, type Ref } from 'vue';
import type { Item, GridCell } from '../types/data-grid-types.js';

export interface GridEventHandlers {
    onCellClicked?: (cell: Item, event: MouseEvent) => void;
    onCellDoubleClicked?: (cell: Item, event: MouseEvent) => void;
    onCellContextMenu?: (cell: Item, event: MouseEvent) => void;
    onCellActivated?: (cell: Item) => void;
    onCellEdited?: (cell: Item, newValue: GridCell) => void;
    onSelectionChanged?: (selection: any) => void;
}

export function useEvents(handlers: GridEventHandlers = {}): {
    eventHandlers: Ref<GridEventHandlers>;
    updateHandlers: (newHandlers: GridEventHandlers) => void;
} {
    const eventHandlers = ref<GridEventHandlers>(handlers);

    const updateHandlers = (newHandlers: GridEventHandlers) => {
        eventHandlers.value = { ...eventHandlers.value, ...newHandlers };
    };

    return {
        eventHandlers,
        updateHandlers
    };
}