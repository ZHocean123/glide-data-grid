import { describe, expect, it } from "vitest";
import { computeBounds } from "../../src/shared/bounds.js";
import { mapColumns } from "../../src/shared/mapped-columns.js";
import type { InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

const columns: InnerGridColumn[] = [
    { title: "ID", width: 80, id: "id" },
    { title: "Name", width: 120, id: "name" },
    { title: "Email", width: 160, id: "email", group: "Info" },
];

const mapped = mapColumns(columns, 1);

const baseParams = {
    width: 600,
    height: 400,
    groupHeaderHeight: 32,
    totalHeaderHeight: 72,
    cellXOffset: 0,
    cellYOffset: 0,
    translateX: 0,
    translateY: 0,
    rows: 100,
    freezeColumns: 1,
    freezeTrailingRows: 0,
    rowHeight: 24,
};

describe("computeBounds", () => {
    it("computes body cell bounds", () => {
        const rect = computeBounds(
            1,
            2,
            baseParams.width,
            baseParams.height,
            baseParams.groupHeaderHeight,
            baseParams.totalHeaderHeight,
            baseParams.cellXOffset,
            baseParams.cellYOffset,
            baseParams.translateX,
            baseParams.translateY,
            baseParams.rows,
            baseParams.freezeColumns,
            baseParams.freezeTrailingRows,
            mapped,
            baseParams.rowHeight
        );
        expect(rect).toEqual({ x: 160, y: 120, width: 121, height: 25 });
    });

    it("computes group header bounds spanning group columns", () => {
        const rect = computeBounds(
            2,
            -2,
            baseParams.width,
            baseParams.height,
            baseParams.groupHeaderHeight,
            baseParams.totalHeaderHeight,
            baseParams.cellXOffset,
            baseParams.cellYOffset,
            baseParams.translateX,
            baseParams.translateY,
            baseParams.rows,
            baseParams.freezeColumns,
            baseParams.freezeTrailingRows,
            mapped,
            baseParams.rowHeight
        );
        expect(rect.x).toBe(280);
        expect(rect.y).toBe(0);
        expect(rect.height).toBe(baseParams.groupHeaderHeight);
        expect(rect.width).toBeGreaterThanOrEqual(160);
    });
});
