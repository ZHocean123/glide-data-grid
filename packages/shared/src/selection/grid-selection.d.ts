import type { Rectangle } from "../geometry/index";
import type { GridItem } from "../types";
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
export declare function gridSelectionHasItem(sel: GridSelectionLike, item: GridItem): boolean;
