<template>
  <div class="uri-cell">
    <!-- Vue版本的URI单元格渲染器 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent } from 'vue';
import { drawTextCellExternal } from '../internal/data-grid/render/data-grid-lib.js';
import { GridCellKind, type UriCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';

// Vue版本的URI编辑器组件
const UriOverlayEditor = defineComponent({
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
      type: String,
      default: ''
    },
    forceEditMode: {
      type: Boolean,
      default: false
    },
    validatedSelection: {
      type: Object,
      default: undefined
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    
    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('change', {
        target: {
          value: target.value
        }
      });
    };
    
    return () => h('input', {
      ref: inputRef,
      type: 'text',
      class: {
        'uri-editor': true,
        'highlight': props.highlight,
        'disabled': props.disabled
      },
      value: props.value,
      disabled: props.disabled,
      autofocus: props.forceEditMode,
      onInput: handleChange,
      onChange: handleChange
    });
  }
});

// Vue版本的URI单元格渲染器
export const uriCellRenderer: InternalCellRenderer<any> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Uri,
    needsHover: true,
    needsHoverPosition: false,
    useLabel: true,
    drawPrep: undefined,
    draw: a => {
        const { cell, theme, rect, ctx, highlighted, hoverAmount } = a;
        const { displayData, data, hoverEffect } = cell;
        const display = displayData ?? data;
        const drawUnderline = cell.hoverEffect === true || hoverEffect === true;
        const color = cell.onClickUri !== undefined ? theme.linkColor : theme.textDark;
        const x = rect.x + theme.cellHorizontalPadding;
        const y = rect.y + theme.cellVerticalPadding;
        const w = rect.width - theme.cellHorizontalPadding * 2;
        const h = rect.height - theme.cellVerticalPadding * 2;
        const underlineHeight = Math.min(2, Math.ceil(h / 12));

        if (highlighted || (hoverEffect === true && hoverAmount > 0)) {
            ctx.fillStyle = drawUnderline ? theme.bgBubble : theme.bgSearchResult;
            let radius = theme.roundingRadius ?? 4;
            if (drawUnderline) {
                radius = Math.min(radius, underlineHeight);
            }
            ctx.beginPath();
            ctx.roundRect(x, y + h - underlineHeight - radius, w, underlineHeight + radius, radius);
            ctx.fill();
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        drawTextCellExternal(a, display, cell.contentAlign);

        if (drawUnderline) {
            const metrics = ctx.measureText(display);
            const textWidth = metrics.width;
            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            const textX = rect.x + theme.cellHorizontalPadding;
            const textY = rect.y + rect.height / 2 - textHeight / 2;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = underlineHeight;
            ctx.moveTo(textX, textY + textHeight + underlineHeight);
            ctx.lineTo(textX + textWidth, textY + textHeight + underlineHeight);
            ctx.stroke();
        }

        ctx.restore();
    },
    measure: (ctx, cell, theme) => {
        const text = cell.displayData ?? cell.data;
        return ctx.measureText(text).width + theme.cellHorizontalPadding * 2;
    },
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: () => ({
        editor: (p: any) => {
            const { onChange, value, forceEditMode, validatedSelection } = p;
            return h(UriOverlayEditor, {
                highlight: p.isHighlighted,
                disabled: value.readonly === true,
                value: value.data,
                preview: value.displayData ?? value.data,
                forceEditMode,
                validatedSelection,
                onChange
            });
        }
    }),
    onClick: e => {
        const { cell, posX, posY, bounds, theme } = e;
        if (cell.onClickUri !== undefined) {
            const { x, y, width, height } = bounds;
            const padding = theme.cellHorizontalPadding;
            const text = cell.displayData ?? cell.data;
            // 由于Vue版本中没有ctx，我们使用一个简化的检测方式
            const metrics = { width: text.length * 8, height: 16 }; // 简化计算，实际应该使用canvas
            const textWidth = metrics.width;
            const textHeight = metrics.height;
            const textX = x + padding;
            const textY = y + height / 2 - textHeight / 2;

            if (
                posX >= textX &&
                posX <= textX + textWidth &&
                posY >= textY &&
                posY <= textY + textHeight
            ) {
                cell.onClickUri({
                    ...e,
                    preventDefault: () => {
                        e.preventDefault();
                    },
                });
            }
        }
        return undefined;
    },
    onPaste: (toPaste, cell, details) =>
        toPaste === cell.data
            ? undefined
            : { ...cell, data: toPaste, displayData: details.formattedString ?? cell.displayData },
};
</script>

<style scoped>
.uri-cell {
  width: 100%;
  height: 100%;
}

.uri-editor {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  text-align: inherit;
  outline: none;
}

.uri-editor.highlight {
  background-color: rgba(79, 93, 255, 0.1);
}

.uri-editor:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>