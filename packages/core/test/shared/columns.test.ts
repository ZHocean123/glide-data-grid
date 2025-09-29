import { describe, expect, it } from "vitest";
import {
    remapForDnDState,
    getStickyWidth,
    getFreezeTrailingHeight,
    getEffectiveColumns,
} from "../../src/shared/columns.js";
import { getColumnIndexForX, getRowIndexForY } from "../../src/shared/geometry.js";
import { mapColumns, type MappedGridColumn } from "../../src/shared/mapped-columns.js";
import type { InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

const buildMapped = (columns: readonly InnerGridColumn[], freezeColumns = 1): readonly MappedGridColumn[] =>
    mapColumns(columns, freezeColumns);

describe("shared column helpers", () => {
    const baseColumns: InnerGridColumn[] = [
        { title: "ID", width: 80, id: "id" },
        { title: "Name", width: 120, id: "name" },
        { title: "Email", width: 160, id: "email" },
    ];

    it("reorders columns for drag and drop without losing sticky flags", () => {
        const mapped = buildMapped(baseColumns, 1);
        const result = remapForDnDState(mapped, { src: 2, dest: 0 });
        expect(result.map(c => c.id)).toEqual(["email", "id", "name"]);
        expect(result[0].sticky).toBe(true);
    });

    it("computes sticky width including DnD offsets", () => {
        const mapped = buildMapped(baseColumns, 1);
        expect(getStickyWidth(mapped)).toBe(80);
        const reordered = remapForDnDState(mapped, { src: 1, dest: 0 });
        expect(getStickyWidth(reordered)).toBe(120);
    });

    it("sums freeze trailing height for numeric and functional row heights", () => {
        expect(getFreezeTrailingHeight(10, 2, 25)).toBe(50);
        const dynamic = getFreezeTrailingHeight(6, 2, row => (row === 5 ? 40 : 20));
        expect(dynamic).toBe(60);
    });

    it("derives effective columns accounting for sticky and viewport width", () => {
        const mapped = buildMapped(baseColumns, 1);
        const effective = getEffectiveColumns(mapped, 1, 150);
        expect(effective.map(c => c.id)).toEqual(["id", "name"]);
        const withScroll = getEffectiveColumns(mapped, 1, 150, undefined, 50);
        expect(withScroll.map(c => c.id)).toEqual(["id", "name"]);
    });

    it("locates column indexes by x coordinate", () => {
        const mapped = buildMapped(baseColumns, 1);
        const effective = getEffectiveColumns(mapped, 0, 500);
        expect(getColumnIndexForX(60, effective)).toBe(0);
        expect(getColumnIndexForX(150, effective)).toBe(1);
        expect(getColumnIndexForX(320, effective)).toBe(2);
        expect(getColumnIndexForX(400, effective)).toBe(-1);
    });

    it("locates row indexes by y coordinate", () => {
        const rowHeight = 25;
        const headerHeight = 40;
        const groupHeaderHeight = 32;
        expect(
            getRowIndexForY(
                headerHeight + groupHeaderHeight + rowHeight + 1,
                400,
                false,
                headerHeight,
                groupHeaderHeight,
                100,
                rowHeight,
                0,
                0,
                0
            )
        ).toBe(1);
        expect(
            getRowIndexForY(
                groupHeaderHeight - 5,
                400,
                true,
                headerHeight,
                groupHeaderHeight,
                100,
                rowHeight,
                0,
                0,
                0
            )
        ).toBe(-2);
    });
});
