import { h } from 'vue';
import { GrowingEntry } from '../internal/growing-entry/growing-entry.vue';
import { drawTextCell, prepTextCell } from '../internal/data-grid/render/data-grid-lib.js';
import { GridCellKind, type RowIDCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';

export const rowIDCellRenderer: InternalCellRenderer<RowIDCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.RowID,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: (a, b) => prepTextCell(a, b, a.theme.textLight),
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign),
    measure: (ctx, cell, theme) => ctx.measureText(cell.data).width + theme.cellHorizontalPadding * 2,
    provideEditor: () => p => {
        const { isHighlighted, onChange, value, validatedSelection } = p;
        return h(GrowingEntry, {
            highlight: isHighlighted,
            autoFocus: value.readonly !== true,
            disabled: value.readonly !== false,
            value: value.data,
            validatedSelection: validatedSelection,
            onChange: (e: Event) => {
                const target = e.target as HTMLInputElement;
                onChange({
                    ...value,
                    data: target.value,
                });
            },
        });
    },
    onPaste: () => undefined,
};
