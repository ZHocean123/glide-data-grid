import type { Rectangle } from "../geometry/index";
import type { GridItem } from "../types";
import { itemsAreEqual } from "../grid/items";

export interface CompactSelectionLike {
    hasIndex(index: number): boolean;
}

export interface GridSelectionRangeLike {
    readonly cell: GridItem;
    readonly range: Readonly<Rectangle>;
    readonly rangeStack: readonly Readonly<Rectangle>[];
}

export interface GridSelectionLike {
    readonly current?: GridSelectionRangeLike;
    readonly columns: CompactSelectionLike;
    readonly rows: CompactSelectionLike;
}

export function gridSelectionHasItem(sel: GridSelectionLike, item: GridItem): boolean {
    const [col, row] = item;
    if (sel.columns.hasIndex(col) || sel.rows.hasIndex(row)) return true;
    if (sel.current !== undefined) {
        if (itemsAreEqual(sel.current.cell, item)) return true;
        const ranges = [sel.current.range, ...sel.current.rangeStack];
        for (const r of ranges) {
            if (col >= r.x && col < r.x + r.width && row >= r.y && row < r.y + r.height) return true;
        }
    }
    return false;
}
