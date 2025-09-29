import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";
import { useGridGeometry } from "../../src/vue/composables/useGridGeometry.js";
import type { MappedGridColumn } from "../../src/shared/mapped-columns.js";

const mappedColumns: MappedGridColumn[] = [
    {
        title: "ID",
        width: 80,
        sourceIndex: 0,
        sticky: true,
        group: undefined,
        grow: undefined,
        hasMenu: undefined,
        icon: undefined,
        menuIcon: undefined,
        overlayIcon: undefined,
        indicatorIcon: undefined,
        style: undefined,
        themeOverride: undefined,
        trailingRowOptions: undefined,
        growOffset: undefined,
        id: undefined,
        rowMarker: undefined,
        rowMarkerChecked: undefined,
        headerRowMarkerTheme: undefined,
        headerRowMarkerAlwaysVisible: undefined,
        headerRowMarkerDisabled: undefined,
    },
    {
        title: "Name",
        width: 120,
        sourceIndex: 1,
        sticky: false,
        group: undefined,
        grow: undefined,
        hasMenu: undefined,
        icon: undefined,
        menuIcon: undefined,
        overlayIcon: undefined,
        indicatorIcon: undefined,
        style: undefined,
        themeOverride: undefined,
        trailingRowOptions: undefined,
        growOffset: undefined,
        id: undefined,
        rowMarker: undefined,
        rowMarkerChecked: undefined,
        headerRowMarkerTheme: undefined,
        headerRowMarkerAlwaysVisible: undefined,
        headerRowMarkerDisabled: undefined,
    },
];

describe("useGridGeometry", () => {
    it("updates bounds when inputs are reactive", async () => {
        const freezeColumns = ref(1);
        const freezeTrailingRows = ref(0);
        const groupHeaderHeight = ref(0);
        const totalHeaderHeight = ref(40);
        const rowHeight = ref<number | ((index: number) => number)>(24);

        const { boundsForCell } = useGridGeometry({
            mappedColumns: ref(mappedColumns),
            freezeColumns,
            freezeTrailingRows,
            groupHeaderHeight,
            totalHeaderHeight,
            rowHeight,
        });

        const initial = boundsForCell(0, -1, 400, 300, 0, 0, 0, 0, 10);
        expect(initial.x).toBe(0);
        expect(initial.width).toBe(81);

        freezeColumns.value = 0;
        groupHeaderHeight.value = 20;
        totalHeaderHeight.value = 60;
        await nextTick();

        const updated = boundsForCell(1, -2, 400, 300, 0, 0, 0, 0, 10);
        expect(updated.y).toBe(0);
        expect(updated.height).toBe(20);
        expect(updated.width).toBe(121);
    });
});
