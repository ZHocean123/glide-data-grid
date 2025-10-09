import { GridCellKind } from "../data-grid-types.js";
import type { Rectangle, Item, GridCell, InnerGridCell } from "../data-grid-types.js";
import type { Theme, FullTheme } from "../../../common/styles.js";
import type { SpriteManager } from "../data-grid-sprites.js";
import type { ImageWindowLoader } from "../image-window-loader-interface.js";
import type { DrawCellCallback } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import type { CellSet } from "../cell-set.js";
import type { BaseDrawArgs } from "../../../cells/cell-types.js";
import { drawTextCell, drawLastUpdateUnderlay, prepTextCell } from "./data-grid-lib.js";
import { assert } from "../../../common/support.js";
import { clamp } from "../../../common/utils.js";
import { drawCheckbox } from "./draw-checkbox.js";
import { drawEditHoverIndicator, HoverEffectTheme } from "./draw-edit-hover-indicator.js";
import { roundedRect, measureTextCached } from "./data-grid-lib.js";
import type { GridSelection, GridColumnIcon } from "../data-grid-types.js";
import { isReadWriteCell, isInnerOnlyCell } from "../data-grid-types.js";
import { mergeAndRealizeTheme } from "../../../common/styles.js";

// Blend function for colors
function blend(color1: string, color2: string, ratio: number = 0.5): string {
    const hex = (color: string) => {
        const c = color.replace('#', '');
        return {
            r: parseInt(c.substring(0, 2), 16),
            g: parseInt(c.substring(2, 4), 16),
            b: parseInt(c.substring(4, 6), 16)
        };
    };
    
    const c1 = hex(color1);
    const c2 = hex(color2);
    
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface DrawCellsArg {
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
    hasAppendRow: boolean;
    drawRegions: Rectangle[];
    damage: CellSet | undefined;
    hoverValues: Map<Item, string>;
    hyperWrapping: boolean;
    drawCellCallback?: DrawCellCallback;
    spriteManager: SpriteManager;
    enqueue: (cb: () => void) => void;
    imageLoader?: ImageWindowLoader;
    minimumCellWidth?: number;
    verticalBorder: boolean;
}

interface SpanInfo {
    cell: InnerGridCell;
    rect: Rectangle; // location relative to the cell being drawn
    width: number;
    height: number;
    colIndex: number;
    rowIndex: number;
    clip: boolean;
}

const cellKinds = new Set<GridCellKind>([
    GridCellKind.Text,
    GridCellKind.Number,
    GridCellKind.Uri,
    GridCellKind.Image,
    GridCellKind.Bubble,
    GridCellKind.Boolean,
    GridCellKind.Protected,
    GridCellKind.Drilldown,
    GridCellKind.RowID,
    GridCellKind.Loading,
    GridCellKind.Markdown,
    GridCellKind.Custom,
]);

const cellRendererCache = new Map<string, {
    kind: string;
    prep: (ctx: CanvasRenderingContext2D, theme: Theme) => void;
    draw: (ctx: CanvasRenderingContext2D, theme: Theme) => void;
}>();

function getCellRenderer(cell: InnerGridCell, getCellRenderer: (cell: InnerGridCell) => any) {
    // For now, we'll just return undefined for custom cells
    if (cell.kind === GridCellKind.Custom) {
        return undefined;
    }
    return getCellRenderer(cell);
}

export function drawCells(args: DrawCellsArg): SpanInfo[] {
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
    } = args;

    const fullTheme = mergeAndRealizeTheme(theme);

    const spans: SpanInfo[] = [];
    const isDamageEnabled = damage !== undefined;

    const dpr = window.devicePixelRatio;
    const isOverlayed = dpr < 1.5;

    const skipY = drawRegions[0]?.y;
    let skipToY = skipY === undefined ? undefined : Math.max(skipY, totalHeaderHeight);

    // First pass: compute all spans and their positions
    for (const [colIndex, col] of effectiveCols.entries()) {
        const isColFrozen = colIndex < effectiveCols.findIndex(c => !c.sticky);
        let cellX = colIndex === 0 ? 0 : effectiveCols[colIndex - 1].width;
        for (let i = colIndex - 1; i >= 0 && effectiveCols[i].sticky; i--) {
            cellX = i === 0 ? 0 : cellX - effectiveCols[i].width;
        }

        cellX = col.sticky ? cellX : cellX + translateX;

        if (cellX > width) break;

        const cellWidth = Math.max(col.width, minimumCellWidth ?? 0) + 1;

        let drawY = totalHeaderHeight + translateY;

        if (drawY > height && !isColFrozen) break;

        for (let rowIndex = cellYOffset; rowIndex < rows - freezeTrailingRows; rowIndex++) {
            const rowHeight = getRowHeight(rowIndex);
            if (drawY + rowHeight < (skipToY || 0)) {
                drawY += rowHeight;
                continue;
            }

            if (drawY > height && !isColFrozen) break;

            const cellItem: Item = [col.sourceIndex, rowIndex];
            const cellContent = getCellContent(cellItem);

            if (isDamageEnabled && !damage.has(cellItem)) {
                drawY += rowHeight;
                continue;
            }

            const cellRect: Rectangle = {
                x: cellX,
                y: drawY,
                width: cellWidth,
                height: rowHeight + 1,
            };

            // Draw cell background
            const rowTheme = getRowThemeOverride(rowIndex);
            const bgCol = rowTheme?.bgCell ?? disabledRows.has(rowIndex)
                ? theme.bgCellDisabled || theme.bgCell
                : theme.bgCell;

            let drawBg = true;
            for (const r of drawRegions) {
                if (cellRect.x >= r.x && cellRect.x + cellRect.width <= r.x + r.width &&
                    cellRect.y >= r.y && cellRect.y + cellRect.height <= r.y + r.height) {
                    drawBg = false;
                    break;
                }
            }

            if (drawBg) {
                ctx.fillStyle = bgCol;
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            // Draw cell content
            const baseArgs: BaseDrawArgs = {
                ctx,
                rect: cellRect,
                theme: rowTheme ? { ...theme, ...rowTheme } : theme,
                col: col.sourceIndex,
                row: rowIndex,
                highlighted: false,
                hoverAmount: 0,
                hoverX: undefined,
                hoverY: undefined,
                cellFillColor: '',
                imageLoader,
                spriteManager,
                hyperWrapping,
                cell: cellContent,
            };

            const hoverValue = hoverValues.get(cellItem);
            if (hoverValue !== undefined) {
                ctx.fillStyle = hoverValue;
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            const highlight = gridSelection.current !== undefined &&
                gridSelection.current.range.x <= col.sourceIndex &&
                gridSelection.current.range.x + gridSelection.current.range.width > col.sourceIndex &&
                gridSelection.current.range.y <= rowIndex &&
                gridSelection.current.range.y + gridSelection.current.range.height > rowIndex;

            const isSelected = gridSelection.columns.hasIndex(col.sourceIndex) ||
                gridSelection.rows.hasIndex(rowIndex) ||
                highlight;

            const isHovered = hoverValues.has(cellItem);

            // Draw cell specific content
            let prepResult: any = undefined;
            let drawResult: any = undefined;

            if (!isInnerOnlyCell(cellContent) && drawCellCallback !== undefined) {
                drawCellCallback({
                    ctx,
                    cell: cellContent as GridCell,
                    theme: rowTheme ? { ...theme, ...rowTheme } : theme,
                    rect: cellRect,
                    col: col.sourceIndex,
                    row: rowIndex,
                    hoverAmount: 0,
                    hoverX: undefined,
                    hoverY: undefined,
                    highlighted: isSelected,
                    imageLoader: imageLoader!,
                }, () => {
                    // Draw default content
                    prepResult = { fillStyle: theme.textDark };
                    if (cellContent.kind === GridCellKind.Text) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.data, cellContent.contentAlign, cellContent.allowWrapping, hyperWrapping);
                    } else if (cellContent.kind === GridCellKind.Number) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Boolean) {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.data,
                            cellRect.x,
                            cellRect.y,
                            cellRect.width,
                            cellRect.height,
                            isSelected,
                            baseArgs.hoverX,
                            baseArgs.hoverY,
                            theme.checkboxMaxSize,
                            cellContent.contentAlign
                        );
                    } else if (cellContent.kind === GridCellKind.Uri) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData || cellContent.data, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Image) {
                        // Draw image placeholder
                        ctx.fillStyle = theme.bgGray || '#dddddd';
                        ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                    } else {
                        drawTextCell(baseArgs, "Unsupported", undefined, false, false);
                    }
                });
            } else if (isInnerOnlyCell(cellContent)) {
                if (cellContent.kind === "new-row") {
                    // Draw new row hint
                    const pad = theme.cellHorizontalPadding;
                    const textX = cellRect.x + pad + (col.icon !== undefined ? 16 + pad : 0);
                    let textWidth = cellRect.width - pad * 2 - (col.icon !== undefined ? 16 + pad : 0);
                    textWidth = Math.max(textWidth, 0);

                    ctx.fillStyle = theme.textLight;
                    ctx.font = fullTheme.baseFontFull;
                    ctx.textBaseline = "middle";
                    const metrics = measureTextCached(cellContent.hint, ctx);
                    if (metrics.width < textWidth) {
                        ctx.fillText(cellContent.hint, textX, cellRect.y + cellRect.height / 2);
                    } else {
                        let truncated = cellContent.hint;
                        while (metrics.width > textWidth && truncated.length > 0) {
                            truncated = truncated.slice(0, -1);
                            const newMetrics = measureTextCached(truncated + "...", ctx);
                            if (newMetrics.width <= textWidth) {
                                truncated = truncated + "...";
                                break;
                            }
                        }
                        ctx.fillText(truncated, textX, cellRect.y + cellRect.height / 2);
                    }

                    if (col.icon !== undefined) {
                        spriteManager.drawSprite(
                            col.icon as any,
                            "normal",
                            ctx,
                            cellRect.x + pad,
                            cellRect.y + cellRect.height / 2 - 8,
                            16,
                            theme
                        );
                    }
                } else if (cellContent.kind === "marker") {
                    const pad = theme.cellHorizontalPadding;
                    const y = cellRect.y + cellRect.height / 2;

                    if (cellContent.markerKind === "checkbox" || cellContent.markerKind === "checkbox-visible") {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.checked,
                            cellRect.x + pad,
                            y - 8,
                            16,
                            16,
                            false,
                            undefined,
                            undefined,
                            theme.checkboxMaxSize,
                            "center"
                        );
                    } else if (cellContent.markerKind === "number" || cellContent.markerKind === "both") {
                        prepTextCell(baseArgs, prepResult);
                        ctx.fillStyle = theme.textLight;
                        ctx.font = fullTheme.baseFontFull;
                        ctx.textBaseline = "middle";
                        ctx.fillText(
                            (rowIndex + 1).toString(),
                            cellRect.x + pad + (cellContent.markerKind === "both" ? 20 : 0),
                            y
                        );
                    }
                }
            } else {
                const renderer = getCellRenderer(cellContent, getCellRenderer as any);
                if (renderer !== undefined) {
                    prepResult = renderer.prep(ctx, rowTheme ? { ...theme, ...rowTheme } : theme);
                    drawResult = renderer.draw(ctx, rowTheme ? { ...theme, ...rowTheme } : theme);
                } else {
                    prepResult = { fillStyle: theme.textDark };
                    if (cellContent.kind === GridCellKind.Text) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.data, cellContent.contentAlign, cellContent.allowWrapping, hyperWrapping);
                    } else if (cellContent.kind === GridCellKind.Number) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Boolean) {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.data,
                            cellRect.x,
                            cellRect.y,
                            cellRect.width,
                            cellRect.height,
                            isSelected,
                            baseArgs.hoverX,
                            baseArgs.hoverY,
                            theme.checkboxMaxSize,
                            cellContent.contentAlign
                        );
                    } else if (cellContent.kind === GridCellKind.Uri) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData || cellContent.data, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Image) {
                        // Draw image placeholder
                        ctx.fillStyle = theme.bgGray || '#dddddd';
                        ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                    } else {
                        drawTextCell(baseArgs, "Unsupported", undefined, false, false);
                    }
                }
            }

            // Draw cell border
            if (verticalBorder) {
                ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
                ctx.beginPath();
                ctx.moveTo(cellRect.x + cellRect.width - 0.5, cellRect.y);
                ctx.lineTo(cellRect.x + cellRect.width - 0.5, cellRect.y + cellRect.height);
                ctx.stroke();
            }

            // Draw cell hover indicator
            if (isHovered && isReadWriteCell(cellContent as GridCell) && !('readonly' in cellContent) || !(cellContent as any).readonly) {
                const hoverTheme: HoverEffectTheme = {
                    bgColor: theme.bgCellSelected || '#e9e9eb',
                    fullSize: false,
                };
                const displayData = cellContent.kind === GridCellKind.Uri 
                    ? cellContent.data 
                    : cellContent.kind === GridCellKind.Text 
                        ? cellContent.data 
                        : '';
                drawEditHoverIndicator(ctx, fullTheme, hoverTheme, displayData, cellRect, 1, undefined);
            }

            // Draw cell selection
            if (isSelected) {
                ctx.fillStyle = blend(theme.bgCellSelected || '#e0e0e0', bgCol);
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            // Draw cell focus
            if (drawFocus && isFocused && gridSelection.current !== undefined &&
                gridSelection.current.cell[0] === col.sourceIndex &&
                gridSelection.current.cell[1] === rowIndex) {
                ctx.strokeStyle = theme.accentColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(cellRect.x + 1, cellRect.y + 1, cellRect.width - 2, cellRect.height - 2);
            }

            // Store span info for later use
            if (cellContent.span !== undefined) {
                spans.push({
                    cell: cellContent,
                    rect: cellRect,
                    width: cellWidth,
                    height: rowHeight + 1,
                    colIndex: col.sourceIndex,
                    rowIndex,
                    clip: false,
                });
            }

            drawY += rowHeight;
        }

        // Draw trailing rows
        let trailingY = height;
        for (let fr = 0; fr < freezeTrailingRows; fr++) {
            const rowIndex = rows - 1 - fr;
            const rowHeight = getRowHeight(rowIndex);
            trailingY -= rowHeight;

            if (trailingY + rowHeight < (skipToY || 0)) continue;

            const cellItem: Item = [col.sourceIndex, rowIndex];
            const cellContent = getCellContent(cellItem);

            if (isDamageEnabled && !damage.has(cellItem)) {
                continue;
            }

            const cellRect: Rectangle = {
                x: cellX,
                y: trailingY,
                width: cellWidth,
                height: rowHeight + 1,
            };

            // Draw cell background
            const rowTheme = getRowThemeOverride(rowIndex);
            const bgCol = rowTheme?.bgCell ?? disabledRows.has(rowIndex)
                ? theme.bgCellDisabled || theme.bgCell
                : theme.bgCell;

            let drawBg = true;
            for (const r of drawRegions) {
                if (cellRect.x >= r.x && cellRect.x + cellRect.width <= r.x + r.width &&
                    cellRect.y >= r.y && cellRect.y + cellRect.height <= r.y + r.height) {
                    drawBg = false;
                    break;
                }
            }

            if (drawBg) {
                ctx.fillStyle = bgCol;
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            // Draw cell content
            const baseArgs: BaseDrawArgs = {
                ctx,
                rect: cellRect,
                theme: rowTheme ? { ...theme, ...rowTheme } : theme,
                col: col.sourceIndex,
                row: rowIndex,
                highlighted: false,
                hoverAmount: 0,
                hoverX: undefined,
                hoverY: undefined,
                cellFillColor: '',
                imageLoader,
                spriteManager,
                hyperWrapping,
                cell: cellContent,
            };

            const hoverValue = hoverValues.get(cellItem);
            if (hoverValue !== undefined) {
                ctx.fillStyle = hoverValue;
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            const highlight = gridSelection.current !== undefined &&
                gridSelection.current.range.x <= col.sourceIndex &&
                gridSelection.current.range.x + gridSelection.current.range.width > col.sourceIndex &&
                gridSelection.current.range.y <= rowIndex &&
                gridSelection.current.range.y + gridSelection.current.range.height > rowIndex;

            const isSelected = gridSelection.columns.hasIndex(col.sourceIndex) ||
                gridSelection.rows.hasIndex(rowIndex) ||
                highlight;

            const isHovered = hoverValues.has(cellItem);

            // Draw cell specific content
            let prepResult: any = undefined;
            let drawResult: any = undefined;

            if (!isInnerOnlyCell(cellContent) && drawCellCallback !== undefined) {
                drawCellCallback({
                    ctx,
                    cell: cellContent as GridCell,
                    theme: rowTheme ? { ...theme, ...rowTheme } : theme,
                    rect: cellRect,
                    col: col.sourceIndex,
                    row: rowIndex,
                    hoverAmount: 0,
                    hoverX: undefined,
                    hoverY: undefined,
                    highlighted: isSelected,
                    imageLoader: imageLoader!,
                }, () => {
                    // Draw default content
                    prepResult = { fillStyle: theme.textDark };
                    if (cellContent.kind === GridCellKind.Text) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.data, cellContent.contentAlign, cellContent.allowWrapping, hyperWrapping);
                    } else if (cellContent.kind === GridCellKind.Number) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Boolean) {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.data,
                            cellRect.x,
                            cellRect.y,
                            cellRect.width,
                            cellRect.height,
                            isSelected,
                            baseArgs.hoverX,
                            baseArgs.hoverY,
                            theme.checkboxMaxSize,
                            cellContent.contentAlign
                        );
                    } else if (cellContent.kind === GridCellKind.Uri) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData || cellContent.data, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Image) {
                        // Draw image placeholder
                        ctx.fillStyle = theme.bgGray || '#dddddd';
                        ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                    } else {
                        drawTextCell(baseArgs, "Unsupported", undefined, false, false);
                    }
                });
            } else if (isInnerOnlyCell(cellContent)) {
                if (cellContent.kind === "new-row") {
                    // Draw new row hint
                    const pad = theme.cellHorizontalPadding;
                    const textX = cellRect.x + pad + (col.icon !== undefined ? 16 + pad : 0);
                    let textWidth = cellRect.width - pad * 2 - (col.icon !== undefined ? 16 + pad : 0);
                    textWidth = Math.max(textWidth, 0);

                    ctx.fillStyle = theme.textLight;
                    ctx.font = fullTheme.baseFontFull;
                    ctx.textBaseline = "middle";
                    const metrics = measureTextCached(cellContent.hint, ctx);
                    if (metrics.width < textWidth) {
                        ctx.fillText(cellContent.hint, textX, cellRect.y + cellRect.height / 2);
                    } else {
                        let truncated = cellContent.hint;
                        while (metrics.width > textWidth && truncated.length > 0) {
                            truncated = truncated.slice(0, -1);
                            const newMetrics = measureTextCached(truncated + "...", ctx);
                            if (newMetrics.width <= textWidth) {
                                truncated = truncated + "...";
                                break;
                            }
                        }
                        ctx.fillText(truncated, textX, cellRect.y + cellRect.height / 2);
                    }

                    if (col.icon !== undefined) {
                        spriteManager.drawSprite(
                            col.icon as any,
                            "normal",
                            ctx,
                            cellRect.x + pad,
                            cellRect.y + cellRect.height / 2 - 8,
                            16,
                            theme
                        );
                    }
                } else if (cellContent.kind === "marker") {
                    const pad = theme.cellHorizontalPadding;
                    const y = cellRect.y + cellRect.height / 2;

                    if (cellContent.markerKind === "checkbox" || cellContent.markerKind === "checkbox-visible") {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.checked,
                            cellRect.x + pad,
                            y - 8,
                            16,
                            16,
                            false,
                            undefined,
                            undefined,
                            theme.checkboxMaxSize,
                            "center"
                        );
                    } else if (cellContent.markerKind === "number" || cellContent.markerKind === "both") {
                        prepTextCell(baseArgs, prepResult);
                        ctx.fillStyle = theme.textLight;
                        ctx.font = fullTheme.baseFontFull;
                        ctx.textBaseline = "middle";
                        ctx.fillText(
                            (rowIndex + 1).toString(),
                            cellRect.x + pad + (cellContent.markerKind === "both" ? 20 : 0),
                            y
                        );
                    }
                }
            } else {
                const renderer = getCellRenderer(cellContent, getCellRenderer as any);
                if (renderer !== undefined) {
                    prepResult = renderer.prep(ctx, rowTheme ? { ...theme, ...rowTheme } : theme);
                    drawResult = renderer.draw(ctx, rowTheme ? { ...theme, ...rowTheme } : theme);
                } else {
                    prepResult = { fillStyle: theme.textDark };
                    if (cellContent.kind === GridCellKind.Text) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.data, cellContent.contentAlign, cellContent.allowWrapping, hyperWrapping);
                    } else if (cellContent.kind === GridCellKind.Number) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Boolean) {
                        drawCheckbox(
                            ctx,
                            fullTheme,
                            cellContent.data,
                            cellRect.x,
                            cellRect.y,
                            cellRect.width,
                            cellRect.height,
                            isSelected,
                            baseArgs.hoverX,
                            baseArgs.hoverY,
                            theme.checkboxMaxSize,
                            cellContent.contentAlign
                        );
                    } else if (cellContent.kind === GridCellKind.Uri) {
                        prepTextCell(baseArgs, prepResult);
                        drawTextCell(baseArgs, cellContent.displayData || cellContent.data, cellContent.contentAlign, false, false);
                    } else if (cellContent.kind === GridCellKind.Image) {
                        // Draw image placeholder
                        ctx.fillStyle = theme.bgGray || '#dddddd';
                        ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                    } else {
                        drawTextCell(baseArgs, "Unsupported", undefined, false, false);
                    }
                }
            }

            // Draw cell border
            if (verticalBorder) {
                ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
                ctx.beginPath();
                ctx.moveTo(cellRect.x + cellRect.width - 0.5, cellRect.y);
                ctx.lineTo(cellRect.x + cellRect.width - 0.5, cellRect.y + cellRect.height);
                ctx.stroke();
            }

            // Draw cell hover indicator
            if (isHovered && isReadWriteCell(cellContent as GridCell) && !('readonly' in cellContent) || !(cellContent as any).readonly) {
                const hoverTheme: HoverEffectTheme = {
                    bgColor: theme.bgCellSelected || '#e9e9eb',
                    fullSize: false,
                };
                const displayData = cellContent.kind === GridCellKind.Uri 
                    ? cellContent.data 
                    : cellContent.kind === GridCellKind.Text 
                        ? cellContent.data 
                        : '';
                drawEditHoverIndicator(ctx, fullTheme, hoverTheme, displayData, cellRect, 1, undefined);
            }

            // Draw cell selection
            if (isSelected) {
                ctx.fillStyle = blend(theme.bgCellSelected || '#e0e0e0', bgCol);
                ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
            }

            // Draw cell focus
            if (drawFocus && isFocused && gridSelection.current !== undefined &&
                gridSelection.current.cell[0] === col.sourceIndex &&
                gridSelection.current.cell[1] === rowIndex) {
                ctx.strokeStyle = theme.accentColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(cellRect.x + 1, cellRect.y + 1, cellRect.width - 2, cellRect.height - 2);
            }

            // Store span info for later use
            if (cellContent.span !== undefined) {
                spans.push({
                    cell: cellContent,
                    rect: cellRect,
                    width: cellWidth,
                    height: rowHeight + 1,
                    colIndex: col.sourceIndex,
                    rowIndex,
                    clip: false,
                });
            }
        }
    }

    return spans;
}