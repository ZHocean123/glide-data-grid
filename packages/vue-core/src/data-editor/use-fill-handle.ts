import { computed, reactive, type Ref } from 'vue';
import {
    type GridCell,
    type Item,
    type Rectangle,
    type GridSelection,
    type EditListItem,
    type EditableGridCell,
    type FillHandleDirection,
    isReadWriteCell
} from '../internal/data-grid/data-grid-types.js';
import { pointInRect, getClosestRect, combineRects } from '../common/math.js';

// 定义 FillPatternEventArgs 类型
export interface FillPatternEventArgs {
    fillDestination: Rectangle;
    patternSource: Rectangle;
    preventDefault: () => void;
}


export interface UseFillHandleOptions {
    /** 当前选择的单元格 */
    selection: Ref<GridSelection>;
    /** 获取单元格内容的函数 */
    getCellContent: (item: Item) => GridCell;
    /** 获取选择区域内单元格的函数 */
    getCellsForSelection?: (
        selection: Rectangle,
        abortSignal: AbortSignal
    ) => readonly (readonly GridCell[])[] | Promise<readonly (readonly GridCell[])[]>;
    /** 单元格编辑完成回调 */
    onCellsEdited?: (items: readonly EditListItem[]) => boolean | void;
    /** 填充模式事件回调 */
    onFillPattern?: (event: FillPatternEventArgs) => void;
    /** 允许的填充方向 */
    allowedFillDirections?: FillHandleDirection;
    /** 行标记偏移量 */
    rowMarkerOffset: number;
}

export interface FillHandleState {
    /** 是否正在拖拽填充 */
    isDragging: boolean;
    /** 填充高亮区域 */
    highlightRegion: Rectangle | undefined;
    /** 之前的选择 */
    previousSelection: GridSelection | undefined;
    /** 开始位置 */
    startPosition: Item | undefined;
}

