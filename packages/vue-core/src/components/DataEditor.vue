<template>
    <div ref="containerRef" :class="className" :style="containerStyle">
        <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            tabindex="0"
            @keydown="handleKeyDown"
            @keyup="handleKeyUp"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @click="handleClick"
            @contextmenu="handleContextMenu"
            @wheel="handleWheel"
        />

        <!-- 搜索组件 -->
        <DataGridSearch
            v-if="showSearch"
            ref="searchComponent"
            :search-value="searchValue"
            @update:search-value="handleSearchValueChange"
            @close="handleSearchClose"
        />

        <!-- 覆盖编辑器 -->
        <DataGridOverlayEditor
            v-if="overlayVisible"
            :target="overlayTarget"
            :cell="overlayCell"
            :theme="overlayTheme"
            @finished-editing="handleFinishedEditing"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { Ref } from "vue";
import type {
    GridSelection,
    GridColumn,
    GridCell,
    Item,
    Rectangle,
    DataEditorRef,
    DataEditorProps,
} from "../internal/data-grid/data-grid-types.js";
import { useTheme } from "../common/styles.js";
import { makeCSSStyle } from "../common/styles.js";
import { drawGrid } from "../internal/data-grid/render/data-grid-render.js";
import DataGridOverlayEditor from "./DataGridOverlayEditor.vue";
import DataGridSearch from "./DataGridSearch.vue";

// Props
const props = defineProps<DataEditorProps>();

// Emits
const emit = defineEmits<{
    "update:gridSelection": [selection: GridSelection];
    "cell-clicked": [cell: Item, event: any];
    "cell-activated": [cell: Item, event: any];
    "cell-edited": [cell: Item, newValue: any];
    "cells-edited": [newValues: any[]];
    "finished-editing": [newValue: any, movement: Item];
    delete: [selection: GridSelection];
    "row-appended": [];
    "column-appended": [];
    "fill-pattern": [event: any];
    "header-clicked": [colIndex: number, event: any];
    "group-header-clicked": [colIndex: number, event: any];
    "cell-context-menu": [cell: Item, event: any];
    "header-context-menu": [colIndex: number, event: any];
    "group-header-context-menu": [colIndex: number, event: any];
    "group-header-renamed": [groupName: string, newVal: string];
    "search-results-changed": [results: any[]];
    "search-value-change": [value: string];
    "search-close": [];
    "visible-region-changed": [range: Rectangle, tx: number, ty: number, extras: any];
    "selection-cleared": [];
}>();

// Refs
const containerRef = ref<HTMLElement>();
const canvasRef = ref<HTMLCanvasElement>();
const searchComponent = ref<any>();

// 状态
const gridSelectionInner = ref<GridSelection>({ columns: [], rows: [] });
const overlayVisible = ref(false);
const overlayTarget = ref<Rectangle>();
const overlayCell = ref<GridCell>();
const overlayTheme = ref<any>();
const showSearchInner = ref(false);
const searchValue = ref("");

// 渲染状态
const cellXOffset = ref(0);
const cellYOffset = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const isFocused = ref(false);
const animationFrameId = ref<number>();

// 计算属性
const gridSelection = computed(() => props.gridSelection ?? gridSelectionInner.value);
const showSearch = computed(() => props.showSearch ?? showSearchInner.value);
const theme = useTheme();

const containerStyle = computed(() => {
    const style: any = {};
    if (props.width) style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
    if (props.height) style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
    return { ...style, ...makeCSSStyle(theme) };
});

const className = computed(() => {
    const baseClass = "glide-data-grid";
    return props.className ? `${baseClass} ${props.className}` : baseClass;
});

const canvasWidth = computed(() => {
    // 计算画布宽度
    return containerRef.value?.clientWidth || 800;
});

const canvasHeight = computed(() => {
    // 计算画布高度
    return containerRef.value?.clientHeight || 600;
});

