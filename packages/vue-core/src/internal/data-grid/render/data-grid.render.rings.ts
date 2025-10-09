import type { FullTheme } from "../../../common/styles.js";
import { blend } from "../color-parser.js";
import type { Rectangle, GridSelection, FillHandle } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import { getFreezeTrailingHeight, getStickyWidth } from "./data-grid-lib.js";
import type { Highlight } from "./data-grid-render.cells.js";
import { walkColumns, walkRowsInCol } from "./data-grid-render.walk.js";

export function drawHighlightRings(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cellXOffset: number,
    cellYOffset: number,
    translateX: number,
    translateY: number,
    mappedColumns: readonly MappedGridColumn[],
    freezeColumns: number,
    headerHeight: number,
    groupHeaderHeight: number,
    rowHeight: number | ((index: number) => number),
    freezeTrailingRows: number,
    rows: number,
    highlightRegions: readonly Highlight[] | undefined,
    theme: FullTheme
): (() => void) | undefined {
    if (highlightRegions === undefined || highlightRegions.length === 0) return undefined;

    const totalHeaderHeight = headerHeight + groupHeaderHeight;
    const stickyWidth = getStickyWidth(mappedColumns);
    const freezeTrailingRowsHeight =
        freezeTrailingRows > 0 ? getFreezeTrailingHeight(rows, freezeTrailingRows, rowHeight) : 0;

    const getRowHeightFunc = typeof rowHeight === "number" ? () => rowHeight : rowHeight;

    // Draw highlight regions
    ctx.save();
    ctx.beginPath();

    for (const region of highlightRegions) {
        const r = region.range;
        let x = 0;
        let y = totalHeaderHeight + translateY;

        // Calculate x position
        for (let i = 0; i < mappedColumns.length; i++) {
            const col = mappedColumns[i];
            if (col.sourceIndex < r.x) {
                x += col.width;
            } else if (col.sourceIndex < r.x + r.width) {
                break;
            }
        }

        // Calculate y position
        for (let i = 0; i < r.y; i++) {
            y += getRowHeightFunc(i);
        }
        if (translateY > 0) {
            y -= translateY;
        }

        let w = 0;
        for (let i = r.x; i < r.x + r.width && i < mappedColumns.length; i++) {
            w += mappedColumns[i].width;
        }

        let h = 0;
        for (let i = r.y; i < r.y + r.height && i < rows; i++) {
            h += getRowHeightFunc(i);
        }

        if (region.style === "dashed") {
            ctx.setLineDash([4, 4]);
        } else if (region.style === "solid") {
            ctx.setLineDash([]);
        } else if (region.style === "no-outline") {
            ctx.setLineDash([]);
            ctx.fillStyle = blend(region.color, theme.bgCell);
            ctx.fillRect(x, y, w, h);
            continue;
        } else if (region.style === "solid-outline") {
            ctx.setLineDash([]);
            ctx.strokeStyle = region.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            continue;
        }

        ctx.strokeStyle = region.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }

    return () => {
        ctx.restore();
    };
}

export function drawFillHandle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cellYOffset: number,
    translateX: number,
    translateY: number,
    effectiveCols: readonly MappedGridColumn[],
    allCols: readonly MappedGridColumn[],
    theme: FullTheme,
    totalHeaderHeight: number,
    selection: GridSelection,
    getRowHeight: (row: number) => number,
    getCellContent: (cell: [number, number]) => any,
    freezeTrailingRows: number,
    hasAppendRow: boolean,
    fillHandle: FillHandle | boolean,
    rows: number
): (() => void) | undefined {
    if (fillHandle === false || fillHandle === undefined || selection.current === undefined) return undefined;

    const range = selection.current.range;
    const cell = selection.current.cell;
    const stickyWidth = getStickyWidth(effectiveCols);
    const freezeTrailingRowsHeight =
        freezeTrailingRows > 0 ? getFreezeTrailingHeight(rows, freezeTrailingRows, getRowHeight) : 0;

    let x = 0;
    let y = totalHeaderHeight + translateY;

    // Calculate x position
    for (let i = 0; i < allCols.length; i++) {
        const col = allCols[i];
        if (col.sourceIndex <= range.x + range.width - 1) {
            x += col.width;
        }
    }

    // Calculate y position
    for (let i = 0; i < range.y + range.height; i++) {
        y += getRowHeight(i);
    }

    const handleSize = 6;
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    return () => {
        // Nothing to cleanup
    };
}

export function drawColumnResizeOutline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number,
    color: string
): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 0.5, y);
    ctx.lineTo(x - 0.5, y + height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}