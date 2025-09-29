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

export const KeyboardEvents: Story = {
    name: "Keyboard events",
    args: {
        columns,
        freezeColumns: 1,
    },
    render: args => ({
        components: { DataGrid },
        setup() {
            // 使用一个初始选中单元格，便于从 GridKeyEventArgs 解析 location/bounds
            const selection = ref<GridSelection>({
                current: {
                    cell: [1, 1],
                    range: { x: 1, y: 1, width: 1, height: 1 },
                    rangeStack: [],
                },
                columns: CompactSelection.fromSingleSelection(1),
                rows: CompactSelection.fromSingleSelection(1),
            });

            const lastEvent = ref("按下键盘以测试键盘事件");

            // 交互控制：是否取消或停止传播键盘事件
            const cancelKeyDown = ref(false);
            const stopPropKeyDown = ref(false);
            const cancelKeyUp = ref(false);
            const stopPropKeyUp = ref(false);

            // 键盘按下事件处理：根据开关执行取消与停止传播
            const onKeyDown = (evt: import("../../internal/data-grid/event-args.js").GridKeyEventArgs) => {
                try {
                    if (cancelKeyDown.value) {
                        // 调用取消逻辑，避免默认处理
                        evt.cancel();
                    }
                    if (stopPropKeyDown.value) {
                        // 停止事件传播，避免上层处理
                        evt.stopPropagation();
                    }
                    const loc = evt.location ? `(${evt.location[0]}, ${evt.location[1]})` : "-";
                    const code = typeof evt.keyCode === "number" ? evt.keyCode : `${evt.keyCode}`;
                    const flags = [
                        cancelKeyDown.value ? "canceled" : null,
                        stopPropKeyDown.value ? "stopped" : null,
                    ].filter(Boolean).join(", ");
                    lastEvent.value = `KeyDown: key=${evt.key} code=${code} location=${loc}${flags ? ` [${flags}]` : ""}`;
                } catch (error) {
                    console.error("KeyboardEvents story onKeyDown error:", error);
                }
            };

            // 键盘抬起事件处理：根据开关执行取消与停止传播
            const onKeyUp = (evt: import("../../internal/data-grid/event-args.js").GridKeyEventArgs) => {
                try {
                    if (cancelKeyUp.value) {
                        evt.cancel();
                    }
                    if (stopPropKeyUp.value) {
                        evt.stopPropagation();
                    }
                    const loc = evt.location ? `(${evt.location[0]}, ${evt.location[1]})` : "-";
                    const code = typeof evt.keyCode === "number" ? evt.keyCode : `${evt.keyCode}`;
                    const flags = [
                        cancelKeyUp.value ? "canceled" : null,
                        stopPropKeyUp.value ? "stopped" : null,
                    ].filter(Boolean).join(", ");
                    lastEvent.value = `KeyUp: key=${evt.key} code=${code} location=${loc}${flags ? ` [${flags}]` : ""}`;
                } catch (error) {
                    console.error("KeyboardEvents story onKeyUp error:", error);
                }
            };

            return { args, selection, lastEvent, onKeyDown, onKeyUp, cancelKeyDown, stopPropKeyDown, cancelKeyUp, stopPropKeyUp };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <DataGrid
                    v-bind="args"
                    :selection="selection"
                    :onKeyDown="onKeyDown"
                    :onKeyUp="onKeyUp"
                />
                <div style="font-size: 0.85rem; color: #475569;">
                    {{ lastEvent }}
                </div>
                <div style="display: flex; gap: 12px; align-items: center; font-size: 0.85rem; color: #334155;">
                    <label><input type="checkbox" v-model="cancelKeyDown" /> 取消 KeyDown</label>
                    <label><input type="checkbox" v-model="stopPropKeyDown" /> 停止传播 KeyDown</label>
                    <span style="color:#94a3b8;">|</span>
                    <label><input type="checkbox" v-model="cancelKeyUp" /> 取消 KeyUp</label>
                    <label><input type="checkbox" v-model="stopPropKeyUp" /> 停止传播 KeyUp</label>
                </div>
                <div style="font-size: 0.8rem; color: #64748b;">
                    提示：点击上方网格以获取焦点（tabindex=0），然后使用方向键或其他键进行测试。可使用上方开关验证取消与停止传播效果。
                </div>
            </div>
        `,
    }),
};
