<template>
    <div ref="containerRef" :class="className" :style="containerStyle">
        <canvas
            ref="canvasRef"
            tabindex="0"
            :width="canvasWidth"
            :height="canvasHeight"
            @keydown="handleKeyDown"
            @keyup="handleKeyUp"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @contextmenu="handleContextMenu"
        />
        <DataGrid
            ref="dataGridRef"
            :columns="innerColumns"
            :rows="props.rows || 0"
            :get-cell-content="getCellContent"
            :theme="theme"
            :row-height="props.rowHeight || 34"
            :header-height="props.headerHeight || 36"
            :group-header-height="props.groupHeaderHeight || 0"
            :min-column-width="props.minColumnWidth || 50"
            :max-column-width="props.maxColumnWidth || 500"
            :allow-resize="props.allowResize !== false"
            :resize-indicator="props.resizeIndicator || 'full'"
            :selection="gridSelection"
            :is-focused="isFocused"
            :is-resizing="isResizing"
            :resize-column="resizeColumn"
            :is-dragging="isDragging"
            :is-filling="isFilling"
            @mouse-down="handleMouseDown"
            @mouse-move="handleMouseMove"
            @mouse-up="handleMouseUp"
            @key-down="handleKeyDown"
            @key-up="handleKeyUp"
            @context-menu="handleContextMenu"
            @cell-focused="handleCellFocused"
            @column-resize="handleColumnResize"
            @column-resize-start="handleColumnResizeStart"
            @column-resize-end="handleColumnResizeEnd"
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
import DataGrid from "../internal/data-grid/DataGrid.vue";
import {
    copyToClipboard,
    parsePasteData,
    createBufferFromGridCells,
    createTextBuffer,
} from "../data-editor/copy-paste.js";

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
const dataGridRef = ref<InstanceType<typeof DataGrid>>();
const searchComponent = ref<any>();
const canvasRef = ref<HTMLCanvasElement>();
const animationFrameId = ref<number>();

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

// 列调整状态
const isResizing = ref(false);
const resizeColumn = ref<number>();
const isDragging = ref(false);
const isFilling = ref(false);

// 内部列状态
const innerColumns = ref<GridColumn[]>([]);

// 计算属性
const gridSelection = computed(() => props.gridSelection ?? gridSelectionInner.value);
const showSearch = computed(() => props.showSearch ?? showSearchInner.value);
const theme = useTheme();

// 初始化内部列
watch(
    () => props.columns,
    newColumns => {
        innerColumns.value = [...(newColumns || [])];
    },
    { immediate: true }
);

// 获取单元格内容
const getCellContent = (location: [number, number]): GridCell => {
    return props.getCellContent?.(location) || { kind: 0, displayData: "", data: "" };
};

// 列调整事件处理
const handleColumnResize = (column: GridColumn, newSize: number, colIndex: number, newSizeWithGroup: number) => {
    // 更新列宽度
    if (innerColumns.value[colIndex]) {
        innerColumns.value[colIndex].width = newSize;
    }

    // 触发外部事件
    props.onColumnResize?.(column, newSize, colIndex, newSizeWithGroup);
};

const handleColumnResizeStart = (column: GridColumn, newSize: number, colIndex: number, newSizeWithGroup: number) => {
    isResizing.value = true;
    resizeColumn.value = colIndex;

    // 触发外部事件
    props.onColumnResizeStart?.(column, newSize, colIndex, newSizeWithGroup);
};

const handleColumnResizeEnd = (column: GridColumn, newSize: number, colIndex: number, newSizeWithGroup: number) => {
    isResizing.value = false;
    resizeColumn.value = undefined;

    // 触发外部事件
    props.onColumnResizeEnd?.(column, newSize, colIndex, newSizeWithGroup);
};

// 单元格聚焦事件
const handleCellFocused = (location: [number, number]) => {
    props.onCellFocused?.(location);
};

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

    // 复制粘贴快捷键
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        switch (event.key) {
            case "c":
            case "C":
                event.preventDefault();
                handleCopy();
                return;
            case "v":
            case "V":
                event.preventDefault();
                handlePaste();
                return;
            case "x":
            case "X":
                event.preventDefault();
                handleCut();
                return;
        }
    }

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

const handleMouseDown = (args: any) => {
    // 处理鼠标按下事件
    isFocused.value = true;
    dataGridRef.value?.focus();

    // 处理单元格选择
    if (args.kind === "cell" && args.location) {
        setSelection(args.location);
    }

    // 触发外部事件
    props.onMouseDown?.(args);
};

