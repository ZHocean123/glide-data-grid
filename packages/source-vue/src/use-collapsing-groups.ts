import { ref, computed } from "vue";

// Simplified types for collapsing groups
interface GridColumn {
    title: string;
    group?: string;
    width?: number;
    themeOverride?: any;
}

interface GridSelection {
    current?: {
        cell: [number, number];
        range?: any;
        rangeStack?: any[];
    };
    columns?: any;
    rows?: any;
}

interface Props {
    columns: readonly GridColumn[];
    onGroupHeaderClicked?: (index: number, event: any) => void;
    onGridSelectionChange?: (selection: GridSelection) => void;
    getGroupDetails?: (groupName: string) => any;
    gridSelection?: GridSelection;
    freezeColumns?: number;
    theme: any;
}

interface Result {
    columns: readonly GridColumn[];
    onGroupHeaderClicked: (index: number, event: any) => void;
    onGridSelectionChange: (selection: GridSelection) => void;
    getGroupDetails: (groupName: string) => any;
    gridSelection: GridSelection | undefined;
}

export function useCollapsingGroups(props: Props): Result {
    const collapsed = ref<readonly string[]>([]);
    const gridSelectionInner = ref<GridSelection | undefined>(undefined);

    const {
        columns: columnsIn,
        onGroupHeaderClicked: onGroupHeaderClickedIn,
        onGridSelectionChange: onGridSelectionChangeIn,
        getGroupDetails: getGroupDetailsIn,
        gridSelection: gridSelectionIn,
        freezeColumns = 0,
        theme,
    } = props;

    const gridSelection = computed(() => gridSelectionIn ?? gridSelectionInner.value);

    const spans = computed(() => {
        const result: [number, number][] = [];
        let current: [number, number] = [-1, -1];
        let lastGroup: string | undefined;
        for (let i = freezeColumns; i < columnsIn.length; i++) {
            const c = columnsIn[i];
            const group = c.group ?? ";
            const isCollapsed = collapsed.value.includes(group);

            if (lastGroup !== group && current[0] !== -1) {
                result.push(current);
                current = [-1, -1];
            }

            if (isCollapsed && current[0] !== -1) {
                current[1] += 1;
            } else if (isCollapsed) {
                current = [i, 1];
            } else if (current[0] !== -1) {
                result.push(current);
                current = [-1, -1];
            }
            lastGroup = group;
        }
        if (current[0] !== -1) result.push(current);
        return result;
    });

    const columns = computed(() => {
        if (spans.value.length === 0) return columnsIn;
        return columnsIn.map((c: GridColumn, index: number) => {
            for (const [start, length] of spans.value) {
                if (index >= start && index < start + length) {
                    let width = 8;
                    if (index === start + length - 1) {
                        width = 36;
                    }

                    return {
                        ...c,
                        width,
                        themeOverride: { bgCell: theme.bgCellMedium },
                    };
                }
            }
            return c;
        });
    });

    const onGroupHeaderClicked = (index: number, a: any) => {
        onGroupHeaderClickedIn?.(index, a);

        const group = columns.value[index]?.group ?? ";
        if (group === "") return;
        a.preventDefault();
        collapsed.value = collapsed.value.includes(group)
            ? collapsed.value.filter(x => x !== group)
            : [...collapsed.value, group];
    };

    const onGridSelectionChange = (s: GridSelection) => {
        if (s.current !== undefined) {
            const col = s.current.cell[0];
            const column = columns.value[col];
            collapsed.value = collapsed.value.includes(column?.group ?? "")
                ? collapsed.value.filter(g => g !== column.group)
                : collapsed.value;
        }
        if (onGridSelectionChangeIn !== undefined) {
            onGridSelectionChangeIn(s);
        } else {
            gridSelectionInner.value = s;
        }
    };

    const getGroupDetails = (group: string) => {
        const result = getGroupDetailsIn?.(group);

        return {
            ...result,
            name: group,
            overrideTheme: collapsed.value.includes(group ?? "")
                ? {
                      bgHeader: theme.bgHeaderHasFocus,
                  }
                : undefined,
        };
    };

    return {
        columns: columns.value,
        onGroupHeaderClicked,
        onGridSelectionChange,
        getGroupDetails,
        gridSelection: gridSelection.value,
    };
}