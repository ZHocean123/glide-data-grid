import { describe, expect, it } from "vitest";
import {
    gridSelectionHasItem,
    cellIsSelected,
    cellIsInRange,
    itemsAreEqual,
    rectBottomRight,
} from "../../src/shared/selection.js";
import type { GridSelection, InnerGridCell, Rectangle, Item } from "../../src/internal/data-grid/data-grid-types.js";
import { CompactSelection } from "../../src/internal/data-grid/data-grid-types.js";

describe("shared selection helpers", () => {
    const makeSelection = (overrides: Partial<GridSelection> = {}): GridSelection => ({
        current: {
            cell: [2, 3],
            range: { x: 1, y: 3, width: 2, height: 1 },
            rangeStack: [{ x: 4, y: 3, width: 1, height: 1 }],
            ...(overrides.current ?? {}),
        },
        columns: CompactSelection.fromArray([2]),
        rows: CompactSelection.fromArray([3]),
        ...overrides,
    });

    const makeCell = (span?: [number, number]): InnerGridCell => ({
        span,
    }) as unknown as InnerGridCell;

    it("detects items present in stacked ranges", () => {
        const sel = makeSelection();
        expect(gridSelectionHasItem(sel, [4, 3])).toBe(true);
        expect(gridSelectionHasItem(sel, [10, 10])).toBe(false);
    });

    it("calculates selected cells with spans", () => {
        const sel = makeSelection({ current: { cell: [2, 3], rangeStack: [] } });
        const spannedCell = makeCell([1, 3]);
        expect(cellIsSelected([1, 3], spannedCell, sel)).toBe(true);
        expect(cellIsSelected([4, 3], spannedCell, sel)).toBe(true);
    });

    it("counts how many ranges include a cell", () => {
        const range: Rectangle = { x: 0, y: 0, width: 1, height: 1 };
        const stacked: Rectangle = { x: 2, y: 0, width: 1, height: 1 };
        const sel = makeSelection({
            current: {
                cell: [0, 0],
                range,
                rangeStack: [stacked],
            },
        });
        const cell = makeCell();
        expect(cellIsInRange([0, 0], cell, sel, true)).toBe(1);
        expect(cellIsInRange([2, 0], cell, sel, false)).toBe(1);
        expect(cellIsInRange([1, 0], cell, sel, false)).toBe(0);
    });

    it("compares items and computes rectangle corners", () => {
        const a: Item = [1, 2];
        const b: Item = [1, 2];
        const c: Item = [2, 2];
        expect(itemsAreEqual(a, b)).toBe(true);
        expect(itemsAreEqual(a, c)).toBe(false);
        expect(rectBottomRight({ x: 3, y: 4, width: 2, height: 3 })).toEqual([4, 6]);
    });
});
