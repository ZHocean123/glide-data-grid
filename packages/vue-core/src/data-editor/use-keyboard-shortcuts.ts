import { computed, reactive, onMounted, onUnmounted, type Ref } from 'vue';
import { 
    type GridSelection,
    type Item,
    type Rectangle,
} from '../internal/data-grid/data-grid-types.js';
import { browserIsOSX } from '../common/browser-detect.js';
import type { Keybinds } from './data-editor-keybindings.js';

export interface UseKeyboardShortcutsOptions {
    /** 当前选择 */
    selection: Ref<GridSelection>;
    /** 键盘绑定配置 */
    keybindings: Ref<Keybinds>;
    /** 行数 */
    rows: Ref<number>;
    /** 列数 */
    columns: Ref<number>;
    /** 行标记偏移量 */
    rowMarkerOffset: Ref<number>;
    /** 获取单元格内容 */
    getCellContent: (item: Item) => any;
    /** 设置选择 */
    setSelection: (selection: GridSelection) => void;
    /** 单元格激活回调 */
    onCellActivated?: (item: Item, event: any) => void;
    /** 单元格编辑回调 */
    onCellEdited?: (item: Item, newValue: any) => void;
    /** 复制回调 */
    onCopy?: (selection: GridSelection) => void;
    /** 粘贴回调 */
    onPaste?: (target: Item, data: any) => void;
    /** 剪切回调 */
    onCut?: (selection: GridSelection) => void;
    /** 删除回调 */
    onDelete?: (selection: GridSelection) => void;
    /** 撤销回调 */
    onUndo?: () => void;
    /** 重做回调 */
    onRedo?: () => void;
    /** 全选回调 */
    onSelectAll?: () => void;
    /** 取消选择回调 */
    onDeselect?: () => void;
}

export interface KeyboardShortcutsState {
    /** 是否正在处理键盘事件 */
    isProcessing: boolean;
    /** 最后按下的键 */
    lastKey: string | undefined;
    /** 修饰键状态 */
    modifierKeys: {
        ctrl: boolean;
        meta: boolean;
        shift: boolean;
        alt: boolean;
    };
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
    const {
        selection,
        rows,
        columns,
        rowMarkerOffset,
        setSelection,
        onCellActivated,
        onCopy,
        onPaste,
        onCut,
        onDelete,
        onUndo,
        onRedo,
        onSelectAll,
        onDeselect
    } = options;

    // 键盘快捷键状态
    const keyboardState = reactive<KeyboardShortcutsState>({
        isProcessing: false,
        lastKey: undefined,
        modifierKeys: {
            ctrl: false,
            meta: false,
            shift: false,
            alt: false
        }
    });

    // 当前选择的单元格
    const currentCell = computed(() => selection.value.current?.cell);
    const currentRange = computed(() => selection.value.current?.range);

    // 检查是否是有效的单元格位置
    const isValidCell = (col: number, row: number): boolean => {
        return col >= rowMarkerOffset.value && 
               col < columns.value + rowMarkerOffset.value && 
               row >= 0 && 
               row < rows.value;
    };

    // 移动选择到指定位置
    const moveToCell = (col: number, row: number, extendSelection = false) => {
        if (!isValidCell(col, row)) return;

        const newCell: Item = [col, row];
        const newRange: Rectangle = {
            x: col,
            y: row,
            width: 1,
            height: 1
        };

        if (extendSelection && currentRange.value) {
            // 扩展选择
            const minX = Math.min(currentRange.value.x, col);
            const minY = Math.min(currentRange.value.y, row);
            const maxX = Math.max(currentRange.value.x + currentRange.value.width - 1, col);
            const maxY = Math.max(currentRange.value.y + currentRange.value.height - 1, row);

            const extendedRange: Rectangle = {
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
            };

            setSelection({
                ...selection.value,
                current: {
                    cell: newCell,
                    range: extendedRange,
                    rangeStack: []
                }
            });
        } else {
            // 新选择
            setSelection({
                ...selection.value,
                current: {
                    cell: newCell,
                    range: newRange,
                    rangeStack: []
                }
            });
        }
    };

    // 处理键盘导航
    const handleNavigation = (key: string, extendSelection = false) => {
        if (!currentCell.value) return;

        const [col, row] = currentCell.value;

        switch (key) {
            case 'ArrowUp':
                moveToCell(col, row - 1, extendSelection);
                break;
            case 'ArrowDown':
                moveToCell(col, row + 1, extendSelection);
                break;
            case 'ArrowLeft':
                moveToCell(col - 1, row, extendSelection);
                break;
            case 'ArrowRight':
                moveToCell(col + 1, row, extendSelection);
                break;
            case 'Home':
                if (extendSelection && currentRange.value) {
                    moveToCell(currentRange.value.x, row, true);
                } else {
                    moveToCell(rowMarkerOffset.value, row, extendSelection);
                }
                break;
            case 'End':
                if (extendSelection && currentRange.value) {
                    moveToCell(currentRange.value.x + currentRange.value.width - 1, row, true);
                } else {
                    moveToCell(columns.value + rowMarkerOffset.value - 1, row, extendSelection);
                }
                break;
            case 'PageUp':
                moveToCell(col, Math.max(0, row - 10), extendSelection);
                break;
            case 'PageDown':
                moveToCell(col, Math.min(rows.value - 1, row + 10), extendSelection);
                break;
        }
    };

