/* eslint-disable unicorn/no-for-loop */
import type { FullTheme } from "../../../common/styles.js";
import {
    type Item,
    type GridSelection,
    type InnerGridCell,
    type InnerGridColumn,
    type Rectangle,
    type BaseGridCell,
} from "../data-grid-types.js";
import { direction } from "../../../common/utils.js";
import React from "react";
import { mapColumns, type MappedGridColumn } from "../../../shared/mapped-columns.js";
import { gridSelectionHasItem, isGroupEqual, cellIsSelected, itemIsInRect, itemsAreEqual, rectBottomRight, cellIsInRange } from "../../../shared/selection.js";
import { remapForDnDState, getStickyWidth, getFreezeTrailingHeight, getEffectiveColumns } from "../../../shared/columns.js";
import { computeBounds } from "../../../shared/bounds.js";
export { computeBounds };
import { getColumnIndexForX, getRowIndexForY } from "../../../shared/geometry.js";
export { getColumnIndexForX, getRowIndexForY };
export { remapForDnDState, getStickyWidth, getFreezeTrailingHeight, getEffectiveColumns };
export { gridSelectionHasItem, isGroupEqual, cellIsSelected, itemIsInRect, itemsAreEqual, rectBottomRight, cellIsInRange };
import type { BaseDrawArgs, PrepResult } from "../../../cells/cell-types.js";
import { split as splitText, clearCache } from "canvas-hypertxt";

export function useMappedColumns(
    columns: readonly InnerGridColumn[],
    freezeColumns: number
): readonly MappedGridColumn[] {
    return React.useMemo(() => mapColumns(columns, freezeColumns), [columns, freezeColumns]);
}



let metricsSize = 0;
let metricsCache: Record<string, TextMetrics | undefined> = {};
const isSSR = typeof window === "undefined";

async function clearCacheOnLoad() {
    if (isSSR || document?.fonts?.ready === undefined) return;
    await document.fonts.ready;
    metricsSize = 0;
    metricsCache = {};
    clearCache();
}

void clearCacheOnLoad();

function makeCacheKey(
    s: string,
    ctx: CanvasRenderingContext2D | undefined,
    baseline: "alphabetic" | "middle",
    font?: string
) {
    return `${s}_${font ?? ctx?.font}_${baseline}`;
}

/** @category Drawing */
export function measureTextCached(
    s: string,
    ctx: CanvasRenderingContext2D,
    font?: string,
    baseline: "middle" | "alphabetic" = "middle"
): TextMetrics {
    const key = makeCacheKey(s, ctx, baseline, font);
    let metrics = metricsCache[key];
    if (metrics === undefined) {
        metrics = ctx.measureText(s);
        metricsCache[key] = metrics;
        metricsSize++;
    }

    if (metricsSize > 10_000) {
        metricsCache = {};
        metricsSize = 0;
    }

    return metrics;
}

export function getMeasuredTextCache(s: string, font: string): TextMetrics | undefined {
    const key = makeCacheKey(s, undefined, "middle", font);
    return metricsCache[key];
}

/** @category Drawing */
export function getMiddleCenterBias(ctx: CanvasRenderingContext2D, font: string | FullTheme): number {
    if (typeof font !== "string") {
        font = font.baseFontFull;
    }
    return getMiddleCenterBiasInner(ctx, font);
}

function loadMetric(ctx: CanvasRenderingContext2D, baseline: "alphabetic" | "middle") {
    const sample = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    ctx.save();
    ctx.textBaseline = baseline;
    const result = ctx.measureText(sample);

    ctx.restore();

    return result;
}

const biasCache: { key: string; val: number }[] = [];

function getMiddleCenterBiasInner(ctx: CanvasRenderingContext2D, font: string): number {
    for (const x of biasCache) {
        if (x.key === font) return x.val;
    }

    const alphabeticMetrics = loadMetric(ctx, "alphabetic");
    const middleMetrics = loadMetric(ctx, "middle");

    const bias =
        -(middleMetrics.actualBoundingBoxDescent - alphabeticMetrics.actualBoundingBoxDescent) +
        alphabeticMetrics.actualBoundingBoxAscent / 2;

    biasCache.push({
        key: font,
        val: bias,
    });

    return bias;
}

export function drawLastUpdateUnderlay(
    args: BaseDrawArgs,
    lastUpdate: number | undefined,
    frameTime: number,
    lastPrep: PrepResult | undefined,
    isLastCol: boolean,
    isLastRow: boolean
) {
    const { ctx, rect, theme } = args;
    let progress = Number.MAX_SAFE_INTEGER;
    const animTime = 500;
    if (lastUpdate !== undefined) {
        progress = frameTime - lastUpdate;

        if (progress < animTime) {
            const fade = 1 - progress / animTime;
            ctx.globalAlpha = fade;
            ctx.fillStyle = theme.bgSearchResult;
            ctx.fillRect(rect.x + 1, rect.y + 1, rect.width - (isLastCol ? 2 : 1), rect.height - (isLastRow ? 2 : 1));
            ctx.globalAlpha = 1;
            if (lastPrep !== undefined) {
                lastPrep.fillStyle = theme.bgSearchResult;
            }
        }
    }

    return progress < animTime;
}

