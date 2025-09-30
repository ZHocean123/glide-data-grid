import { GridCellKind, type TextCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

export const textCellRenderer: InternalCellRenderer<TextCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Text,
    needsHover: textCell => textCell.hoverEffect === true,
    needsHoverPosition: false,
    useLabel: true,
    draw: a => {
        const { cell, hoverAmount, hyperWrapping, ctx, rect, theme, overrideCursor } = a;
        const { displayData, contentAlign, hoverEffect, allowWrapping, hoverEffectTheme } = cell;
        if (hoverEffect === true && hoverAmount > 0) {
            // drawEditHoverIndicator will be implemented in Vue
            // drawEditHoverIndicator(ctx, theme, hoverEffectTheme, displayData, rect, hoverAmount, overrideCursor);
        }
        // drawTextCell will be implemented in Vue
        // drawTextCell(a, displayData, contentAlign, allowWrapping, hyperWrapping);

        // 临时实现
        ctx.fillStyle = theme.textDark;
        ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`;
        ctx.textAlign = contentAlign || "left";
        ctx.textBaseline = "middle";

        const padding = 8;
        const x = contentAlign === "right" ? rect.x + rect.width - padding : rect.x + padding;
        const y = rect.y + rect.height / 2;

        ctx.fillText(displayData || cell.data || "", x, y);
    },
    measure: (ctx, cell, t) => {
        const lines = cell.displayData.split("\n", cell.allowWrapping === true ? undefined : 1);
        let maxLineWidth = 0;
        for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        return maxLineWidth + 2 * t.cellHorizontalPadding;
    },
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: cell => ({
        disablePadding: cell.allowWrapping === true,
        editor: p => {
            const { isHighlighted, onChange, value, validatedSelection } = p;
            // Vue editor implementation will be handled in overlay editor
            return null;
        },
    }),
    onPaste: (toPaste, cell, details) =>
        toPaste === cell.data
            ? undefined
            : { ...cell, data: toPaste, displayData: details.formattedString ?? cell.displayData },
};