export function useFillHandle(options: UseFillHandleOptions) {
    const {
        selection,
        getCellsForSelection,
        onCellsEdited,
        onFillPattern,
        allowedFillDirections = 'any',
        rowMarkerOffset
    } = options;

    // 填充手柄状态
    const fillHandleState = reactive<FillHandleState>({
        isDragging: false,
        highlightRegion: undefined,
        previousSelection: undefined,
        startPosition: undefined
    });

    // 当前选择区域
    const currentRange = computed(() => selection.value.current?.range);

    // 开始填充拖拽
    const startFillDrag = (startPosition: Item) => {
        if (!currentRange.value) return false;

        fillHandleState.isDragging = true;
        fillHandleState.previousSelection = { ...selection.value };
        fillHandleState.startPosition = startPosition;
        fillHandleState.highlightRegion = undefined;

        return true;
    };

    // 更新填充区域
    const updateFillRegion = (currentPosition: Item, maxRow: number, maxCol: number) => {
        if (!fillHandleState.isDragging || !currentRange.value || !fillHandleState.startPosition) return;

        const [, ] = fillHandleState.startPosition;
        const [currentCol, currentRow] = currentPosition;
        
        // 限制在有效范围内
        const clampedCol = Math.max(0, Math.min(maxCol - 1, currentCol));
        const clampedRow = Math.max(0, Math.min(maxRow - 1, currentRow));
        
        // 获取最近的填充区域
        const rect = getClosestRect(
            currentRange.value,
            clampedCol,
            clampedRow,
            allowedFillDirections
        );
        
        fillHandleState.highlightRegion = rect;
    };

    // 完成填充
    const finishFill = async (): Promise<GridSelection | undefined> => {
        if (!fillHandleState.isDragging || !fillHandleState.previousSelection || !fillHandleState.highlightRegion) {
            resetFillState();
            return undefined;
        }

        const patternRange = fillHandleState.previousSelection.current?.range;
        if (!patternRange || !getCellsForSelection) {
            resetFillState();
            return undefined;
        }

        const currentRange = fillHandleState.highlightRegion;

        // 触发填充模式事件
        if (onFillPattern) {
            let canceled = false;
            onFillPattern({
                fillDestination: { ...currentRange, x: currentRange.x - rowMarkerOffset },
                patternSource: { ...patternRange, x: patternRange.x - rowMarkerOffset },
                preventDefault: () => (canceled = true),
            });
            if (canceled) {
                resetFillState();
                return undefined;
            }
        }

        try {
            // 获取模式数据
            let cells = getCellsForSelection(patternRange, new AbortController().signal);
            if (typeof cells !== 'object') {
                // @ts-ignore
                cells = await cells();
            }

            const pattern = cells as readonly (readonly GridCell[])[];

            // 创建编辑列表
            const editItemList: EditListItem[] = [];
            for (let x = 0; x < currentRange.width; x++) {
                for (let y = 0; y < currentRange.height; y++) {
                    const cell: Item = [currentRange.x + x, currentRange.y + y];
                    if (pointInRect(cell[0], cell[1], patternRange)) continue;
                    
                    const patternCell = pattern[y % patternRange.height][x % patternRange.width];
                    if (!isReadWriteCell(patternCell)) continue;
                    
                    editItemList.push({
                        location: cell,
                        value: patternCell as EditableGridCell,
                    });
                }
            }

            // 应用编辑
            if (editItemList.length > 0) {
                if (onCellsEdited) {
                    const result = onCellsEdited(editItemList);
                    if (result !== true) {
                        // 如果返回false，则不更新选择
                        resetFillState();
                        return undefined;
                    }
                }
            }

            // 更新选择
            const newSelection: GridSelection = {
                current: fillHandleState.previousSelection.current ? {
                    ...fillHandleState.previousSelection.current,
                    range: combineRects(patternRange, currentRange),
                } : undefined,
                columns: fillHandleState.previousSelection.columns,
                rows: fillHandleState.previousSelection.rows,
            };

            return newSelection;
        } catch (error) {
            console.error('Fill operation failed:', error);
            return undefined;
        } finally {
            resetFillState();
        }
    };

    // 取消填充
    const cancelFill = () => {
        resetFillState();
    };

    // 重置填充状态
    const resetFillState = () => {
        fillHandleState.isDragging = false;
        fillHandleState.highlightRegion = undefined;
        fillHandleState.previousSelection = undefined;
        fillHandleState.startPosition = undefined;
    };

    // 向右填充
    const fillRight = async () => {
        if (!currentRange.value || currentRange.value.width <= 1) return;

        const firstColSelection = {
            ...selection.value,
            current: selection.value.current ? {
                ...selection.value.current,
                range: {
                    ...currentRange.value,
                    width: 1,
                },
            } : undefined,
        };

        return await executeFill(firstColSelection, selection.value);
    };

    // 向下填充
    const fillDown = async () => {
        if (!currentRange.value || currentRange.value.height <= 1) return;

        const firstRowSelection = {
            ...selection.value,
            current: selection.value.current ? {
                ...selection.value.current,
                range: {
                    ...currentRange.value,
                    height: 1,
                },
            } : undefined,
        };

        return await executeFill(firstRowSelection, selection.value);
    };

    // 执行填充操作
    const executeFill = async (patternSelection: GridSelection, targetSelection: GridSelection): Promise<void> => {
        if (!patternSelection.current || !targetSelection.current || !getCellsForSelection) {
            return;
        }

        const patternRange = patternSelection.current.range;
        const targetRange = targetSelection.current.range;

        // 触发填充模式事件
        if (onFillPattern) {
            let canceled = false;
            onFillPattern({
                fillDestination: { ...targetRange, x: targetRange.x - rowMarkerOffset },
                patternSource: { ...patternRange, x: patternRange.x - rowMarkerOffset },
                preventDefault: () => (canceled = true),
            });
            if (canceled) return;
        }

        try {
            // 获取模式数据
            let cells = getCellsForSelection(patternRange, new AbortController().signal);
            if (typeof cells !== 'object') {
                // @ts-ignore
                cells = await cells();
            }

            const pattern = cells as readonly (readonly GridCell[])[];

            // 创建编辑列表
            const editItemList: EditListItem[] = [];
            for (let x = 0; x < targetRange.width; x++) {
                for (let y = 0; y < targetRange.height; y++) {
                    const cell: Item = [targetRange.x + x, targetRange.y + y];
                    if (pointInRect(cell[0], cell[1], patternRange)) continue;
                    
                    const patternCell = pattern[y % patternRange.height][x % patternRange.width];
                    if (!isReadWriteCell(patternCell)) continue;
                    
                    editItemList.push({
                        location: cell,
                        value: patternCell as EditableGridCell,
                    });
                }
            }

            // 应用编辑
            if (editItemList.length > 0 && onCellsEdited) {
                await onCellsEdited(editItemList);
            }
        } catch (error) {
            console.error('Fill operation failed:', error);
        }
    };

    return {
        // 状态
        fillHandleState,
        
        // 计算属性
        isDragging: computed(() => fillHandleState.isDragging),
        highlightRegion: computed(() => fillHandleState.highlightRegion),
        
        // 方法
        startFillDrag,
        updateFillRegion,
        finishFill,
        cancelFill,
        fillRight,
        fillDown,
        resetFillState
    };
}