// 方法
const handleKeyDown = (event: KeyboardEvent) => {
    // 处理键盘按下事件
    isFocused.value = true;

    // 基本键盘导航
    switch (event.key) {
        case "ArrowUp":
            event.preventDefault();
            moveSelection(0, -1);
            break;
        case "ArrowDown":
            event.preventDefault();
            moveSelection(0, 1);
            break;
        case "ArrowLeft":
            event.preventDefault();
            moveSelection(-1, 0);
            break;
        case "ArrowRight":
            event.preventDefault();
            moveSelection(1, 0);
            break;
        case "Enter":
            event.preventDefault();
            activateCurrentCell();
            break;
        case " ":
            event.preventDefault();
            activateCurrentCell();
            break;
    }

    requestRender();
};

const handleKeyUp = (event: KeyboardEvent) => {
    // 处理键盘释放事件
    // TODO: 实现键盘事件处理
};

const handleMouseDown = (event: MouseEvent) => {
    // 处理鼠标按下事件
    isFocused.value = true;
    canvasRef.value?.focus();

    const cell = getCellFromMouseEvent(event);
    if (cell) {
        setSelection(cell);
        requestRender();
    }
};

const handleMouseMove = (event: MouseEvent) => {
    // 处理鼠标移动事件
    // TODO: 实现鼠标事件处理
};

const handleMouseUp = (event: MouseEvent) => {
    // 处理鼠标释放事件
    // TODO: 实现鼠标事件处理
};

const handleClick = (event: MouseEvent) => {
    // 处理点击事件
    const cell = getCellFromMouseEvent(event);
    if (cell) {
        emit("cell-clicked", cell, event);
    }
};

const handleContextMenu = (event: MouseEvent) => {
    // 处理右键菜单事件
    event.preventDefault();
    const cell = getCellFromMouseEvent(event);
    if (cell) {
        emit("cell-context-menu", cell, event);
    }
};

const handleWheel = (event: WheelEvent) => {
    // 处理滚轮事件
    event.preventDefault();

    // 基本滚动
    translateY.value += event.deltaY;
    translateX.value += event.deltaX;

    // 限制滚动范围
    translateY.value = Math.max(0, translateY.value);
    translateX.value = Math.max(0, translateX.value);

    requestRender();
};

// 辅助方法
const getCellFromMouseEvent = (event: MouseEvent): Item | null => {
    if (!canvasRef.value) return null;

    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const headerHeight = props.headerHeight || 36;
    const groupHeaderHeight = props.groupHeaderHeight || props.headerHeight || 36;
    const totalHeaderHeight = headerHeight + groupHeaderHeight;
    const rowHeight = props.rowHeight || 34;
    const hasRowMarkers = props.rowMarkers !== undefined && props.rowMarkers !== "none";

    // 检查是否在数据区域
    if (y < totalHeaderHeight) return null;

    // 计算单元格位置
    const row = Math.floor((y - totalHeaderHeight + translateY.value) / rowHeight) + cellYOffset.value;

    let colX = hasRowMarkers ? 40 : 0;
    let col = cellXOffset.value;

    for (const column of props.columns || []) {
        const colStart = colX - translateX.value;
        const colEnd = colStart + column.width;

        if (x >= colStart && x < colEnd) {
            return [col, row];
        }

        colX += column.width;
        col++;
    }

    return null;
};

const setSelection = (cell: Item) => {
    const newSelection: GridSelection = {
        columns: [],
        rows: [],
        current: {
            cell,
            range: {
                x: cell[0],
                y: cell[1],
                width: 1,
                height: 1,
            },
            rangeStack: [],
        },
    };

    if (props.onGridSelectionChange) {
        emit("update:gridSelection", newSelection);
    } else {
        gridSelectionInner.value = newSelection;
    }
};

const moveSelection = (dx: number, dy: number) => {
    if (!gridSelection.value.current) return;

    const currentCell = gridSelection.value.current.cell;
    const newCell: Item = [
        Math.max(0, Math.min((props.columns?.length || 0) - 1, currentCell[0] + dx)),
        Math.max(0, Math.min((props.rows || 0) - 1, currentCell[1] + dy)),
    ];

    setSelection(newCell);
};

