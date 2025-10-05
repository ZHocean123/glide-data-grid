import type { StarCell, VueCellRenderer, DrawArgs } from "../types";

const starPoints = [
    [50, 5],
    [61.23, 39.55],
    [97.55, 39.55],
    [68.16, 60.9],
    [79.39, 95.45],
    [50, 74.1],
    [20.61, 95.45],
    [31.84, 60.9],
    [2.45, 39.55],
    [38.77, 39.55],
];

function pathStar(ctx: CanvasRenderingContext2D, center: [number, number], size: number) {
    let moved = false;
    for (const p of starPoints) {
        const x = (p[0] - 50) * (size / 100) + center[0];
        const y = (p[1] - 50) * (size / 100) + center[1];

        if (moved) {
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x, y);
            moved = true;
        }
    }

    ctx.closePath();
}

export const StarCellRenderer: VueCellRenderer<StarCell> = {
    kind: "star-cell",

    draw: (args: DrawArgs<StarCell>) => {
        const { ctx, cell, rect } = args;
        const { rating } = cell;

        const starSize = 12;
        const starSpacing = 2;
        const totalWidth = 5 * starSize + 4 * starSpacing;
        const startX = rect.x + (rect.width - totalWidth) / 2;
        const centerY = rect.y + rect.height / 2;

        ctx.save();

        for (let i = 0; i < 5; i++) {
            const centerX = startX + i * (starSize + starSpacing) + starSize / 2;

            ctx.beginPath();
            pathStar(ctx, [centerX, centerY], starSize);

            if (i < rating) {
                ctx.fillStyle = "#ffc107";
                ctx.fill();
            } else {
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        ctx.restore();
    },

    measure: (_ctx: CanvasRenderingContext2D, _cell: StarCell) => {
        return 80; // Fixed width for star rating
    },

    getAccessibilityString: (cell: StarCell) => {
        return `${cell.rating} out of 5 stars`;
    },

    onPaste: (val: string, cell: StarCell) => {
        const rating = parseInt(val, 10);
        if (rating >= 0 && rating <= 5) {
            return {
                ...cell,
                rating
            };
        }
        return undefined;
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "star-cell" && val.length > 0;
    }
};