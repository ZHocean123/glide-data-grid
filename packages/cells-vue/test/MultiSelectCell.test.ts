import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { MultiSelectCellComponent } from "../src/index";

describe("MultiSelectCell", () => {
    it("renders with selected values", () => {
        const { getAllByText } = render(MultiSelectCellComponent, {
            props: {
                cell: {
                    values: ["option1", "option2"],
                    options: [
                        { value: "option1", label: "Option 1" },
                        { value: "option2", label: "Option 2" },
                        { value: "option3", label: "Option 3" }
                    ]
                },
                width: 200,
                height: 30
            }
        });

        expect(getAllByText("Option 1")).toBeTruthy();
        expect(getAllByText("Option 2")).toBeTruthy();
    });

    it("renders with empty values", () => {
        const { container } = render(MultiSelectCellComponent, {
            props: {
                cell: {
                    values: [],
                    options: [
                        { value: "option1", label: "Option 1" },
                        { value: "option2", label: "Option 2" }
                    ]
                },
                width: 200,
                height: 30
            }
        });

        expect(container.querySelector(".bubble")).toBeNull();
    });
});