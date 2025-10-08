import { computed, reactive, type Ref } from 'vue';
import { 
    type GridCell, 
    type Item, 
    type EditableGridCell, 
    type Rectangle,
    type GridSelection,
    type EditListItem,
    isEditableGridCell,
    isReadWriteCell
} from '../internal/data-grid/data-grid-types.js';
import { toggleBoolean } from './data-editor-fns.js';

export interface UseCellEditorOptions {
    /** 当前选择的单元格 */
    selection: Ref<GridSelection>;
    /** 获取单元格内容的函数 */
    getCellContent: (item: Item) => GridCell;
    /** 单元格编辑完成回调 */
    onCellEdited?: (item: Item, newValue: EditableGridCell) => void;
    /** 批量单元格编辑完成回调 */
    onCellsEdited?: (items: readonly EditListItem[]) => boolean | void;
    /** 单元格验证函数 */
    validateCell?: (item: Item, newValue: EditableGridCell, prevValue: GridCell) => boolean | EditableGridCell;
    /** 编辑完成回调 */
    onFinishedEditing?: (newValue: GridCell | undefined, movement: Item) => void;
    /** 单元格激活回调 */
    onCellActivated?: (item: Item, event: any) => void;
}

export interface CellEditorState {
    /** 是否正在编辑 */
    isEditing: boolean;
    /** 编辑的目标位置 */
    target: Rectangle | undefined;
    /** 编辑的单元格内容 */
    content: GridCell | undefined;
    /** 编辑的单元格位置 */
    cell: Item | undefined;
    /** 初始值 */
    initialValue: string | undefined;
    /** 是否高亮 */
    highlight: boolean;
    /** 是否强制进入编辑模式 */
    forceEditMode: boolean;
    /** 激活事件 */
    activation: any;
}

