import { ref } from "vue";
import { DataGrid } from "../src/index";

export default {
    title: "Extra Packages/Core Vue",
    parameters: {
        layout: "centered",
    },
};

export const BasicGrid = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "Name", width: 150 },
                { title: "Age", width: 100 },
                { title: "Email", width: 200 }
            ]);

            const rows = ref(100);

            const getCellContent = ([col, row]: [number, number]) => {
                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: `Name ${row}`,
                        displayData: `Name ${row}`,
                        allowOverlay: true
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: `${row + 20}`,
                        displayData: `${row + 20}`,
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: `user${row}@example.com`,
                        displayData: `user${row}@example.com`,
                        allowOverlay: true
                    };
                }
            };

            return { columns, rows, getCellContent };
        },
        template: `
            <div style="width: 500px; height: 400px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                />
            </div>
        `
    })
};

export const EditableGrid = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "Task", width: 200 },
                { title: "Status", width: 100 },
                { title: "Priority", width: 100 }
            ]);

            const rows = ref(50);

            const cellData = ref<Record<string, string>>({});

            const getCellContent = ([col, row]: [number, number]) => {
                const key = `${col},${row}`;
                if (!cellData.value[key]) {
                    if (col === 0) cellData.value[key] = `Task ${row}`;
                    else if (col === 1) cellData.value[key] = "Pending";
                    else cellData.value[key] = "Medium";
                }

                return {
                    kind: "text" as const,
                    data: cellData.value[key],
                    displayData: cellData.value[key],
                    allowOverlay: true
                };
            };

            const onCellEdited = ([col, row]: [number, number], newValue: any) => {
                const key = `${col},${row}`;
                if (newValue.kind === "text") {
                    cellData.value[key] = newValue.data;
                }
            };

            return { columns, rows, getCellContent, onCellEdited };
        },
        template: `
            <div style="width: 450px; height: 300px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                    :onCellEdited="onCellEdited"
                />
            </div>
        `
    })
};

export const GridWithSelection = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "ID", width: 80 },
                { title: "Product", width: 150 },
                { title: "Price", width: 100 },
                { title: "Stock", width: 80 }
            ]);

            const rows = ref(30);
            const gridSelection = ref();

            const getCellContent = ([col, row]: [number, number]) => {
                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: `ID-${row}`,
                        displayData: `ID-${row}`,
                        allowOverlay: false
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: `Product ${row}`,
                        displayData: `Product ${row}`,
                        allowOverlay: true
                    };
                } else if (col === 2) {
                    return {
                        kind: "text" as const,
                        data: `$${(row + 1) * 10}`,
                        displayData: `$${(row + 1) * 10}`,
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: `${100 - row}`,
                        displayData: `${100 - row}`,
                        allowOverlay: true
                    };
                }
            };

            const onGridSelectionChange = (newSelection: any) => {
                gridSelection.value = newSelection;
            };

            return { columns, rows, gridSelection, getCellContent, onGridSelectionChange };
        },
        template: `
            <div style="width: 450px; height: 350px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                    :gridSelection="gridSelection"
                    :onGridSelectionChange="onGridSelectionChange"
                />
            </div>
        `
    })
};

export const ResizableColumns = {
    render: () => ({
        components: { DataGrid },
        setup() {
            const columns = ref([
                { title: "First Name", width: 120 },
                { title: "Last Name", width: 120 },
                { title: "Department", width: 150 },
                { title: "Role", width: 120 }
            ]);

            const rows = ref(25);

            const getCellContent = ([col, row]: [number, number]) => {
                const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
                const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones"];
                const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];
                const roles = ["Developer", "Manager", "Analyst", "Designer", "Tester"];

                if (col === 0) {
                    return {
                        kind: "text" as const,
                        data: firstNames[row % firstNames.length],
                        displayData: firstNames[row % firstNames.length],
                        allowOverlay: true
                    };
                } else if (col === 1) {
                    return {
                        kind: "text" as const,
                        data: lastNames[row % lastNames.length],
                        displayData: lastNames[row % lastNames.length],
                        allowOverlay: true
                    };
                } else if (col === 2) {
                    return {
                        kind: "text" as const,
                        data: departments[row % departments.length],
                        displayData: departments[row % departments.length],
                        allowOverlay: true
                    };
                } else {
                    return {
                        kind: "text" as const,
                        data: roles[row % roles.length],
                        displayData: roles[row % roles.length],
                        allowOverlay: true
                    };
                }
            };

            const onColumnResize = (column: any, newSize: number) => {
                const index = columns.value.findIndex(col => col.title === column.title);
                if (index !== -1) {
                    const newCols = [...columns.value];
                    newCols[index] = { ...newCols[index], width: newSize };
                    columns.value = newCols;
                }
            };

            return { columns, rows, getCellContent, onColumnResize };
        },
        template: `
            <div style="width: 550px; height: 400px; border: 1px solid #ccc;">
                <DataGrid
                    :columns="columns"
                    :rows="rows"
                    :getCellContent="getCellContent"
                    :onColumnResize="onColumnResize"
                />
            </div>
        `
    })
};