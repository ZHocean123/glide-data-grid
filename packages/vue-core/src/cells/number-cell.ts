import { GridCellKind, type NumberCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

export const numberCellRenderer: InternalCellRenderer<NumberCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Number,
    needsHover: cell => cell.hoverEffect === true,
    needsHoverPosition: false,
    useLabel: true,
    draw: a => {
        const { hoverAmount, cell, ctx, theme, rect, overrideCursor } = a;
        const { hoverEffect, displayData, hoverEffectTheme } = cell;

        if (hoverEffect === true && hoverAmount > 0) {
            // drawEditHoverIndicator will be implemented in Vue
            // drawEditHoverIndicator(ctx, theme, hoverEffectTheme, displayData, rect, hoverAmount, overrideCursor);
        }
        // drawTextCell will be implemented in Vue
        // drawTextCell(a, a.cell.displayData, a.cell.contentAlign);

        // 临时实现
        ctx.fillStyle = theme.textDark;
        ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`;
        ctx.textAlign = cell.contentAlign || "right";
        ctx.textBaseline = "middle";

        const padding = 8;
        const x = cell.contentAlign === "right" ? rect.x + rect.width - padding : rect.x + padding;
        const y = rect.y + rect.height / 2;

        ctx.fillText(displayData || cell.data?.toString() || "", x, y);
    },
    measure: (ctx, cell, theme) => ctx.measureText(cell.displayData).width + theme.cellHorizontalPadding * 2,
    onDelete: c => ({
        ...c,
        data: undefined,
    }),
    provideEditor: () => p => {
        const { isHighlighted, onChange, value, validatedSelection } = p;
        // Vue editor implementation will be handled in overlay editor
        return null;
    },
    onPaste: (toPaste, cell, details) => {
        const newNumber =
            typeof details.rawValue === "number"
                ? details.rawValue
                : Number.parseFloat(typeof details.rawValue === "string" ? details.rawValue : toPaste);
        if (Number.isNaN(newNumber) || cell.data === newNumber) return undefined;
        return { ...cell, data: newNumber, displayData: details.formattedString ?? cell.displayData };
    },
};
