<template>
  <div class="number-cell">
    <!-- Vue版本的数字单元格渲染器 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent } from 'vue';
import { drawTextCell, prepTextCell } from '../internal/data-grid/render/data-grid-lib.js';
import { GridCellKind, type NumberCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';
import { drawEditHoverIndicator } from '../internal/data-grid/render/draw-edit-hover-indicator.js';

// Vue版本的数字编辑器组件
const NumberOverlayEditor = defineComponent({
  props: {
    highlight: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    value: {
      type: Number,
      default: 0
    },
    fixedDecimals: {
      type: Number,
      default: undefined
    },
    allowNegative: {
      type: Boolean,
      default: true
    },
    thousandSeparator: {
      type: String,
      default: ","
    },
    decimalSeparator: {
      type: String,
      default: "."
    },
    validatedSelection: {
      type: Object,
      default: undefined
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    
    const formatValue = (val: number): string => {
      if (Number.isNaN(val)) return "0";
      
      let result = val.toString();
      
      // 处理小数位数
      if (props.fixedDecimals !== undefined) {
        result = val.toFixed(props.fixedDecimals);
      }
      
      // 处理千位分隔符
      if (props.thousandSeparator) {
        const parts = result.split(props.decimalSeparator);
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, props.thousandSeparator);
        result = parts.join(props.decimalSeparator);
      }
      
      return result;
    };
    
    const parseValue = (str: string): number => {
      let result = str;
      
      // 移除千位分隔符
      if (props.thousandSeparator) {
        result = result.replace(new RegExp(`\\${props.thousandSeparator}`, 'g'), '');
      }
      
      // 替换小数分隔符
      if (props.decimalSeparator && props.decimalSeparator !== '.') {
        result = result.replace(props.decimalSeparator, '.');
      }
      
      const parsed = parseFloat(result);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    
    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const parsedValue = parseValue(target.value);
      
      emit('change', {
        floatValue: parsedValue
      });
    };
    
    return () => h('input', {
      ref: inputRef,
      type: 'text',
      class: {
        'number-editor': true,
        'highlight': props.highlight,
        'disabled': props.disabled
      },
      value: formatValue(props.value),
      disabled: props.disabled,
      onInput: handleChange,
      onChange: handleChange
    });
  }
});

// Vue版本的数字单元格渲染器
export const numberCellRenderer: InternalCellRenderer<any> = {
  getAccessibilityString: c => c.data?.toString() ?? "",
  kind: GridCellKind.Number,
  needsHover: cell => cell.hoverEffect === true,
  needsHoverPosition: false,
  useLabel: true,
  drawPrep: prepTextCell,
  draw: a => {
    const { hoverAmount, cell, ctx, theme, rect, overrideCursor } = a;
    const { hoverEffect, displayData, hoverEffectTheme } = cell;

    if (hoverEffect === true && hoverAmount > 0) {
      drawEditHoverIndicator(ctx, theme, hoverEffectTheme, displayData ?? cell.data.toString(), rect, hoverAmount, overrideCursor as any);
    }
    drawTextCell(a, a.cell.displayData ?? a.cell.data.toString(), a.cell.contentAlign);
  },
  measure: (ctx, cell, theme) => {
    const text = cell.displayData ?? cell.data.toString();
    return ctx.measureText(text).width + theme.cellHorizontalPadding * 2;
  },
  onDelete: c => ({
    ...c,
    data: 0,
  }),
  provideEditor: () => ({
    editor: (p: any) => {
      const { isHighlighted, onChange, value, validatedSelection } = p;
      return h(NumberOverlayEditor, {
        highlight: isHighlighted,
        disabled: value.readonly === true,
        value: value.data,
        fixedDecimals: value.fixedDecimals,
        allowNegative: value.allowNegative,
        thousandSeparator: value.thousandSeparator,
        decimalSeparator: value.decimalSeparator,
        validatedSelection,
        onChange
      });
    }
  }),
  onPaste: (toPaste, cell, details) => {
    const newNumber =
      typeof details.rawValue === "number"
        ? details.rawValue
        : Number.parseFloat(typeof details.rawValue === "string" ? details.rawValue : toPaste);
    if (Number.isNaN(newNumber) || cell.data === newNumber) return undefined;
    return { ...cell, data: newNumber, displayData: details.formattedString ?? cell.displayData };
  },
};
</script>

<style scoped>
.number-cell {
  width: 100%;
  height: 100%;
}

.number-editor {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  text-align: inherit;
  outline: none;
}

.number-editor.highlight {
  background-color: rgba(79, 93, 255, 0.1);
}

.number-editor:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>