import { computed, reactive, type Ref } from 'vue';
import { 
    type GridCell, 
    type Item, 
    type Rectangle,
    type GridSelection,
    type CopyBuffer,
    GridCellKind,
    isEditableGridCell,
    isReadWriteCell
} from '../internal/data-grid/data-grid-types.js';
import { copyToClipboard, unquote } from './data-editor-fns.js';
import { browserIsOSX } from '../common/browser-detect.js';

export interface UseCopyPasteOptions {
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
    onCellEdited?: (item: Item, newValue: any) => void;
    /** 批量单元格编辑完成回调 */
    onCellsEdited?: (items: readonly any[]) => boolean | void;
    /** 粘贴回调 */
    onPaste?: (target: Item, values: readonly (readonly string[])[]) => boolean;
    /** 强制粘贴值回调 */
    coercePasteValue?: (val: string, cell: GridCell) => GridCell | undefined;
    /** 是否包含表头 */
    copyHeaders?: boolean;
    /** 行标记偏移量 */
    rowMarkerOffset: number;
    /** 列信息 */
    columns: readonly any[];
    /** 行数 */
    rows: number;
}

export interface CopyPasteState {
    /** 是否正在复制 */
    isCopying: boolean;
    /** 是否正在粘贴 */
    isPasting: boolean;
    /** 复制的数据 */
    copiedData: CopyBuffer | undefined;
}

