import { ref } from "vue";
import { DataGrid } from "@glideapps/glide-data-grid-vue";
import {
    useStaticDataSource,
    useColumnSort,
    useCollapsingGroups,
    useMoveableColumns
} from "../src/index";

export default {
    title: "Extra Packages/Source Vue",
    parameters: {
        layout: "centered",
    },
};

export const StaticDataSource = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "ID", width: 80 },
                { title: "Name", width: 150 },
                { title: "Value", width: 100 }
            ]);

            const initialData = ref([
                { id: 1, name: "Item 1", value: 100 },
                { id: 2, name: "Item 2", value: 200 },
                { id: 3, name: "Item 3", value: 300 },
                { id: 4, name: "Item 4", value: 400 },
                { id: 5, name: "Item 5", value: 500 }
            ]);

            const dataSource = useStaticDataSource({
                initialRows: initialData.value
            });

            const getCellContent = ([col, row]: [number, number]) => {
                const rowData = dataSource.rows.value[row];
                if (!rowData) {
                    return {
                        kind: "text" as const,
                        data: "",
                        displayData: "",
                        allowOverlay: false
                    };
                }

                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: rowData.id.toString(),
                        displayData: rowData.id.toString(),
                        allowOverlay: false
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: rowData.name,
                        displayData: rowData.name,
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: rowData.value.toString(),
                        displayData: rowData.value.toString(),
                        allowOverlay: true
                    };
                }
            };

            const addRow = () => {
                const newId = dataSource.rows.value.length + 1;
                const newRow = {
                    id: newId,
                    name: `Item ${newId}`,
                    value: newId * 100
                };
                dataSource.replaceRows([...dataSource.rows.value, newRow]);
            };

            return { columns, dataSource, getCellContent, addRow };
        },
        template: `
            <div style="width: 400px; height: 300px; display: flex; flex-direction: column;">
                <div style="margin-bottom: 10px;">
                    <button @click="addRow" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Add Row
                    </button>
                </div>
                <div style="flex: 1; border: 1px solid #ccc;">
                    <DataGrid
                        :columns="columns"
                        :rows="dataSource.rowCount"
                        :getCellContent="getCellContent"
                    />
                </div>
            </div>
        `
    })
};

export const ColumnSorting = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "Name", width: 150 },
                { title: "Age", width: 100 },
                { title: "Score", width: 100 }
            ]);

            const rows = ref(20);

            const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
            const getCellContent = ([col, row]: [number, number]) => {
                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: names[row % names.length],
                        displayData: names[row % names.length],
                        allowOverlay: true
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: `${20 + (row % 30)}`,
                        displayData: `${20 + (row % 30)}`,
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: `${(row % 100) + 50}`,
                        displayData: `${(row % 100) + 50}`,
                        allowOverlay: true
                    };
                }
            };

            const sortState = ref();

            const sortArgs = useColumnSort({
                columns: columns.value,
                getCellContent,
                rows: rows.value,
                sort: sortState.value
            });

            const onHeaderClick = (index: number) => {
                if (sortState.value?.column === columns.value[index]) {
                    sortState.value = {
                        ...sortState.value,
                        direction: sortState.value.direction === "asc" ? "desc" : "asc"
                    };
                } else {
                    sortState.value = {
                        column: columns.value[index],
                        direction: "asc",
                        mode: "smart"
                    };
                }
            };

            return { columns, rows, getCellContent, sortArgs, onHeaderClick };
        },
        template: `
            <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                    :onHeaderClicked="onHeaderClick"
                />
            </div>
        `
    })
};

export const MoveableColumns = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "First", width: 100 },
                { title: "Second", width: 100 },
                { title: "Third", width: 100 },
                { title: "Fourth", width: 100 }
            ]);

            const rows = ref(15);

            const getCellContent = ([col, row]: [number, number]) => {
                return {
                    kind: "text" as const,
                    data: `Cell ${col}-${row}`,
                    displayData: `Cell ${col}-${row}`,
                    allowOverlay: true
                };
            };

            const moveArgs = useMoveableColumns({
                columns: columns.value,
                getCellContent
            });

            const onColumnMoved = (startIndex: number, endIndex: number) => {
                const newCols = [...columns.value];
                const [moved] = newCols.splice(startIndex, 1);
                newCols.splice(endIndex, 0, moved);
                columns.value = newCols;
            };

            return { columns, rows, getCellContent, moveArgs, onColumnMoved };
        },
        template: `
            <div style="width: 450px; height: 300px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                    :onColumnMoved="onColumnMoved"
                />
            </div>
        `
    })
};

export const CollapsingGroups = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "Name", width: 120, group: "Personal Info" },
                { title: "Age", width: 80, group: "Personal Info" },
                { title: "Department", width: 120, group: "Work Info" },
                { title: "Salary", width: 100, group: "Work Info" },
                { title: "Location", width: 120, group: "Work Info" }
            ]);

            const rows = ref(10);

            const names = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
            const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];
            const locations = ["New York", "San Francisco", "London", "Tokyo", "Sydney"];

            const getCellContent = ([col, row]: [number, number]) => {
                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: names[row % names.length],
                        displayData: names[row % names.length],
                        allowOverlay: true
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: `${25 + (row % 20)}`,
                        displayData: `${25 + (row % 20)}`,
                        allowOverlay: true
                    };
                } else if (col === 2) {
                    return {
                        kind: "text" as const,
                        data: departments[row % departments.length],
                        displayData: departments[row % departments.length],
                        allowOverlay: true
                    };
                } else if (col === 3) {
                    return {
                        kind: "text" as const,
                        data: `$${(row + 1) * 5000}`,
                        displayData: `$${(row + 1) * 5000}`,
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: locations[row % locations.length],
                        displayData: locations[row % locations.length],
                        allowOverlay: true
                    };
                }
            };

            const collapseArgs = useCollapsingGroups({
                columns: columns.value,
                theme: {},
                freezeColumns: 0
            });

            return { columns, rows, getCellContent, collapseArgs };
        },
        template: `
            <div style="width: 600px; height: 350px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                />
            </div>
        `
    })
};