export function useCellEditor(options: UseCellEditorOptions) {
    const {
        selection,
        getCellContent,
        onCellEdited,
        onCellsEdited,
        validateCell,
        onFinishedEditing,
        onCellActivated
    } = options;

    // 编辑器状态
    const editorState = reactive<CellEditorState>({
        isEditing: false,
        target: undefined,
        content: undefined,
        cell: undefined,
        initialValue: undefined,
        highlight: false,
        forceEditMode: false,
        activation: undefined
    });

    // 当前选中的单元格
    const currentCell = computed(() => selection.value.current?.cell);

    // 开始编辑单元格
    const startEditing = (
        cell: Item,
        bounds: Rectangle,
        initialValue?: string,
        forceEditMode = false,
        activation?: any
    ) => {
        const cellContent = getCellContent(cell);
        
        // 检查单元格是否可编辑
        if (!isEditableGridCell(cellContent) || !isReadWriteCell(cellContent)) {
            return false;
        }

        // 布尔单元格特殊处理
        if (cellContent.kind === 'boolean') {
            const boolCell = cellContent as any;
            if (activation?.inputType === 'keyboard' && boolCell.readonly !== true) {
                const newValue = {
                    ...boolCell,
                    data: toggleBoolean(boolCell.data),
                };
                
                if (onCellsEdited) {
                    onCellsEdited([{
                        location: cell,
                        value: newValue
                    }]);
                } else if (onCellEdited) {
                    onCellEdited(cell, newValue);
                }
                return true;
            }
        }

        // 设置编辑器状态
        editorState.isEditing = true;
        editorState.target = bounds;
        editorState.cell = cell;
        editorState.highlight = initialValue === undefined;
        editorState.forceEditMode = forceEditMode;
        editorState.activation = activation;

        // 处理初始值
        let content = cellContent;
        if (initialValue !== undefined) {
            switch (content.kind) {
                case 'number': {
                    const num = initialValue === "-" ? -0 : Number.parseFloat(initialValue);
                    content = {
                        ...content,
                        data: Number.isNaN(num) ? 0 : num,
                    };
                    break;
                }
                case 'text':
                case 'markdown':
                case 'uri':
                    content = {
                        ...content,
                        data: initialValue,
                    };
                    break;
            }
        }
        
        editorState.content = content;
        editorState.initialValue = initialValue;

        // 触发单元格激活事件
        if (onCellActivated) {
            onCellActivated(cell, activation);
        }

        return true;
    };

    // 完成编辑
    const finishEditing = (newValue: GridCell | undefined, movement: Item) => {
        if (!editorState.cell || !editorState.content) return;

        // 如果有新值且是可编辑单元格
        if (newValue !== undefined && isEditableGridCell(newValue)) {
            // 验证新值
            let validatedValue = newValue;
            if (validateCell) {
                const validationResult = validateCell(editorState.cell, newValue, editorState.content);
                if (validationResult === false) {
                    // 验证失败，取消编辑
                    cancelEditing();
                    return;
                } else if (validationResult !== true) {
                    validatedValue = validationResult;
                }
            }

            // 应用编辑
            if (onCellsEdited) {
                const result = onCellsEdited([{
                    location: editorState.cell,
                    value: validatedValue
                }]);
                
                // 如果返回true，则不调用单个单元格编辑回调
                if (result !== true && onCellEdited) {
                    onCellEdited(editorState.cell, validatedValue);
                }
            } else if (onCellEdited) {
                onCellEdited(editorState.cell, validatedValue);
            }
        }

        // 重置编辑器状态
        resetEditingState();

        // 触发编辑完成事件
        if (onFinishedEditing) {
            onFinishedEditing(newValue, movement);
        }
    };

    // 取消编辑
    const cancelEditing = () => {
        resetEditingState();
    };

    // 重置编辑器状态
    const resetEditingState = () => {
        editorState.isEditing = false;
        editorState.target = undefined;
        editorState.content = undefined;
        editorState.cell = undefined;
        editorState.initialValue = undefined;
        editorState.highlight = false;
        editorState.forceEditMode = false;
        editorState.activation = undefined;
    };

    // 激活当前选中的单元格
    const activateCurrentCell = (bounds: Rectangle, activation: any, initialValue?: string) => {
        if (!currentCell.value) return false;
        return startEditing(currentCell.value, bounds, initialValue, false, activation);
    };

    // 处理键盘事件
    const handleKeyDown = (event: KeyboardEvent, bounds?: Rectangle) => {
        if (!editorState.isEditing && !currentCell.value) return;

        // 处理编辑中的键盘事件
        if (editorState.isEditing) {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    if (event.shiftKey) {
                        // Shift+Enter: 向上移动
                        finishEditing(editorState.content, [0, -1]);
                    } else {
                        // Enter: 向下移动
                        finishEditing(editorState.content, [0, 1]);
                    }
                    break;
                case 'Tab':
                    event.preventDefault();
                    if (event.shiftKey) {
                        // Shift+Tab: 向左移动
                        finishEditing(editorState.content, [-1, 0]);
                    } else {
                        // Tab: 向右移动
                        finishEditing(editorState.content, [1, 0]);
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    cancelEditing();
                    break;
            }
        } else {
            // 处理非编辑状态的键盘事件
            if (bounds && (event.key === 'Enter' || event.key === ' ' || event.key === 'F2')) {
                event.preventDefault();
                const activation = {
                    inputType: 'keyboard',
                    key: event.key
                };
                activateCurrentCell(bounds, activation);
            }
        }
    };

    return {
        // 状态
        editorState,
        currentCell,
        
        // 方法
        startEditing,
        finishEditing,
        cancelEditing,
        activateCurrentCell,
        handleKeyDown,
        
        // 计算属性
        isEditing: computed(() => editorState.isEditing),
        editTarget: computed(() => editorState.target),
        editContent: computed(() => editorState.content),
        editCell: computed(() => editorState.cell)
    };
}