export function useCopyPaste(options: UseCopyPasteOptions) {
    const {
        selection,
        getCellContent,
        getCellsForSelection,
        onCellEdited,
        onCellsEdited,
        onPaste,
        coercePasteValue,
        copyHeaders = false,
        rowMarkerOffset,
        columns,
        rows
    } = options;

    // 复制粘贴状态
    const copyPasteState = reactive<CopyPasteState>({
        isCopying: false,
        isPasting: false,
        copiedData: undefined
    });

    // 当前选择区域
    const currentRange = computed(() => selection.value.current?.range);

    // 简单的HTML解码函数
    function decodeHTML(html: string): CopyBuffer | undefined {
        try {
            // 简化实现，实际应该使用更复杂的HTML解析
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const table = doc.querySelector('table');
            if (!table) return undefined;
            
            const rows = Array.from(table.querySelectorAll('tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                return cells.map(cell => {
                    const text = cell.textContent || '';
                    return {
                        rawValue: text,
                        formatted: text
                    };
                });
            });
        } catch {
            return undefined;
        }
    }

    // 复制到剪贴板
    const copyToClipboardInternal = async (e?: ClipboardEvent) => {
        if (!getCellsForSelection || !currentRange.value) return false;

        copyPasteState.isCopying = true;

        try {
            let cells = getCellsForSelection(currentRange.value, new AbortController().signal);
            if (cells instanceof Promise) {
                cells = await cells;
            }

            const columnIndexes = Array.from(
                { length: currentRange.value?.width || 0 },
                (_, i) => (currentRange.value?.x || 0) + i - rowMarkerOffset
            );

            if (!copyHeaders) {
                copyToClipboard(cells, columnIndexes, e);
            } else {
                const headers = columnIndexes.map(index => ({
                    kind: 'text' as const,
                    data: columns[index].title,
                    displayData: columns[index].title,
                    allowOverlay: false,
                })) as GridCell[];
                copyToClipboard([headers, ...cells], columnIndexes, e);
            }

            return true;
        } catch (error) {
            console.error('Copy operation failed:', error);
            return false;
        } finally {
            copyPasteState.isCopying = false;
        }
    };

    // 从剪贴板粘贴
    const pasteFromClipboard = async (e?: ClipboardEvent) => {
        if (!getCellsForSelection || !currentRange.value) return false;

        copyPasteState.isPasting = true;

        try {
            const target: Item = [currentRange.value.x, currentRange.value.y];
            let data: CopyBuffer | undefined;
            let text: string | undefined;

            const textPlain = "text/plain";
            const textHtml = "text/html";

            if (navigator.clipboard?.read !== undefined) {
                const clipboardContent = await navigator.clipboard.read();

                for (const item of clipboardContent) {
                    if (item.types.includes(textHtml)) {
                        const htmlBlob = await item.getType(textHtml);
                        const html = await htmlBlob.text();
                        const decoded = decodeHTML(html);
                        if (decoded !== undefined) {
                            data = decoded;
                            break;
                        }
                    }
                    if (item.types.includes(textPlain)) {
                        text = await (await item.getType(textPlain)).text();
                    }
                }
            } else if (navigator.clipboard?.readText !== undefined) {
                text = await navigator.clipboard.readText();
            } else if (e !== undefined && e?.clipboardData !== null) {
                if (e.clipboardData.types.includes(textHtml)) {
                    const html = e.clipboardData.getData(textHtml);
                    data = decodeHTML(html);
                }
                if (data === undefined && e.clipboardData.types.includes(textPlain)) {
                    text = e.clipboardData.getData(textPlain);
                }
            } else {
                return false;
            }

            const [targetCol, targetRow] = target;
            const editList: any[] = [];
            
            if (data === undefined) {
                if (text === undefined) return false;
                data = unquote(text);
            }

            if (data && (
                onPaste === undefined ||
                (typeof onPaste === "function" &&
                    onPaste?.(
                        [target[0] - rowMarkerOffset, target[1]],
                        data.map(r => r.map(cb => cb.rawValue?.toString() ?? ""))
                    ) === true)
            )) {
                for (const [row, dataRow] of data.entries()) {
                    if (row + targetRow >= rows) break;
                    for (const [col, dataItem] of dataRow.entries()) {
                        const index = [col + targetCol, row + targetRow] as const;
                        const [writeCol, writeRow] = index;
                        if (writeCol >= columns.length) continue;
                        if (writeRow >= rows) continue;
                        const cellData = getCellContent(index);
                        const newVal = pasteToCell(cellData, index, dataItem.rawValue, dataItem.formatted);
                        if (newVal !== undefined) {
                            editList.push(newVal);
                        }
                    }
                }
            }

            if (editList.length > 0) {
                if (onCellsEdited) {
                    const result = onCellsEdited(editList);
                    if (result !== true && onCellEdited) {
                        for (const item of editList) {
                            onCellEdited(item.location, item.value);
                        }
                    }
                } else if (onCellEdited) {
                    for (const item of editList) {
                        onCellEdited(item.location, item.value);
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Paste operation failed:', error);
            return false;
        } finally {
            copyPasteState.isPasting = false;
        }
    };

    // 粘贴到单元格
    function pasteToCell(
        inner: GridCell,
        target: Item,
        rawValue: string | boolean | string[] | number | undefined,
        _formatted?: string | string[]
    ): any | undefined {
        const stringifiedRawValue =
            typeof rawValue === "object" ? (rawValue?.join("\n") ?? "") : (rawValue?.toString() ?? "");

        if (isEditableGridCell(inner) && isReadWriteCell(inner)) {
            const coerced = coercePasteValue?.(stringifiedRawValue, inner);
            if (coerced !== undefined && isEditableGridCell(coerced)) {
                return {
                    location: target,
                    value: coerced,
                };
            }
            
            // 简化的单元格处理，实际应该根据单元格类型进行不同的处理
            switch (inner.kind) {
                case GridCellKind.Text:
                case GridCellKind.Markdown:
                case GridCellKind.Uri:
                    return {
                        location: target,
                        value: {
                            ...inner,
                            data: stringifiedRawValue,
                        },
                    };
                case GridCellKind.Number:
                    const num = Number.parseFloat(stringifiedRawValue);
                    return {
                        location: target,
                        value: {
                            ...inner,
                            data: Number.isNaN(num) ? 0 : num,
                        },
                    };
                case GridCellKind.Boolean:
                    const lowerVal = stringifiedRawValue.toLowerCase();
                    let boolValue: boolean | null | undefined = undefined;
                    if (lowerVal === 'true' || lowerVal === '1') {
                        boolValue = true;
                    } else if (lowerVal === 'false' || lowerVal === '0') {
                        boolValue = false;
                    } else {
                        boolValue = null;
                    }
                    return {
                        location: target,
                        value: {
                            ...(inner as any),
                            data: boolValue,
                        },
                    };
                default:
                    return undefined;
            }
        }
        return undefined;
    }

    // 剪切操作
    const cutToClipboard = async (e?: ClipboardEvent) => {
        const copySuccess = await copyToClipboardInternal(e);
        if (!copySuccess) return false;

        // 删除选择的内容
        if (currentRange.value) {
            // 简化实现，实际应该调用删除逻辑
            console.log('Cut operation: delete selected content');
        }

        return true;
    };

    return {
        // 状态
        copyPasteState,
        
        // 计算属性
        isCopying: computed(() => copyPasteState.isCopying),
        isPasting: computed(() => copyPasteState.isPasting),
        hasCopiedData: computed(() => copyPasteState.copiedData !== undefined),
        
        // 方法
        copyToClipboard: copyToClipboardInternal,
        pasteFromClipboard,
        cutToClipboard,
        
        // 键盘事件处理
        handleKeyDown: async (event: KeyboardEvent) => {
            const isCtrlKey = browserIsOSX.value ? event.metaKey : event.ctrlKey;
            
            if (isCtrlKey) {
                switch (event.key) {
                    case 'c':
                        if (!event.shiftKey) {
                            event.preventDefault();
                            await copyToClipboardInternal();
                        }
                        break;
                    case 'v':
                        if (!event.shiftKey) {
                            event.preventDefault();
                            await pasteFromClipboard();
                        }
                        break;
                    case 'x':
                        if (!event.shiftKey) {
                            event.preventDefault();
                            await cutToClipboard();
                        }
                        break;
                }
            }
        }
    };
}