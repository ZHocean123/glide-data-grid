import type { MappedGridColumn } from "./mapped-columns.js";

export function getColumnIndexForX(
    targetX: number,
    effectiveColumns: readonly MappedGridColumn[],
    translateX?: number
): number {
    let x = 0;
    for (const c of effectiveColumns) {
        const cx = c.sticky ? x : x + (translateX ?? 0);
        if (targetX <= cx + c.width) {
            return c.sourceIndex;
        }
        x += c.width;
    }
    return -1;
}

export function getRowIndexForY(
    targetY: number,
    height: number,
    hasGroups: boolean,
    headerHeight: number,
    groupHeaderHeight: number,
    rows: number,
    rowHeight: number | ((index: number) => number),
    cellYOffset: number,
    translateY: number,
    freezeTrailingRows: number
): number | undefined {
    const totalHeaderHeight = headerHeight + groupHeaderHeight;
    if (hasGroups && targetY <= groupHeaderHeight) return -2;
    if (targetY <= totalHeaderHeight) return -1;

    let y = height;
    for (let fr = 0; fr < freezeTrailingRows; fr++) {
        const row = rows - 1 - fr;
        const rh = typeof rowHeight === "number" ? rowHeight : rowHeight(row);
        y -= rh;
        if (targetY >= y) {
            return row;
        }
    }

    const effectiveRows = rows - freezeTrailingRows;

    const ty = targetY - (translateY ?? 0);
    if (typeof rowHeight === "number") {
        const target = Math.floor((ty - totalHeaderHeight) / rowHeight) + cellYOffset;
        if (target >= effectiveRows) return undefined;
        return target;
    } else {
        let curY = totalHeaderHeight;
        for (let i = cellYOffset; i < effectiveRows; i++) {
            const rh = rowHeight(i);
            if (ty <= curY + rh) return i;
            curY += rh;
        }
        return undefined;
    }
}