export function prepTextCell(
    args: BaseDrawArgs,
    lastPrep: PrepResult | undefined,
    overrideColor?: string
): Partial<PrepResult> {
    const { ctx, theme } = args;
    const result: Partial<PrepResult> = lastPrep ?? {};

    const newFill = overrideColor ?? theme.textDark;
    if (newFill !== result.fillStyle) {
        ctx.fillStyle = newFill;
        result.fillStyle = newFill;
    }
    return result;
}

/** @category Drawing */
export function drawTextCellExternal(
    args: BaseDrawArgs,
    data: string,
    contentAlign?: BaseGridCell["contentAlign"],
    allowWrapping?: boolean,
    hyperWrapping?: boolean
) {
    const { rect, ctx, theme } = args;

    ctx.fillStyle = theme.textDark;
    drawTextCell(
        {
            ctx: ctx,
            rect,
            theme: theme,
        },
        data,
        contentAlign,
        allowWrapping,
        hyperWrapping
    );
}

function drawSingleTextLine(
    ctx: CanvasRenderingContext2D,
    data: string,
    x: number,
    y: number,
    w: number,
    h: number,
    bias: number,
    theme: FullTheme,
    contentAlign?: BaseGridCell["contentAlign"]
) {
    if (contentAlign === "right") {
        ctx.fillText(data, x + w - (theme.cellHorizontalPadding + 0.5), y + h / 2 + bias);
    } else if (contentAlign === "center") {
        ctx.fillText(data, x + w / 2, y + h / 2 + bias);
    } else {
        ctx.fillText(data, x + theme.cellHorizontalPadding + 0.5, y + h / 2 + bias);
    }
}

export function getEmHeight(ctx: CanvasRenderingContext2D, fontStyle: string): number {
    const textMetrics = measureTextCached("ABCi09jgqpy", ctx, fontStyle); // do not question the magic string
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

function truncateString(data: string, w: number): string {
    if (data.includes("\n")) {
        // new lines are rare and split is relatively expensive compared to the search
        // it pays off to not do the split contantly. More accurately... it pays off not to run the regex.
        // what even is the point of this? So what if there is a /r at the end of a line? It wont be drawn anyway.
        data = data.split(/\r?\n/, 1)[0];
    }
    const max = w / 4; // no need to round, slice will just truncate this
    if (data.length > max) {
        data = data.slice(0, max);
    }
    return data;
}

function drawMultiLineText(
    ctx: CanvasRenderingContext2D,
    data: string,
    x: number,
    y: number,
    w: number,
    h: number,
    bias: number,
    theme: FullTheme,
    contentAlign?: BaseGridCell["contentAlign"],
    hyperWrapping?: boolean
) {
    const fontStyle = theme.baseFontFull;
    const split = splitText(ctx, data, fontStyle, w - theme.cellHorizontalPadding * 2, hyperWrapping ?? false);

    const emHeight = getEmHeight(ctx, fontStyle);
    const lineHeight = theme.lineHeight * emHeight;

    const actualHeight = emHeight + lineHeight * (split.length - 1);
    const mustClip = actualHeight + theme.cellVerticalPadding > h;

    if (mustClip) {
        // well now we have to clip because we might render outside the cell vertically
        ctx.save();
        ctx.rect(x, y, w, h);
        ctx.clip();
    }

    const optimalY = y + h / 2 - actualHeight / 2;
    let drawY = Math.max(y + theme.cellVerticalPadding, optimalY);
    for (const line of split) {
        drawSingleTextLine(ctx, line, x, drawY, w, emHeight, bias, theme, contentAlign);
        drawY += lineHeight;
        if (drawY > y + h) break;
    }
    if (mustClip) {
        ctx.restore();
    }
}

/** @category Drawing */
export function drawTextCell(
    args: Pick<BaseDrawArgs, "rect" | "ctx" | "theme">,
    data: string,
    contentAlign?: BaseGridCell["contentAlign"],
    allowWrapping?: boolean,
    hyperWrapping?: boolean
): void {
    const { ctx, rect, theme } = args;

    const { x, y, width: w, height: h } = rect;

    allowWrapping = allowWrapping ?? false;

    if (!allowWrapping) {
        data = truncateString(data, w);
    }

    const bias = getMiddleCenterBias(ctx, theme);

    const isRtl = direction(data) === "rtl";

    if (contentAlign === undefined && isRtl) {
        contentAlign = "right";
    }

    if (isRtl) {
        ctx.direction = "rtl";
    }

    if (data.length > 0) {
        let changed = false;
        if (contentAlign === "right") {
            // Use right alignment as default for RTL text
            ctx.textAlign = "right";
            changed = true;
        } else if (contentAlign !== undefined && contentAlign !== "left") {
            // Since default is start (=left), only apply if alignment is center or right
            ctx.textAlign = contentAlign;
            changed = true;
        }

        if (!allowWrapping) {
            drawSingleTextLine(ctx, data, x, y, w, h, bias, theme, contentAlign);
        } else {
            drawMultiLineText(ctx, data, x, y, w, h, bias, theme, contentAlign, hyperWrapping);
        }

        if (changed) {
            // Reset alignment to default
            ctx.textAlign = "start";
        }

        if (isRtl) {
            ctx.direction = "inherit";
        }
    }
}

interface CornerRadius {
    tl: number;
    tr: number;
    bl: number;
    br: number;
}

export function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | CornerRadius
) {
    if (typeof radius === "number") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }

    // restrict radius to a reasonable max
    radius = {
        tl: Math.max(0, Math.min(radius.tl, height / 2, width / 2)),
        tr: Math.max(0, Math.min(radius.tr, height / 2, width / 2)),
        bl: Math.max(0, Math.min(radius.bl, height / 2, width / 2)),
        br: Math.max(0, Math.min(radius.br, height / 2, width / 2)),
    };

    ctx.moveTo(x + radius.tl, y);
    ctx.arcTo(x + width, y, x + width, y + radius.tr, radius.tr);
    ctx.arcTo(x + width, y + height, x + width - radius.br, y + height, radius.br);
    ctx.arcTo(x, y + height, x, y + height - radius.bl, radius.bl);
    ctx.arcTo(x, y, x + radius.tl, y, radius.tl);
}

