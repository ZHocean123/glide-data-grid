import { describe, it, expect } from 'vitest';
import {
    CompactSelection,
    GridCellKind,
    isEditableGridCell,
    isTextEditableGridCell,
    isReadWriteCell,
    booleanCellIsEditable,
    type TextCell,
    type NumberCell,
    type BooleanCell,
    type ImageCell,
    type MarkdownCell,
    type UriCell,
    type CustomCell,
    type BubbleCell,
    type RowIDCell,
    type LoadingCell,
    type ProtectedCell,
    type DrilldownCell,
    BooleanEmpty,
    BooleanIndeterminate
} from '../src/internal/data-grid/data-grid-types';

describe('Data Grid Types', () => {
    describe('CompactSelection', () => {
        it('should create empty selection', () => {
            const selection = CompactSelection.empty();
            expect(selection.length).toBe(0);
            expect(selection.first()).toBeUndefined();
            expect(selection.last()).toBeUndefined();
        });

        it('should create from single selection', () => {
            const selection = CompactSelection.fromSingleSelection(5);
            expect(selection.length).toBe(1);
            expect(selection.hasIndex(5)).toBe(true);
            expect(selection.hasIndex(4)).toBe(false);
        });

        it('should create from array', () => {
            const selection = CompactSelection.fromArray([1, 3, 5]);
            expect(selection.length).toBe(3);
            expect(selection.hasIndex(1)).toBe(true);
            expect(selection.hasIndex(3)).toBe(true);
            expect(selection.hasIndex(5)).toBe(true);
            expect(selection.hasIndex(2)).toBe(false);
        });

        it('should add selections', () => {
            let selection = CompactSelection.empty();
            selection = selection.add(5);
            selection = selection.add([10, 15]);

            expect(selection.length).toBe(6); // 5 + [10,15] = 5, 10, 11, 12, 13, 14
            expect(selection.hasIndex(5)).toBe(true);
            expect(selection.hasIndex(10)).toBe(true);
            expect(selection.hasIndex(14)).toBe(true);
        });

        it('should remove selections', () => {
            let selection = CompactSelection.fromArray([1, 2, 3, 4, 5]);
            selection = selection.remove(3);

            expect(selection.length).toBe(4);
            expect(selection.hasIndex(3)).toBe(false);
            expect(selection.hasIndex(2)).toBe(true);
            expect(selection.hasIndex(4)).toBe(true);
        });

        it('should iterate over selections', () => {
            const selection = CompactSelection.fromArray([1, 3, 5]);
            const items = Array.from(selection);
            expect(items).toEqual([1, 3, 5]);
        });

        it('should check equality', () => {
            const selection1 = CompactSelection.fromArray([1, 2, 3]);
            const selection2 = CompactSelection.fromArray([1, 2, 3]);
            const selection3 = CompactSelection.fromArray([1, 2]);

            expect(selection1.equals(selection2)).toBe(true);
            expect(selection1.equals(selection3)).toBe(false);
        });
    });

    describe('Cell Type Guards', () => {
        it('should identify editable grid cells', () => {
            const textCell: TextCell = {
                kind: GridCellKind.Text,
                displayData: 'test',
                data: 'test',
                allowOverlay: true
            };

            const numberCell: NumberCell = {
                kind: GridCellKind.Number,
                displayData: '123',
                data: 123,
                allowOverlay: true
            };

            const loadingCell: LoadingCell = {
                kind: GridCellKind.Loading,
                allowOverlay: false
            };

            expect(isEditableGridCell(textCell)).toBe(true);
            expect(isEditableGridCell(numberCell)).toBe(true);
            expect(isEditableGridCell(loadingCell)).toBe(false);
        });

        it('should identify text editable grid cells', () => {
            const textCell: TextCell = {
                kind: GridCellKind.Text,
                displayData: 'test',
                data: 'test',
                allowOverlay: true
            };

            const booleanCell: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false
            };

            expect(isTextEditableGridCell(textCell)).toBe(true);
            expect(isTextEditableGridCell(booleanCell)).toBe(false);
        });

        it('should identify read-write cells', () => {
            const textCell: TextCell = {
                kind: GridCellKind.Text,
                displayData: 'test',
                data: 'test',
                allowOverlay: true
            };

            const readonlyTextCell: TextCell = {
                kind: GridCellKind.Text,
                displayData: 'test',
                data: 'test',
                allowOverlay: true,
                readonly: true
            };

            const imageCell: ImageCell = {
                kind: GridCellKind.Image,
                data: ['image.jpg'],
                allowOverlay: true
            };

            expect(isReadWriteCell(textCell)).toBe(true);
            expect(isReadWriteCell(readonlyTextCell)).toBe(false);
            expect(isReadWriteCell(imageCell)).toBe(false);
        });

        it('should check boolean cell editability', () => {
            const editableBooleanCell: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false
            };

            const readonlyBooleanCell: BooleanCell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false,
                readonly: true
            };

            expect(booleanCellIsEditable(editableBooleanCell)).toBe(true);
            expect(booleanCellIsEditable(readonlyBooleanCell)).toBe(false);
        });
    });

    describe('Boolean Constants', () => {
        it('should have correct boolean constants', () => {
            expect(BooleanEmpty).toBe(null);
            expect(BooleanIndeterminate).toBe(undefined);
        });
    });

    describe('Cell Kinds', () => {
        it('should have all cell kinds defined', () => {
            expect(GridCellKind.Uri).toBe('uri');
            expect(GridCellKind.Text).toBe('text');
            expect(GridCellKind.Image).toBe('image');
            expect(GridCellKind.RowID).toBe('row-id');
            expect(GridCellKind.Number).toBe('number');
            expect(GridCellKind.Bubble).toBe('bubble');
            expect(GridCellKind.Boolean).toBe('boolean');
            expect(GridCellKind.Loading).toBe('loading');
            expect(GridCellKind.Markdown).toBe('markdown');
            expect(GridCellKind.Drilldown).toBe('drilldown');
            expect(GridCellKind.Protected).toBe('protected');
            expect(GridCellKind.Custom).toBe('custom');
        });
    });
});
