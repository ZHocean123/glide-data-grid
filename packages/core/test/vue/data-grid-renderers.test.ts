import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { nextTick } from "vue";
import type { CustomRenderer } from "../../src/cells/cell-types.js";
import DataGrid from "../../src/vue/components/DataGrid.vue";
import { GridCellKind, type CustomCell, type InnerGridCell, type InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

const drawGridMock = vi.fn();

vi.mock("../../src/internal/data-grid/render/data-grid-render.js", () => ({
    drawGrid: (...args: any[]) => drawGridMock(...args),
}));

const columns: InnerGridColumn[] = [
    { title: "A", width: 120 },
];

function createContextStub() {
    const gradient = { addColorStop: vi.fn() };
    return {
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        createLinearGradient: vi.fn(() => gradient),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        textBaseline: "middle",
        textAlign: "center",
        font: "",
        fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
}

describe("DataGrid cell renderer resolution", () => {
    let getContextSpy: ReturnType<typeof vi.spyOn>;
    let userAgentSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        drawGridMock.mockReset();
        userAgentSpy = vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("vitest");
        getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(createContextStub());
    });

    afterEach(() => {
        getContextSpy.mockRestore();
        userAgentSpy.mockRestore();
    });

    it("uses built-in renderer when no override supplied", async () => {
        const cell = {
            kind: GridCellKind.Text,
            data: "value",
            displayData: "value",
            allowOverlay: false,
        } as InnerGridCell;

        const wrapper = mount(DataGrid, {
            props: {
                width: 200,
                height: 120,
                rows: 1,
                columns,
                getCellContent: () => cell,
            },
        });

        await nextTick();
        await nextTick();

        expect(drawGridMock).toHaveBeenCalled();

        const drawArgs = drawGridMock.mock.calls[drawGridMock.mock.calls.length - 1][0];
        const renderer = drawArgs.getCellRenderer(cell);
        expect(renderer).toBeDefined();
        expect(renderer.kind).toBe(GridCellKind.Text);

        wrapper.unmount();
    });

    it("prefers additional custom renderers before defaults", async () => {
        const customCell = {
            kind: GridCellKind.Custom,
            data: { label: "hi" },
            copyData: "hi",
            allowOverlay: false,
        } as CustomCell<{ label: string }>;

        const marker = Symbol("custom-renderer");
        const customRenderer = {
            kind: GridCellKind.Custom,
            draw: vi.fn(),
            getAccessibilityString: () => "custom",
            isMatch: (cell: CustomCell<{ label: string }>) => cell.data.label === "hi",
            marker,
        } as CustomRenderer<CustomCell<{ label: string }>> & { marker: symbol };

        const wrapper = mount(DataGrid, {
            props: {
                width: 200,
                height: 120,
                rows: 1,
                columns,
                getCellContent: () => customCell,
                additionalRenderers: [customRenderer],
            },
        });

        await nextTick();
        await nextTick();

        expect(drawGridMock).toHaveBeenCalled();
        const drawArgs = drawGridMock.mock.calls[drawGridMock.mock.calls.length - 1][0];
        const renderer = drawArgs.getCellRenderer(customCell) as (CustomRenderer<CustomCell<{ label: string }>> & { marker?: symbol }) | undefined;
        expect(renderer).toBeDefined();
        expect(renderer?.marker).toBe(marker);

        wrapper.unmount();
    });

    it("respects explicit getCellRenderer override", async () => {
        const cell = {
            kind: GridCellKind.Text,
            data: "value",
            displayData: "value",
            allowOverlay: false,
        } as InnerGridCell;

        const overrideRenderer = {
            kind: GridCellKind.Text,
            draw: vi.fn(),
            getAccessibilityString: () => "override",
        };

        const getCellRenderer = vi.fn(() => overrideRenderer);

        const wrapper = mount(DataGrid, {
            props: {
                width: 200,
                height: 120,
                rows: 1,
                columns,
                getCellContent: () => cell,
                getCellRenderer,
            },
        });

        await nextTick();
        await nextTick();

        expect(drawGridMock).toHaveBeenCalled();
        const drawArgs = drawGridMock.mock.calls[drawGridMock.mock.calls.length - 1][0];
        const renderer = drawArgs.getCellRenderer(cell);
        expect(renderer).toBe(overrideRenderer);
        expect(getCellRenderer).toHaveBeenCalledWith(cell);

        wrapper.unmount();
    });
});