const activateCurrentCell = () => {
    if (!gridSelection.value.current) return;

    const cell = gridSelection.value.current.cell;
    emit("cell-activated", cell, {
        kind: "keyboard",
        location: [cell[0], cell[1]],
    });
};

const handleSearchValueChange = (value: string) => {
    searchValue.value = value;
    emit("search-value-change", value);
};

const handleSearchClose = () => {
    showSearchInner.value = false;
    emit("search-close");
};

const handleFinishedEditing = (newValue: any, movement: Item) => {
    overlayVisible.value = false;
    emit("finished-editing", newValue, movement);
};

// 渲染方法
const renderGrid = () => {
    if (!canvasRef.value) return;

    const ctx = canvasRef.value.getContext("2d");
    if (!ctx) return;

    drawGrid({
        ctx,
        width: canvasWidth.value,
        height: canvasHeight.value,
        cellXOffset: cellXOffset.value,
        cellYOffset: cellYOffset.value,
        translateX: translateX.value,
        translateY: translateY.value,
        theme: theme.value,
        gridSelection: gridSelection.value,
        columns: props.columns || [],
        rows: props.rows || 0,
        rowHeight: props.rowHeight || 34,
        headerHeight: props.headerHeight || 36,
        groupHeaderHeight: props.groupHeaderHeight || props.headerHeight || 36,
        freezeColumns: props.freezeColumns || 0,
        hasRowMarkers: props.rowMarkers !== undefined && props.rowMarkers !== "none",
    });
};

const requestRender = () => {
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value);
    }
    animationFrameId.value = requestAnimationFrame(renderGrid);
};

// 公共方法
defineExpose<DataEditorRef>({
    appendRow: async (col: number, openOverlay?: boolean, behavior?: ScrollBehavior) => {
        // TODO: 实现添加行
    },
    appendColumn: async (row: number, openOverlay?: boolean) => {
        // TODO: 实现添加列
    },
    updateCells: () => {
        // TODO: 实现更新单元格
    },
    getBounds: () => {
        // TODO: 实现获取边界
        return { x: 0, y: 0, width: 0, height: 0 };
    },
    focus: () => {
        canvasRef.value?.focus();
    },
    emit: async (eventName: string) => {
        // TODO: 实现事件发射
    },
    scrollTo: () => {
        // TODO: 实现滚动到
    },
    remeasureColumns: (cols: any) => {
        // TODO: 实现重新测量列
    },
    getMouseArgsForPosition: (posX: number, posY: number, ev?: MouseEvent | TouchEvent) => {
        // TODO: 实现获取鼠标参数
        return undefined;
    },
});

// 生命周期
onMounted(() => {
    requestRender();

    // 监听窗口大小变化
    window.addEventListener("resize", requestRender);
});

onUnmounted(() => {
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value);
    }
    window.removeEventListener("resize", requestRender);
});

// 监听器
watch(
    () => props.searchValue,
    newValue => {
        searchValue.value = newValue || "";
    }
);

watch(
    () => props.showSearch,
    newValue => {
        if (newValue !== undefined) {
            showSearchInner.value = newValue;
        }
    }
);

// 监听数据变化触发重新渲染
watch(
    [
        () => props.columns,
        () => props.rows,
        () => props.gridSelection,
        () => props.rowHeight,
        () => props.headerHeight,
        () => props.groupHeaderHeight,
        () => props.freezeColumns,
        () => props.rowMarkers,
    ],
    () => {
        requestRender();
    },
    { deep: true }
);

watch([canvasWidth, canvasHeight], () => {
    requestRender();
});
</script>

<style scoped>
.glide-data-grid {
    position: relative;
    overflow: hidden;
    outline: none;
}

glide-data-grid canvas {
    display: block;
    outline: none;
}
</style>
