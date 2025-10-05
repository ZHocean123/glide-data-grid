import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { DataGrid } from "../src/index";

describe("DataGrid", () => {
    it("renders data grid component", () => {
        const { container } = render(DataGrid, {
            props: {
                width: 800,
                height: 600,
                cellXOffset: 0,
                cellYOffset: 0,
                accessibilityHeight: 600,
                freezeColumns: 0,
                freezeTrailingRows: 0,
                hasAppendRow: false,
                firstColAccessible: false,
                isResizing: false,
                isDragging: false,
                isFilling: false,
                isFocused: false,
                columns: [],
                rows: 0,
                headerHeight: 0,
                groupHeaderHeight: 0,
                enableGroups: false,
                rowHeight: 32,
                getCellContent: () => ({}),
                selection: { current: undefined, rows: undefined, columns: undefined },
                imageWindowLoader: { load: () => Promise.resolve(undefined) },
                verticalBorder: () => false,
                drawFocusRing: false,
                theme: {},
                getCellRenderer: () => undefined
            }
        });

        expect(container.querySelector(".glide-data-grid-vue")).toBeTruthy();
    });

    it("renders with minimal props", () => {
        const { container } = render(DataGrid, {
            props: {
                width: 400,
                height: 300,
                cellXOffset: 0,
                cellYOffset: 0,
                accessibilityHeight: 300,
                freezeColumns: 0,
                freezeTrailingRows: 0,
                hasAppendRow: false,
                firstColAccessible: false,
                isResizing: false,
                isDragging: false,
                isFilling: false,
                isFocused: false,
                columns: [],
                rows: 0,
                headerHeight: 0,
                groupHeaderHeight: 0,
                enableGroups: false,
                rowHeight: 32,
                getCellContent: () => ({}),
                selection: { current: undefined, rows: undefined, columns: undefined },
                imageWindowLoader: { load: () => Promise.resolve(undefined) },
                verticalBorder: () => false,
                drawFocusRing: false,
                theme: {},
                getCellRenderer: () => undefined
            }
        });

        expect(container.querySelector(".glide-data-grid-vue")).toBeTruthy();
    });
});
