import type { ButtonCell, VueCellRenderer, DrawArgs } from "../types";
import { roundedRect } from "./draw-fns";

function unpackColor(color: any, theme: Record<string, any>, hoverAmount: number): string {
    if (typeof color === "string") {
        if (theme[color] !== undefined) return theme[color];
        return color;
    }

    if (Array.isArray(color) && color.length === 2) {
        let [normal, hover] = color;
        if (theme[normal] !== undefined) normal = theme[normal];
        if (theme[hover] !== undefined) hover = theme[hover];

        // Simple interpolation between colors
        if (hoverAmount === 0) return normal;
        if (hoverAmount === 1) return hover;

        // For simplicity, use linear interpolation between colors
        // In a real implementation, you'd want proper color interpolation
        return hoverAmount > 0.5 ? hover : normal;
    }

    return "#007acc"; // Default color
}

function getIsHovered(rect: any, hoverX: number | undefined, hoverY: number | undefined): boolean {
    const x = Math.floor(rect.x + 8 + 1);
    const y = Math.floor(rect.y + 4 + 1);
    const width = Math.ceil(rect.width - 16 - 1);
    const height = Math.ceil(rect.height - 8 - 1);

    return (
        hoverX !== undefined &&
        hoverY !== undefined &&
        hoverX + rect.x >= x &&
        hoverX + rect.x < x + width &&
        hoverY + rect.y >= y &&
        hoverY + rect.y < y + height
    );
}

export const ButtonCellRenderer: VueCellRenderer<ButtonCell> = {
    kind: "button-cell",
    needsHoverPosition: true,
    needsHover: true,

    drawPrep: (args) => {
        const { ctx } = args;

        ctx.textAlign = "center";

        return {
            deprep: (a: any) => {
                a.ctx.textAlign = "start";
            },
        };
    },

    draw: (args: DrawArgs<ButtonCell>) => {
        const { ctx, cell, rect, hoverX, hoverY, frameTime, drawState } = args;
        const { title, backgroundColor, color, borderColor, borderRadius } = cell;

        const x = Math.floor(rect.x + 8 + 1);
        const y = Math.floor(rect.y + 4 + 1);
        const width = Math.ceil(rect.width - 16 - 1);
        const height = Math.ceil(rect.height - 8 - 1);

        if (width <= 0 || height <= 0) return;

        const isHovered = getIsHovered(rect, hoverX, hoverY);

        interface DrawState {
            readonly hovered: boolean;
            readonly animationStartTime: number;
        }

        // eslint-disable-next-line prefer-const
        let [state, setState] = drawState as [DrawState | undefined, (state: DrawState) => void];

        if (isHovered) args.overrideCursor?.("pointer");

        state ??= { hovered: false, animationStartTime: 0 };

        if (isHovered !== state.hovered) {
            state = { ...state, hovered: isHovered, animationStartTime: frameTime };
            setState(state);
        }

        const progress = Math.min(1, (frameTime - state.animationStartTime) / 200);

        const hoverAmount = isHovered ? progress : 1 - progress;

        if (progress < 1) args.requestAnimationFrame?.();

        // Draw button background
        if (backgroundColor !== undefined) {
            ctx.beginPath();
            roundedRect(ctx, x, y, width, height, borderRadius ?? 4);
            ctx.fillStyle = unpackColor(backgroundColor, {}, hoverAmount);
            ctx.fill();
        }

        // Draw button border
        if (borderColor !== undefined) {
            ctx.beginPath();
            roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, borderRadius ?? 4);
            ctx.strokeStyle = unpackColor(borderColor, {}, hoverAmount);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw button text
        ctx.fillStyle = unpackColor(color ?? "#007acc", {}, hoverAmount);
        ctx.font = "13px system-ui";
        ctx.textBaseline = "middle";
        ctx.fillText(title, x + width / 2, y + height / 2);
    },

    measure: (ctx: CanvasRenderingContext2D, cell: ButtonCell) => {
        ctx.font = "13px system-ui";
        const textWidth = ctx.measureText(cell.title).width;
        return Math.max(textWidth + 32, 80); // Minimum button width
    },

    getAccessibilityString: (cell: ButtonCell) => {
        return `Button: ${cell.title}`;
    },

    onPaste: (_val: string, _cell: ButtonCell) => {
        // Button cells don't support paste
        return undefined;
    },

    isMatch: (cell: any, _val: string) => {
        return cell.kind === "button-cell";
    }
};