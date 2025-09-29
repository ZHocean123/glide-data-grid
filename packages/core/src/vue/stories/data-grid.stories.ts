import type { Meta, StoryObj } from "@storybook/vue3";
import DataGrid from "../components/DataGrid.vue";
import type { InnerGridColumn } from "../../internal/data-grid/data-grid-types.js";

const meta: Meta<typeof DataGrid> = {
    title: "Vue/DataGrid",
    component: DataGrid,
    args: {
        width: 600,
        height: 320,
        rows: 100,
    },
};

export default meta;

const columns: InnerGridColumn[] = [
    { title: "ID", width: 80 },
    { title: "Project", width: 180 },
    { title: "Owner", width: 140 },
    { title: "Status", width: 120 },
];

export const Basic: StoryObj<typeof DataGrid> = {
    args: {
        columns,
        freezeColumns: 1,
        headerHeight: 44,
        groupHeaderHeight: 32,
        enableGroups: true,
    },
};

export const EmptyColumns: StoryObj<typeof DataGrid> = {
    args: {
        columns: [],
    },
};
