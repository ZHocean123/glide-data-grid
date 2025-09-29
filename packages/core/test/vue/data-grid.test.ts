import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import DataGrid from "../../src/vue/components/DataGrid.vue";
import type { InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

describe("DataGrid", () => {
    const columns: InnerGridColumn[] = [
        { title: "ID", width: 80 },
        { title: "Name", width: 140 },
        { title: "Value", width: 120 },
    ];

    it("renders headers with mapped widths and sticky offset", () => {
        const wrapper = mount(DataGrid, {
            props: {
                width: 400,
                height: 200,
                rows: 10,
                columns,
                headerHeight: 40,
                freezeColumns: 1,
            },
        });

        const headerCells = wrapper.findAll(".gdg-vue-grid-header-cell");
        expect(headerCells).toHaveLength(3);
        expect(headerCells[0].text()).toBe("ID");
        expect((headerCells[0].element as HTMLElement).style.width).toBe("80px");

        const gridEl = wrapper.get(".gdg-vue-grid").element as HTMLElement;
        expect(gridEl.style.width).toBe("400px");
        expect(gridEl.style.getPropertyValue("--gdg-sticky-width")).toBe("80px");

        // computeBounds adds a one-pixel stroke to width, expect data attribute to reflect that
        expect(wrapper.attributes()["data-first-header-width"]).toBe("81");

        const body = wrapper.get(".gdg-vue-grid-body").element as HTMLElement;
        expect(body.style.height).toBe("160px");
    });

    it("shows placeholder when no columns are provided", () => {
        const wrapper = mount(DataGrid, {
            props: {
                width: 320,
                height: 180,
                rows: 5,
                columns: [],
                headerHeight: 36,
            },
        });

        expect(wrapper.findAll(".gdg-vue-grid-header-cell")).toHaveLength(0);
        expect(wrapper.get(".gdg-vue-grid-header-empty").text()).toContain("No columns mapped yet");
    });
});
