import { describe, it, expect } from 'vitest';
import { textCellRenderer } from '../src/cells/text-cell.js';
import { numberCellRenderer } from '../src/cells/number-cell.js';
import { booleanCellRenderer } from '../src/cells/boolean-cell.js';
import { GridCellKind } from '../src/internal/data-grid/data-grid-types.js';

describe('Cell Renderers', () => {
    describe('Text Cell', () => {
        it('should render text cell correctly', () => {
            const cell = {
                kind: GridCellKind.Text,
                displayData: 'Test Data',
                data: 'Test Data',
                allowOverlay: true
            };

            expect(textCellRenderer.kind).toBe(GridCellKind.Text);
            expect(textCellRenderer.getAccessibilityString(cell)).toBe('Test Data');
        });

        it('should handle empty text cell', () => {
            const cell = {
                kind: GridCellKind.Text,
                displayData: '',
                data: '',
                allowOverlay: true
            };

            expect(textCellRenderer.getAccessibilityString(cell)).toBe('');
        });

        it('should delete text cell correctly', () => {
            const cell = {
                kind: GridCellKind.Text,
                displayData: 'Test Data',
                data: 'Test Data',
                allowOverlay: true
            };

            const result = textCellRenderer.onDelete?.(cell);
            expect(result?.data).toBe('');
        });
    });

    describe('Number Cell', () => {
        it('should render number cell correctly', () => {
            const cell = {
                kind: GridCellKind.Number,
                displayData: '123',
                data: 123,
                allowOverlay: true
            };

            expect(numberCellRenderer.kind).toBe(GridCellKind.Number);
            expect(numberCellRenderer.getAccessibilityString(cell)).toBe('123');
        });

        it('should handle undefined number cell', () => {
            const cell = {
                kind: GridCellKind.Number,
                displayData: '',
                data: undefined,
                allowOverlay: true
            };

            expect(numberCellRenderer.getAccessibilityString(cell)).toBe('');
        });

        it('should delete number cell correctly', () => {
            const cell = {
                kind: GridCellKind.Number,
                displayData: '123',
                data: 123,
                allowOverlay: true
            };

            const result = numberCellRenderer.onDelete(cell);
            expect(result.data).toBeUndefined();
        });

        it('should paste number correctly', () => {
            const cell = {
                kind: GridCellKind.Number,
                displayData: '100',
                data: 100,
                allowOverlay: true
            };

            const result = numberCellRenderer.onPaste('200', cell, {
                rawValue: 200,
                formattedString: '200'
            });

            expect(result?.data).toBe(200);
        });
    });

    describe('Boolean Cell', () => {
        it('should render boolean cell correctly', () => {
            const cell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false
            };

            expect(booleanCellRenderer.kind).toBe(GridCellKind.Boolean);
            expect(booleanCellRenderer.getAccessibilityString(cell)).toBe('true');
        });

        it('should handle false boolean cell', () => {
            const cell = {
                kind: GridCellKind.Boolean,
                data: false,
                allowOverlay: false
            };

            expect(booleanCellRenderer.getAccessibilityString(cell)).toBe('false');
        });

        it('should delete boolean cell correctly', () => {
            const cell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false
            };

            const result = booleanCellRenderer.onDelete(cell);
            expect(result.data).toBe(false);
        });

        it('should paste true boolean correctly', () => {
            const cell = {
                kind: GridCellKind.Boolean,
                data: false,
                allowOverlay: false
            };

            const result = booleanCellRenderer.onPaste('true', cell);
            expect(result?.data).toBe(true);
        });

        it('should paste false boolean correctly', () => {
            const cell = {
                kind: GridCellKind.Boolean,
                data: true,
                allowOverlay: false
            };

            const result = booleanCellRenderer.onPaste('false', cell);
            expect(result?.data).toBe(false);
        });
    });
});
