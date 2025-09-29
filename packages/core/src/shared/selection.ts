import type {
    GridSelection,
    InnerGridCell,
    Rectangle,
    Item
} from "../internal/data-grid/data-grid-types.js";

export function gridSelectionHasItem(sel: GridSelection, item: Item): boolean {
    const [col, row] = item;
    if (sel.columns.hasIndex(col) || sel.rows.hasIndex(row)) return true;
    if (sel.current !== undefined) {
        if (itemsAreEqual(sel.current.cell, item)) return true;
        const toCheck = [sel.current.range, ...sel.current.rangeStack];
        for (const r of toCheck) {
            if (col >= r.x && col < r.x + r.width && row >= r.y && row < r.y + r.height) return true;
        }
    }
    return false;
}

export function isGroupEqual(left: string | undefined, right: string | undefined): boolean {
    return (left ?? "") === (right ?? "");
}

export function cellIsSelected(location: Item, cell: InnerGridCell, selection: GridSelection): boolean {
    if (selection.current === undefined) return false;

    if (location[1] !== selection.current.cell[1]) return false;

    if (cell.span === undefined) {
        return selection.current.cell[0] === location[0];
    }

    return selection.current.cell[0] >= cell.span[0] && selection.current.cell[0] <= cell.span[1];
}

export function itemIsInRect(location: Item, rect: Rectangle): boolean {
    const [x, y] = location;

    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export function itemsAreEqual(a: Item | undefined, b: Item | undefined): boolean {
    return a?.[0] === b?.[0] && a?.[1] === b?.[1];
}

export function rectBottomRight(rect: Rectangle): Item {
    return [rect.x + rect.width - 1, rect.y + rect.height - 1];
}

export function cellIsInRange(
    location: Item,
    cell: InnerGridCell,
    selection: GridSelection,
    includeSingleSelection: boolean
): number {
    let result = 0;
    if (selection.current === undefined) return result;

    const range = selection.current.range;

    if ((includeSingleSelection || range.height * range.width > 1) && cellIsInRect(location, cell, range)) {
        result++;
    }
    for (const r of selection.current.rangeStack) {
        if (cellIsInRect(location, cell, r)) {
            result++;
        }
    }
    return result;
}

function cellIsInRect(location: Item, cell: InnerGridCell, rect: Rectangle): boolean {
    const startX = rect.x;
    const endX = rect.x + rect.width - 1;
    const startY = rect.y;
    const endY = rect.y + rect.height - 1;

    const [cellCol, cellRow] = location;
    if (cellRow < startY || cellRow > endY) return false;

    if (cell.span === undefined) {
        return cellCol >= startX && cellCol <= endX;
    }

    const [spanStart, spanEnd] = cell.span;
    return (
        (spanStart >= startX && spanStart <= endX) ||
        (spanEnd >= startX && spanStart <= endX) ||
        (spanStart < startX && spanEnd > endX)
    );
}
