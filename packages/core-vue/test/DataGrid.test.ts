import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { DataGrid } from "../src/index.js";

describe("DataGrid", () => {
    it("renders default placeholder content", () => {
        const { getByRole } = render(DataGrid);

        const grid = getByRole("grid");

        expect(grid).toBeTruthy();
        expect(grid.textContent).toContain("Glide Data Grid Vue placeholder");
    });

    it("forwards slotted content", () => {
        const { getByRole } = render(DataGrid, {
            slots: {
                default: "Custom content"
            }
        });

        expect(getByRole("grid").textContent).toContain("Custom content");
    });
});
