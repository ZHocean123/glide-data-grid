import type { MappedGridColumn } from "./data-grid-lib.js";
import type { Rectangle } from "../data-grid-types.js";

interface SkipPoint {
    col: number;
    row: number;
}

export function getSkipPoint(drawRegions: readonly Rectangle[]): SkipPoint | undefined {
    let result: SkipPoint | undefined = undefined;
    for (const r of drawRegions) {
        if (result === undefined || r.y < result.row || (r.y === result.row && r.x < result.col)) {
            result = {
                col: r.x,
                row: r.y,
            };
        }
    }
    return result;
}

export function walkGroups(
    effectiveColumns: readonly MappedGridColumn[],
    width: number,
    tx: number,
    groupHeaderHeight: number,
    callback: (
        span: readonly [number, number],
        group: string,
        x: number,
        y: number,
        w: number,
        h: number
    ) => void
): void {
    if (effectiveColumns.length === 0) return;
    let currentGroup = effectiveColumns[0].group ?? "";
    let spanStart = 0;
    let x = tx ?? 0;

    for (let i = 0; i < effectiveColumns.length; i++) {
        const col = effectiveColumns[i];
        const colGroup = col.group ?? "";
        if (colGroup !== currentGroup) {
            const spanWidth = x - (tx ?? 0);
            callback([spanStart, i - 1], currentGroup, tx ?? 0, 0, spanWidth, groupHeaderHeight);
            currentGroup = colGroup;
            spanStart = i;
        }
        x += col.width;
    }

    const spanWidth = x - (tx ?? 0);
    callback([spanStart, effectiveColumns.length - 1], currentGroup, tx ?? 0, 0, spanWidth, groupHeaderHeight);
}

export function walkColumns(
    effectiveColumns: readonly MappedGridColumn[],
    cellYOffset: number,
    translateX: number,
    translateY: number,
    totalHeaderHeight: number,
    callback: (
        col: MappedGridColumn,
        drawX: number,
        colDrawStartY: number,
        clipX: number,
        startRow: number
    ) => boolean | void
): void {
    let drawX = 0;
    for (let i = 0; i < effectiveColumns.length; i++) {
        const c = effectiveColumns[i];
        const colDrawStartY = totalHeaderHeight + 1 + translateY;
        let clipX = 0;
        if (!c.sticky) {
            clipX = drawX + translateX;
        }
        const shouldStop = callback(c, drawX, colDrawStartY, clipX, cellYOffset);
        drawX += c.width;
        if (shouldStop === true) {
            break;
        }
    }
}

export function walkRowsInCol(
    startRow: number,
    colDrawStartY: number,
    height: number,
    rows: number,
    getRowHeight: (row: number) => number,
    freezeTrailingRows: number,
    hasAppendRow: boolean,
    skipPoint: SkipPoint | undefined,
    callback: (
        drawY: number,
        row: number,
        rh: number,
        isSticky: boolean,
        isTrailingRow: boolean
    ) => boolean | void
): void {
    let curY = colDrawStartY;
    let didSkip = skipPoint?.row !== startRow;

    // Draw frozen rows first
    for (let i = 0; i < freezeTrailingRows; i++) {
        const row = rows - 1 - i;
        const rh = getRowHeight(row);
        if (curY + rh > 0 && curY < height) {
            const shouldStop = callback(curY, row, rh, true, true);
            if (shouldStop === true) {
                return;
            }
        }
        curY += rh;
    }

    // Then draw normal rows
    curY = colDrawStartY;
    for (let row = startRow; row < rows; row++) {
        const rh = getRowHeight(row);
        const isTrailingRow = row >= rows - freezeTrailingRows;
        if (!isTrailingRow) {
            if (curY + rh > 0 && curY < height) {
                if (skipPoint !== undefined && skipPoint.row === row && !didSkip) {
                    didSkip = true;
                } else {
                    const shouldStop = callback(curY, row, rh, false, isTrailingRow);
                    if (shouldStop === true) {
                        break;
                    }
                }
            }
        }
        curY += rh;
    }

    // Finally draw append row if needed
    if (hasAppendRow) {
        const row = rows;
        const rh = 32; // Fixed height for append row
        if (curY + rh > 0 && curY < height) {
            callback(curY, row, rh, false, false);
        }
    }
}

export function getSpanBounds(
    span: readonly [number, number],
    x: number,
    y: number,
    width: number,
    height: number,
    col: MappedGridColumn,
    allColumns: readonly MappedGridColumn[]
): [Rectangle | undefined, Rectangle | undefined] {
    const stickyBounds: Rectangle | undefined = col.sticky
        ? {
              x,
              y,
              width,
              height,
          }
        : undefined;

    const normalBounds: Rectangle | undefined = !col.sticky
        ? {
              x,
              y,
              width,
              height,
          }
        : undefined;

    // Calculate full span width
    let spanWidth = 0;
    for (let i = span[0]; i <= span[1]; i++) {
        if (i < allColumns.length) {
            spanWidth += allColumns[i].width;
        }
    }

    // Adjust bounds for spanned columns
    if (stickyBounds !== undefined) {
        stickyBounds.width = spanWidth;
    }
    if (normalBounds !== undefined) {
        normalBounds.width = spanWidth;
    }

    return [stickyBounds, normalBounds];
}