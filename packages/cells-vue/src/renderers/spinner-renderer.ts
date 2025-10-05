import type { SpinnerCell, VueCellRenderer, DrawArgs } from "../types";

export const SpinnerCellRenderer: VueCellRenderer<SpinnerCell> = {
    kind: "spinner-cell",

    draw: (args: DrawArgs<SpinnerCell>) => {
        const { ctx, rect, requestAnimationFrame } = args;

        const progress = (performance.now() % 1000) / 1000;

        const x = rect.x + rect.width / 2;
        const y = rect.y + rect.height / 2;

        ctx.save();

        ctx.beginPath();
        ctx.arc(x, y, Math.min(12, rect.height / 6), Math.PI * 2 * progress, Math.PI * 2 * progress + Math.PI * 1.5);

        ctx.strokeStyle = "#666"; // textMedium
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.restore();

        requestAnimationFrame();
    },

    measure: (_ctx: CanvasRenderingContext2D, _cell: SpinnerCell) => {
        return 40; // Fixed width for spinner
    },

    getAccessibilityString: (_cell: SpinnerCell) => {
        return "Loading spinner";
    },

    onPaste: (_val: string, _cell: SpinnerCell) => {
        // Spinner cells don't support paste
        return undefined;
    },

    isMatch: (cell: any, _val: string) => {
        return cell.kind === "spinner-cell";
    }
};