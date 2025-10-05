<template>
    <div class="gdg-date-picker-cell">
        <span class="date-display">{{ displayText }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DatePickerCell } from "../types";

defineProps<{
    cell: DatePickerCell;
    width: number;
    height: number;
}>();

const displayText = computed(() => {
    return "Date picker cell"; // Simplified display for now
});
</script>

<style scoped>
.gdg-date-picker-cell {
    display: flex;
    align-items: center;
    padding: 0 8px;
    height: 100%;
    font-size: 13px;
    color: #333;
}

.date-display {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>