import type { UserProfileCell, VueCellRenderer, DrawArgs } from "../types";

function measureTextCached(text: string, ctx: CanvasRenderingContext2D): TextMetrics {
    return ctx.measureText(text);
}

function getMiddleCenterBias(ctx: CanvasRenderingContext2D, font: string): number {
    ctx.font = font;
    const metrics = ctx.measureText("M");
    return metrics.actualBoundingBoxAscent / 2;
}

export const UserProfileCellRenderer: VueCellRenderer<UserProfileCell> = {
    kind: "user-profile-cell",

    draw: (args: DrawArgs<UserProfileCell>) => {
        const { ctx, cell, rect } = args;
        const { image, name, initial, tint } = cell;

        ctx.save();

        const xPad = 8; // cellHorizontalPadding
        const radius = Math.min(12, rect.height / 2 - 4); // cellVerticalPadding

        const drawX = rect.x + xPad;

        // Draw background circle
        ctx.beginPath();
        ctx.arc(drawX + radius, rect.y + rect.height / 2, radius, 0, Math.PI * 2);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = tint;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw initial
        ctx.font = `600 16px system-ui`;
        const metrics = measureTextCached(initial[0], ctx);
        ctx.fillText(
            initial[0],
            drawX + radius - metrics.width / 2,
            rect.y + rect.height / 2 + getMiddleCenterBias(ctx, `600 16px system-ui`)
        );

        // Draw image if available (simplified - in real implementation would use imageLoader)
        if (image) {
            // Note: In a real implementation, we would use an image loader
            // This is a simplified version that assumes the image is already loaded
            ctx.save();
            ctx.beginPath();
            ctx.arc(drawX + radius, rect.y + rect.height / 2, radius, 0, Math.PI * 2);
            ctx.clip();

            // Draw placeholder for image
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fillRect(drawX, rect.y + rect.height / 2 - radius, radius * 2, radius * 2);

            ctx.restore();
        }

        // Draw name if available
        if (name !== undefined) {
            ctx.font = "14px system-ui";
            ctx.fillStyle = "#333";
            ctx.fillText(name, drawX + radius * 2 + xPad, rect.y + rect.height / 2 + getMiddleCenterBias(ctx, "14px system-ui"));
        }

        ctx.restore();
    },

    measure: (_ctx: CanvasRenderingContext2D, cell: UserProfileCell) => {
        if (cell.name) {
            // Calculate width based on name length
            return Math.min(200, 60 + cell.name.length * 8);
        }
        return 60; // Fixed width for avatar only
    },

    getAccessibilityString: (cell: UserProfileCell) => {
        if (cell.name) {
            return `User profile: ${cell.name} (${cell.initial})`;
        }
        return `User profile: ${cell.initial}`;
    },

    onPaste: (val: string, cell: UserProfileCell) => {
        return {
            ...cell,
            name: val
        };
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "user-profile-cell" && val.length > 0;
    }
};