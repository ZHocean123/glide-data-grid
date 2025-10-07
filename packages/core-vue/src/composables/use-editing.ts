import { ref, type Ref } from 'vue';
import type { Item, EditableGridCell } from '../types/data-grid-types.js';

export function useEditing(): {
    editingCell: Ref<Item | null>;
    editValue: Ref<EditableGridCell | null>;
    isEditing: Ref<boolean>;
    startEditing: (cell: Item, value: EditableGridCell) => void;
    stopEditing: () => void;
    updateEditValue: (value: EditableGridCell) => void;
} {
    const editingCell = ref<Item | null>(null);
    const editValue = ref<EditableGridCell | null>(null);
    const isEditing = ref(false);

    const startEditing = (cell: Item, value: EditableGridCell) => {
        editingCell.value = cell;
        editValue.value = value;
        isEditing.value = true;
    };

    const stopEditing = () => {
        editingCell.value = null;
        editValue.value = null;
        isEditing.value = false;
    };

    const updateEditValue = (value: EditableGridCell) => {
        editValue.value = value;
    };

    return {
        editingCell,
        editValue,
        isEditing,
        startEditing,
        stopEditing,
        updateEditValue
    };
}