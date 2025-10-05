import type { TagsCell, VueCellRenderer, DrawArgs } from "../types";

export const TagsCellRenderer: VueCellRenderer<TagsCell> = {
    kind: "tags-cell",

    draw: (args: DrawArgs<TagsCell>) => {
        const { ctx, cell, rect } = args;
        const { tags } = cell;

        if (!tags || tags.length === 0) return;

        ctx.save();

        const tagHeight = 16;
        const tagPadding = 6;
        const tagMargin = 4;
        let currentX = rect.x + 4;
        const centerY = rect.y + rect.height / 2;

        ctx.font = "11px system-ui";
        ctx.textBaseline = "middle";

        let visibleCount = 0;
        const maxWidth = rect.width - 8;

        for (const tag of tags) {
            const tagWidth = ctx.measureText(tag).width + tagPadding * 2;

            // Check if we have space for this tag
            if (currentX + tagWidth > rect.x + maxWidth) {
                // Draw "+X" indicator
                const remaining = tags.length - visibleCount;
                if (remaining > 0) {
                    const indicatorText = `+${remaining}`;
                    const indicatorWidth = ctx.measureText(indicatorText).width + tagPadding * 2;

                    if (currentX + indicatorWidth <= rect.x + maxWidth) {
                        ctx.fillStyle = "#f5f5f5";
                        ctx.strokeStyle = "#e0e0e0";
                        ctx.lineWidth = 1;

                        // Draw indicator background
                        ctx.fillRect(currentX, centerY - tagHeight / 2, indicatorWidth, tagHeight);
                        ctx.strokeRect(currentX, centerY - tagHeight / 2, indicatorWidth, tagHeight);

                        // Draw indicator text
                        ctx.fillStyle = "#666";
                        ctx.fillText(indicatorText, currentX + tagPadding, centerY);
                    }
                }
                break;
            }

            // Draw tag background
            const tagColor = getTagColor(tag);
            ctx.fillStyle = tagColor;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.lineWidth = 1;

            ctx.fillRect(currentX, centerY - tagHeight / 2, tagWidth, tagHeight);
            ctx.strokeRect(currentX, centerY - tagHeight / 2, tagWidth, tagHeight);

            // Draw tag text
            ctx.fillStyle = "#333";
            ctx.fillText(tag, currentX + tagPadding, centerY);

            currentX += tagWidth + tagMargin;
            visibleCount++;
        }

        ctx.restore();
    },

    measure: (ctx: CanvasRenderingContext2D, cell: TagsCell) => {
        if (!cell.tags || cell.tags.length === 0) return 60;

        ctx.font = "11px system-ui";
        const tagPadding = 6;
        const tagMargin = 4;

        let totalWidth = 4; // Start with padding
        let count = 0;

        for (const tag of cell.tags) {
            const tagWidth = ctx.measureText(tag).width + tagPadding * 2;
            totalWidth += tagWidth + tagMargin;
            count++;

            // Limit to first few tags for measurement
            if (count >= 3) break;
        }

        return Math.min(totalWidth, 200); // Max width for tags
    },

    getAccessibilityString: (cell: TagsCell) => {
        const { tags } = cell;
        if (!tags || tags.length === 0) return "No tags";

        return `Tags: ${tags.join(', ')}`;
    },

    onPaste: (val: string, cell: TagsCell) => {
        // Parse comma-separated tags
        const tags = val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tags.length > 0) {
            return {
                ...cell,
                tags
            };
        }
        return undefined;
    },

    isMatch: (cell: any, val: string) => {
        return cell.kind === "tags-cell" && val.includes(',');
    }
};

// Generate consistent colors for tags
function getTagColor(tag: string): string {
    const colors = [
        "#e3f2fd",
        "#f3e5f5",
        "#e8f5e8",
        "#fff3e0",
        "#fbe9e7",
        "#fce4ec",
        "#f3e5f5",
        "#e8eaf6"
    ];

    // Simple hash function for consistent coloring
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = ((hash << 5) - hash) + tag.charCodeAt(i);
        hash = hash & hash;
    }

    return colors[Math.abs(hash) % colors.length];
}