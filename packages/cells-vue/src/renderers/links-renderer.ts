import type { LinksCell, VueCellRenderer, DrawArgs } from "../types";

export const LinksCellRenderer: VueCellRenderer<LinksCell> = {
    kind: "links-cell",
    needsHover: true,
    needsHoverPosition: true,

    draw: (args: DrawArgs<LinksCell>) => {
        const { ctx, cell, rect, hoverX = -100 } = args;
        const { links, underlineOffset = 5 } = cell;

        if (!links || links.length === 0) return;

        ctx.save();

        // Set up text styling
        ctx.font = "13px system-ui";
        ctx.fillStyle = "#333";
        ctx.textBaseline = "middle";

        const xPad = 8;
        let drawX = rect.x + xPad;
        const drawY = rect.y + rect.height / 2;

        const rectHoverX = rect.x + hoverX;

        for (const [index, link] of links.entries()) {
            const needsComma = index < links.length - 1;
            const text = needsComma ? link.title + "," : link.title;
            const metrics = ctx.measureText(text);

            const isHovered = rectHoverX > drawX && rectHoverX < drawX + metrics.width;

            if (isHovered) {
                args.overrideCursor?.("pointer");

                // Draw underline
                ctx.beginPath();
                ctx.moveTo(drawX, Math.floor(drawY + underlineOffset) + 0.5);
                ctx.lineTo(drawX + metrics.width, Math.floor(drawY + underlineOffset) + 0.5);
                ctx.strokeStyle = "#333";
                ctx.stroke();

                // Draw text with slight offset for hover effect
                ctx.fillStyle = "#333";
                ctx.fillText(text, drawX, drawY);
            } else {
                ctx.fillStyle = "#333";
                ctx.fillText(text, drawX, drawY);
            }

            drawX += metrics.width + 4;
        }

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: LinksCell) => {
        const { links } = cell;
        if (!links || links.length === 0) return 60;

        ctx.font = "13px system-ui";
        let totalWidth = 8; // Start with padding

        for (const [index, link] of links.entries()) {
            const needsComma = index < links.length - 1;
            const text = needsComma ? link.title + "," : link.title;
            const textWidth = ctx.measureText(text).width;
            totalWidth += textWidth + 4;

            // Limit to first few links for measurement
            if (index >= 2) break;
        }

        return Math.min(totalWidth, 200); // Max width for links
    },

    getAccessibilityString: (cell: LinksCell) => {
        const { links } = cell;
        if (!links || links.length === 0) return "No links";

        const linkTitles = links.map(link => link.title).join(', ');
        return `Links: ${linkTitles}`;
    },

    onPaste: (val: string, cell: LinksCell) => {
        const split = val.split(",");
        if (cell.links.some((l, i) => split[i] !== l.title)) return undefined;

        return {
            ...cell,
            links: split.map(title => ({ title })),
        };
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "links-cell" && val.includes(",");
    }
};