    // 处理编辑相关键
    const handleEditingKeys = (key: string) => {
        if (!currentCell.value) return;

        switch (key) {
            case 'Enter':
                if (currentCell.value) {
                    onCellActivated?.(currentCell.value, { inputType: 'keyboard', key: 'Enter' });
                }
                break;
            case 'F2':
                if (currentCell.value) {
                    onCellActivated?.(currentCell.value, { inputType: 'keyboard', key: 'F2' });
                }
                break;
            case 'Delete':
            case 'Backspace':
                onDelete?.(selection.value);
                break;
            case 'Escape':
                onDeselect?.();
                break;
        }
    };

    // 处理快捷键
    const handleShortcuts = (event: KeyboardEvent) => {
        const isCtrlKey = browserIsOSX.value ? event.metaKey : event.ctrlKey;
        const isAltKey = event.altKey;
        const isShiftKey = event.shiftKey;

        // 更新修饰键状态
        keyboardState.modifierKeys.ctrl = event.ctrlKey;
        keyboardState.modifierKeys.meta = event.metaKey;
        keyboardState.modifierKeys.shift = event.shiftKey;
        keyboardState.modifierKeys.alt = event.altKey;

        // 处理系统级快捷键
        if (isCtrlKey && !isAltKey) {
            switch (event.key) {
                case 'c':
                    if (!isShiftKey) {
                        event.preventDefault();
                        onCopy?.(selection.value);
                    }
                    break;
                case 'v':
                    if (!isShiftKey && currentCell.value) {
                        event.preventDefault();
                        onPaste?.(currentCell.value, null);
                    }
                    break;
                case 'x':
                    if (!isShiftKey) {
                        event.preventDefault();
                        onCut?.(selection.value);
                    }
                    break;
                case 'z':
                    if (!isShiftKey) {
                        event.preventDefault();
                        onUndo?.();
                    } else {
                        event.preventDefault();
                        onRedo?.();
                    }
                    break;
                case 'y':
                    if (!isShiftKey) {
                        event.preventDefault();
                        onRedo?.();
                    }
                    break;
                case 'a':
                    if (!isShiftKey) {
                        event.preventDefault();
                        onSelectAll?.();
                    }
                    break;
            }
        }

        // 处理导航键
        if (!isCtrlKey && !isAltKey) {
            if (event.key.startsWith('Arrow') || ['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
                event.preventDefault();
                handleNavigation(event.key, isShiftKey);
            } else if (['Enter', 'F2', 'Delete', 'Backspace', 'Escape'].includes(event.key)) {
                event.preventDefault();
                handleEditingKeys(event.key);
            }
        }

        // 处理Tab键
        if (event.key === 'Tab') {
            event.preventDefault();
            if (currentCell.value) {
                const [col, row] = currentCell.value;
                if (isShiftKey) {
                    // 向前移动
                    if (col > rowMarkerOffset.value) {
                        moveToCell(col - 1, row);
                    } else if (row > 0) {
                        moveToCell(columns.value + rowMarkerOffset.value - 1, row - 1);
                    }
                } else {
                    // 向后移动
                    if (col < columns.value + rowMarkerOffset.value - 1) {
                        moveToCell(col + 1, row);
                    } else if (row < rows.value - 1) {
                        moveToCell(rowMarkerOffset.value, row + 1);
                    }
                }
            }
        }

        keyboardState.lastKey = event.key;
    };

    // 键盘事件处理器
    const handleKeyDown = (event: KeyboardEvent) => {
        if (keyboardState.isProcessing) return;

        keyboardState.isProcessing = true;

        try {
            // 创建键盘事件参数
            // Handle keyboard shortcuts

            // 处理快捷键
            handleShortcuts(event);
        } finally {
            keyboardState.isProcessing = false;
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        // 更新修饰键状态
        keyboardState.modifierKeys.ctrl = event.ctrlKey;
        keyboardState.modifierKeys.meta = event.metaKey;
        keyboardState.modifierKeys.shift = event.shiftKey;
        keyboardState.modifierKeys.alt = event.altKey;
    };

    // 生命周期钩子
    onMounted(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    });

    return {
        // 状态
        keyboardState,
        
        // 计算属性
        isProcessing: computed(() => keyboardState.isProcessing),
        lastKey: computed(() => keyboardState.lastKey),
        modifierKeys: computed(() => keyboardState.modifierKeys),
        
        // 方法
        moveToCell,
        handleNavigation,
        handleEditingKeys,
        
        // 事件处理器
        handleKeyDown,
        handleKeyUp
    };
}