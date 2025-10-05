<template>
    <div class="gdg-range-cell">
        <div class="range-container">
            <div class="range-track">
                <div
                    class="range-fill"
                    :style="{ width: fillPercentage + '%' }"
                ></div>
            </div>
            <div v-if="cell.label" class="range-label">
                {{ cell.label }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RangeCell } from "../types";

const props = defineProps<{
    cell: RangeCell;
    width: number;
    height: number;
}>();

const fillPercentage = computed(() => {
    const { min, max, value } = props.cell;
    const rangeSize = max - min;
    return ((value - min) / rangeSize) * 100;
});
</script>

<style scoped>
.gdg-range-cell {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.range-track {
    flex: 1;
    height: 6px;
    background-color: #e0e0e0;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
}

.range-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: #007acc;
    border-radius: 3px;
    transition: width 0.2s ease;
}

.range-label {
    font-size: 12px;
    color: #666;
    min-width: 40px;
    text-align: right;
}
</style>