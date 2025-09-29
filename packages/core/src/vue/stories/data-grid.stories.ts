import { Meta, StoryObj } from "@storybook/vue3";
import DataGrid from "../components/DataGrid.vue";
import type { InnerGridColumn } from "../../internal/data-grid/data-grid-types.js";

const meta: Meta<typeof DataGrid> = {
    title: "Vue/DataGrid",
    component: DataGrid,
    args: {
        width: 720,
        height: 360,
        rows: 100,
        headerHeight: 44,
    },
    argTypes: {
        freezeColumns: { control: { type: "number", min: 0, max: 4, step: 1 } },
        cellXOffset: { control: { type: "number", min: 0, max: 10, step: 1 } },
        translateX: { control: { type: "number", min: -200, max: 200, step: 10 } },
        translateY: { control: { type: "number", min: -200, max: 200, step: 10 } },
        enableGroups: { control: "boolean" },
        themeOverrides: { control: "object" },
    },
};

export default meta;

type Story = StoryObj<typeof DataGrid>;

const columns: InnerGridColumn[] = [
    { title: "ID", width: 80 },
    { title: "Project", width: 180 },
    { title: "Owner", width: 140 },
    { title: "Status", width: 120 },
];

export const Basic: Story = {
    args: {
        columns,
        freezeColumns: 1,
        groupHeaderHeight: 32,
        enableGroups: true,
    },
};

export const Virtualized: Story = {
    name: "Virtualized offset",
    args: {
        columns,
        freezeColumns: 1,
        cellXOffset: 1,
        translateX: -60,
        translateY: -20,
    },
};

export const EmptyColumns: Story = {
    args: {
        columns: [],
        rows: 0,
    },
};

export const CustomTheme: Story = {
    args: {
        columns,
        freezeColumns: 1,
        themeOverrides: {
            bgHeader: "#0f172a",
            textHeader: "#f8fafc",
            borderColor: "#1e293b",
        },
    },
};