interface Point {
    x: number;
    y: number;
    radius?: number;
}

interface Vector {
    nx: number;
    ny: number;
    len: number;
    x: number;
    y: number;
    ang: number;
}

export function drawMenuDots(ctx: CanvasRenderingContext2D, dotsX: number, dotsY: number) {
    const radius = 1.25;
    ctx.arc(dotsX, dotsY - radius * 3.5, radius, 0, 2 * Math.PI, false);
    ctx.arc(dotsX, dotsY, radius, 0, 2 * Math.PI, false);
    ctx.arc(dotsX, dotsY + radius * 3.5, radius, 0, 2 * Math.PI, false);
}

export function roundedPoly(ctx: CanvasRenderingContext2D, points: Point[], radiusAll: number) {
    // convert 2 points into vector form, polar form, and normalised
    const asVec = function (p: Point, pp: Point): Vector {
        const vx = pp.x - p.x;
        const vy = pp.y - p.y;
        const vlen = Math.sqrt(vx * vx + vy * vy);
        const vnx = vx / vlen;
        const vny = vy / vlen;
        return {
            x: vx,
            y: pp.y - p.y,
            len: vlen,
            nx: vnx,
            ny: vny,
            ang: Math.atan2(vny, vnx),
        };
    };
    let radius: number;
    // const v1: Vector = {} as any;
    // const v2: Vector = {} as any;
    const len = points.length;
    let p1 = points[len - 1];
    // for each point
    for (let i = 0; i < len; i++) {
        let p2 = points[i % len];
        const p3 = points[(i + 1) % len];
        //-----------------------------------------
        // Part 1
        const v1 = asVec(p2, p1);
        const v2 = asVec(p2, p3);
        const sinA = v1.nx * v2.ny - v1.ny * v2.nx;
        const sinA90 = v1.nx * v2.nx - v1.ny * -v2.ny;
        let angle = Math.asin(sinA < -1 ? -1 : sinA > 1 ? 1 : sinA);
        //-----------------------------------------
        let radDirection = 1;
        let drawDirection = false;
        if (sinA90 < 0) {
            if (angle < 0) {
                angle = Math.PI + angle;
            } else {
                angle = Math.PI - angle;
                radDirection = -1;
                drawDirection = true;
            }
        } else {
            if (angle > 0) {
                radDirection = -1;
                drawDirection = true;
            }
        }
        radius = p2.radius !== undefined ? p2.radius : radiusAll;
        //-----------------------------------------
        // Part 2
        const halfAngle = angle / 2;
        //-----------------------------------------

        //-----------------------------------------
        // Part 3
        let lenOut = Math.abs((Math.cos(halfAngle) * radius) / Math.sin(halfAngle));
        //-----------------------------------------

        //-----------------------------------------
        // Special part A
        let cRadius: number;
        if (lenOut > Math.min(v1.len / 2, v2.len / 2)) {
            lenOut = Math.min(v1.len / 2, v2.len / 2);
            cRadius = Math.abs((lenOut * Math.sin(halfAngle)) / Math.cos(halfAngle));
        } else {
            cRadius = radius;
        }
        //-----------------------------------------
        // Part 4
        let x = p2.x + v2.nx * lenOut;
        let y = p2.y + v2.ny * lenOut;
        //-----------------------------------------
        // Part 5
        x += -v2.ny * cRadius * radDirection;
        y += v2.nx * cRadius * radDirection;
        //-----------------------------------------
        // Part 6
        ctx.arc(
            x,
            y,
            cRadius,
            v1.ang + (Math.PI / 2) * radDirection,
            v2.ang - (Math.PI / 2) * radDirection,
            drawDirection
        );
        //-----------------------------------------
        p1 = p2;
        p2 = p3;
    }
    ctx.closePath();
}






