import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import DataGrid from "../../src/vue/components/DataGrid.vue";
import type { InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";
import type { GridMouseEventArgs } from "../../src/internal/data-grid/event-args.js";

if (typeof PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
        pointerId: number;
        pointerType: string;
        buttons: number;

        constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string; buttons?: number }) {
            super(type, init);
            this.pointerId = init.pointerId ?? 0;
            this.pointerType = init.pointerType ?? "mouse";
            this.buttons = init.buttons ?? 0;
        }
    }

    // @ts-expect-error polyfill assignment for test environment
    globalThis.PointerEvent = PointerEventPolyfill;
}

const columns: InnerGridColumn[] = [
    { title: "ID", width: 80 },
    { title: "Name", width: 140 },
    { title: "Value", width: 120 },
];

function stubCanvasRect(canvas: HTMLCanvasElement, width: number, height: number) {
    canvas.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
        toJSON: () => {},
    });
}

describe("DataGrid pointer events", () => {
    it("emits pointer down and up payloads", async () => {
        const onMouseDown = vi.fn();
        const onMouseUp = vi.fn();
        const wrapper = mount(DataGrid, {
            props: {
                width: 420,
                height: 260,
                rows: 12,
                columns,
                onMouseDown,
                onMouseUp,
            },
        });

        const canvas = wrapper.get("canvas").element as HTMLCanvasElement;
        stubCanvasRect(canvas, 420, 224);

        const pointerInit: PointerEventInit = {
            clientX: 180,
            clientY: 120,
            pointerId: 3,
            pointerType: "mouse",
            button: 0,
            buttons: 1,
            bubbles: true,
            cancelable: true,
        };

        const pointerDownEvent = new PointerEvent("pointerdown", pointerInit);
        canvas.dispatchEvent(pointerDownEvent);
        await nextTick();
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onMouseDown.mock.calls[0][0].kind).toBe("cell");

        const pointerUpEvent = new PointerEvent("pointerup", pointerInit);
        canvas.dispatchEvent(pointerUpEvent);
        await nextTick();

        expect(onMouseUp).toHaveBeenCalledTimes(1);
        const [args, isOutside] = onMouseUp.mock.calls[0];
        expect(args.kind).toBe("cell");
        expect(isOutside).toBe(false);
    });

    it("invokes context menu callback with prevent handler", async () => {
        const preventSpy = vi.fn();
        const onContextMenu = vi.fn((args: GridMouseEventArgs, prevent: () => void) => {
            expect(args.kind).toBe("cell");
            prevent();
        });

        const wrapper = mount(DataGrid, {
            props: {
                width: 360,
                height: 200,
                rows: 8,
                columns,
                onContextMenu,
            },
        });

        const canvas = wrapper.get("canvas").element as HTMLCanvasElement;
        stubCanvasRect(canvas, 360, 164);

        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 60,
        });
        event.preventDefault = preventSpy;

        canvas.dispatchEvent(event);
        await nextTick();

        expect(onContextMenu).toHaveBeenCalledTimes(1);
        expect(preventSpy).toHaveBeenCalledTimes(1);
    });
});
