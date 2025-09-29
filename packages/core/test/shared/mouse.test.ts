import { describe, expect, it } from "vitest";
import { getMouseEventArgs } from "../../src/shared/mouse.js";
import { mapColumns } from "../../src/shared/mapped-columns.js";
import { computeBounds } from "../../src/shared/bounds.js";
import { CompactSelection, DEFAULT_FILL_HANDLE, type GridSelection } from "../../src/internal/data-grid/data-grid-types.js";

const width = 320;
const height = 240;
const headerHeight = 32;
const groupHeaderHeight = 0;
const totalHeaderHeight = headerHeight + groupHeaderHeight;
const rowHeight = 24;
const rows = 10;
const freezeColumns = 1;
const freezeTrailingRows = 0;
const cellXOffset = 0;
const cellYOffset = 0;
const translateX = 0;
const translateY = 0;

const mappedColumns = mapColumns(
    [
        { title: "ID", width: 80 },
        { title: "Name", width: 120 },
        { title: "Status", width: 120 },
    ],
    freezeColumns
);

const effectiveColumns = mappedColumns;

const getBounds = (col: number, row: number) =>
    computeBounds(
        col,
        row,
        width,
        height,
        groupHeaderHeight,
        totalHeaderHeight,
        cellXOffset,
        cellYOffset,
        translateX,
        translateY,
        rows,
        freezeColumns,
        freezeTrailingRows,
        mappedColumns,
        rowHeight
    );

describe("getMouseEventArgs", () => {
    it("returns cell args for body coordinates", () => {
        const cellBounds = getBounds(1, 0);
        const pointerX = cellBounds.x + 10;
        const pointerY = cellBounds.y + 10;

        const { args } = getMouseEventArgs({
            x: pointerX,
            y: pointerY,
            clientX: pointerX,
            clientY: pointerY,
            width,
            height,
            enableGroups: false,
            headerHeight,
            groupHeaderHeight,
            totalHeaderHeight,
            rows,
            rowHeight,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            freezeTrailingRows,
            mappedColumns,
            effectiveColumns,
            selection: undefined,
            fillHandle: undefined,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            isTouch: false,
            button: 0,
            buttons: 0,
            getBounds,
        });

        expect(args.kind).toBe("cell");
        expect(args.location).toEqual([1, 0]);
        expect(args.localEventX).toBeCloseTo(10, 1);
        expect(args.localEventY).toBeCloseTo(10, 1);
    });

    it("returns header args when hovering header row", () => {
        const headerBounds = getBounds(0, -1);
        const pointerX = headerBounds.x + 5;
        const pointerY = headerBounds.y + 5;

        const { args } = getMouseEventArgs({
            x: pointerX,
            y: pointerY,
            clientX: pointerX,
            clientY: pointerY,
            width,
            height,
            enableGroups: false,
            headerHeight,
            groupHeaderHeight,
            totalHeaderHeight,
            rows,
            rowHeight,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            freezeTrailingRows,
            mappedColumns,
            effectiveColumns,
            selection: undefined,
            fillHandle: undefined,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            isTouch: false,
            button: 0,
            buttons: 0,
            getBounds,
        });

        expect(args.kind).toBe("header");
        expect(args.location).toEqual([0, -1]);
        expect(args.localEventX).toBeCloseTo(5, 1);
        expect(args.localEventY).toBeCloseTo(5, 1);
    });

    it("flags out-of-bounds to the right", () => {
        const { args } = getMouseEventArgs({
            x: width + 20,
            y: totalHeaderHeight + 10,
            clientX: width + 20,
            clientY: totalHeaderHeight + 10,
            width,
            height,
            enableGroups: false,
            headerHeight,
            groupHeaderHeight,
            totalHeaderHeight,
            rows,
            rowHeight,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            freezeTrailingRows,
            mappedColumns,
            effectiveColumns,
            selection: undefined,
            fillHandle: undefined,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            isTouch: false,
            button: 0,
            buttons: 0,
            getBounds,
        });

        expect(args.kind).toBe("out-of-bounds");
        expect(args.region[0]).toBeGreaterThan(0);
    });

    it("detects pointer over fill handle", () => {
        const selection: GridSelection = {
            current: {
                cell: [1, 0],
                range: { x: 1, y: 0, width: 1, height: 1 },
                rangeStack: [],
            },
            columns: CompactSelection.fromArray([1]),
            rows: CompactSelection.fromArray([0]),
        };

        const fillBounds = getBounds(1, 0);
        const half = DEFAULT_FILL_HANDLE.size / 2;
        const pointerX = fillBounds.x + fillBounds.width + DEFAULT_FILL_HANDLE.offsetX - half + 0.5;
        const pointerY = fillBounds.y + fillBounds.height + DEFAULT_FILL_HANDLE.offsetY - half + 0.5;

        const { args } = getMouseEventArgs({
            x: pointerX,
            y: pointerY,
            clientX: pointerX,
            clientY: pointerY,
            width,
            height,
            enableGroups: false,
            headerHeight,
            groupHeaderHeight,
            totalHeaderHeight,
            rows,
            rowHeight,
            cellXOffset,
            cellYOffset,
            translateX,
            translateY,
            freezeTrailingRows,
            mappedColumns,
            effectiveColumns,
            selection,
            fillHandle: DEFAULT_FILL_HANDLE,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            isTouch: false,
            button: 0,
            buttons: 0,
            getBounds,
        });

        expect(args.kind).toBe("cell");
        expect(args.isFillHandle).toBe(true);
    });
});
