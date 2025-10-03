import { fireEvent, render } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { BooleanCell } from "../src/index.js";

describe("BooleanCell", () => {
    it("emits toggle with inverse value", async () => {
        const toggle = vi.fn();
        const { getByRole, emitted } = render(BooleanCell, {
            props: {
                value: true
            },
            attrs: {
                onToggle: toggle
            }
        });

        await fireEvent.click(getByRole("checkbox"));

        expect(toggle).toHaveBeenCalledWith(false);
        const events = emitted().toggle ?? [];
        expect(events[0]).toEqual([false]);
    });
});
