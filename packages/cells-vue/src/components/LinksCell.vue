<template>
    <div class="gdg-links-cell">
        <span
            v-for="(link, index) in visibleLinks"
            :key="index"
            class="link-item"
            :class="{ 'with-comma': index < visibleLinks.length - 1 }"
        >
            {{ link.title }}
        </span>
        <span v-if="hasMoreLinks" class="more-indicator">
            +{{ cell.links.length - visibleLinks.length }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LinksCell } from "../types";

const { cell } = defineProps<{
    cell: LinksCell;
    width: number;
    height: number;
}>();

const visibleLinks = computed(() => {
    // Simplified - show first 2-3 links based on available width
    return cell.links?.slice(0, 3) || [];
});

const hasMoreLinks = computed(() => {
    return (cell.links?.length || 0) > 3;
});
</script>

<style scoped>
.gdg-links-cell {
    display: flex;
    align-items: center;
    padding: 0 8px;
    height: 100%;
    font-size: 13px;
    color: #333;
}

.link-item {
    cursor: pointer;
    text-decoration: underline;
    margin-right: 4px;
}

.link-item.with-comma::after {
    content: ",";
    text-decoration: none;
}

.more-indicator {
    color: #666;
    font-size: 12px;
    margin-left: 4px;
}
</style>