const handleMouseMove = (args: any) => {
    // 处理鼠标移动事件
    props.onMouseMove?.(args);
};

const handleMouseUp = (args: any, isOutside: boolean) => {
    // 处理鼠标释放事件
    props.onMouseUp?.(args, isOutside);
};

const handleContextMenu = (args: any, preventDefault: () => void) => {
    // 处理右键菜单事件
    preventDefault();

    if (args.kind === "cell" && args.location) {
        emit("cell-context-menu", args.location, args.rawEvent);
    }
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

// 复制粘贴功能
const handleCopy = async () => {
    if (!gridSelection.value.current) return;

    const selection = gridSelection.value.current.range;

    // 获取选中的单元格数据
    if (props.getCellsForSelection) {
        const cells = await props.getCellsForSelection(selection);
        if (cells) {
            const columnIndexes = Array.from({ length: selection.width }, (_, i) => selection.x + i);
            const copyBuffer = createBufferFromGridCells(cells, columnIndexes);
            const text = createTextBuffer(copyBuffer);
            await copyToClipboard(text);
        }
    } else if (props.getCellContent) {
        // 如果没有 getCellsForSelection，使用 getCellContent 获取数据
        const cells: any[][] = [];
        for (let row = selection.y; row < selection.y + selection.height; row++) {
            const rowCells: any[] = [];
            for (let col = selection.x; col < selection.x + selection.width; col++) {
                const cell = props.getCellContent([col, row]);
                rowCells.push(cell);
            }
            cells.push(rowCells);
        }
        const columnIndexes = Array.from({ length: selection.width }, (_, i) => selection.x + i);
        const copyBuffer = createBufferFromGridCells(cells, columnIndexes);
        const text = createTextBuffer(copyBuffer);
        await copyToClipboard(text);
    }
};

const handleCut = async () => {
    await handleCopy();
    // 剪切操作需要删除原数据，这里可以触发删除事件
    emit("delete", gridSelection.value);
};

const handlePaste = async () => {
    if (!gridSelection.value.current) return;

    try {
        const clipboardText = await navigator.clipboard.readText();
        const pasteData = parsePasteData(clipboardText);

        const targetCell = gridSelection.value.current.cell;

        // 处理粘贴数据
        if (props.onPaste) {
            const result = props.onPaste(targetCell, pasteData);
            if (result === false) return;
        }

        // 默认粘贴行为
        const pasteCells: any[] = [];

        for (let row = 0; row < pasteData.length; row++) {
            const pasteRow = pasteData[row];
            for (let col = 0; col < pasteRow.length; col++) {
                const targetRow = targetCell[1] + row;
                const targetCol = targetCell[0] + col;

                if (targetRow < (props.rows || 0) && targetCol < (props.columns?.length || 0)) {
                    const targetCellItem: [number, number] = [targetCol, targetRow];
                    const currentCell = props.getCellContent?.(targetCellItem);

                    if (currentCell && currentCell.allowOverlay !== false) {
                        const pasteValue = pasteRow[col];

                        // 根据单元格类型处理粘贴值
                        let newCell: any;
                        switch (currentCell.kind) {
                            case "text":
                                newCell = { ...currentCell, data: pasteValue };
                                break;
                            case "number":
                                const numValue = parseFloat(pasteValue);
                                if (!isNaN(numValue)) {
                                    newCell = { ...currentCell, data: numValue };
                                }
                                break;
                            case "boolean":
                                const boolValue = pasteValue.toLowerCase() === "true" || pasteValue === "1";
                                newCell = { ...currentCell, data: boolValue };
                                break;
                            default:
                                newCell = { ...currentCell, data: pasteValue };
                        }

                        if (newCell) {
                            pasteCells.push({
                                cell: targetCellItem,
                                value: newCell,
                            });
                        }
                    }
                }
            }
        }

        // 触发单元格编辑事件
        if (pasteCells.length > 0) {
            if (props.onCellsEdited) {
                props.onCellsEdited(pasteCells);
            } else if (props.onCellEdited) {
                pasteCells.forEach(({ cell, value }) => {
                    props.onCellEdited?.(cell, value);
                });
            }
        }

        requestRender();
    } catch (error) {
        console.error("Paste failed:", error);
    }
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
        getCellContent: props.getCellContent, // 传递真实的单元格内容获取函数
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
