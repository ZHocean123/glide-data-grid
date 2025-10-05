import { fireEvent, render } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import { StarCellComponent } from "../src/index";

describe("StarCell", () => {
    it("renders correct number of stars", () => {
        const { getAllByRole } = render(StarCellComponent, {
            props: {
                cell: {
                    rating: 3
                }
            }
        });

        const stars = getAllByRole("button");
        expect(stars).toHaveLength(5);
    });

    it("emits update with new rating", async () => {
        const update = vi.fn();
        const { getAllByRole, emitted } = render(StarCellComponent, {
            props: {
                cell: {
                    rating: 2
                }
            },
            attrs: {
                onUpdate: update
            }
        });

        const stars = getAllByRole("button");
        await fireEvent.click(stars[3]); // Click 4th star (rating 4)

        expect(update).toHaveBeenCalledWith({
            rating: 4
        });
        const events = emitted().update ?? [];
        expect(events[0][0]).toMatchObject({
            rating: 4
        });
    });
});