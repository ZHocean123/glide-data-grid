/**
 * Vue版本的选择行为组合式函数
 * 与React版本保持一致，但使用Vue的响应式系统
 */

import { type Ref } from "vue";
import { type GridSelection, CompactSelection, type Slice, type SelectionBlending, type SelectionTrigger } from "./data-grid-types.js";

type SetCallback = (newVal: GridSelection, expand: boolean) => void;

export function useSelectionBehavior(
    gridSelection: Ref<GridSelection>,
    setGridSelection: SetCallback,
    rangeBehavior: SelectionBlending,
    columnBehavior: SelectionBlending,
    rowBehavior: SelectionBlending,
    rangeSelect: "none" | "cell" | "rect" | "multi-cell" | "multi-rect",
    rangeSelectionColumnSpanning: boolean
) {
    // if append is true, the current range will be added to the rangeStack
    const setCurrent = (
        value: Pick<NonNullable<GridSelection["current"]>, "cell" | "range"> | undefined,
        expand: boolean,
        append: boolean,
        trigger: SelectionTrigger
    ) => {
        if ((rangeSelect === "cell" || rangeSelect === "multi-cell") && value !== undefined) {
            value = {
                ...value,
                range: {
                    x: value.cell[0],
                    y: value.cell[1],
                    width: 1,
                    height: 1,
                },
            };
        }

        if (!rangeSelectionColumnSpanning && value !== undefined && value.range.width > 1) {
            value = {
                ...value,
                range: {
                    ...value.range,
                    width: 1,
                    x: value.cell[0],
                },
            };
        }

        const rangeMixable =
            (rangeBehavior === "mixed" && (append || trigger === "drag")) || rangeBehavior === "additive";
        const allowColumnCoSelect = (columnBehavior === "mixed" || columnBehavior === "additive") && rangeMixable;
        const allowRowCoSelect = (rowBehavior === "mixed" || rowBehavior === "additive") && rangeMixable;
        
        let newVal: GridSelection = {
            current:
                value === undefined
                    ? undefined
                    : {
                          ...value,
                          rangeStack: trigger === "drag" ? (gridSelection.value.current?.rangeStack ?? []) : [],
                      },
            columns: allowColumnCoSelect ? gridSelection.value.columns : CompactSelection.empty(),
            rows: allowRowCoSelect ? gridSelection.value.rows : CompactSelection.empty(),
        };

        const addLastRange = append && (rangeSelect === "multi-rect" || rangeSelect === "multi-cell");
        if (addLastRange && newVal.current !== undefined && gridSelection.value.current !== undefined) {
            newVal = {
                ...newVal,
                current: {
                    ...newVal.current,
                    rangeStack: [...gridSelection.value.current.rangeStack, gridSelection.value.current.range],
                },
            };
        }
        setGridSelection(newVal, expand);
    };

    const setSelectedRows = (
        newRows: CompactSelection | undefined,
        append: Slice | number | undefined,
        allowMixed: boolean
    ) => {
        newRows = newRows ?? gridSelection.value.rows ?? CompactSelection.empty();
        if (append !== undefined && newRows) {
            newRows = newRows.add(append);
        }
        let newVal: GridSelection;
        if (rowBehavior === "exclusive" && newRows && newRows.length > 0) {
            newVal = {
                current: undefined,
                columns: CompactSelection.empty(),
                rows: newRows,
            };
        } else {
            const rangeMixed = (allowMixed && rangeBehavior === "mixed") || rangeBehavior === "additive";
            const columnMixed = (allowMixed && columnBehavior === "mixed") || columnBehavior === "additive";
            const current = !rangeMixed ? undefined : gridSelection.value.current;
            newVal = {
                current,
                columns: columnMixed ? gridSelection.value.columns : CompactSelection.empty(),
                rows: newRows ?? CompactSelection.empty(),
            };
        }
        setGridSelection(newVal, false);
    };

    const setSelectedColumns = (
        newCols: CompactSelection | undefined,
        append: number | Slice | undefined,
        allowMixed: boolean
    ) => {
        newCols = newCols ?? gridSelection.value.columns ?? CompactSelection.empty();
        if (append !== undefined && newCols) {
            newCols = newCols.add(append);
        }
        let newVal: GridSelection;
        if (columnBehavior === "exclusive" && newCols && newCols.length > 0) {
            newVal = {
                current: undefined,
                rows: CompactSelection.empty(),
                columns: newCols,
            };
        } else {
            const rangeMixed = (allowMixed && rangeBehavior === "mixed") || rangeBehavior === "additive";
            const rowMixed = (allowMixed && rowBehavior === "mixed") || rowBehavior === "additive";
            const current = !rangeMixed ? undefined : gridSelection.value.current;
            newVal = {
                current,
                rows: rowMixed ? gridSelection.value.rows : CompactSelection.empty(),
                columns: newCols ?? CompactSelection.empty(),
            };
        }
        setGridSelection(newVal, false);
    };

    return [setCurrent, setSelectedRows, setSelectedColumns] as const;
}