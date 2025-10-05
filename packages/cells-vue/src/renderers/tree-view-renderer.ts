import type { TreeViewCell, VueCellRenderer, DrawArgs } from "../types";

const depthShift = 16;

function isOverIcon(posX: number, posY: number, inset: number, h: number): boolean {
    return (
        posX >= inset + 8 - 4 &&
        posX <= inset + 8 + 18 &&
        posY >= h / 2 - 9 &&
        posY <= h / 2 + 9
    );
}

export const TreeViewCellRenderer: VueCellRenderer<TreeViewCell> = {
    kind: "tree-view-cell",
    needsHover: true,
    needsHoverPosition: true,

    draw: (args: DrawArgs<TreeViewCell>) => {
        const { ctx, cell, rect, hoverX = 0, hoverY = 0 } = args;
        const { x, y, height: h } = rect;
        const { canOpen, depth, text, isOpen } = cell;

        ctx.save();

        // Set up text styling
        ctx.font = "13px system-ui";
        ctx.fillStyle = "#333";
        ctx.textBaseline = "middle";

        const inset = depth * depthShift;
        const midLine = y + h / 2;

        if (canOpen) {
            const overIcon = isOverIcon(hoverX, hoverY, inset, h);

            // Draw triangle opener
            ctx.beginPath();
            if (isOpen) {
                // Downward pointing triangle
                ctx.moveTo(inset + x + 8, midLine - 2.5);
                ctx.lineTo(inset + x + 8 + 5, midLine + 2.5);
                ctx.lineTo(inset + x + 8 + 10, midLine - 2.5);
            } else {
                // Rightward pointing triangle
                ctx.moveTo(inset + x + 8 + 2.5, midLine - 5);
                ctx.lineTo(inset + x + 8 + 2.5 + 5, midLine);
                ctx.lineTo(inset + x + 8 + 2.5, midLine + 5);
            }

            ctx.strokeStyle = overIcon ? "#666" : "#999";
            ctx.lineWidth = 2;
            ctx.stroke();

            if (overIcon) args.overrideCursor?.("pointer");
        }

        // Draw text
        ctx.fillStyle = "#333";
        ctx.fillText(text, 16 + x + inset + 8 + 0.5, y + h / 2);

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: TreeViewCell) => {
        const { text, depth } = cell;
        ctx.font = "13px system-ui";
        const textWidth = ctx.measureText(text).width;
        // Add padding and depth-based indentation
        return textWidth + 16 + (depth + 2) * depthShift;
    },

    getAccessibilityString: (cell: TreeViewCell) => {
        const { text, isOpen, canOpen } = cell;
        const state = canOpen ? (isOpen ? "expanded" : "collapsed") : "leaf";
        return `Tree view item: ${text} (${state})`;
    },

    onPaste: (_val: string, _cell: TreeViewCell) => {
        // Tree view cells don't support paste
        return undefined;
    },

    isMatch: (cell: any, _val: string) => {
        return cell.kind === "tree-view-cell";
    }
};