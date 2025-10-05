import type { DatePickerCell, VueCellRenderer, DrawArgs } from "../types";

export const DatePickerCellRenderer: VueCellRenderer<DatePickerCell> = {
    kind: "date-picker-cell",

    draw: (args: DrawArgs<DatePickerCell>) => {
        const { ctx, cell, rect } = args;
        const { displayDate } = cell;

        ctx.save();

        // Set up text styling
        ctx.font = "13px system-ui";
        ctx.fillStyle = "#333";
        ctx.textBaseline = "middle";

        // Draw the date text
        const textX = rect.x + 8;
        const textY = rect.y + rect.height / 2;

        // Clip text to cell bounds
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();

        ctx.fillText(displayDate || "Select date", textX, textY);

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: DatePickerCell) => {
        const { displayDate } = cell;
        ctx.font = "13px system-ui";
        const textWidth = ctx.measureText(displayDate || "Select date").width;
        return textWidth + 16; // Add padding
    },

    getAccessibilityString: (cell: DatePickerCell) => {
        const { displayDate } = cell;
        return `Date picker: ${displayDate || "No date selected"}`;
    },

    onPaste: (val: string, cell: DatePickerCell) => {
        let parseDateTimestamp = NaN;

        // We only try to parse the value if it is not empty/undefined/null:
        if (val) {
            // Support for unix timestamps (milliseconds since 1970-01-01):
            parseDateTimestamp = Number(val).valueOf();

            if (Number.isNaN(parseDateTimestamp)) {
                // Support for parsing ISO 8601 date strings:
                parseDateTimestamp = Date.parse(val);
                if (cell.format === "time" && Number.isNaN(parseDateTimestamp)) {
                    // The pasted value was not a valid date string
                    // Try to interpret value as time string instead (HH:mm:ss)
                    parseDateTimestamp = Date.parse(`1970-01-01T${val}Z`);
                }
            }
        }

        return {
            ...cell,
            date: Number.isNaN(parseDateTimestamp) ? undefined : new Date(parseDateTimestamp),
        };
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "date-picker-cell" && val.length > 0;
    }
};