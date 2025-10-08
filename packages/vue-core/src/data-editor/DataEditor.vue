<template>
  <div
    ref="containerRef"
    class="data-editor-container"
    :class="[themeClass, accessibilityClass]"
    :style="[containerStyle, accessibilityStyle]"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
    @copy="handleCopy"
    @paste="handlePaste"
    @cut="handleCut"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!-- 网格画布 -->
    <canvas
      ref="canvasRef"
      class="data-grid-canvas"
      :width="width"
      :height="height"
      tabindex="0"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
      @focus="handleCanvasFocus"
      @blur="handleCanvasBlur"
    />

    <!-- 编辑器覆盖层 -->
    <div
      v-if="editorState.isEditing"
      ref="editorOverlayRef"
      class="editor-overlay"
      :style="editorOverlayStyle"
    >
      <input
        v-if="editorState.content?.kind === 'text'"
        v-model="editorValue"
        class="text-editor"
        @keydown="handleEditorKeyDown"
        @blur="handleEditorBlur"
      />
      <input
        v-else-if="editorState.content?.kind === 'number'"
        v-model.number="editorValue"
        type="number"
        class="number-editor"
        @keydown="handleEditorKeyDown"
        @blur="handleEditorBlur"
      />
      <input
        v-else-if="editorState.content?.kind === 'boolean'"
        v-model="editorValue"
        type="checkbox"
        class="boolean-editor"
        @change="handleEditorChange"
        @blur="handleEditorBlur"
      />
    </div>

    <!-- 选择框 -->
    <div
      v-if="selectionState.isSelecting && selectionRect"
      class="selection-rect"
      :style="selectionRectStyle"
    />

    <!-- 滚动阴影 -->
    <div v-if="true" class="scroll-shadows">
      <div v-if="showTopShadow" class="scroll-shadow top" />
      <div v-if="showBottomShadow" class="scroll-shadow bottom" />
      <div v-if="showLeftShadow" class="scroll-shadow left" />
      <div v-if="showRightShadow" class="scroll-shadow right" />
    </div>
    
    <!-- 辅助功能树 -->
    <AccessibilityTree
      :accessibility-tree="accessibilityTree || {}"
      :show-accessibility-tree="showAccessibilityTree"
      :focused-cell="focusedCell"
      :current-range="currentRange"
      :screen-reader-mode="screenReaderMode"
      :high-contrast-mode="highContrastMode"
      :zoom-level="zoomLevel"
      :get-cell-content="(item: Item) => props.getCellContent(item as [number, number])"
      @cell-focused="handleAccessibilityCellFocused"
      @cell-activated="handleAccessibilityCellActivated"
      @header-focused="handleAccessibilityHeaderFocused"
      @header-activated="handleAccessibilityHeaderActivated"
    />
    
    <!-- 键盘快捷键帮助 -->
    <KeyboardShortcutsHelp
      :visible="showKeyboardHelp"
      :high-contrast-mode="highContrastMode"
      :zoom-level="zoomLevel"
      @close="hideKeyboardHelp"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  reactive,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  type PropType
} from 'vue';
import {
  GridCellKind,
  emptyGridSelection,
  CompactSelection,
  type Item
} from '../internal/data-grid/data-grid-types.js';
import { useAccessibility } from './use-accessibility.js';
import { useHighContrastTheme } from './use-high-contrast-theme.js';
import { useZoomSupport } from './use-zoom-support.js';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts.js';
import { keybindingDefaults, type Keybinds } from './data-editor-keybindings.js';
import AccessibilityTree from './AccessibilityTree.vue';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp.vue';

// Props 定义
const props = defineProps({
  /** 网格数据 */
  columns: {
    type: Array as PropType<readonly any[]>,
    required: true
  },
  /** 行数 */
  rows: {
    type: Number,
    required: true
  },
  /** 获取单元格内容 */
  getCellContent: {
    type: Function as PropType<(item: [number, number]) => any>,
    required: true
  },
  /** 主题 */
  theme: {
    type: Object,
    default: () => ({})
  },
  /** 宽度 */
  width: {
    type: Number,
    default: 800
  },
  /** 高度 */
  height: {
    type: Number,
    default: 600
  },
  /** 行高 */
  rowHeight: {
    type: Number,
    default: 32
  },
  /** 行标记偏移量 */
  rowMarkerOffset: {
    type: Number,
    default: 0
  },
  /** 是否可编辑 */
  editable: {
    type: Boolean,
    default: true
  }
});

