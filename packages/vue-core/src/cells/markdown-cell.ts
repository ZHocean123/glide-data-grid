import { h } from 'vue';
import { MarkdownOverlayEditor } from '../internal/data-grid-overlay-editor/private/markdown-overlay-editor.vue';
import { drawTextCell, prepTextCell } from '../internal/data-grid/render/data-grid-lib.js';
import { GridCellKind, type MarkdownCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';

export const markdownCellRenderer: InternalCellRenderer<MarkdownCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Markdown,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: prepTextCell,
    measure: (ctx, cell, t) => {
        const firstLine = cell.data.split("\n")[0];
        return ctx.measureText(firstLine).width + 2 * t.cellHorizontalPadding;
    },
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign),
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: () => p => {
        const { onChange, value, target, onFinishedEditing, markdownDivCreateNode, forceEditMode, validatedSelection } =
            p;
        return h(MarkdownOverlayEditor, {
            onFinish: onFinishedEditing,
            targetRect: target,
            value: value,
            validatedSelection: validatedSelection,
            onChange: (e: Event) => {
                const target = e.target as HTMLInputElement;
                onChange({
                    ...value,
                    data: target.value,
                });
            },
            forceEditMode: forceEditMode,
            createNode: markdownDivCreateNode,
        });
    },
    onPaste: (toPaste, cell) => (toPaste === cell.data ? undefined : { ...cell, data: toPaste }),
};
