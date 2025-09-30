<template>
    <div>
        <ScrollingDataGrid
            :prelightCells="searchResults"
            :accessibilityHeight="accessibilityHeight"
            :canvasRef="canvasRef"
            :cellXOffset="cellXOffset"
            :cellYOffset="cellYOffset"
            :className="className"
            :clientSize="clientSize"
            :columns="columns"
            :disabledRows="disabledRows"
            :enableGroups="enableGroups"
            :fillHandle="fillHandle"
            :firstColAccessible="firstColAccessible"
            :nonGrowWidth="nonGrowWidth"
            :fixedShadowX="fixedShadowX"
            :fixedShadowY="fixedShadowY"
            :freezeColumns="freezeColumns"
            :getCellContent="getCellContent"
            :getCellRenderer="getCellRenderer"
            :getGroupDetails="getGroupDetails"
            :getRowThemeOverride="getRowThemeOverride"
            :groupHeaderHeight="groupHeaderHeight"
            :headerHeight="headerHeight"
            :highlightRegions="highlightRegions"
            :imageWindowLoader="imageWindowLoader"
            :initialSize="initialSize"
            :isFilling="isFilling"
            :isFocused="isFocused"
            :lockColumns="lockColumns"
            :maxColumnWidth="maxColumnWidth"
            :minColumnWidth="minColumnWidth"
            :onHeaderMenuClick="onHeaderMenuClick"
            :onHeaderIndicatorClick="onHeaderIndicatorClick"
            :onMouseMove="onMouseMove"
            :onVisibleRegionChanged="onVisibleRegionChanged"
            :overscrollX="overscrollX"
            :overscrollY="overscrollY"
            :preventDiagonalScrolling="preventDiagonalScrolling"
            :rightElement="rightElement"
            :rightElementProps="rightElementProps"
            :rowHeight="rowHeight"
            :rows="rows"
            :scrollRef="scrollRef"
            :selection="selection"
            :theme="theme"
            :freezeTrailingRows="freezeTrailingRows"
            :hasAppendRow="hasAppendRow"
            :translateX="translateX"
            :translateY="translateY"
            :verticalBorder="verticalBorder"
            :onColumnProposeMove="onColumnProposeMove"
            :drawFocusRing="drawFocusRing"
            :drawCell="drawCell"
            :drawHeader="drawHeader"
            :experimental="experimental"
            :gridRef="gridRef"
            :headerIcons="headerIcons"
            :isDraggable="isDraggable"
            :onCanvasBlur="onCanvasBlur"
            :onCanvasFocused="onCanvasFocused"
            :onCellFocused="onCellFocused"
            :onColumnMoved="onColumnMoved"
            :onColumnResize="onColumnResize"
            :onColumnResizeEnd="onColumnResizeEnd"
            :onColumnResizeStart="onColumnResizeStart"
            :onContextMenu="onContextMenu"
            :onDragEnd="onDragEnd"
            :onDragLeave="onDragLeave"
            :onDragOverCell="onDragOverCell"
            :onDragStart="onDragStart"
            :onDrop="onDrop"
            :onItemHovered="onItemHovered"
            :onKeyDown="onKeyDown"
            :onKeyUp="onKeyUp"
            :onMouseDown="onMouseDown"
            :onMouseUp="onMouseUp"
            :onRowMoved="onRowMoved"
            :smoothScrollX="smoothScrollX"
            :smoothScrollY="smoothScrollY"
            :resizeIndicator="resizeIndicator"
        />
        <SearchWrapper
            v-if="showSearch || isAnimatingOut"
            :class="'gdg-search-bar' + (showSearch ? '' : ' out')"
            @mousedown="cancelEvent"
            @mousemove="cancelEvent"
            @mouseup="cancelEvent"
            @click="cancelEvent"
        >
            <div class="gdg-search-bar-inner">
                <input
                    :id="searchID"
                    :aria-hidden="!showSearch"
                    data-testid="search-input"
                    :ref="searchInputRef"
                    :value="searchString"
                    :tabindex="showSearch ? undefined : -1"
                    @change="onSearchChange"
                    @keydown.capture="onSearchKeyDown"
                />
                <button
                    type="button"
                    aria-label="Previous Result"
                    :aria-hidden="!showSearch"
                    :tabindex="showSearch ? undefined : -1"
                    @click="onPrev"
                    :disabled="(searchStatus?.results ?? 0) === 0"
                >
                    <svg class="button-icon" viewBox="0 0 512 512">
                        <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="48"
                            d="M112 244l144-144 144 144M256 120v292"
                        />
                    </svg>
                </button>
                <button
                    type="button"
                    aria-label="Next Result"
                    :aria-hidden="!showSearch"
                    :tabindex="showSearch ? undefined : -1"
                    @click="onNext"
                    :disabled="(searchStatus?.results ?? 0) === 0"
                >
                    <svg class="button-icon" viewBox="0 0 512 512">
                        <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="48"
                            d="M112 268l144 144 144-144M256 392V100"
                        />
                    </svg>
                </button>
                <button
                    v-if="onSearchClose"
                    type="button"
                    aria-label="Close Search"
                    :aria-hidden="!showSearch"
                    data-testid="search-close-button"
                    :tabindex="showSearch ? undefined : -1"
                    @click="onClose"
                >
                    <svg class="button-icon" viewBox="0 0 512 512">
                        <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="32"
                            d="M368 368L144 144M368 144L144 368"
                        />
                    </svg>
                </button>
            </div>
            <div v-if="searchStatus !== undefined" class="gdg-search-status">
                <div data-testid="search-result-area">{{ resultString }}</div>
            </div>
            <div v-else class="gdg-search-status">
                <label :for="searchID">Type to search</label>
            </div>
            <div v-if="searchStatus !== undefined" class="gdg-search-progress" :style="progressStyle" />
        </SearchWrapper>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import ScrollingDataGrid from "../internal/scrolling-data-grid/scrolling-data-grid.vue";