// Emits 定义
const emit = defineEmits([
  'cell-activated',
  'cell-clicked',
  'cell-edited',
  'selection-changed'
]);

// 引用
const containerRef = ref<HTMLElement>();
const canvasRef = ref<HTMLCanvasElement>();
const editorOverlayRef = ref<HTMLElement>();

// 选择状态
const selectionState = reactive({
  isSelecting: false,
  selectionStart: undefined as [number, number] | undefined,
  current: undefined as {
    cell: [number, number];
    range: { x: number; y: number; width: number; height: number };
    rangeStack: { x: number; y: number; width: number; height: number }[];
  } | undefined,
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty()
});

// 编辑器状态
const editorState = reactive({
  isEditing: false,
  target: undefined as { x: number; y: number; width: number; height: number } | undefined,
  content: undefined as any
});

// 编辑器值
const editorValue = ref('');

// 滚动阴影
const showTopShadow = ref(false);
const showBottomShadow = ref(false);
const showLeftShadow = ref(false);
const showRightShadow = ref(false);

// 辅助功能状态
const showKeyboardHelp = ref(false);

// 响应式数据
const rowsRef = ref(props.rows);
const columnsRef = ref(props.columns.length);
const rowMarkerOffsetRef = ref(props.rowMarkerOffset);
const accessibilityHeightRef = ref(50);
const keybindingsRef = ref<Keybinds>(keybindingDefaults);

// 创建符合GridSelection类型的响应式对象
const selectionRef = computed(() => ({
  current: selectionState.current,
  columns: selectionState.columns,
  rows: selectionState.rows
}));

// 初始化辅助功能
const accessibility = useAccessibility({
  containerRef,
  canvasRef,
  selection: selectionRef as any,
  rows: rowsRef,
  columns: columnsRef,
  rowMarkerOffset: rowMarkerOffsetRef,
  accessibilityHeight: accessibilityHeightRef,
  getCellContent: (item: Item) => props.getCellContent(item as [number, number]),
  onCellFocused: (item: Item) => {
    selectionState.current = {
      cell: item as [number, number],
      range: { x: item[0], y: item[1], width: 1, height: 1 },
      rangeStack: []
    };
    emit('selection-changed', selectionState.current);
  },
  onCanvasFocused: () => {
    // 处理画布聚焦
  },
  onCanvasBlur: () => {
    // 处理画布失焦
  },
  onKeyDown: (event) => {
    // 处理键盘事件
  }
});

// 初始化高对比度主题
const highContrastTheme = useHighContrastTheme({
  theme: 'system'
});

// 初始化缩放支持
const zoomSupport = useZoomSupport({
  enableKeyboardShortcuts: true,
  enableWheelZoom: true,
  requireCtrlForWheel: true,
  zoomMode: 'both'
});

// 初始化键盘快捷键
const keyboardShortcuts = useKeyboardShortcuts({
  selection: selectionRef as any,
  keybindings: keybindingsRef,
  rows: rowsRef,
  columns: columnsRef,
  rowMarkerOffset: rowMarkerOffsetRef,
  getCellContent: (item: Item) => props.getCellContent(item as [number, number]),
  setSelection: (selection) => {
    if (selection.current) {
      selectionState.current = {
        cell: selection.current.cell as [number, number],
        range: {
          x: selection.current.range.x,
          y: selection.current.range.y,
          width: selection.current.range.width,
          height: selection.current.range.height
        },
        rangeStack: selection.current.rangeStack.map(r => ({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height
        }))
      };
    }
    emit('selection-changed', selectionState.current);
  },
  onCellActivated: (item: Item, event: any) => {
    emit('cell-activated', item as [number, number]);
  }
});

// 计算属性
const themeClass = computed(() => `data-editor-theme-${(props.theme as any)?.baseTheme || 'light'}`);

const accessibilityClass = computed(() => ({
  'data-editor-focused': accessibility.isFocused.value,
  'data-editor-high-contrast': highContrastTheme.isHighContrastEnabled.value,
  'data-editor-screen-reader': accessibility.screenReaderMode.value,
  'data-editor-zoomed': zoomSupport.currentZoomLevel.value !== 1
}));

const containerStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  ...zoomSupport.cssTransform.value
}));

const accessibilityStyle = computed(() => ({
  ...highContrastTheme.cssVariables.value,
  ...zoomSupport.cssVariables.value
}));

const accessibilityTree = computed(() => accessibility.accessibilityTree.value);
const showAccessibilityTree = computed(() => accessibility.accessibilityTree.value !== null);
const focusedCell = computed(() => selectionState.current?.cell);
const currentRange = computed(() => selectionState.current?.range);
const screenReaderMode = computed(() => accessibility.screenReaderMode.value);
const highContrastMode = computed(() => highContrastTheme.isHighContrastEnabled.value);
const zoomLevel = computed(() => zoomSupport.currentZoomLevel.value);

const editorOverlayStyle = computed(() => {
  if (!editorState.isEditing || !editorState.target) return {};
  
  return {
    position: 'absolute' as const,
    left: `${editorState.target.x}px`,
    top: `${editorState.target.y}px`,
    width: `${editorState.target.width}px`,
    height: `${editorState.target.height}px`,
    zIndex: 1000
  };
});

const selectionRect = computed(() => {
  if (!selectionState.isSelecting || !selectionState.selectionStart) return null;
  
  // 计算选择矩形
  const startX = Math.floor(selectionState.selectionStart[0] * 100);
  const startY = Math.floor(selectionState.selectionStart[1] * props.rowHeight);
  
  return {
    x: startX,
    y: startY,
    width: 100,
    height: props.rowHeight
  };
});

const selectionRectStyle = computed(() => {
  if (!selectionRect.value) return {};
  
  return {
    position: 'absolute' as const,
    left: `${selectionRect.value.x}px`,
    top: `${selectionRect.value.y}px`,
    width: `${selectionRect.value.width}px`,
    height: `${selectionRect.value.height}px`,
    border: '1px solid var(--gdg-accent-color)',
    backgroundColor: 'var(--gdg-accent-color)',
    opacity: 0.2,
    zIndex: 1,
    pointerEvents: 'none' as const
  };
});

// 事件处理器
const handleKeyDown = (event: KeyboardEvent) => {
  // 处理键盘事件
  const isCtrlKey = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? event.metaKey : event.ctrlKey;
  
  if (isCtrlKey) {
    switch (event.key) {
      case 'c':
        event.preventDefault();
        handleCopy();
        break;
      case 'v':
        event.preventDefault();
        handlePaste();
        break;
      case 'x':
        event.preventDefault();
        handleCut();
        break;
      case 'a':
        event.preventDefault();
        handleSelectAll();
        break;
    }
  } else {
    switch (event.key) {
      case 'Escape':
        if (editorState.isEditing) {
          hideEditor();
        }
        break;
      case 'Enter':
        if (editorState.isEditing) {
          finishEditing();
        } else if (selectionState.current) {
          startEditing(selectionState.current.cell);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!editorState.isEditing) {
          handleDelete();
        }
        break;
    }
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  // 处理键盘释放事件
};

const handleMouseDown = (event: MouseEvent) => {
  // 处理鼠标按下事件
};

const handleMouseMove = (event: MouseEvent) => {
  // 处理鼠标移动事件
};

const handleMouseUp = (event: MouseEvent) => {
  // 处理鼠标释放事件
  selectionState.isSelecting = false;
  selectionState.selectionStart = undefined;
};

const handleClick = (event: MouseEvent) => {
  // 处理点击事件
};

const handleDoubleClick = (event: MouseEvent) => {
  // 处理双击事件
  if (props.editable && selectionState.current) {
    startEditing(selectionState.current.cell);
  }
};

const handleContextMenu = (event: MouseEvent) => {
  // 处理右键菜单事件
};

const handleCopy = (event?: ClipboardEvent) => {
  // 处理复制事件
  console.log('Copy operation');
};

const handlePaste = (event?: ClipboardEvent) => {
  // 处理粘贴事件
  console.log('Paste operation');
};

const handleCut = (event?: ClipboardEvent) => {
  // 处理剪切事件
  console.log('Cut operation');
};

const handleDelete = () => {
  // 处理删除事件
  console.log('Delete operation');
};

const handleSelectAll = () => {
  // 处理全选事件
  selectionState.current = {
    cell: [props.rowMarkerOffset, 0],
    range: {
      x: props.rowMarkerOffset,
      y: 0,
      width: props.columns.length,
      height: props.rows
    },
    rangeStack: []
  };
  emit('selection-changed', selectionState.current);
};

const handleCanvasMouseDown = (event: MouseEvent) => {
  // 处理画布鼠标按下事件
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 计算点击的单元格位置
  const col = Math.floor(x / 100); // 简化计算
  const row = Math.floor(y / props.rowHeight);
  
  const item: [number, number] = [col + props.rowMarkerOffset, row];
  
  selectionState.isSelecting = true;
  selectionState.selectionStart = item;
  selectionState.current = {
    cell: item,
    range: {
      x: col * 100,
      y: row * props.rowHeight,
      width: 100,
      height: props.rowHeight
    },
    rangeStack: []
  };
  
  emit('selection-changed', selectionState.current);
  emit('cell-clicked', item);
};

const handleCanvasMouseMove = (event: MouseEvent) => {
  // 处理画布鼠标移动事件
  if (selectionState.isSelecting) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 计算鼠标位置的单元格
    const col = Math.floor(x / 100); // 简化计算
    const row = Math.floor(y / props.rowHeight);
    
    const item: [number, number] = [col + props.rowMarkerOffset, row];
    
    if (selectionState.current && selectionState.selectionStart) {
      const minX = Math.min(selectionState.selectionStart[0], item[0]);
      const minY = Math.min(selectionState.selectionStart[1], item[1]);
      const maxX = Math.max(selectionState.selectionStart[0], item[0]);
      const maxY = Math.max(selectionState.selectionStart[1], item[1]);
      
      selectionState.current.range = {
        x: minX * 100 - props.rowMarkerOffset * 100,
        y: minY * props.rowHeight,
        width: (maxX - minX + 1) * 100,
        height: (maxY - minY + 1) * props.rowHeight
      };
    }
  }
};

