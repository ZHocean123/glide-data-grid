import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import DataGrid from "../../src/vue/components/DataGrid.vue";
import { CompactSelection, type GridSelection, type Rectangle, type InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

const columns: InnerGridColumn[] = [
    { title: "ID", width: 80 },
    { title: "Name", width: 140 },
    { title: "Value", width: 120 },
];

function makeSelection(cell: readonly [number, number]): GridSelection {
    const range: Rectangle = { x: cell[0], y: cell[1], width: 1, height: 1 };
    return {
        current: {
            cell,
            range,
            rangeStack: [],
        },
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
    };
}

describe("DataGrid keyboard events", () => {
    it("invokes onKeyDown with parsed GridKeyEventArgs and supports cancel handling", async () => {
        const onKeyDown = vi.fn();
        const selection = makeSelection([1, 0]);

        const wrapper = mount(DataGrid, {
            props: {
                width: 420,
                height: 260,
                rows: 12,
                columns,
                selection,
                onKeyDown,
            },
        });

        // 等待几次 tick 保证几何与样式计算完成
        await nextTick();
        await nextTick();

        const root = wrapper.get(".gdg-vue-grid").element as HTMLElement;
        const kd = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
        const preventSpy = vi.fn();
        const stopSpy = vi.fn();
        // jsdom 中可用赋值来拦截调用
        // @ts-expect-error override for test
        kd.preventDefault = preventSpy;
        // @ts-expect-error override for test
        kd.stopPropagation = stopSpy;

        root.dispatchEvent(kd);
        await nextTick();

        expect(onKeyDown).toHaveBeenCalledTimes(1);
        const args = onKeyDown.mock.calls[0][0];
        expect(args.key).toBe("ArrowRight");
        expect(args.keyCode).toBe(39);
        expect(args.location).toEqual([1, 0]);
        expect(args.bounds).toBeDefined();
        expect(typeof args.bounds.x).toBe("number");

        // 验证取消流程会调用 preventDefault/stopPropagation
        args.cancel();
        expect(preventSpy).toHaveBeenCalledTimes(1);
        expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it("invokes onKeyUp with parsed GridKeyEventArgs", async () => {
        const onKeyUp = vi.fn();
        const selection = makeSelection([0, 0]);

        const wrapper = mount(DataGrid, {
            props: {
                width: 360,
                height: 220,
                rows: 8,
                columns,
                selection,
                onKeyUp,
            },
        });

        await nextTick();
        await nextTick();

        const root = wrapper.get(".gdg-vue-grid").element as HTMLElement;
        const ku = new KeyboardEvent("keyup", { key: "Enter", bubbles: true, cancelable: true });
        root.dispatchEvent(ku);
        await nextTick();

        expect(onKeyUp).toHaveBeenCalledTimes(1);
        const args = onKeyUp.mock.calls[0][0];
        expect(args.key).toBe("Enter");
        expect(args.keyCode).toBe(13);
        expect(args.location).toEqual([0, 0]);
    });
});