import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";
import { useMappedColumns } from "../../src/vue/composables/useMappedColumns.js";
import type { InnerGridColumn } from "../../src/internal/data-grid/data-grid-types.js";

function makeColumns(): InnerGridColumn[] {
    return [
        { title: "ID", width: 80 },
        { title: "Name", width: 140 },
        { title: "Value", width: 120 },
    ];
}

describe("useMappedColumns", () => {
    it("maps columns and updates when freezeColumns changes", async () => {
        const columns = ref(makeColumns());
        const freezeColumns = ref(1);

        const { mappedColumns, stickyWidth } = useMappedColumns({ columns, freezeColumns });

        expect(mappedColumns.value.map(c => c.sticky)).toEqual([true, false, false]);
        expect(stickyWidth.value).toBe(80);

        freezeColumns.value = 2;
        await nextTick();

        expect(mappedColumns.value.map(c => c.sticky)).toEqual([true, true, false]);
        expect(stickyWidth.value).toBe(220);
    });

    it("falls back to mapped columns when virtualization props are omitted", () => {
        const columns = ref(makeColumns());
        const freezeColumns = ref(0);

        const { mappedColumns, effectiveColumns } = useMappedColumns({ columns, freezeColumns });

        expect(effectiveColumns.value).toBe(mappedColumns.value);
    });

    it("computes effective columns for the current viewport", async () => {
        const columns = ref<InnerGridColumn[]>([
            { title: "ID", width: 80 },
            { title: "Name", width: 140 },
            { title: "Value", width: 120 },
            { title: "Status", width: 100 },
        ]);
        const freezeColumns = ref(0);
        const cellXOffset = ref(1);
        const viewportWidth = ref(220);

        const { effectiveColumns } = useMappedColumns({
            columns,
            freezeColumns,
            cellXOffset,
            viewportWidth,
        });

        expect(effectiveColumns.value.map(c => c.sourceIndex)).toEqual([1, 2]);

        cellXOffset.value = 2;
        await nextTick();

        expect(effectiveColumns.value.map(c => c.sourceIndex)).toEqual([2, 3]);
    });
});