const handleCanvasMouseUp = (event: MouseEvent) => {
  // 处理画布鼠标释放事件
  selectionState.isSelecting = false;
  selectionState.selectionStart = undefined;
};

const handleWheel = (event: WheelEvent) => {
  // 处理滚轮事件
};

// 编辑器相关方法
const startEditing = (item: [number, number]) => {
  if (!props.editable) return;
  
  const cell = props.getCellContent(item);
  editorState.content = cell;
  editorState.isEditing = true;
  
  // 计算编辑器位置
  const col = item[0] - props.rowMarkerOffset;
  const row = item[1];
  
  editorState.target = {
    x: col * 100 + 2,
    y: row * props.rowHeight + 2,
    width: 96,
    height: props.rowHeight - 4
  };
  
  // 设置编辑器值
  if (cell.kind === GridCellKind.Text || cell.kind === GridCellKind.Number) {
    editorValue.value = cell.data.toString();
  } else if (cell.kind === GridCellKind.Boolean) {
    editorValue.value = cell.data || false;
  }
  
  emit('cell-activated', item);
  
  nextTick(() => {
    const input = editorOverlayRef.value?.querySelector('input');
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const hideEditor = () => {
  editorState.isEditing = false;
  editorState.content = undefined;
  editorState.target = undefined;
  editorValue.value = '';
};

const finishEditing = () => {
  if (!editorState.isEditing || !selectionState.current) return;
  
  const cell = editorState.content;
  let newValue: any = editorValue.value;
  
  // 根据单元格类型转换值
  if (cell.kind === GridCellKind.Number) {
    newValue = Number.parseFloat(newValue);
    if (Number.isNaN(newValue)) newValue = 0;
  } else if (cell.kind === GridCellKind.Boolean) {
    newValue = Boolean(newValue);
  }
  
  emit('cell-edited', selectionState.current.cell, newValue);
  hideEditor();
};

const handleEditorKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      finishEditing();
      break;
    case 'Escape':
      event.preventDefault();
      hideEditor();
      break;
  }
};

const handleEditorBlur = () => {
  finishEditing();
};

const handleEditorChange = () => {
  // 处理编辑器变化
};

// 辅助功能事件处理方法
const handleFocusIn = (event: FocusEvent) => {
  accessibility.handleFocusIn(event);
};

const handleFocusOut = (event: FocusEvent) => {
  accessibility.handleFocusOut(event);
};

const handleCanvasFocus = (event: FocusEvent) => {
  accessibility.handleFocusIn(event);
};

const handleCanvasBlur = (event: FocusEvent) => {
  accessibility.handleFocusOut(event);
};

const handleAccessibilityCellFocused = (item: Item) => {
  selectionState.current = {
    cell: item as [number, number],
    range: { x: item[0], y: item[1], width: 1, height: 1 },
    rangeStack: []
  };
  emit('selection-changed', selectionState.current);
};

const handleAccessibilityCellActivated = (item: Item) => {
  emit('cell-activated', item as [number, number]);
};

const handleAccessibilityHeaderFocused = (index: number) => {
  // 处理表头聚焦
};

const handleAccessibilityHeaderActivated = (index: number) => {
  // 处理表头激活
};

const showKeyboardHelpOverlay = () => {
  showKeyboardHelp.value = true;
};

const hideKeyboardHelp = () => {
  showKeyboardHelp.value = false;
};

// 生命周期
onMounted(() => {
  // 初始化画布
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      // 初始化绘制
      drawGrid();
    }
  }
});

