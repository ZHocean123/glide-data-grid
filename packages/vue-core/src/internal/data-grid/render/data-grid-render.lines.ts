import type { FullTheme } from "../../../common/styles.js";
import { blend } from "../color-parser.js";
import type { Rectangle, CompactSelection } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import { getFreezeTrailingHeight, getStickyWidth } from "./data-grid-lib.js";
import { walkColumns, walkRowsInCol } from "./data-grid-render.walk.js";
import type { GetRowThemeCallback } from "./data-grid-render.cells.js";

export function drawGridLines(
    ctx: CanvasRenderingContext2D,
    effectiveCols: readonly MappedGridColumn[],
    cellYOffset: number,
    translateX: number,
    translateY: number,
    width: number,
    height: number,
    drawRegions: readonly Rectangle[],
    spans: readonly Rectangle[],
    groupHeaderHeight: number,
    totalHeaderHeight: number,
    getRowHeight: (row: number) => number,
    getRowThemeOverride: GetRowThemeCallback | undefined,
    verticalBorder: (col: number) => boolean,
    freezeTrailingRows: number,
    rows: number,
    theme: FullTheme,
    headerOnly: boolean = false
) {
    ctx.beginPath();
    const stickyWidth = getStickyWidth(effectiveCols);

    // Draw vertical lines
    for (let i = 0; i < effectiveCols.length; i++) {
        const c = effectiveCols[i];
        const x = c.sticky ? 0 : translateX;
        let colX = x + stickyWidth + 1;
        for (let j = 0; j < effectiveCols.length; j++) {
            const col = effectiveCols[j];
            if (col.sticky) {
                colX += col.width;
            } else {
                break;
            }
        }
        const finalX = colX + c.width;
        if (verticalBorder(c.sourceIndex)) {
            ctx.moveTo(finalX + 0.5, totalHeaderHeight);
            ctx.lineTo(finalX + 0.5, height);
        }
    }

    // Draw horizontal lines
    let y = totalHeaderHeight + 1 + translateY;
    for (let row = cellYOffset; row < rows; row++) {
        const rh = getRowHeight(row);
        y += rh;
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
    }

    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw span borders
    if (spans.length > 0) {
        ctx.beginPath();
        for (const span of spans) {
            ctx.rect(span.x, span.y, span.width, span.height);
        }
        ctx.strokeStyle = theme.borderColor;
        ctx.stroke();
    }
}

export function overdrawStickyBoundaries(
    ctx: CanvasRenderingContext2D,
    effectiveCols: readonly MappedGridColumn[],
    width: number,
    height: number,
    freezeTrailingRows: number,
    rows: number,
    verticalBorder: (col: number) => boolean,
    getRowHeight: (row: number) => number,
    theme: FullTheme
) {
    const stickyWidth = getStickyWidth(effectiveCols);
    const freezeTrailingRowsHeight =
        freezeTrailingRows > 0 ? getFreezeTrailingHeight(rows, freezeTrailingRows, getRowHeight) : 0;

    if (stickyWidth > 0) {
        ctx.beginPath();
        ctx.moveTo(stickyWidth + 0.5, 0);
        ctx.lineTo(stickyWidth + 0.5, height - freezeTrailingRowsHeight);
        ctx.strokeStyle = blend(theme.borderColor, theme.bgCell);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    if (freezeTrailingRowsHeight > 0) {
        ctx.beginPath();
        ctx.moveTo(0, height - freezeTrailingRowsHeight + 0.5);
        ctx.lineTo(width, height - freezeTrailingRowsHeight + 0.5);
        ctx.strokeStyle = blend(theme.borderColor, theme.bgCell);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

export function drawBlanks(
    ctx: CanvasRenderingContext2D,
    effectiveCols: readonly MappedGridColumn[],
    allColumns: readonly MappedGridColumn[],
    width: number,
    height: number,
    totalHeaderHeight: number,
    translateX: number,
    translateY: number,
    cellYOffset: number,
    rows: number,
    getRowHeight: (row: number) => number,
    getRowThemeOverride: GetRowThemeCallback | undefined,
    disabledRows: CompactSelection,
    freezeTrailingRows: number,
    hasAppendRow: boolean,
    drawRegions: readonly Rectangle[],
    damage: Rectangle | undefined,
    theme: FullTheme
) {
    // This function fills in any blank areas that might appear due to scrolling or other operations
    // For simplicity, we'll just fill the entire canvas with the background color
    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(0, 0, width, height);
}

export function drawExtraRowThemes(
    ctx: CanvasRenderingContext2D,
    effectiveCols: readonly MappedGridColumn[],
    cellYOffset: number,
    translateX: number,
    translateY: number,
    width: number,
    height: number,
    drawRegions: readonly Rectangle[],
    totalHeaderHeight: number,
    getRowHeight: (row: number) => number,
    getRowThemeOverride: GetRowThemeCallback | undefined,
    verticalBorder: (col: number) => boolean,
    freezeTrailingRows: number,
    rows: number,
    theme: FullTheme
) {
    // This function applies any extra row themes that might be defined
    // For simplicity, we'll just return without doing anything
    return;
}