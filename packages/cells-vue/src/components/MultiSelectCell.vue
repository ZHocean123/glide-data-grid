<template>
    <div class="gdg-multi-select-cell">
        <div class="bubbles-container">
            <span
                v-for="(value, index) in displayValues"
                :key="index"
                class="bubble"
                :style="getBubbleStyle(value)"
            >
                {{ getDisplayText(value) }}
            </span>
            <span v-if="hasMoreValues" class="more-indicator">
                +{{ cell.values ? cell.values.length - displayValues.length : 0 }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MultiSelectCell, SelectOption } from "../types";

const { cell } = defineProps<{
    cell: MultiSelectCell;
    width: number;
    height: number;
}>();

const prepareOptions = (options: readonly (string | SelectOption)[]): SelectOption[] => {
    return options.map(option => {
        if (typeof option === "string" || option === null || option === undefined) {
            return { value: option, label: option ?? "" };
        }
        return {
            value: option.value,
            label: option.label ?? option.value ?? "",
            color: option.color ?? undefined,
        };
    });
};

const options = computed(() => {
    return prepareOptions(cell.options ?? []);
});

const displayValues = computed(() => {
    if (!cell.values || cell.values.length === 0) return [];

    // Show first 2-3 values based on available width
    return cell.values.slice(0, 3);
});

const hasMoreValues = computed(() => {
    return (cell.values?.length || 0) > 3;
});

const getDisplayText = (value: string) => {
    const matchedOption = options.value.find(option => option.value === value);
    return matchedOption?.label ?? value;
};

const getBubbleStyle = (value: string) => {
    const matchedOption = options.value.find(option => option.value === value);
    const backgroundColor = matchedOption?.color ?? "#e0e0e0";

    // Simple luminance calculation for text color
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return {
        backgroundColor,
        color: luminance > 0.5 ? '#000000' : '#ffffff'
    };
};
</script>

<style scoped>
.gdg-multi-select-cell {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

.bubbles-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    max-width: 100%;
}

.bubble {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
}

.more-indicator {
    color: #666;
    font-size: 12px;
    margin-left: 4px;
}
</style>