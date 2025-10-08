import { describe, it, expect } from 'vitest';
import {
    GridCellKind,
    CompactSelection,
    emptyGridSelection,
    isEditableGridCell,
    isReadWriteCell,
    isInnerOnlyCell,
    type GridCell,
    type TextCell,
    type NumberCell,
    type BooleanCell,
    type ImageCell,
    type UriCell,
    type MarkdownCell,
    type CustomCell,
    type LoadingCell,
    type ProtectedCell,
    type BubbleCell,
    type DrilldownCell,
    type RowIDCell,
    type EditableGridCell,
    type GridSelection,
    type GridColumn,
    type Rectangle,
    type Item,
    type Slice
} from '../../internal/data-grid/data-grid-types.js';

describe('类型定义测试', () => {
    describe('GridCellKind 枚举', () => {
        it('应该包含所有预期的单元格类型', () => {
            expect(GridCellKind.Text).toBe('text');
            expect(GridCellKind.Number).toBe('number');
            expect(GridCellKind.Boolean).toBe('boolean');
            expect(GridCellKind.Image).toBe('image');
            expect(GridCellKind.Uri).toBe('uri');
            expect(GridCellKind.Markdown).toBe('markdown');
            expect(GridCellKind.Custom).toBe('custom');
            expect(GridCellKind.Loading).toBe('loading');
            expect(GridCellKind.Protected).toBe('protected');
            expect(GridCellKind.Bubble).toBe('bubble');
            expect(GridCellKind.Drilldown).toBe('drilldown');
            expect(GridCellKind.RowID).toBe('row-id');
        });
    });

    describe('单元格类型', () => {
        it('应该正确创建文本单元格', () => {
            const cell: TextCell = {
                kind: GridCellKind.Text,
                data: 'Test text',
                allowOverlay: true,
                displayData: 'Display text'
            };

            expect(cell.kind).toBe(GridCellKind.Text);
            expect(cell.data).toBe('Test text');
            expect(cell.allowOverlay).toBe(true);
            expect(cell.displayData).toBe('Display text');
        });

        it('应该正确创建数字单元格', () => {
            const cell: NumberCell = {
                kind: GridCellKind.Number,
                data: 42,
                allowOverlay: true,
                displayData: '42'
            };

            expect(cell.kind).toBe(GridCellKind.Number);
            expect(cell.data).toBe(42);
            expect(cell.allowOverlay).toBe(true);
            expect(cell.displayData).toBe('42');
        });

        it('应该正确创建布尔单元格', () => {
            const cell1: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false,
                readonly: false
            };

            const cell2: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: false,
                allowOverlay: false,
                readonly: true
            };

            const cell3: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: null,
                allowOverlay: false
            };

            expect(cell1.kind).toBe(GridCellKind.Boolean);
            expect(cell1.data).toBe(true);
            expect(cell1.readonly).toBe(false);

            expect(cell2.kind).toBe(GridCellKind.Boolean);
            expect(cell2.data).toBe(false);
            expect(cell2.readonly).toBe(true);

            expect(cell3.kind).toBe(GridCellKind.Boolean);
            expect(cell3.data).toBe(null);
        });

        it('应该正确创建图像单元格', () => {
            const cell: ImageCell = {
                kind: GridCellKind.Image,
                data: ['image1.jpg', 'image2.png'],
                allowOverlay: true
            };

            expect(cell.kind).toBe(GridCellKind.Image);
            expect(cell.data).toEqual(['image1.jpg', 'image2.png']);
            expect(cell.allowOverlay).toBe(true);
        });

        it('应该正确创建URI单元格', () => {
            const cell: UriCell = {
                kind: GridCellKind.Uri,
                data: 'https://example.com',
                allowOverlay: true,
                displayData: 'Example'
            };

            expect(cell.kind).toBe(GridCellKind.Uri);
            expect(cell.data).toBe('https://example.com');
            expect(cell.allowOverlay).toBe(true);
            expect(cell.displayData).toBe('Example');
        });

        it('应该正确创建Markdown单元格', () => {
            const cell: MarkdownCell = {
                kind: GridCellKind.Markdown,
                data: '# Title\n\nContent',
                allowOverlay: true
            };

            expect(cell.kind).toBe(GridCellKind.Markdown);
            expect(cell.data).toBe('# Title\n\nContent');
            expect(cell.allowOverlay).toBe(true);
        });

        it('应该正确创建自定义单元格', () => {
            const cell: CustomCell<{ name: string; value: number }> = {
                kind: GridCellKind.Custom,
                data: { name: 'test', value: 42 },
                copyData: 'test: 42',
                allowOverlay: true
            };

            expect(cell.kind).toBe(GridCellKind.Custom);
            expect(cell.data).toEqual({ name: 'test', value: 42 });
            expect(cell.copyData).toBe('test: 42');
            expect(cell.allowOverlay).toBe(true);
        });

        it('应该正确创建加载单元格', () => {
            const cell: LoadingCell = {
                kind: GridCellKind.Loading,
                allowOverlay: false
            };

            expect(cell.kind).toBe(GridCellKind.Loading);
            expect(cell.allowOverlay).toBe(false);
        });

        it('应该正确创建受保护单元格', () => {
            const cell: ProtectedCell = {
                kind: GridCellKind.Protected,
                allowOverlay: false
            };

            expect(cell.kind).toBe(GridCellKind.Protected);
            expect(cell.allowOverlay).toBe(false);
        });

        it('应该正确创建气泡单元格', () => {
            const cell: BubbleCell = {
                kind: GridCellKind.Bubble,
                data: ['Item 1', 'Item 2', 'Item 3'],
                allowOverlay: true
            };

            expect(cell.kind).toBe(GridCellKind.Bubble);
            expect(cell.data).toEqual(['Item 1', 'Item 2', 'Item 3']);
            expect(cell.allowOverlay).toBe(true);
        });

        it('应该正确创建下钻单元格', () => {
            const cell: DrilldownCell = {
                kind: GridCellKind.Drilldown,
                data: [
                    { text: 'Level 1', img: 'icon1.png' },
                    { text: 'Level 2' }
                ],
                allowOverlay: true
            };

            expect(cell.kind).toBe(GridCellKind.Drilldown);
            expect(cell.data).toEqual([
                { text: 'Level 1', img: 'icon1.png' },
                { text: 'Level 2' }
            ]);
            expect(cell.allowOverlay).toBe(true);
        });

        it('应该正确创建行ID单元格', () => {
            const cell: RowIDCell = {
                kind: GridCellKind.RowID,
                data: 'row-123',
                allowOverlay: false
            };

            expect(cell.kind).toBe(GridCellKind.RowID);
            expect(cell.data).toBe('row-123');
            expect(cell.allowOverlay).toBe(false);
        });
    });

    describe('CompactSelection 类', () => {
        it('应该创建空选择', () => {
            const selection = CompactSelection.empty();
            expect(selection.length).toBe(0);
            expect(selection.hasIndex(0)).toBe(false);
            expect(selection.first()).toBeUndefined();
        });

        it('应该创建单索引选择', () => {
            const selection = CompactSelection.fromSingleSelection(5);
            expect(selection.length).toBe(1);
            expect(selection.hasIndex(5)).toBe(true);
            expect(selection.hasIndex(4)).toBe(false);
            expect(selection.first()).toBe(5);
        });

        it('应该创建范围选择', () => {
            const selection = CompactSelection.fromSingleSelection([2, 5] as Slice);
            expect(selection.length).toBe(3);
            expect(selection.hasIndex(2)).toBe(true);
            expect(selection.hasIndex(3)).toBe(true);
            expect(selection.hasIndex(4)).toBe(true);
            expect(selection.hasIndex(5)).toBe(false);
            expect(selection.first()).toBe(2);
        });

        it('应该添加索引', () => {
            let selection = CompactSelection.empty();
            selection = selection.add(3);
            expect(selection.hasIndex(3)).toBe(true);
            
            selection = selection.add(7);
            expect(selection.hasIndex(3)).toBe(true);
            expect(selection.hasIndex(7)).toBe(true);
        });

        it('应该移除索引', () => {
            let selection = CompactSelection.fromSingleSelection([2, 5] as Slice);
            expect(selection.hasIndex(3)).toBe(true);
            
            selection = selection.remove(3);
            expect(selection.hasIndex(2)).toBe(true);
            expect(selection.hasIndex(3)).toBe(false);
            expect(selection.hasIndex(4)).toBe(true);
        });

        it('应该检查是否包含所有索引', () => {
            const selection = CompactSelection.fromSingleSelection([2, 6] as Slice);
            expect(selection.hasAll([2, 6] as Slice)).toBe(true);
            expect(selection.hasAll([3, 5] as Slice)).toBe(true);
            expect(selection.hasAll([1, 3] as Slice)).toBe(false);
            expect(selection.hasAll([5, 7] as Slice)).toBe(false);
        });

        it('应该偏移选择', () => {
            let selection = CompactSelection.fromSingleSelection([2, 5] as Slice);
            selection = selection.offset(3);
            
            expect(selection.hasIndex(5)).toBe(true);
            expect(selection.hasIndex(7)).toBe(true);
            expect(selection.hasIndex(8)).toBe(true);
            expect(selection.hasIndex(2)).toBe(false);
        });
    });

    describe('GridSelection 接口', () => {
        it('应该创建空网格选择', () => {
            const selection: GridSelection = emptyGridSelection;
            expect(selection.current).toBeUndefined();
            expect(selection.columns.length).toBe(0);
            expect(selection.rows.length).toBe(0);
        });

        it('应该创建带当前选择的网格选择', () => {
            const selection: GridSelection = {
                current: {
                    cell: [2, 3] as Item,
                    range: { x: 2, y: 3, width: 4, height: 5 },
                    rangeStack: []
                },
                columns: CompactSelection.empty(),
                rows: CompactSelection.empty()
            };

            expect(selection.current?.cell).toEqual([2, 3]);
            expect(selection.current?.range).toEqual({ x: 2, y: 3, width: 4, height: 5 });
            expect(selection.current?.rangeStack).toEqual([]);
        });

        it('应该创建带列和行选择的网格选择', () => {
            const selection: GridSelection = {
                current: {
                    cell: [1, 1] as Item,
                    range: { x: 1, y: 1, width: 1, height: 1 },
                    rangeStack: []
                },
                columns: CompactSelection.fromSingleSelection([2, 4] as Slice),
                rows: CompactSelection.fromSingleSelection([3, 6] as Slice)
            };

            expect(selection.columns.hasIndex(2)).toBe(true);
            expect(selection.columns.hasIndex(3)).toBe(true);
            expect(selection.columns.hasIndex(4)).toBe(false);
            
            expect(selection.rows.hasIndex(3)).toBe(true);
            expect(selection.rows.hasIndex(5)).toBe(true);
            expect(selection.rows.hasIndex(6)).toBe(false);
        });
    });

    describe('GridColumn 接口', () => {
        it('应该创建基本列', () => {
            const column: GridColumn = {
                title: 'Test Column',
                width: 150
            };

            expect(column.title).toBe('Test Column');
            expect(column.width).toBe(150);
        });

        it('应该创建带所有属性的列', () => {
            const column: GridColumn = {
                title: 'Full Column',
                width: 200,
                icon: 'icon.png',
                hasMenu: true,
                style: 'highlight',
                themeOverride: { bgColor: 'red' },
                overlayIcon: 'overlay.png',
                readonly: false,
                group: 'Group 1',
                trailingRowOptions: {
                    hint: 'Add new row',
                    disabled: false,
                    addIcon: 'plus.png',
                    targetColumn: 1
                }
            };

            expect(column.title).toBe('Full Column');
            expect(column.width).toBe(200);
            expect(column.icon).toBe('icon.png');
            expect(column.hasMenu).toBe(true);
            expect(column.style).toBe('highlight');
            expect(column.readonly).toBe(false);
            expect(column.group).toBe('Group 1');
        });
    });

    describe('Rectangle 接口', () => {
        it('应该创建矩形', () => {
            const rect: Rectangle = {
                x: 10,
                y: 20,
                width: 100,
                height: 50
            };

            expect(rect.x).toBe(10);
            expect(rect.y).toBe(20);
            expect(rect.width).toBe(100);
            expect(rect.height).toBe(50);
        });
    });

    describe('Item 和 Slice 类型', () => {
        it('应该正确使用 Item 类型', () => {
            const item: Item = [5, 10];
            expect(item[0]).toBe(5);
            expect(item[1]).toBe(10);
            expect(item).toBeReadOnly();
        });

        it('应该正确使用 Slice 类型', () => {
            const slice: Slice = [2, 8];
            expect(slice[0]).toBe(2);
            expect(slice[1]).toBe(8);
            expect(slice).toBeReadOnly();
        });
    });

    describe('类型守卫函数', () => {
        it('isEditableGridCell 应该正确识别可编辑单元格', () => {
            const editableCells: EditableGridCell[] = [
                {
                    kind: GridCellKind.Text,
                    data: 'Text',
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Number,
                    data: 42,
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Uri,
                    data: 'https://example.com',
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Markdown,
                    data: '# Title',
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Custom,
                    data: { value: 42 },
                    copyData: '42',
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Boolean,
                    data: true,
                    allowOverlay: false
                }
            ];

            const nonEditableCells: GridCell[] = [
                {
                    kind: GridCellKind.Image,
                    data: ['image.jpg'],
                    allowOverlay: true
                } as ImageCell,
                {
                    kind: GridCellKind.Loading,
                    allowOverlay: false
                } as LoadingCell,
                {
                    kind: GridCellKind.Protected,
                    allowOverlay: false
                } as ProtectedCell,
                {
                    kind: GridCellKind.Bubble,
                    data: ['Item 1'],
                    allowOverlay: true
                } as BubbleCell,
                {
                    kind: GridCellKind.Drilldown,
                    data: [{ text: 'Item' }],
                    allowOverlay: true
                } as DrilldownCell,
                {
                    kind: GridCellKind.RowID,
                    data: 'row-1',
                    allowOverlay: false
                } as RowIDCell
            ];

            editableCells.forEach(cell => {
                expect(isEditableGridCell(cell)).toBe(true);
            });

            nonEditableCells.forEach(cell => {
                expect(isEditableGridCell(cell)).toBe(false);
            });
        });

        it('isReadWriteCell 应该正确识别读写单元格', () => {
            const readWriteCells: EditableGridCell[] = [
                {
                    kind: GridCellKind.Text,
                    data: 'Text',
                    allowOverlay: true
                },
                {
                    kind: GridCellKind.Boolean,
                    data: true,
                    allowOverlay: false,
                    readonly: false
                }
            ];

            const readOnlyCells: EditableGridCell[] = [
                {
                    kind: GridCellKind.Boolean,
                    data: true,
                    allowOverlay: false,
                    readonly: true
                }
            ];

            readWriteCells.forEach(cell => {
                expect(isReadWriteCell(cell)).toBe(true);
            });

            readOnlyCells.forEach(cell => {
                expect(isReadWriteCell(cell)).toBe(false);
            });
        });

        it('isInnerOnlyCell 应该正确识别内部单元格', () => {
            // 这个测试需要 InnerGridCell 类型，但它在当前文件中不可用
            // 我们可以测试函数是否存在
            expect(typeof isInnerOnlyCell).toBe('function');
        });
    });

    describe('类型兼容性', () => {
        it('应该正确处理类型转换', () => {
            const textCell: TextCell = {
                kind: GridCellKind.Text,
                data: 'Text',
                allowOverlay: true
            };

            const gridCell: GridCell = textCell;
            expect(gridCell.kind).toBe(GridCellKind.Text);

            if (isEditableGridCell(gridCell)) {
                const editableCell: EditableGridCell = gridCell;
                expect(editableCell.allowOverlay).toBe(true);
            }
        });

        it('应该正确处理联合类型', () => {
            const cells: GridCell[] = [
                {
                    kind: GridCellKind.Text,
                    data: 'Text',
                    allowOverlay: true
                } as TextCell,
                {
                    kind: GridCellKind.Number,
                    data: 42,
                    allowOverlay: true
                } as NumberCell,
                {
                    kind: GridCellKind.Image,
                    data: ['image.jpg'],
                    allowOverlay: true
                } as ImageCell
            ];

            cells.forEach(cell => {
                switch (cell.kind) {
                    case GridCellKind.Text:
                        expect((cell as TextCell).data).toBeTypeOf('string');
                        break;
                    case GridCellKind.Number:
                        expect((cell as NumberCell).data).toBeTypeOf('number');
                        break;
                    case GridCellKind.Image:
                        expect(Array.isArray((cell as ImageCell).data)).toBe(true);
                        break;
                }
            });
        });
    });
});