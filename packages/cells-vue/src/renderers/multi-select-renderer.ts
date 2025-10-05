import type { MultiSelectCell, VueCellRenderer, DrawArgs, SelectOption } from "../types";
import { roundedRect } from "./draw-fns";

function prepareOptions(options: readonly (string | SelectOption)[]): SelectOption[] {
    return options.map(option => {
        if (typeof option === "string" || option === null || option === undefined) {
            return { value: option, label: option ?? "" };
        }
        return {
            value: option.value,
            label: option.label ?? option.value ?? "",
            color: option.color ?? undefined,
        };
    });
}

function getLuminance(color: string): number {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export const MultiSelectCellRenderer: VueCellRenderer<MultiSelectCell> = {
    kind: "multi-select-cell",

    draw: (args: DrawArgs<MultiSelectCell>) => {
        const { ctx, cell, rect } = args;
        const { values, options: optionsIn } = cell;

        if (values === undefined || values === null || values.length === 0) return;

        ctx.save();

        const options = prepareOptions(optionsIn ?? []);

        const drawArea = {
            x: rect.x + 8,
            y: rect.y + 4,
            width: rect.width - 16,
            height: rect.height - 8,
        };

        const bubbleHeight = 20;
        const bubblePadding = 8;
        const bubbleMargin = 4;
        const rows = Math.max(1, Math.floor(drawArea.height / (bubbleHeight + bubblePadding)));

        let x = drawArea.x;
        let row = 1;

        let y = rows === 1
            ? drawArea.y + (drawArea.height - bubbleHeight) / 2
            : drawArea.y + (drawArea.height - rows * bubbleHeight - (rows - 1) * bubblePadding) / 2;

        for (const value of values) {
            const matchedOption = options.find(t => t.value === value);
            const color = matchedOption?.color ?? "#e0e0e0";
            const displayText = matchedOption?.label ?? value;

            const metrics = ctx.measureText(displayText);
            const width = metrics.width + bubblePadding * 2;
            const textY = bubbleHeight / 2;

            if (x !== drawArea.x && x + width > drawArea.x + drawArea.width && row < rows) {
                row++;
                y += bubbleHeight + bubblePadding;
                x = drawArea.x;
            }

            // Draw bubble background
            ctx.fillStyle = color;
            ctx.beginPath();
            roundedRect(ctx, x, y, width, bubbleHeight, bubbleHeight / 2);
            ctx.fill();

            // Draw bubble text
            ctx.fillStyle = matchedOption?.color
                ? getLuminance(color) > 0.5 ? "#000000" : "#ffffff"
                : "#333";
            ctx.font = "12px system-ui";
            ctx.textBaseline = "middle";
            ctx.fillText(displayText, x + bubblePadding, y + textY);

            x += width + bubbleMargin;
            if (x > drawArea.x + drawArea.width + 8 && row >= rows) {
                break;
            }
        }

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: MultiSelectCell) => {
        const { values, options: optionsIn } = cell;

        if (!values || values.length === 0) {
            return 16;
        }

        const options = prepareOptions(optionsIn ?? []);

        // Resolve the values to the actual display labels:
        const labels = values.map(value => {
            const matchedOption = options.find(t => t.value === value);
            return matchedOption?.label ?? value;
        });

        const bubblePadding = 8;
        const bubbleMargin = 4;

        const bubblesWidth = labels.reduce(
            (acc, data) => ctx.measureText(data).width + acc + bubblePadding * 2 + bubbleMargin,
            0
        );

        if (labels.length === 0) {
            return 16;
        }

        return bubblesWidth + 16 - bubbleMargin;
    },

    getAccessibilityString: (cell: MultiSelectCell) => {
        const { values, options: optionsIn } = cell;

        if (!values || values.length === 0) {
            return "No values selected";
        }

        const options = prepareOptions(optionsIn ?? []);
        const displayValues = values.map(value => {
            const matchedOption = options.find(t => t.value === value);
            return matchedOption?.label ?? value;
        });

        return `Multi-select: ${displayValues.join(', ')}`;
    },

    onPaste: (val: string, cell: MultiSelectCell) => {
        if (!val || !val.trim()) {
            // Empty values should result in empty strings
            return {
                ...cell,
                values: [],
            };
        }

        let values = val.split(",").map(s => s.trim());

        if (!cell.allowDuplicates) {
            // Remove all duplicates
            values = values.filter((v, index) => values.indexOf(v) === index);
        }

        if (!cell.allowCreation) {
            // Only allow values that are part of the options:
            const options = prepareOptions(cell.options ?? []);
            values = values.filter(v => options.find(o => o.value === v));
        }

        if (values.length === 0) {
            // We were not able to parse any values, return undefined to
            // not change the cell value.
            return undefined;
        }

        return {
            ...cell,
            values,
        };
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "multi-select-cell" && val.includes(",");
    }
};