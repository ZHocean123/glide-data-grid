import type { SparklineCell, VueCellRenderer, DrawArgs } from "../types";

export const SparklineCellRenderer: VueCellRenderer<SparklineCell> = {
    kind: "sparkline-cell",

    draw: (args: DrawArgs<SparklineCell>) => {
        const { ctx, cell, rect } = args;
        const { values, graphColor = "#007acc", graphKind = "line" } = cell;

        if (!values || values.length === 0) return;

        ctx.save();

        // Calculate min and max values
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        // Calculate points
        const points = values.map((value: number, index: number) => {
            const x = rect.x + 2 + (index / (values.length - 1)) * (rect.width - 4);
            const y = rect.y + rect.height - 2 - ((value - min) / range) * (rect.height - 4);
            return { x, y };
        });

        ctx.strokeStyle = graphColor;
        ctx.fillStyle = graphColor;
        ctx.lineWidth = 1;

        if (graphKind === "line") {
            // Draw line sparkline
            ctx.beginPath();
            points.forEach((point: {x: number, y: number}, index: number) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        } else if (graphKind === "bar") {
            // Draw bar sparkline
            const barWidth = rect.width / values.length;
            points.forEach((point: {x: number, y: number}, _index: number) => {
                const barHeight = rect.height - (point.y - rect.y) - 2;
                ctx.fillRect(
                    point.x - barWidth / 2,
                    point.y,
                    barWidth - 2,
                    barHeight
                );
            });
        }

        ctx.restore();
    },

    measure: (_ctx: CanvasRenderingContext2D, _cell: SparklineCell) => {
        return 120; // Fixed width for sparkline
    },

    getAccessibilityString: (cell: SparklineCell) => {
        const { values } = cell;
        if (!values || values.length === 0) return "Empty sparkline";

        const min = Math.min(...values);
        const max = Math.max(...values);
        return `Sparkline from ${min} to ${max} with ${values.length} data points`;
    },

    onPaste: (val: string, cell: SparklineCell) => {
        // Parse comma-separated values
        const values = val.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        if (values.length > 0) {
            return {
                ...cell,
                values
            };
        }
        return undefined;
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "sparkline-cell" && val.includes(',');
    }
};