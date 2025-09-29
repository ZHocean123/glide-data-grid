<template>
    <div
        class="gdg-vue-grid"
        :style="gridStyle"
        :data-first-header-x="sampleBounds?.x ?? 0"
        :data-first-header-width="sampleBounds?.width ?? 0"
    >
        <div
            v-if="enableGroups && groupHeaderHeight > 0"
            class="gdg-vue-grid-group-header"
            :style="{ height: `${groupHeaderHeight}px` }"
        >
            <div class="gdg-vue-grid-group-header-placeholder">
                Group headers pending migration
            </div>
        </div>
        <div class="gdg-vue-grid-header" role="row" :style="{ height: `${headerHeight}px` }">
            <div
                v-for="col in headerColumns"
                :key="col.id ?? col.sourceIndex"
                class="gdg-vue-grid-header-cell"
                role="columnheader"
                :style="{ width: `${col.width}px` }"
            >
                <span class="gdg-vue-grid-header-title">{{ col.title }}</span>
            </div>
            <div v-if="headerColumns.length === 0" class="gdg-vue-grid-header-empty">
                No columns mapped yet.
            </div>
        </div>
        <div class="gdg-vue-grid-body" role="presentation" :style="{ height: `${bodyHeight}px` }">
            <div class="gdg-vue-grid-body-placeholder">Vue canvas rendering port in progress.</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";
import type { InnerGridColumn } from "../../internal/data-grid/data-grid-types.js";
import { useMappedColumns } from "../composables/useMappedColumns.js";
import { useGridGeometry } from "../composables/useGridGeometry.js";

interface DataGridProps {
    width: number;
    height: number;
    columns: readonly InnerGridColumn[];
    rows: number;
    freezeColumns?: number;
    freezeTrailingRows?: number;
    cellXOffset?: number;
    cellYOffset?: number;
    translateX?: number;
    translateY?: number;
    viewportWidth?: number;
    groupHeaderHeight?: number;
    headerHeight?: number;
    rowHeight?: number | ((index: number) => number);
    enableGroups?: boolean;
}

const props = withDefaults(defineProps<DataGridProps>(), {
    freezeColumns: 0,
    freezeTrailingRows: 0,
    cellXOffset: 0,
    cellYOffset: 0,
    translateX: 0,
    translateY: 0,
    groupHeaderHeight: 0,
    headerHeight: 36,
    rowHeight: 24,
    enableGroups: false,
});

const {
    width,
    height,
    columns,
    rows,
    freezeColumns,
    freezeTrailingRows,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    viewportWidth,
    groupHeaderHeight,
    headerHeight,
    rowHeight,
    enableGroups,
} = toRefs(props);

const viewport = computed(() => viewportWidth.value ?? width.value);
const translateXValue = computed(() => translateX.value ?? 0);

const { mappedColumns, effectiveColumns, stickyWidth } = useMappedColumns({
    columns,
    freezeColumns,
    cellXOffset,
    viewportWidth: viewport,
    translateX: translateXValue,
});

const totalHeaderHeight = computed(() =>
    enableGroups.value ? groupHeaderHeight.value + headerHeight.value : headerHeight.value
);

const { boundsForCell } = useGridGeometry({
    mappedColumns,
    freezeColumns,
    freezeTrailingRows,
    groupHeaderHeight,
    totalHeaderHeight,
    rowHeight,
});

const headerColumns = computed(() => effectiveColumns.value);

const sampleBounds = computed(() => {
    if (mappedColumns.value.length === 0) {
        return undefined;
    }
    return boundsForCell(
        0,
        -1,
        width.value,
        height.value,
        cellXOffset.value,
        cellYOffset.value,
        translateXValue.value,
        translateY.value ?? 0,
        rows.value
    );
});

const gridStyle = computed<Record<string, string>>(() => ({
    width: `${width.value}px`,
    height: `${height.value}px`,
    "--gdg-sticky-width": `${stickyWidth.value}px`,
}));

const bodyHeight = computed(() => Math.max(height.value - totalHeaderHeight.value, 0));
</script>

<style scoped>
.gdg-vue-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--gdg-border-color, #d1d5e5);
    border-radius: 8px;
    overflow: hidden;
    background: var(--gdg-bg-surface, #ffffff);
    color: var(--gdg-text-dark, #1f2933);
    font-family: var(--gdg-font-family, 'Inter', sans-serif);
}

.gdg-vue-grid-group-header {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    background: var(--gdg-bg-group-header, #eef2ff);
    border-bottom: 1px solid var(--gdg-border-color, #d1d5e5);
}

.gdg-vue-grid-group-header-placeholder {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gdg-text-muted, #6b7280);
}

.gdg-vue-grid-header {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--gdg-border-color, #d1d5e5);
    background: var(--gdg-bg-header, #f3f4f6);
    padding-left: var(--gdg-sticky-width, 0px);
}

.gdg-vue-grid-header-cell {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 0.75rem;
    border-right: 1px solid var(--gdg-border-color, #e5e7eb);
    background: inherit;
    white-space: nowrap;
}

.gdg-vue-grid-header-cell:last-of-type {
    border-right: none;
}

.gdg-vue-grid-header-title {
    font-size: 0.82rem;
    font-weight: 600;
}

.gdg-vue-grid-header-empty {
    padding: 0.5rem;
    font-size: 0.8rem;
    color: var(--gdg-text-muted, #6b7280);
}

.gdg-vue-grid-body {
    flex: 1 1 auto;
    background: var(--gdg-bg-cell, #f8fafc);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gdg-text-muted, #6b7280);
    font-size: 0.85rem;
}

.gdg-vue-grid-body-placeholder {
    padding: 1rem;
    text-align: center;
}
</style>