// 绘制网格
const drawGrid = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制网格线
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  
  // 绘制垂直线
  for (let i = 0; i <= props.columns.length; i++) {
    const x = i * 100; // 简化计算
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // 绘制水平线
  for (let i = 0; i <= props.rows; i++) {
    const y = i * props.rowHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // 绘制单元格内容
  for (let row = 0; row < props.rows; row++) {
    for (let col = 0; col < props.columns.length; col++) {
      const item: [number, number] = [col + props.rowMarkerOffset, row];
      const cell = props.getCellContent(item);
      
      const x = col * 100;
      const y = row * props.rowHeight;
      
      // 绘制单元格背景
      if (selectionState.current?.range) {
        const range = selectionState.current.range;
        if (col * 100 >= range.x && 
            col * 100 < range.x + range.width &&
            row * props.rowHeight >= range.y && 
            row * props.rowHeight < range.y + range.height) {
          ctx.fillStyle = 'rgba(0, 120, 255, 0.1)';
          ctx.fillRect(x, y, 100, props.rowHeight);
        }
      }
      
      // 绘制单元格文本
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      let text = '';
      if (cell.kind === GridCellKind.Text) {
        text = cell.data;
      } else if (cell.kind === GridCellKind.Number) {
        text = cell.data.toString();
      } else if (cell.kind === GridCellKind.Boolean) {
        text = cell.data ? 'true' : 'false';
      }
      
      ctx.fillText(text, x + 8, y + props.rowHeight / 2);
    }
  }
};

// 监听数据变化
watch([() => props.columns, () => props.rows, () => selectionState.current], () => {
  nextTick(() => {
    drawGrid();
  });
}, { deep: true });
</script>

<style scoped>
.data-editor-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: #333;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  user-select: none;
}

.data-grid-canvas {
  display: block;
  cursor: default;
}

.editor-overlay {
  background-color: #fff;
  border: 1px solid #007acc;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.text-editor, .number-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 4px;
  font-family: inherit;
  font-size: inherit;
}

.boolean-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-rect {
  pointer-events: none;
}

.scroll-shadows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.scroll-shadow {
  position: absolute;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent);
}

.scroll-shadow.top {
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
}

.scroll-shadow.bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
}

.scroll-shadow.left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 8px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent);
}

.scroll-shadow.right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 8px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent);
}

/* 主题样式 */
.data-editor-theme-light {
  --gdg-bg-color: #ffffff;
  --gdg-text-color: #333333;
  --gdg-border-color: #e0e0e0;
  --gdg-accent-color: #007acc;
  --gdg-hover-color: #f5f5f5;
  --gdg-selected-color: rgba(0, 120, 204, 0.1);
}

.data-editor-theme-dark {
  --gdg-bg-color: #1e1e1e;
  --gdg-text-color: #cccccc;
  --gdg-border-color: #404040;
  --gdg-accent-color: #0078d4;
  --gdg-hover-color: #2d2d2d;
  --gdg-selected-color: rgba(0, 120, 212, 0.2);
}
</style>