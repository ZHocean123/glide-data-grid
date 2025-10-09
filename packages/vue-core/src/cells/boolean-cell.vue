<template>
  <div class="boolean-cell">
    <!-- Vue版本的布尔单元格渲染器 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { drawCheckbox } from '../internal/data-grid/render/draw-checkbox.js';
import { GridCellKind, BooleanEmpty, BooleanIndeterminate, type BooleanCell } from '../internal/data-grid/data-grid-types.js';
import type { InternalCellRenderer } from './cell-types.js';

// 布尔单元格工具函数
function booleanCellIsEditable(cell: BooleanCell): boolean {
    return cell.readonly !== true;
}

function toggleBoolean(data: boolean | typeof BooleanEmpty | typeof BooleanIndeterminate): boolean | typeof BooleanEmpty | typeof BooleanIndeterminate {
    if (data === true) return false;
    if (data === false) return BooleanIndeterminate;
    if (data === BooleanIndeterminate) return BooleanEmpty;
    return true;
}

function isOverEditableRegion(e: {
    readonly cell: BooleanCell;
    readonly posX: number;
    readonly posY: number;
    readonly bounds: { x: number; y: number; width: number; height: number };
    readonly theme: any;
}): boolean {
    const { cell, posX: pointerX, posY: pointerY, bounds, theme } = e;
    const { width, height, x: cellX, y: cellY } = bounds;
    const maxWidth = cell.maxSize ?? theme.checkboxMaxSize;
    const cellCenterY = Math.floor(bounds.y + height / 2);
    const checkBoxWidth = Math.min(cell.maxSize ?? theme.checkboxMaxSize, height - theme.cellVerticalPadding * 2);
    let posX = cellX + theme.cellHorizontalPadding + checkBoxWidth / 2;
    
    if (cell.contentAlign === "center") {
        posX = Math.floor(cellX + width / 2);
    } else if (cell.contentAlign === "right") {
        posX = Math.floor(cellX + width) - theme.cellHorizontalPadding - checkBoxWidth / 2;
    }
    
    const bb = {
        x1: posX - checkBoxWidth / 2,
        y1: cellCenterY - checkBoxWidth / 2,
        x2: posX + checkBoxWidth / 2,
        y2: cellCenterY + checkBoxWidth / 2
    };
    
    const checkBoxClicked = 
        pointerX >= bb.x1 && pointerX <= bb.x2 &&
        pointerY >= bb.y1 && pointerY <= bb.y2;

    return booleanCellIsEditable(cell) && checkBoxClicked;
}

// Vue版本的布尔单元格渲染器
export const booleanCellRenderer: InternalCellRenderer<any> = {
    getAccessibilityString: c => c.data?.toString() ?? "false",
    kind: GridCellKind.Boolean,
    needsHover: true,
    useLabel: false,
    needsHoverPosition: true,
    measure: () => 50,
    draw: a =>
        drawBoolean(
            a,
            a.cell.data,
            booleanCellIsEditable(a.cell),
            a.cell.maxSize ?? a.theme.checkboxMaxSize,
            a.cell.hoverEffectIntensity ?? 0.35
        ),
    onDelete: c => ({
        ...c,
        data: false,
    }),
    onSelect: e => {
        if (isOverEditableRegion(e)) {
            e.preventDefault();
        }
    },
    onClick: e => {
        if (isOverEditableRegion(e)) {
            return {
                ...e.cell,
                data: toggleBoolean(e.cell.data),
            };
        }
        return undefined;
    },
    onPaste: (toPaste, cell) => {
        let newVal: boolean | typeof BooleanEmpty | typeof BooleanIndeterminate = BooleanEmpty;
        if (toPaste.toLowerCase() === "true") {
            newVal = true;
        } else if (toPaste.toLowerCase() === "false") {
            newVal = false;
        } else if (toPaste.toLowerCase() === "indeterminate") {
            newVal = BooleanIndeterminate;
        }
        return newVal === cell.data
            ? undefined
            : {
                  ...cell,
                  data: newVal,
              };
    },
};

function drawBoolean(
    args: any,
    data: boolean | typeof BooleanEmpty | typeof BooleanIndeterminate,
    canEdit: boolean,
    maxSize: number,
    hoverEffectIntensity: number
) {
    if (!canEdit && data === BooleanEmpty) {
        return;
    }
    const {
        ctx,
        hoverAmount,
        theme,
        rect,
        highlighted,
        hoverX,
        hoverY,
        cell: { contentAlign },
    } = args;
    const { x, y, width: w, height: h } = rect;

    // Don't set the global alpha unnecessarily
    let shouldRestoreAlpha = false;
    if (hoverEffectIntensity > 0) {
        let alpha = canEdit ? 1 - hoverEffectIntensity + hoverEffectIntensity * hoverAmount : 0.4;
        if (data === BooleanEmpty) {
            alpha *= hoverAmount;
        }
        if (alpha === 0) {
            return;
        }

        if (alpha < 1) {
            shouldRestoreAlpha = true;
            ctx.globalAlpha = alpha;
        }
    }

    drawCheckbox(ctx, theme, data, x, y, w, h, highlighted, hoverX, hoverY, maxSize, contentAlign);

    if (shouldRestoreAlpha) {
        ctx.globalAlpha = 1;
    }
}
</script>

<style scoped>
.boolean-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>