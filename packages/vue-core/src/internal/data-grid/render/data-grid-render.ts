import type { Rectangle, Item, GridCell, InnerGridCell, GridSelection } from "../data-grid-types.js";
import type { Theme, FullTheme } from "../../../common/styles.js";
import type { SpriteManager } from "../data-grid-sprites.js";
import type { ImageWindowLoader } from "../image-window-loader-interface.js";
import type { DrawCellCallback, DrawHeaderCallback } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import type { CellSet } from "../cell-set.js";
import { drawCells } from "./data-grid-render.cells.js";
import { drawHeader } from "./data-grid-render.header.js";
import { roundedRect, measureTextCached } from "./data-grid-lib.js";
import { mergeAndRealizeTheme } from "../../../common/styles.js";

export interface DrawGridArg {
    ctx: CanvasRenderingContext2D;
    theme: Theme;
    effectiveCols: readonly MappedGridColumn[];
    cellXOffset: number;
    cellYOffset: number;
    translateX: number;
    translateY: number;
    width: number;
    height: number;
    totalHeaderHeight: number;
    rows: number;
    getRowHeight: (row: number) => number;
    gridSelection: GridSelection;
    getCellContent: (cell: Item) => InnerGridCell;
    getGroupDetails: (group: string) => { name: string; icon?: string };
    getRowThemeOverride: (row: number) => Partial<Theme> | undefined;
    disabledRows: Set<number>;
    isFocused: boolean;
    drawFocus: boolean;
    freezeTrailingRows: number;
    freezeColumns: number;
    hasAppendRow: boolean;
    drawRegions: Rectangle[];
    damage: CellSet | undefined;
    hoverValues: Map<Item, string>;
    hyperWrapping: boolean;
    drawCellCallback?: DrawCellCallback;
    drawHeaderCallback?: DrawHeaderCallback;
    spriteManager: SpriteManager;
    enqueue: (cb: () => void) => void;
    imageLoader?: ImageWindowLoader;
    minimumCellWidth?: number;
    verticalBorder: boolean;
    horizontalBorder: boolean;
    headerHeight: number;
    groupHeaderHeight: number;
    enableGroups: boolean;
    dragAndDropState?: {
        src: number;
        dest: number;
    };
    resizeIndicator: "none" | "full" | "header";
    resizeCol: number;
}

