import type { RangeCell, VueCellRenderer, DrawArgs } from "../types";
import { roundedRect, getEmHeight } from "./draw-fns";

function measureTextCached(text: string, ctx: CanvasRenderingContext2D, font: string): TextMetrics {
    ctx.font = font;
    return ctx.measureText(text);
}

function getMiddleCenterBias(ctx: CanvasRenderingContext2D, font: string): number {
    ctx.font = font;
    const metrics = ctx.measureText("M");
    return metrics.actualBoundingBoxAscent / 2;
}


export const RangeCellRenderer: VueCellRenderer<RangeCell> = {
    kind: "range-cell",

    draw: (args: DrawArgs<RangeCell>) => {
        const { ctx, cell, rect } = args;
        const { min, max, value, label, measureLabel } = cell;

        ctx.save();

        const x = rect.x + 8; // cellHorizontalPadding
        const yMid = rect.y + rect.height / 2;

        const rangeSize = max - min;
        const fillRatio = (value - min) / rangeSize;
        const labelFont = `12px system-ui`; // Simplified font

        const emHeight = getEmHeight(ctx, labelFont);
        const rangeHeight = emHeight / 2;

        let labelWidth = 0;
        if (label !== undefined) {
            ctx.font = labelFont;
            labelWidth = measureTextCached(measureLabel ?? label, ctx, labelFont).width + 8; // cellHorizontalPadding
        }

        const rangeWidth = rect.width - 16 - labelWidth; // cellHorizontalPadding * 2

        if (rangeWidth >= rangeHeight) {
            const gradient = ctx.createLinearGradient(x, yMid, x + rangeWidth, yMid);

            gradient.addColorStop(0, "#007acc"); // accentColor
            gradient.addColorStop(fillRatio, "#007acc");
            gradient.addColorStop(fillRatio, "#f5f5f5"); // bgBubble
            gradient.addColorStop(1, "#f5f5f5");

            ctx.beginPath();
            ctx.fillStyle = gradient;
            roundedRect(ctx, x, yMid - rangeHeight / 2, rangeWidth, rangeHeight, rangeHeight / 2);
            ctx.fill();

            ctx.beginPath();
            roundedRect(
                ctx,
                x + 0.5,
                yMid - rangeHeight / 2 + 0.5,
                rangeWidth - 1,
                rangeHeight - 1,
                (rangeHeight - 1) / 2
            );
            ctx.strokeStyle = "#e0e0e0"; // accentLight
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if (label !== undefined) {
            ctx.textAlign = "right";
            ctx.fillStyle = "#333"; // textDark
            ctx.fillText(
                label,
                rect.x + rect.width - 8, // cellHorizontalPadding
                yMid + getMiddleCenterBias(ctx, labelFont)
            );
        }

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: RangeCell) => {
        const { label, measureLabel } = cell;

        let width = 100; // Default width for range

        if (label !== undefined) {
            ctx.font = "12px system-ui";
            const textWidth = ctx.measureText(measureLabel ?? label).width;
            width = Math.max(width, textWidth + 60); // Add padding for label
        }

        return Math.min(width, 200); // Max width
    },

    getAccessibilityString: (cell: RangeCell) => {
        const { min, max, value, label } = cell;
        if (label) {
            return `Range: ${value} (${min}-${max}) - ${label}`;
        }
        return `Range: ${value} (${min}-${max})`;
    },

    onPaste: (val: string, cell: RangeCell) => {
        let num = Number.parseFloat(val);
        num = Number.isNaN(num) ? cell.value : Math.max(cell.min, Math.min(cell.max, num));
        return {
            ...cell,
            value: num
        };
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "range-cell" && val.length > 0;
    }
};