import { SearchWrapper } from "../internal/data-grid-search/data-grid-search-style.js";
import { assert } from "../common/support.js";
import type { CellArray, GetCellsThunk, Item, Rectangle } from "../internal/data-grid/data-grid-types.js";
import type { ScrollingDataGridProps } from "../internal/scrolling-data-grid/scrolling-data-grid.js";

interface DataGridSearchProps extends Omit<ScrollingDataGridProps, "prelightCells"> {
    readonly getCellsForSelection?: (selection: Rectangle, abortSignal: AbortSignal) => GetCellsThunk | CellArray;
    readonly searchResults?: readonly Item[];
    readonly onSearchResultsChanged?: (results: readonly Item[], navIndex: number) => void;
    readonly showSearch?: boolean;
    readonly onSearchClose?: () => void;
    readonly searchValue?: string;
    readonly onSearchValueChange?: (newVal: string) => void;
    readonly searchInputRef: { value: HTMLInputElement | null };
}

const props = withDefaults(defineProps<DataGridSearchProps>(), {
    showSearch: false,
});

const emit = defineEmits<{
    searchResultsChanged: [results: readonly Item[], navIndex: number];
    searchValueChange: [newVal: string];
    searchClose: [];
}>();

const targetSearchTimeMS = 10;

const searchID = ref(`search-box-${Math.round(Math.random() * 1000)}`);
const searchStringInner = ref("");
const searchString = computed(() => props.searchValue ?? searchStringInner.value);

const searchStatus = ref<{
    rowsSearched: number;
    results: number;
    selectedIndex: number;
}>();

const abortControllerRef = ref(new AbortController());
const searchHandle = ref<number>();
const searchResultsInner = ref<readonly Item[]>([]);
const searchResults = computed(() => props.searchResults ?? searchResultsInner.value);
const cellYOffsetRef = ref(props.cellYOffset);
const isAnimatingOut = ref(false);

const setSearchString = (newVal: string) => {
    searchStringInner.value = newVal;
    emit("searchValueChange", newVal);
};

const cancelSearch = () => {
    if (searchHandle.value !== undefined) {
        window.cancelAnimationFrame(searchHandle.value);
        searchHandle.value = undefined;
    }
    if (abortControllerRef.value !== undefined) {
        abortControllerRef.value.abort();
    }
    abortControllerRef.value = new AbortController();
};

const beginSearch = (str: string) => {
    const regex = new RegExp(str.replace(/([$()*+.?[\]^{|}-])/g, "\\$1"), "i");

    let startY = cellYOffsetRef.value;
    let searchStride = Math.min(10, props.rows);
    let rowsSearched = 0;

    searchStatus.value = undefined;
    searchResultsInner.value = [];

    const runningResult: [number, number][] = [];

    const tick = async () => {
        if (props.getCellsForSelection === undefined) return;
        const tStart = performance.now();
        const rowsLeft = props.rows - rowsSearched;
        let data = props.getCellsForSelection(
            {
                x: 0,
                y: startY,
                width: props.columns.length,
                height: Math.min(searchStride, rowsLeft, props.rows - startY),
            },
            abortControllerRef.value.signal
        );

        if (typeof data === "function") {
            data = await data();
        }

        let added = false;
        for (const [row, d] of data.entries()) {
            for (const [col, cell] of d.entries()) {
                let testString: string | undefined;
                switch (cell.kind) {
                    case GridCellKind.Text:
                    case GridCellKind.Number:
                        testString = cell.displayData;
                        break;
                    case GridCellKind.Uri:
                    case GridCellKind.Markdown:
                        testString = cell.data;
                        break;
                    case GridCellKind.Boolean:
                        testString = typeof cell.data === "boolean" ? cell.data.toString() : undefined;
                        break;
                    case GridCellKind.Image:
                    case GridCellKind.Bubble:
                        testString = cell.data.join("🐳");
                        break;
                    case GridCellKind.Custom:
                        testString = cell.copyData;
                        break;
                }

                if (testString !== undefined && regex.test(testString)) {
                    runningResult.push([col, row + startY]);
                    added = true;
                }
            }
        }

        const tEnd = performance.now();

        if (added) {
            searchResultsInner.value = [...runningResult];
        }

        rowsSearched += data.length;
        assert(rowsSearched <= props.rows);

        const selectedIndex = searchStatus.value?.selectedIndex ?? -1;
        searchStatus.value = {
            results: runningResult.length,
            rowsSearched,
            selectedIndex,
        };
        emit("searchResultsChanged", runningResult, selectedIndex);

        if (startY + searchStride >= props.rows) {
            startY = 0;
        } else {
            startY += searchStride;
        }

        const tElapsed = tEnd - tStart;
        const rounded = Math.max(tElapsed, 1);

        const scalar = targetSearchTimeMS / rounded;
        searchStride = Math.ceil(searchStride * scalar);

        if (rowsSearched < props.rows && runningResult.length < 1000) {
            searchHandle.value = window.requestAnimationFrame(tick);
        }
    };

    cancelSearch();
    searchHandle.value = window.requestAnimationFrame(tick);
};

