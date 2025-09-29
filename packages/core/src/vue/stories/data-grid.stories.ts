import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";
import DataGrid from "../components/DataGrid.vue";
import {
    CompactSelection,
    type GridSelection,
    type InnerGridColumn,
    type Item,
} from "../../internal/data-grid/data-grid-types.js";
import type { GridMouseEventArgs } from "../../internal/data-grid/event-args.js";

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

export const PointerEvents: Story = {
    name: "Pointer events",
    args: {
        columns,
        freezeColumns: 1,
    },
    render: args => ({
        components: { DataGrid },
        setup() {
            const selection = ref<GridSelection>({
                current: undefined,
                columns: CompactSelection.empty(),
                rows: CompactSelection.empty(),
            });
            const lastEvent = ref("Interact with the grid");

            const createSelection = (cell: Item): GridSelection => ({
                current: {
                    cell,
                    range: { x: cell[0], y: cell[1], width: 1, height: 1 },
                    rangeStack: [],
                },
                columns: CompactSelection.fromSingleSelection(cell[0]),
                rows: CompactSelection.fromSingleSelection(cell[1]),
            });

            const handleMouseDown = (evt: GridMouseEventArgs) => {
                if (evt.kind === "cell") {
                    selection.value = createSelection(evt.location);
                    lastEvent.value = `Down (${evt.location[0]}, ${evt.location[1]})`;
                } else {
                    lastEvent.value = `Down ${evt.kind}`;
                }
            };

            const handleMouseUp = (evt: GridMouseEventArgs, isOutside: boolean) => {
                const scope = isOutside ? "outside" : "inside";
                if (evt.kind === "cell") {
                    lastEvent.value = `Up (${evt.location[0]}, ${evt.location[1]}) ${scope}`;
                } else {
                    lastEvent.value = `Up ${evt.kind} ${scope}`;
                }
            };

            const handleContextMenu = (evt: GridMouseEventArgs, prevent: () => void) => {
                prevent();
                if (evt.kind === "cell") {
                    lastEvent.value = `Context menu (${evt.location[0]}, ${evt.location[1]})`;
                } else {
                    lastEvent.value = `Context menu ${evt.kind}`;
                }
            };

            return {
                args,
                selection,
                lastEvent,
                handleMouseDown,
                handleMouseUp,
                handleContextMenu,
            };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <DataGrid
                    v-bind="args"
                    :selection="selection"
                    :onMouseDown="handleMouseDown"
                    :onMouseUp="handleMouseUp"
                    :onContextMenu="handleContextMenu"
                />
                <div style="font-size: 0.85rem; color: #475569;">
                    {{ lastEvent }}
                </div>
            </div>
        `,
    }),
};
