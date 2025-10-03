import { describe, expect, it } from "vitest";
import { useStaticDataSource } from "../src/index.js";

describe("useStaticDataSource", () => {
    it("tracks row count and allows replacement", () => {
        const source = useStaticDataSource({
            initialRows: [
                { id: 1 },
                { id: 2 }
            ]
        });

        expect(source.rowCount.value).toBe(2);
        expect(source.rows.value[0]).toStrictEqual({ id: 1 });

        source.replaceRows([
            { id: 3 }
        ]);

        expect(source.rowCount.value).toBe(1);
        expect(source.rows.value[0]).toStrictEqual({ id: 3 });
    });
});