const onClose = () => {
    props.onSearchClose?.();
    emit("searchClose");
    searchStatus.value = undefined;
    searchResultsInner.value = [];
    emit("searchResultsChanged", [], -1);
    cancelSearch();
    props.canvasRef?.current?.focus();
};

const onSearchChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setSearchString(target.value);
    if (props.searchResults !== undefined) return;
    if (target.value === "") {
        searchStatus.value = undefined;
        searchResultsInner.value = [];
        cancelSearch();
    } else {
        beginSearch(target.value);
    }
};

const onNext = (ev?: MouseEvent) => {
    ev?.stopPropagation?.();
    if (searchStatus.value === undefined || searchStatus.value.results === 0) return;
    const newIndex = (searchStatus.value.selectedIndex + 1) % searchStatus.value.results;
    searchStatus.value = {
        ...searchStatus.value,
        selectedIndex: newIndex,
    };
    emit("searchResultsChanged", searchResults.value, newIndex);
};

const onPrev = (ev?: MouseEvent) => {
    ev?.stopPropagation?.();
    if (searchStatus.value === undefined || searchStatus.value.results === 0) return;
    let newIndex = (searchStatus.value.selectedIndex - 1) % searchStatus.value.results;
    if (newIndex < 0) newIndex += searchStatus.value.results;
    searchStatus.value = {
        ...searchStatus.value,
        selectedIndex: newIndex,
    };
    emit("searchResultsChanged", searchResults.value, newIndex);
};

const onSearchKeyDown = (event: KeyboardEvent) => {
    if (((event.ctrlKey || event.metaKey) && event.code === "KeyF") || event.key === "Escape") {
        onClose();
        event.stopPropagation();
        event.preventDefault();
    } else if (event.key === "Enter") {
        if (event.shiftKey) {
            onPrev();
        } else {
            onNext();
        }
    }
};

const cancelEvent = (ev: MouseEvent) => {
    ev.stopPropagation();
};

const resultString = computed(() => {
    if (searchStatus.value === undefined) return undefined;
    let result =
        searchStatus.value.results >= 1000
            ? "over 1000"
            : `${searchStatus.value.results} result${searchStatus.value.results !== 1 ? "s" : ""}`;
    if (searchStatus.value.selectedIndex >= 0) {
        result = `${searchStatus.value.selectedIndex + 1} of ${result}`;
    }
    return result;
});

const progressStyle = computed(() => {
    const rowsSearchedProgress =
        props.rows > 0 ? Math.floor(((searchStatus.value?.rowsSearched ?? 0) / props.rows) * 100) : 0;
    return {
        width: `${rowsSearchedProgress}%`,
    };
});

// Watch for showSearch changes
watch(
    () => props.showSearch,
    newVal => {
        if (newVal) {
            isAnimatingOut.value = true;
            nextTick(() => {
                if (props.searchInputRef.current) {
                    props.searchInputRef.current.focus({ preventScroll: true });
                }
            });
        } else {
            const timeoutId = setTimeout(() => (isAnimatingOut.value = false), 150);
            return () => clearTimeout(timeoutId);
        }
    }
);

// Watch for external search results
watch(
    () => props.searchResults,
    newVal => {
        if (newVal === undefined) return;
        if (newVal.length > 0) {
            searchStatus.value = {
                rowsSearched: props.rows,
                results: newVal.length,
                selectedIndex: searchStatus.value?.selectedIndex ?? -1,
            };
        } else {
            searchStatus.value = undefined;
        }
    }
);

// Watch cellYOffset
watch(
    () => props.cellYOffset,
    newVal => {
        cellYOffsetRef.value = newVal;
    }
);

onMounted(() => {
    // Reset search on mount
    setSearchString("");
    searchStatus.value = undefined;
    if (searchResultsInner.value.length > 0) {
        searchResultsInner.value = [];
        emit("searchResultsChanged", [], -1);
    }
});

onUnmounted(() => {
    cancelSearch();
});
</script>

<style scoped>
.button-icon {
    width: 16px;
    height: 16px;
}
</style>
