import type { GridItem } from "../types.js";

export function itemsAreEqual(a: GridItem | undefined, b: GridItem | undefined): boolean {
    return a?.[0] === b?.[0] && a?.[1] === b?.[1];
}
