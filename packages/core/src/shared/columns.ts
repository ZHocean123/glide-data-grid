import type { MappedGridColumn } from "./mapped-columns.js";

export interface ColumnDnDState {
    src: number;
    dest: number;
}

export function remapForDnDState(
    columns: readonly MappedGridColumn[],
    dndState?: ColumnDnDState
): readonly MappedGridColumn[] {
    let mappedCols = columns;
    if (dndState !== undefined) {
        let writable = [...columns];
        const temp = mappedCols[dndState.src];
        if (dndState.src > dndState.dest) {
            writable.splice(dndState.src, 1);
            writable.splice(dndState.dest, 0, temp);
        } else {
            writable.splice(dndState.dest + 1, 0, temp);
            writable.splice(dndState.src, 1);
        }
        writable = writable.map((c, i) => ({
            ...c,
            sticky: columns[i].sticky,
        }));
        mappedCols = writable;
    }
    return mappedCols;
}

export function getStickyWidth(
    columns: readonly MappedGridColumn[],
    dndState?: ColumnDnDState
): number {
    let result = 0;
    const remapped = remapForDnDState(columns, dndState);
    for (let i = 0; i < remapped.length; i++) {
        const c = remapped[i];
        if (c.sticky) result += c.width;
        else break;
    }

    return result;
}

export function getFreezeTrailingHeight(
    rows: number,
    freezeTrailingRows: number,
    getRowHeight: number | ((row: number) => number)
): number {
    if (typeof getRowHeight === "number") {
        return freezeTrailingRows * getRowHeight;
    } else {
        let result = 0;
        for (let i = rows - freezeTrailingRows; i < rows; i++) {
            result += getRowHeight(i);
        }
        return result;
    }
}

export function getEffectiveColumns(
    columns: readonly MappedGridColumn[],
    cellXOffset: number,
    width: number,
    dndState?: ColumnDnDState,
    tx?: number
): readonly MappedGridColumn[] {
    const mappedCols = remapForDnDState(columns, dndState);

    const sticky: MappedGridColumn[] = [];
    for (const c of mappedCols) {
        if (c.sticky) {
            sticky.push(c);
        } else {
            break;
        }
    }
    if (sticky.length > 0) {
        for (const c of sticky) {
            width -= c.width;
        }
    }
    let endIndex = cellXOffset;
    let curX = tx ?? 0;

    while (curX <= width && endIndex < mappedCols.length) {
        curX += mappedCols[endIndex].width;
        endIndex++;
    }

    for (let i = cellXOffset; i < endIndex; i++) {
        const c = mappedCols[i];
        if (!c.sticky) {
            sticky.push(c);
        }
    }

    return sticky;
}
