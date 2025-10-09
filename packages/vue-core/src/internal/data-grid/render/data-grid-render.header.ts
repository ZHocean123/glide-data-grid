import type { Rectangle, Item, GridColumn, GridColumnIcon } from "../data-grid-types.js";
import type { Theme, FullTheme } from "../../../common/styles.js";
import type { SpriteManager } from "../data-grid-sprites.js";
import type { DrawHeaderCallback } from "../data-grid-types.js";
import type { MappedGridColumn } from "./data-grid-lib.js";
import type { CellSet } from "../cell-set.js";
import { drawTextCell, prepTextCell } from "./data-grid-lib.js";
import { assert } from "../../../common/support.js";
import { clamp } from "../../../common/utils.js";
import { drawEditHoverIndicator } from "./draw-edit-hover-indicator.js";
import { roundedRect, measureTextCached } from "./data-grid-lib.js";
import type { GridSelection } from "../data-grid-types.js";
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

export interface DrawHeaderArg {
    ctx: CanvasRenderingContext2D;
    theme: Theme;
    effectiveCols: readonly MappedGridColumn[];
    translateX: number;
    width: number;
    height: number;
    headerHeight: number;
    groupHeaderHeight: number;
    gridSelection: GridSelection;
    getGroupDetails: (group: string) => { name: string; icon?: string };
    drawRegions: Rectangle[];
    damage: CellSet | undefined;
    hoverValues: Map<Item, string>;
    drawHeaderCallback?: DrawHeaderCallback;
    spriteManager: SpriteManager;
    isFocused: boolean;
    dragAndDropState?: {
        src: number;
        dest: number;
    };
    resizeIndicator: "none" | "full" | "header";
    resizeCol: number;
    enableGroups: boolean;
    freezeColumns: number;
}

export function drawHeader(args: DrawHeaderArg): void {
    const {
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
    } = args;

    const fullTheme = mergeAndRealizeTheme(theme);
    const isDamageEnabled = damage !== undefined;

    // Draw header background
    ctx.fillStyle = theme.bgHeader;
    ctx.fillRect(0, 0, width, headerHeight);

    // Draw group headers if enabled
    if (enableGroups && groupHeaderHeight > 0) {
        ctx.fillStyle = theme.bgGroupHeader || theme.bgHeader;
        ctx.fillRect(0, 0, width, groupHeaderHeight);
    }

    // Draw header columns
    let cellX = 0;
    for (const [colIndex, col] of effectiveCols.entries()) {
        const isColFrozen = colIndex < freezeColumns;
        cellX = colIndex === 0 ? 0 : effectiveCols[colIndex - 1].width;
        
        if (!isColFrozen) {
            cellX = cellX + translateX;
        }

        if (cellX > width) break;

        const cellWidth = col.width + 1;
        const cellRect: Rectangle = {
            x: cellX,
            y: 0,
            width: cellWidth,
            height: headerHeight,
        };

        // Draw column header background
        const isHovered = hoverValues.has([col.sourceIndex, -1]);
        
        if (isHovered) {
            ctx.fillStyle = theme.bgHeaderHovered;
            ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
        }

        // Draw column header content
        const isSelected = gridSelection.columns.hasIndex(col.sourceIndex);
        const hasSelectedCell = gridSelection.current !== undefined && 
                               gridSelection.current.cell[1] >= 0 &&
                               gridSelection.current.range.x <= col.sourceIndex &&
                               gridSelection.current.range.x + gridSelection.current.range.width > col.sourceIndex;

        const menuBounds: Rectangle = {
            x: cellRect.x + cellRect.width - 20,
            y: cellRect.y,
            width: 20,
            height: cellRect.height,
        };

        if (drawHeaderCallback !== undefined) {
            drawHeaderCallback({
                ctx,
                column: col,
                columnIndex: col.sourceIndex,
                theme,
                rect: cellRect,
                hoverAmount: isHovered ? 0.5 : 0,
                isSelected,
                isHovered,
                hasSelectedCell,
                spriteManager,
                menuBounds,
                hoverX: undefined,
                hoverY: undefined,
            }, () => {
                // Draw default content
                drawDefaultHeader(ctx, fullTheme, cellRect, col, spriteManager, isHovered);
            });
        } else {
            drawDefaultHeader(ctx, fullTheme, cellRect, col, spriteManager, isHovered);
        }

        // Draw column header border
        ctx.strokeStyle = theme.horizontalBorderColor || '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(cellRect.x + cellRect.width - 0.5, cellRect.y);
        ctx.lineTo(cellRect.x + cellRect.width - 0.5, cellRect.y + cellRect.height);
        ctx.stroke();

        // Draw resize indicator if needed
        if (resizeIndicator === "header" && resizeCol === col.sourceIndex) {
            ctx.fillStyle = theme.resizeIndicatorColor || theme.accentColor;
            ctx.fillRect(cellRect.x + cellRect.width - 2, cellRect.y, 2, cellRect.height);
        }

        // Draw drag and drop indicator if needed
        if (dragAndDropState !== undefined && dragAndDropState.src === col.sourceIndex) {
            ctx.strokeStyle = theme.accentColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
        }
    }

    // Draw drag and drop indicator if dest column is different
    if (dragAndDropState !== undefined && dragAndDropState.dest !== dragAndDropState.src) {
        let destX = 0;
        for (let i = 0; i < dragAndDropState.dest; i++) {
            destX += effectiveCols[i].width;
        }
        
        if (dragAndDropState.dest >= freezeColumns) {
            destX += translateX;
        }
        
        ctx.strokeStyle = theme.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(destX, 0);
        ctx.lineTo(destX, headerHeight);
        ctx.stroke();
    }
}

function drawDefaultHeader(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    rect: Rectangle,
    col: MappedGridColumn,
    spriteManager: SpriteManager,
    isHovered: boolean
): void {
    const pad = theme.cellHorizontalPadding;
    const textX = rect.x + pad + (col.icon !== undefined ? theme.headerIconSize + pad : 0);
    let textWidth = rect.width - pad * 2 - (col.icon !== undefined ? theme.headerIconSize + pad : 0);
    textWidth = Math.max(textWidth, 0);

    // Draw icon if present
    if (col.icon !== undefined) {
        const iconY = rect.y + rect.height / 2 - theme.headerIconSize / 2;
        spriteManager.drawSprite(
            col.icon as any,
            "normal",
            ctx,
            rect.x + pad,
            iconY,
            theme.headerIconSize,
            theme
        );
    }

    // Draw title
    ctx.fillStyle = theme.textHeader;
    ctx.font = theme.headerFontFull;
    ctx.textBaseline = "middle";
    const metrics = measureTextCached(col.title, ctx);
    if (metrics.width < textWidth) {
        ctx.fillText(col.title, textX, rect.y + rect.height / 2);
    } else {
        let truncated = col.title;
        while (metrics.width > textWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
            const newMetrics = measureTextCached(truncated + "...", ctx);
            if (newMetrics.width <= textWidth) {
                truncated = truncated + "...";
                break;
            }
        }
        ctx.fillText(truncated, textX, rect.y + rect.height / 2);
    }

    // Draw overlay icon if present
    if (col.overlayIcon !== undefined) {
        const iconX = rect.x + rect.width - pad - theme.headerIconSize;
        const iconY = rect.y + rect.height / 2 - theme.headerIconSize / 2;
        spriteManager.drawSprite(
            col.overlayIcon as any,
            "normal",
            ctx,
            iconX,
            iconY,
            theme.headerIconSize,
            theme
        );
    }
}