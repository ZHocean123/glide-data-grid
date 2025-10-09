<template>
  <div class="text-cell">
    <!-- Vue版本的文本单元格渲染器 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent } from 'vue';
import { drawTextCell, prepTextCell } from '../internal/data-grid/render/data-grid-lib.js';
import { GridCellKind, type TextCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';
import { drawEditHoverIndicator } from '../internal/data-grid/render/draw-edit-hover-indicator.js';

// Vue版本的GrowingEntry组件
const GrowingEntry = defineComponent({
  props: {
    style: {
      type: Object,
      default: () => ({})
    },
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
    altNewline: {
      type: Boolean,
      default: false
    },
    value: {
      type: String,
      default: ''
    },
    validatedSelection: {
      type: Object,
      default: undefined
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    
    const handleChange = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      emit('change', {
        target: {
          value: target.value
        }
      });
    };
    
    return () => h('textarea', {
      ref: textareaRef,
      style: props.style,
      class: {
        'growing-entry': true,
        'highlight': props.highlight,
        'disabled': props.disabled
      },
      value: props.value,
      disabled: props.disabled,
      autofocus: props.autoFocus,
      onInput: handleChange,
      onChange: handleChange
    });
  }
});

// Vue版本的文本单元格渲染器
export const textCellRenderer: InternalCellRenderer<any> = {
  getAccessibilityString: c => c.data?.toString() ?? "",
  kind: GridCellKind.Text,
  needsHover: textCell => textCell.hoverEffect === true,
  needsHoverPosition: false,
  drawPrep: prepTextCell,
  useLabel: true,
  draw: a => {
    const { cell, hoverAmount, hyperWrapping, ctx, rect, theme, overrideCursor } = a;
    const { displayData, contentAlign, hoverEffect, allowWrapping, hoverEffectTheme } = cell;
    const text = displayData ?? cell.data;
    if (hoverEffect === true && hoverAmount > 0) {
      drawEditHoverIndicator(ctx, theme, hoverEffectTheme, text, rect, hoverAmount, overrideCursor as any);
    }
    drawTextCell(a, text, contentAlign, allowWrapping, hyperWrapping);
  },
  measure: (ctx, cell, t) => {
    const lines = (cell.displayData ?? cell.data).split("\n", cell.allowWrapping === true ? undefined : 1);
    let maxLineWidth = 0;
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
    }
    return maxLineWidth + 2 * t.cellHorizontalPadding;
  },
  onDelete: c => ({
    ...c,
    data: "",
  }),
  provideEditor: cell => ({
    disablePadding: cell.allowWrapping === true,
    editor: p => {
      const { isHighlighted, onChange, value, validatedSelection } = p;
      return h(GrowingEntry, {
        style: cell.allowWrapping === true ? { padding: "3px 8.5px" } : undefined,
        highlight: isHighlighted,
        autoFocus: value.readonly !== true,
        disabled: value.readonly === true,
        altNewline: true,
        value: value.data,
        validatedSelection,
        onChange
      });
    },
  }),
  onPaste: (toPaste, cell, details) =>
    toPaste === cell.data
      ? undefined
      : { ...cell, data: toPaste, displayData: details.formattedString ?? cell.displayData },
};
</script>

<style scoped>
.text-cell {
  width: 100%;
  height: 100%;
}

.growing-entry {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  resize: none;
  outline: none;
  overflow: hidden;
}

.growing-entry.highlight {
  background-color: rgba(79, 93, 255, 0.1);
}

.growing-entry:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>