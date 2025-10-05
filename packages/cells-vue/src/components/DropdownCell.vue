<template>
    <div class="gdg-dropdown-cell">
        <div class="dropdown-display">
            {{ displayText }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DropdownCell } from "../types";

const props = defineProps<{
    cell: DropdownCell;
    width: number;
    height: number;
}>();

const displayText = computed(() => {
    const { value, allowedValues } = props.cell;

    if (!value) return ";

    const foundOption = allowedValues.find(opt => {
        if (typeof opt === "string" || opt === null || opt === undefined) {
            return opt === value;
        }
        return opt.value === value;
    });

    if (typeof foundOption === "string") {
        return foundOption;
    }

    return foundOption?.label ?? ";
});
</script>

<style scoped>
.gdg-dropdown-cell {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

.dropdown-display {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>