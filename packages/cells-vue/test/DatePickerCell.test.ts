import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { DatePickerCellComponent } from "../src/index";

describe("DatePickerCell", () => {
    it("renders date picker cell", () => {
        const testDate = new Date("2023-01-15");
        const { getByText } = render(DatePickerCellComponent, {
            props: {
                cell: {
                    data: testDate
                },
                width: 100,
                height: 30
            }
        });

        expect(getByText("Date picker cell")).toBeTruthy();
    });

    it("renders with required props", () => {
        const testDate = new Date("2023-01-15");
        const { getByText } = render(DatePickerCellComponent, {
            props: {
                cell: {
                    data: testDate
                },
                width: 100,
                height: 30
            }
        });

        expect(getByText("Date picker cell")).toBeTruthy();
    });
});