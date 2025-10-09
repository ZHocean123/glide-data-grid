import { h } from "vue";
import GrowingEntry from "../internal/data-grid-overlay-editor/private/GrowingEntry.vue";
import { drawTextCell, prepTextCell } from "../internal/data-grid/render/data-grid-lib.js";
import { GridCellKind, type RowIDCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

// Vue component for row ID cell overlay editor
const GrowingEntryComponent = {
    name: "GrowingEntryComponent",
    props: {
        highlight: {
            type: Boolean,
            default: false
        },
        autoFocus: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        value: {
            type: String,
            default: ""
        },
        validatedSelection: {
            type: Object,
            default: () => ({})
        },
        onChange: {
            type: Function,
            default: () => {}
        }
    },
    setup(props: any) {
        return () => h(GrowingEntry, {
            highlight: props.highlight,
            autoFocus: props.autoFocus,
            disabled: props.disabled,
            value: props.value,
            validatedSelection: props.validatedSelection,
            onChange: props.onChange
        });
    }
};

export const rowIDCellRenderer: InternalCellRenderer<RowIDCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.RowID,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: (a, b) => prepTextCell(a, b, a.theme.textLight),
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign),
    measure: (ctx, cell, theme) => ctx.measureText(cell.data).width + theme.cellHorizontalPadding * 2,
    provideEditor: () => {
        return {
            editor: (props: any) => {
                const { isHighlighted, onChange, value, validatedSelection } = props;
                return h(GrowingEntryComponent, {
                    highlight: isHighlighted,
                    autoFocus: value.readonly !== true,
                    disabled: value.readonly !== false,
                    value: value.data,
                    validatedSelection: validatedSelection,
                    onChange: (e: any) => {
                        onChange({
                            ...value,
                            data: e.target.value,
                        });
                    }
                });
            }
        };
    },
    onPaste: () => undefined,
};