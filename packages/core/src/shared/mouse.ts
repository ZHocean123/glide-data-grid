import { assert } from "../common/support.js";
import { getScrollBarWidth } from "../common/utils.js";
import {
    DEFAULT_FILL_HANDLE,
    type FillHandle,
    type GridSelection,
    type Rectangle,
} from "../internal/data-grid/data-grid-types.js";
import {
    OutOfBoundsRegionAxis,
    groupHeaderKind,
    headerKind,
    outOfBoundsKind,
    type GridMouseEventArgs,
} from "../internal/data-grid/event-args.js";
import { getColumnIndexForX, getRowIndexForY } from "./geometry.js";
import type { MappedGridColumn } from "./mapped-columns.js";
import { rectBottomRight } from "./selection.js";

export interface MouseEventComputationArgs {
    /** Canvas-space X coordinate */
    readonly x: number;
    /** Canvas-space Y coordinate */
    readonly y: number;
    /** Client X position */
    readonly clientX: number;
    /** Client Y position */
    readonly clientY: number;
    readonly width: number;
    readonly height: number;
    readonly enableGroups: boolean;
    readonly headerHeight: number;
    readonly groupHeaderHeight: number;
    readonly totalHeaderHeight: number;
    readonly rows: number;
    readonly rowHeight: number | ((index: number) => number);
    readonly cellXOffset: number;
    readonly cellYOffset: number;
    readonly translateX: number | undefined;
    readonly translateY: number | undefined;
    readonly freezeTrailingRows: number;
    readonly mappedColumns: readonly MappedGridColumn[];
    readonly effectiveColumns: readonly MappedGridColumn[];
    readonly selection: GridSelection | undefined;
    readonly fillHandle: FillHandle | false | undefined;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly isTouch: boolean;
    readonly button: number;
    readonly buttons: number;
    /**
     * Canvas-space bounds generator which should return *client* area rectangles (matching DOMRect positioning).
     */
    readonly getBounds: (col: number, row: number) => Rectangle | undefined;
    readonly edgeDetectionBuffer?: number;
}

export interface GetMouseEventResult {
    readonly args: GridMouseEventArgs;
    readonly columnIndex: number;
    readonly rowIndex: number | undefined;
}

/**
 * Shared helper used across React and Vue grids to translate pointer coordinates into grid mouse event arguments.
 */
