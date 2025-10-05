<template>
    <div class="gdg-tree-view-cell">
        <div
            class="tree-content"
            :style="{ marginLeft: indent + 'px' }"
        >
            <span
                v-if="cell.canOpen"
                class="tree-opener"
                :class="{ open: cell.isOpen }"
                @click="handleOpenerClick"
            >
                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                        v-if="cell.isOpen"
                        d="M4 6 L8 10 L12 6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                    <path
                        v-else
                        d="M6 4 L10 8 L6 12"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                </svg>
            </span>
            <span class="tree-text">{{ cell.text }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TreeViewCell } from "../types";

const { cell } = defineProps<{
    cell: TreeViewCell;
    width: number;
    height: number;
}>();

const indent = computed(() => {
    return cell.depth * 16;
});

const handleOpenerClick = () => {
    if (cell.canOpen && cell.onClickOpener) {
        cell.onClickOpener(cell);
    }
};
</script>

<style scoped>
.gdg-tree-view-cell {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
    font-size: 13px;
    color: #333;
}

.tree-content {
    display: flex;
    align-items: center;
    min-width: 0;
}

.tree-opener {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-right: 4px;
    cursor: pointer;
    color: #666;
    transition: color 0.2s ease;
}

.tree-opener:hover {
    color: #333;
}

.tree-opener svg {
    width: 12px;
    height: 12px;
}

.tree-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>