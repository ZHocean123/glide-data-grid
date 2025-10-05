<template>
    <div class="gdg-tags-cell">
        <div class="tags-container">
            <span
                v-for="(tag, index) in visibleTags"
                :key="index"
                class="tag"
                :style="{ backgroundColor: getTagColor(tag) }"
            >
                {{ tag }}
            </span>
            <span v-if="hasMoreTags" class="more-tags">
                +{{ cell.tags.length - visibleTags.length }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TagsCell } from "../types";

const props = defineProps<{
    cell: TagsCell;
    width: number;
}>();

// Calculate how many tags can fit in the available width
const visibleTags = computed(() => {
    const { tags } = props.cell;
    if (!tags || tags.length === 0) return [];

    // Simple calculation: assume each tag takes ~60px + margin
    const maxVisible = Math.floor(props.width / 70);
    return tags.slice(0, Math.max(1, maxVisible - 1)); // Leave space for "+X" indicator
});

const hasMoreTags = computed(() => {
    return props.cell.tags && props.cell.tags.length > visibleTags.value.length;
});

// Generate consistent colors for tags
const getTagColor = (tag: string) => {
    const colors = [
        "#e3f2fd",
        "#f3e5f5",
        "#e8f5e8",
        "#fff3e0",
        "#fbe9e7",
        "#fce4ec",
        "#f3e5f5",
        "#e8eaf6"
    ];

    // Simple hash function for consistent coloring
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = ((hash << 5) - hash) + tag.charCodeAt(i);
        hash = hash & hash;
    }

    return colors[Math.abs(hash) % colors.length];
};
</script>

<style scoped>
.gdg-tags-cell {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
}

.tag {
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 11px;
    line-height: 1.2;
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.more-tags {
    font-size: 11px;
    color: #666;
    margin-left: 2px;
}
</style>