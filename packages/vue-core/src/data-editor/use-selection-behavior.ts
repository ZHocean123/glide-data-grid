import { ref, computed, reactive, watch, type Ref } from 'vue';
import {
    type GridSelection,
    type Item,
    type Rectangle,
    CompactSelection,
    type SelectionBlending,
    type SelectionTrigger,
    emptyGridSelection
} from '../internal/data-grid/data-grid-types.js';

export interface UseSelectionBehaviorOptions {
    /** 初始选择 */
    initialSelection?: GridSelection;
    /** 选择混合模式 */
    selectionBlending?: SelectionBlending;
    /** 是否启用多选 */
    enableMultiSelection?: boolean;
    /** 行标记偏移量 */
    rowMarkerOffset: Ref<number>;
    /** 列数 */
    columns: Ref<number>;
    /** 行数 */
    rows: Ref<number>;
    /** 选择变化回调 */
    onSelectionChanged?: (selection: GridSelection) => void;
}

export interface SelectionBehaviorState {
    /** 当前选择 */
    selection: GridSelection;
    /** 是否正在选择 */
    isSelecting: boolean;
    /** 选择开始位置 */
    selectionStart?: Item;
    /** 选择触发类型 */
    selectionTrigger?: SelectionTrigger;
}

export function useSelectionBehavior(options: UseSelectionBehaviorOptions) {
    const {
        initialSelection = emptyGridSelection,
        selectionBlending = 'mixed',
        rowMarkerOffset,
        columns,
        rows,
        onSelectionChanged
    } = options;

    // 选择状态
    const selectionState = reactive<SelectionBehaviorState>({
        selection: initialSelection,
        isSelecting: false,
        selectionStart: undefined,
        selectionTrigger: undefined
    });

    // 当前选择的响应式引用
    const selection = ref<GridSelection>(initialSelection);

    // 监听选择变化
    watch(selection, (newSelection) => {
        selectionState.selection = newSelection;
        // @ts-ignore
        onSelectionChanged?.(newSelection);
    }, { deep: true });

    // 检查位置是否有效
    const isValidLocation = (col: number, row: number): boolean => {
        return col >= rowMarkerOffset.value && 
               col < columns.value + rowMarkerOffset.value && 
               row >= 0 && 
               row < rows.value;
    };

    // 创建矩形选择
    const createRectSelection = (start: Item, end: Item): Rectangle => {
        const minX = Math.min(start[0], end[0]);
        const minY = Math.min(start[1], end[1]);
        const maxX = Math.max(start[0], end[0]);
        const maxY = Math.max(start[1], end[1]);

        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    };

    // 设置当前选择
    const setCurrentSelection = (
        cell: Item | undefined,
        range: Rectangle | undefined,
        trigger: SelectionTrigger,
        blending: SelectionBlending = selectionBlending
    ) => {
        if (!cell || !range) {
            selection.value = {
                ...selection.value,
                current: undefined
            };
            return;
        }

        const current = selection.value.current;
        let newSelection: GridSelection;

        if (current && (blending === 'additive' || (blending === 'mixed' && trigger === 'keyboard-select'))) {
            // 添加模式：保持现有选择，添加新选择
            newSelection = {
                current: {
                    cell,
                    range,
                    rangeStack: [...current.rangeStack, current.range]
                },
                columns: selection.value.columns,
                rows: selection.value.rows
            } as unknown as GridSelection;
        } else if (blending === 'exclusive' || (blending === 'mixed' && trigger === 'drag')) {
            // 排他模式：替换当前选择
            newSelection = {
                current: {
                    cell,
                    range,
                    rangeStack: []
                },
                columns: selection.value.columns,
                rows: selection.value.rows
            } as unknown as GridSelection;
        } else {
            // 混合模式：根据触发类型决定
            newSelection = {
                current: {
                    cell,
                    range,
                    rangeStack: []
                },
                columns: selection.value.columns,
                rows: selection.value.rows
            } as unknown as GridSelection;
        }

        selection.value = newSelection;
    };

    // 设置列选择
    const setColumnSelection = (col: number, blending: SelectionBlending = selectionBlending) => {
        if (!isValidLocation(col, 0)) return;

        let newColumns: CompactSelection;
        
        if (blending === 'additive') {
            newColumns = selection.value.columns.add(col);
        } else if (blending === 'exclusive') {
            newColumns = CompactSelection.fromSingleSelection(col);
        } else {
            // 混合模式
            if (selection.value.columns.hasIndex(col)) {
                newColumns = selection.value.columns.remove(col);
            } else {
                newColumns = selection.value.columns.add(col);
            }
        }

        selection.value = {
            current: selection.value.current,
            columns: newColumns,
            rows: selection.value.rows
        } as GridSelection;
    };

    // 设置行选择
    const setRowSelection = (row: number, blending: SelectionBlending = selectionBlending) => {
        if (!isValidLocation(rowMarkerOffset.value, row)) return;

        let newRows: CompactSelection;
        
        if (blending === 'additive') {
            newRows = selection.value.rows.add(row);
        } else if (blending === 'exclusive') {
            newRows = CompactSelection.fromSingleSelection(row);
        } else {
            // 混合模式
            if (selection.value.rows.hasIndex(row)) {
                newRows = selection.value.rows.remove(row);
            } else {
                newRows = selection.value.rows.add(row);
            }
        }

        selection.value = {
            current: selection.value.current,
            columns: selection.value.columns,
            rows: newRows
        } as GridSelection;
    };

    // 开始选择
    const beginSelection = (location: Item, trigger: SelectionTrigger) => {
        selectionState.isSelecting = true;
        selectionState.selectionStart = location;
        selectionState.selectionTrigger = trigger;

        const range = createRectSelection(location, location);
        setCurrentSelection(location, range, trigger);
    };

    // 更新选择
    const updateSelection = (location: Item) => {
        if (!selectionState.isSelecting || !selectionState.selectionStart) return;

        const range = createRectSelection(selectionState.selectionStart, location);
        setCurrentSelection(location, range, selectionState.selectionTrigger!);
    };

    // 结束选择
    const endSelection = () => {
        selectionState.isSelecting = false;
        selectionState.selectionStart = undefined;
        selectionState.selectionTrigger = undefined;
    };

    // 清除选择
    const clearSelection = () => {
        selection.value = emptyGridSelection;
    };

    // 全选
    const selectAll = () => {
        const range: Rectangle = {
            x: rowMarkerOffset.value,
            y: 0,
            width: columns.value,
            height: rows.value
        };

        const cell: Item = [rowMarkerOffset.value, 0];
        setCurrentSelection(cell, range, 'keyboard-select');

        // 同时选择所有列和行
        selection.value = {
            current: selection.value.current,
            columns: CompactSelection.fromSingleSelection([rowMarkerOffset.value, rowMarkerOffset.value + columns.value]),
            rows: CompactSelection.fromSingleSelection([0, rows.value])
        } as GridSelection;
    };

    // 选择列
    const selectColumn = (col: number, blending?: SelectionBlending) => {
        setColumnSelection(col, blending);
    };

    // 选择行
    const selectRow = (row: number, blending?: SelectionBlending) => {
        setRowSelection(row, blending);
    };

    // 选择矩形区域
    const selectRectangle = (rect: Rectangle) => {
        const cell: Item = [rect.x, rect.y];
        setCurrentSelection(cell, rect, 'drag');
    };

    // 反转选择
    const invertSelection = () => {
        // 简化实现，实际应该更复杂
        if (selection.value.current) {
            const { range } = selection.value.current;
            const newColumns = CompactSelection.fromSingleSelection([range.x, range.x + range.width]);
            const newRows = CompactSelection.fromSingleSelection([range.y, range.y + range.height]);
            
            selection.value = {
                current: selection.value.current,
                columns: newColumns,
                rows: newRows
            } as GridSelection;
        }
    };

    // 扩展选择到整行
    const extendSelectionToRow = (row: number) => {
        if (!isValidLocation(rowMarkerOffset.value, row)) return;

        const range: Rectangle = {
            x: rowMarkerOffset.value,
            y: row,
            width: columns.value,
            height: 1
        };

        const cell: Item = [rowMarkerOffset.value, row];
        setCurrentSelection(cell, range, 'keyboard-select');
    };

    // 扩展选择到整列
    const extendSelectionToColumn = (col: number) => {
        if (!isValidLocation(col, 0)) return;

        const range: Rectangle = {
            x: col,
            y: 0,
            width: 1,
            height: rows.value
        };

        const cell: Item = [col, 0];
        setCurrentSelection(cell, range, 'keyboard-select');
    };

    // 计算属性
    const hasSelection = computed(() => selection.value.current !== undefined);
    const selectedCell = computed(() => selection.value.current?.cell);
    const selectedRange = computed(() => selection.value.current?.range);
    const selectedColumns = computed(() => selection.value.columns);
    const selectedRows = computed(() => selection.value.rows);
    const isSelecting = computed(() => selectionState.isSelecting);

    return {
        // 状态
        selection,
        selectionState,
        
        // 计算属性
        hasSelection,
        selectedCell,
        selectedRange,
        selectedColumns,
        selectedRows,
        isSelecting,
        
        // 方法
        setCurrentSelection,
        setColumnSelection,
        setRowSelection,
        beginSelection,
        updateSelection,
        endSelection,
        clearSelection,
        selectAll,
        selectColumn,
        selectRow,
        selectRectangle,
        invertSelection,
        extendSelectionToRow,
        extendSelectionToColumn,
        
        // 工具方法
        isValidLocation,
        createRectSelection
    };
}