export function drawGrid(args: DrawGridArg): void {
    const {
        ctx,
        theme,
        effectiveCols,
        cellXOffset,
        cellYOffset,
        translateX,
        translateY,
        width,
        height,
        totalHeaderHeight,
        rows,
        getRowHeight,
        gridSelection,
        getCellContent,
        getGroupDetails,
        getRowThemeOverride,
        disabledRows,
        isFocused,
        drawFocus,
        freezeTrailingRows,
        freezeColumns,
        hasAppendRow,
        drawRegions,
        damage,
        hoverValues,
        hyperWrapping,
        drawCellCallback,
        drawHeaderCallback,
        spriteManager,
        enqueue,
        imageLoader,
        minimumCellWidth,
        verticalBorder,
        horizontalBorder,
        headerHeight,
        groupHeaderHeight,
        enableGroups,
        dragAndDropState,
        resizeIndicator,
        resizeCol,
    } = args;

    const fullTheme = mergeAndRealizeTheme(theme);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.fillStyle = theme.bgCell;
    ctx.fillRect(0, totalHeaderHeight, width, height - totalHeaderHeight);

    // Draw header
    drawHeader({
        ctx,
        theme,
        effectiveCols,
        translateX,
        width,
        height,
        headerHeight,
        groupHeaderHeight,
        gridSelection,
        getGroupDetails,
        drawRegions,
        damage,
        hoverValues,
        drawHeaderCallback,
        spriteManager,
        isFocused,
        dragAndDropState,
        resizeIndicator,
        resizeCol,
        enableGroups,
        freezeColumns,
    });

    // Draw cells
    const spans = drawCells({
        ctx,
        theme,
        effectiveCols,
        cellXOffset,
        cellYOffset,
        translateX,
        translateY,
        width,
        height,
        totalHeaderHeight,
        rows,
        getRowHeight,
        gridSelection,
        getCellContent,
        getGroupDetails,
        getRowThemeOverride,
        disabledRows,
        isFocused,
        drawFocus,
        freezeTrailingRows,
        hasAppendRow,
        drawRegions,
        damage,
        hoverValues,
        hyperWrapping,
        drawCellCallback,
        spriteManager,
        enqueue,
        imageLoader,
        minimumCellWidth,
        verticalBorder,
    });

    // Draw grid lines
    if (horizontalBorder || verticalBorder) {
        drawGridLines(
            ctx,
            theme,
            effectiveCols,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            width,
            height,
            totalHeaderHeight,
            rows,
            getRowHeight,
            freezeTrailingRows,
            horizontalBorder,
            verticalBorder
        );
    }

    // Draw spans
    for (const span of spans) {
        if (span.cell.span !== undefined) {
            const [startCol, endCol] = span.cell.span;
            if (startCol !== span.colIndex) continue; // Only draw spans from their origin

            let spanX = span.rect.x;
            let spanWidth = span.rect.width;

            // Calculate total span width
            for (let i = span.colIndex + 1; i < endCol; i++) {
                const col = effectiveCols.find(c => c.sourceIndex === i);
                if (col !== undefined) {
                    spanWidth += col.width + 1;
                }
            }

            // Draw span background
            ctx.fillStyle = theme.bgCell;
            ctx.fillRect(spanX, span.rect.y, spanWidth, span.rect.height);

            // Draw span border
            ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(spanX, span.rect.y, spanWidth, span.rect.height);

            // Draw span content
            const spanRect: Rectangle = {
                x: spanX,
                y: span.rect.y,
                width: spanWidth,
                height: span.rect.height,
            };

            // Draw cell content in span
            if (drawCellCallback !== undefined && !('kind' in span.cell) || span.cell.kind !== "new-row" && span.cell.kind !== "marker") {
                drawCellCallback({
                    ctx,
                    cell: span.cell as GridCell,
                    theme,
                    rect: spanRect,
                    col: span.colIndex,
                    row: span.rowIndex,
                    hoverAmount: 0,
                    hoverX: undefined,
                    hoverY: undefined,
                    highlighted: false,
                    imageLoader: imageLoader!,
                }, () => {
                    // Draw default content
                    ctx.fillStyle = theme.textDark;
                    ctx.font = fullTheme.baseFontFull;
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        span.cell.kind === "text" ? span.cell.data : "",
                        spanRect.x + theme.cellHorizontalPadding,
                        spanRect.y + spanRect.height / 2
                    );
                });
            }
        }
    }

    // Draw resize indicator for full grid if needed
    if (resizeIndicator === "full") {
        ctx.fillStyle = theme.resizeIndicatorColor || theme.accentColor;
        ctx.fillRect(resizeCol - 1, 0, 2, height);
    }
}

function drawGridLines(
    ctx: CanvasRenderingContext2D,
    theme: Theme,
    effectiveCols: readonly MappedGridColumn[],
    cellXOffset: number,
    cellYOffset: number,
    translateX: number,
    translateY: number,
    width: number,
    height: number,
    totalHeaderHeight: number,
    rows: number,
    getRowHeight: (row: number) => number,
    freezeTrailingRows: number,
    horizontalBorder: boolean,
    verticalBorder: boolean
): void {
    // Draw vertical lines
    if (verticalBorder) {
        ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
        ctx.beginPath();
        
        let cellX = 0;
        for (const [colIndex, col] of effectiveCols.entries()) {
            const isColFrozen = colIndex < effectiveCols.findIndex(c => !c.sticky);
            cellX = colIndex === 0 ? 0 : effectiveCols[colIndex - 1].width;
            
            if (!isColFrozen) {
                cellX = cellX + translateX;
            }
            
            if (cellX > width) break;
            
            const cellWidth = col.width + 1;
            
            // Draw right border
            ctx.moveTo(cellX + cellWidth - 0.5, 0);
            ctx.lineTo(cellX + cellWidth - 0.5, height);
        }
        
        ctx.stroke();
    }
    
    // Draw horizontal lines
    if (horizontalBorder) {
        ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
        ctx.beginPath();
        
        let drawY = totalHeaderHeight + translateY;
        
        for (let rowIndex = cellYOffset; rowIndex < rows - freezeTrailingRows; rowIndex++) {
            const rowHeight = getRowHeight(rowIndex);
            
            // Draw bottom border
            ctx.moveTo(0, drawY + rowHeight - 0.5);
            ctx.lineTo(width, drawY + rowHeight - 0.5);
            
            drawY += rowHeight;
        }
        
        // Draw trailing rows horizontal lines
        let trailingY = height;
        for (let fr = 0; fr < freezeTrailingRows; fr++) {
            const rowIndex = rows - 1 - fr;
            const rowHeight = getRowHeight(rowIndex);
            trailingY -= rowHeight;
            
            // Draw bottom border
            ctx.moveTo(0, trailingY - 0.5);
            ctx.lineTo(width, trailingY - 0.5);
        }
        
        ctx.stroke();
    }
}