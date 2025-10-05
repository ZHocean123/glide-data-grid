import type { DropdownCell, VueCellRenderer, DrawArgs } from "../types";

function getMiddleCenterBias(ctx: CanvasRenderingContext2D, font: string): number {
    ctx.font = font;
    const metrics = ctx.measureText("M");
    return metrics.actualBoundingBoxAscent / 2;
}

export const DropdownCellRenderer: VueCellRenderer<DropdownCell> = {
    kind: "dropdown-cell",

    draw: (args: DrawArgs<DropdownCell>) => {
        const { ctx, cell, rect } = args;
        const { value, allowedValues } = cell;

        ctx.save();

        // Find the display text for the selected value
        const foundOption = allowedValues.find(opt => {
            if (typeof opt === "string" || opt === null || opt === undefined) {
                return opt === value;
            }
            return opt.value === value;
        });

        const displayText = typeof foundOption === "string" ? foundOption : foundOption?.label ?? ";

        if (displayText) {
            ctx.font = "14px system-ui";
            ctx.fillStyle = "#333";
            ctx.fillText(
                displayText,
                rect.x + 8, // cellHorizontalPadding
                rect.y + rect.height / 2 + getMiddleCenterBias(ctx, "14px system-ui")
            );
        }

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: DropdownCell) => {
        const { value, allowedValues } = cell;

        // Find the display text for measurement
        const foundOption = allowedValues.find(opt => {
            if (typeof opt === "string" || opt === null || opt === undefined) {
                return opt === value;
            }
            return opt.value === value;
        });

        const displayText = typeof foundOption === "string" ? foundOption : foundOption?.label ?? ";

        ctx.font = "14px system-ui";
        const textWidth = displayText ? ctx.measureText(displayText).width : 0;
        return textWidth + 16; // cellHorizontalPadding * 2
    },

    getAccessibilityString: (cell: DropdownCell) => {
        const { value, allowedValues } = cell;

        const foundOption = allowedValues.find(opt => {
            if (typeof opt === "string" || opt === null || opt === undefined) {
                return opt === value;
            }
            return opt.value === value;
        });

        const displayText = typeof foundOption === "string" ? foundOption : foundOption?.label ?? ";

        if (displayText) {
            return `Dropdown: ${displayText}`;
        }
        return "Empty dropdown";
    },

    onPaste: (val: string, cell: DropdownCell) => {
        const isValidValue = cell.allowedValues.some(option => {
            if (option === null || option === undefined) return false;
            if (typeof option === "string") return option === val;
            return option.value === val;
        });

        if (isValidValue) {
            return {
                ...cell,
                value: val
            };
        }
        return undefined;
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "dropdown-cell" && val.length > 0;
    }
};