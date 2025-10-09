import { h } from "vue";
import MarkdownOverlayEditor from "../internal/data-grid-overlay-editor/private/MarkdownOverlayEditor.vue";
import { drawTextCell, prepTextCell } from "../internal/data-grid/render/data-grid-lib.js";
import { GridCellKind, type MarkdownCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

// Vue component for markdown cell overlay editor
const MarkdownOverlayEditorComponent = {
    name: "MarkdownOverlayEditorComponent",
    props: {
        onFinish: {
            type: Function,
            default: () => {}
        },
        targetRect: {
            type: Object,
            default: () => ({})
        },
        value: {
            type: Object,
            default: () => ({})
        },
        validatedSelection: {
            type: Object,
            default: () => ({})
        },
        onChange: {
            type: Function,
            default: () => {}
        },
        forceEditMode: {
            type: Boolean,
            default: false
        },
        createNode: {
            type: Function,
            default: () => {}
        }
    },
    setup(props: any) {
        return () => h(MarkdownOverlayEditor, {
            onFinish: props.onFinish,
            targetRect: props.targetRect,
            value: props.value,
            validatedSelection: props.validatedSelection,
            onChange: props.onChange,
            forceEditMode: props.forceEditMode,
            createNode: props.createNode
        });
    }
};

export const markdownCellRenderer: InternalCellRenderer<MarkdownCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Markdown,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: prepTextCell,
    measure: (ctx, cell, t) => {
        const firstLine = cell.data.split("\n")[0];
        return ctx.measureText(firstLine).width + 2 * t.cellHorizontalPadding;
    },
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign),
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: () => {
        return {
            editor: (props: any) => {
                const { onChange, value, target, onFinishedEditing, markdownDivCreateNode, forceEditMode, validatedSelection } = props;
                return h(MarkdownOverlayEditorComponent, {
                    onFinish: onFinishedEditing,
                    targetRect: target,
                    value: value,
                    validatedSelection: validatedSelection,
                    onChange: (e: any) => {
                        onChange({
                            ...value,
                            data: e.target.value,
                        });
                    },
                    forceEditMode: forceEditMode,
                    createNode: markdownDivCreateNode
                });
            }
        };
    },
    onPaste: (toPaste, cell) => (toPaste === cell.data ? undefined : { ...cell, data: toPaste }),
};