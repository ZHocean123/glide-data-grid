import type { Rectangle } from "../internal/data-grid/data-grid-types.js";
import type { MappedGridColumn } from "./mapped-columns.js";
import { getStickyWidth } from "./columns.js";
import { isGroupEqual } from "./selection.js";

export function computeBounds(
    col: number,
    row: number,
    width: number,
    height: number,
    groupHeaderHeight: number,
    totalHeaderHeight: number,
    cellXOffset: number,
    cellYOffset: number,
    translateX: number,
    translateY: number,
    rows: number,
    freezeColumns: number,
    freezeTrailingRows: number,
    mappedColumns: readonly MappedGridColumn[],
    rowHeight: number | ((index: number) => number)
): Rectangle {
    const result: Rectangle = {
        x: 0,
        y: totalHeaderHeight + translateY,
        width: 0,
        height: 0,
    };

    if (col >= mappedColumns.length || row >= rows || row < -2 || col < 0) {
        return result;
    }

    const headerHeight = totalHeaderHeight - groupHeaderHeight;

    if (col >= freezeColumns) {
        const dir = cellXOffset > col ? -1 : 1;
        const freezeWidth = getStickyWidth(mappedColumns);
        result.x += freezeWidth + translateX;
        for (let i = cellXOffset; i !== col; i += dir) {
            result.x += mappedColumns[dir === 1 ? i : i - 1].width * dir;
        }
    } else {
        for (let i = 0; i < col; i++) {
            result.x += mappedColumns[i].width;
        }
    }
    result.width = mappedColumns[col].width + 1;

    if (row === -1) {
        result.y = groupHeaderHeight;
        result.height = headerHeight;
    } else if (row === -2) {
        result.y = 0;
        result.height = groupHeaderHeight;

        let start = col;
        const group = mappedColumns[col].group;
        const sticky = mappedColumns[col].sticky;
        while (
            start > 0 &&
            isGroupEqual(mappedColumns[start - 1].group, group) &&
            mappedColumns[start - 1].sticky === sticky
        ) {
            const c = mappedColumns[start - 1];
            result.x -= c.width;
            result.width += c.width;
            start--;
        }

        let end = col;
        while (
            end + 1 < mappedColumns.length &&
            isGroupEqual(mappedColumns[end + 1].group, group) &&
            mappedColumns[end + 1].sticky === sticky
        ) {
            const c = mappedColumns[end + 1];
            result.width += c.width;
            end++;
        }
        if (!sticky) {
            const freezeWidth = getStickyWidth(mappedColumns);
            const clip = result.x - freezeWidth;
            if (clip < 0) {
                result.x -= clip;
                result.width += clip;
            }

            if (result.x + result.width > width) {
                result.width = width - result.x;
            }
        }
    } else if (row >= rows - freezeTrailingRows) {
        let dy = rows - row;
        result.y = height;
        while (dy > 0) {
            const r = row + dy - 1;
            result.height = typeof rowHeight === "number" ? rowHeight : rowHeight(r);
            result.y -= result.height;
            dy--;
        }
        result.height += 1;
    } else {
        const dir = cellYOffset > row ? -1 : 1;
        if (typeof rowHeight === "number") {
            const delta = row - cellYOffset;
            result.y += delta * rowHeight;
        } else {
            for (let r = cellYOffset; r !== row; r += dir) {
                result.y += rowHeight(r) * dir;
            }
        }
        result.height = (typeof rowHeight === "number" ? rowHeight : rowHeight(row)) + 1;
    }

    return result;
}
