import type { FullTheme } from "../../../common/styles.js";
import type { Rectangle } from "../data-grid-types.js";
import { getSquareWidth, getSquareXPosFromAlign, getSquareBB } from "../../../common/utils.js";

export function drawCheckbox(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    data: boolean | undefined | null,
    x: number,
    y: number,
    w: number,
    h: number,
    highlighted: boolean,
    hoverX: number | undefined,
    hoverY: number | undefined,
    maxSize: number,
    contentAlign?: "left" | "center" | "right"
) {
    const maxWidth = maxSize ?? theme.checkboxMaxSize;
    const cellCenterY = Math.floor(y + h / 2);
    const checkBoxWidth = getSquareWidth(maxWidth, h, theme.cellVerticalPadding);
    const posX = getSquareXPosFromAlign(
        contentAlign ?? "center",
        x,
        w,
        theme.cellHorizontalPadding,
        checkBoxWidth
    );
    const bb = getSquareBB(posX, cellCenterY, checkBoxWidth);

    const { x1: bbX, y1: bbY, x2, y2 } = bb;
    const width = x2 - bbX;
    const height = y2 - bbY;

    const hoverAmount =
        hoverX !== undefined && hoverY !== undefined
            ? pointInRect({ x: bbX, y: bbY, width, height }, x + hoverX, y + hoverY)
                ? 1
                : 0
            : 0;

    ctx.save();

    ctx.beginPath();
    ctx.rect(bbX, bbY, width, height);
    ctx.lineWidth = highlighted ? 2 : 1;
    ctx.strokeStyle = theme.textDark;
    ctx.stroke();

    if (data === true || data === false) {
        ctx.beginPath();
        if (data === true) {
            const p = 0.15;
            ctx.moveTo(bbX + width * p, bbY + height * 0.5);
            ctx.lineTo(bbX + width * 0.4, bbY + height * (1 - p));
            ctx.lineTo(bbX + width * (1 - p), bbY + height * p);
        } else if (data === false) {
            const p = 0.2;
            ctx.moveTo(bbX + width * p, bbY + height * p);
            ctx.lineTo(bbX + width * (1 - p), bbY + height * (1 - p));
            ctx.moveTo(bbX + width * (1 - p), bbY + height * p);
            ctx.lineTo(bbX + width * p, bbY + height * (1 - p));
        }
        ctx.strokeStyle = theme.textDark;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();
}

interface Point {
    x: number;
    y: number;
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function pointInRect(rect: Rect, x: number, y: number): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}