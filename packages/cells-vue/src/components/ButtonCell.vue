<template>
    <div class="gdg-button-cell">
        <button
            class="button"
            :style="buttonStyle"
            @click="handleClick"
        >
            {{ cell.title }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ButtonCell } from "../types";

const { cell } = defineProps<{
    cell: ButtonCell;
    width: number;
    height: number;
}>();

const handleClick = () => {
    if (cell.onClick) {
        cell.onClick();
    }
};

const buttonStyle = computed(() => {
    return {
        backgroundColor: typeof cell.backgroundColor === 'string' ? cell.backgroundColor : undefined,
        color: typeof cell.color === 'string' ? cell.color : undefined,
        borderColor: typeof cell.borderColor === 'string' ? cell.borderColor : undefined,
        borderRadius: cell.borderRadius ? `${cell.borderRadius}px` : undefined,
    };
});
</script>

<style scoped>
.gdg-button-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 4px;
}

.button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f5f5f5;
    color: #333;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 60px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.button:hover {
    background-color: #e0e0e0;
    border-color: #999;
}

.button:active {
    background-color: #d0d0d0;
}
</style>