export function getMouseEventArgs({
    x,
    y,
    clientX,
    clientY,
    width,
    height,
    enableGroups,
    headerHeight,
    groupHeaderHeight,
    totalHeaderHeight,
    rows,
    rowHeight,
    cellXOffset,
    cellYOffset,
    translateX,
    translateY,
    freezeTrailingRows,
    mappedColumns,
    effectiveColumns,
    selection,
    fillHandle,
    shiftKey,
    ctrlKey,
    metaKey,
    isTouch,
    button,
    buttons,
    getBounds,
    edgeDetectionBuffer = 5,
}: MouseEventComputationArgs): GetMouseEventResult {
    const resolvedTranslateX = translateX ?? 0;
    const resolvedTranslateY = translateY ?? 0;

    const effectiveCols = effectiveColumns.length > 0 ? effectiveColumns : mappedColumns;

    const col = getColumnIndexForX(x, effectiveCols, resolvedTranslateX);
    const row = getRowIndexForY(
        y,
        height,
        enableGroups,
        headerHeight,
        groupHeaderHeight,
        rows,
        rowHeight,
        cellYOffset,
        resolvedTranslateY,
        freezeTrailingRows
    );

    const scrollEdge: GridMouseEventArgs["scrollEdge"] = [
        x < 0 ? -1 : x > width ? 1 : 0,
        y < totalHeaderHeight ? -1 : y > height ? 1 : 0,
    ];

    let result: GridMouseEventArgs;

    if (col === -1 || y < 0 || x < 0 || row === undefined || x > width || y > height) {
        const horizontal = x > width ? 1 : x < 0 ? -1 : 0;
        const vertical = y > height ? 1 : y < 0 ? -1 : 0;

        let innerHorizontal: OutOfBoundsRegionAxis = horizontal * 2;
        let innerVertical: OutOfBoundsRegionAxis = vertical * 2;
        if (horizontal === 0)
            innerHorizontal = col === -1 ? OutOfBoundsRegionAxis.EndPadding : OutOfBoundsRegionAxis.Center;
        if (vertical === 0)
            innerVertical = row === undefined ? OutOfBoundsRegionAxis.EndPadding : OutOfBoundsRegionAxis.Center;

        let isEdge = false;
        if (col === -1 && row === -1) {
            const b = getBounds(mappedColumns.length - 1, -1);
            assert(b !== undefined);
            isEdge = clientX < b.x + b.width + edgeDetectionBuffer;
        }

        const isMaybeScrollbar =
            (x > width && x < width + getScrollBarWidth()) || (y > height && y < height + getScrollBarWidth());

        result = {
            kind: outOfBoundsKind,
            location: [col !== -1 ? col : x < 0 ? 0 : mappedColumns.length - 1, row ?? rows - 1],
            region: [innerHorizontal, innerVertical],
            shiftKey,
            ctrlKey,
            metaKey,
            isTouch,
            isEdge,
            button,
            buttons,
            scrollEdge,
            isMaybeScrollbar,
        };

        return { args: result, columnIndex: col, rowIndex: row };
    }

    if (row !== undefined && row <= -1) {
        let bounds = getBounds(col, row);
        assert(bounds !== undefined);
        let isEdge = bounds !== undefined && bounds.x + bounds.width - clientX <= edgeDetectionBuffer;

        const previousCol = col - 1;
        if (clientX - bounds.x <= edgeDetectionBuffer && previousCol >= 0) {
            isEdge = true;
            bounds = getBounds(previousCol, row);
            assert(bounds !== undefined);
            result = {
                kind: enableGroups && row === -2 ? groupHeaderKind : headerKind,
                location: [previousCol, row] as any,
                bounds,
                group: mappedColumns[previousCol].group ?? "",
                isEdge,
                shiftKey,
                ctrlKey,
                metaKey,
                isTouch,
                localEventX: clientX - bounds.x,
                localEventY: clientY - bounds.y,
                button,
                buttons,
                scrollEdge,
            };
            return { args: result, columnIndex: previousCol, rowIndex: row };
        }

        result = {
            kind: enableGroups && row === -2 ? groupHeaderKind : headerKind,
            group: mappedColumns[col].group ?? "",
            location: [col, row] as any,
            bounds,
            isEdge,
            shiftKey,
            ctrlKey,
            metaKey,
            isTouch,
            localEventX: clientX - bounds.x,
            localEventY: clientY - bounds.y,
            button,
            buttons,
            scrollEdge,
        };
        return { args: result, columnIndex: col, rowIndex: row };
    }

    const bounds = getBounds(col, row ?? 0);
    assert(bounds !== undefined);
    const isEdge = bounds !== undefined && bounds.x + bounds.width - clientX < edgeDetectionBuffer;

    let isFillHandle = false;
    const drawFill = fillHandle !== false && fillHandle !== undefined;
    if (drawFill && selection?.current !== undefined) {
        const fill = typeof fillHandle === "object" ? { ...DEFAULT_FILL_HANDLE, ...fillHandle } : DEFAULT_FILL_HANDLE;
        const fillHandleClickSize = fill.size;
        const half = fillHandleClickSize / 2;
        const [fillCol, fillRow] = rectBottomRight(selection.current.range);
        const fillBounds = getBounds(fillCol, fillRow);
        if (fillBounds !== undefined) {
            const centerX = fillBounds.x + fillBounds.width + fill.offsetX - half + 0.5;
            const centerY = fillBounds.y + fillBounds.height + fill.offsetY - half + 0.5;
            isFillHandle = Math.abs(centerX - clientX) < fillHandleClickSize && Math.abs(centerY - clientY) < fillHandleClickSize;
        }
    }

    result = {
        kind: "cell",
        location: [col, row ?? 0],
        bounds,
        isEdge,
        shiftKey,
        ctrlKey,
        metaKey,
        isTouch,
        button,
        buttons,
        scrollEdge,
        localEventX: clientX - bounds.x,
        localEventY: clientY - bounds.y,
        isFillHandle,
    };

    return { args: result, columnIndex: col, rowIndex: row };
}
