<template>
  <div
    v-if="showAccessibilityTree"
    ref="accessibilityTreeRef"
    class="accessibility-tree"
    :style="treeStyle"
    aria-hidden="false"
  >
    <div
      role="grid"
      :aria-rowcount="accessibilityTree?.['aria-rowcount']"
      :aria-multiselectable="accessibilityTree?.['aria-multiselectable']"
      :aria-colcount="accessibilityTree?.['aria-colcount']"
    >
      <!-- 表头 -->
      <div role="rowgroup">
        <div role="row" :aria-rowindex="1">
          <div
            v-for="(header, index) in accessibilityTree?.children?.[0]?.children?.[0]?.children"
            :key="`header-${index}`"
            role="columnheader"
            :aria-selected="header['aria-selected']"
            :aria-colindex="header['aria-colindex']"
            :tabindex="header.tabIndex"
            :data-testid="header['data-testid']"
            class="accessibility-cell accessibility-header"
            @focus="handleHeaderFocus(header, index)"
            @click="handleHeaderClick(header, index)"
          >
            {{ header.text }}
          </div>
        </div>
      </div>
      
      <!-- 表体 -->
      <div role="rowgroup">
        <div
          v-for="(row, rowIndex) in accessibilityTree?.children?.[1]?.children"
          :key="`row-${rowIndex}`"
          role="row"
          :aria-selected="row['aria-selected']"
          :aria-rowindex="row['aria-rowindex']"
        >
          <div
            v-for="(cell, cellIndex) in row.children"
            :key="`cell-${cellIndex}`"
            :id="cell.id"
            role="gridcell"
            :aria-selected="cell['aria-selected']"
            :aria-readonly="cell['aria-readonly']"
            :aria-colindex="cell['aria-colindex']"
            :tabindex="cell.tabIndex"
            :data-testid="cell['data-testid']"
            class="accessibility-cell"
            :class="{
              'accessibility-cell-focused': cell.focused,
              'accessibility-cell-selected': cell['aria-selected']
            }"
            @focus="handleCellFocus(cell, rowIndex, cellIndex)"
            @click="handleCellClick(cell, rowIndex, cellIndex)"
          >
            {{ cell.text }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 屏幕阅读器公告区域 -->
    <div
      ref="announcerRef"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ announcement }}
    </div>
    
    <!-- 键盘快捷键帮助 -->
    <div
      v-if="showKeyboardHelp"
      ref="keyboardHelpRef"
      class="keyboard-help-overlay"
      @keydown="handleHelpKeyDown"
    >
      <div class="keyboard-help-content">
        <h3>键盘快捷键</h3>
        <table>
          <tr>
            <th>操作</th>
            <th>快捷键</th>
          </tr>
          <tr v-for="(shortcut, index) in keyboardShortcuts" :key="index">
            <td>{{ shortcut.action }}</td>
            <td><kbd>{{ shortcut.key }}</kbd></td>
          </tr>
        </table>
        <button @click="hideKeyboardHelp" class="close-help">关闭 (Esc)</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, type PropType } from 'vue';
import type { Item } from '../internal/data-grid/data-grid-types.js';

// Props 定义
const props = defineProps({
  /** 辅助功能树数据 */
  accessibilityTree: {
    type: Object,
    default: null
  },
  /** 是否显示辅助功能树 */
  showAccessibilityTree: {
    type: Boolean,
    default: false
  },
  /** 当前聚焦的单元格 */
  focusedCell: {
    type: Array as PropType<Item>,
    default: undefined
  },
  /** 获取单元格内容 */
  getCellContent: {
    type: Function as PropType<(item: Item) => any>,
    default: undefined
  },
  /** 当前选择范围 */
  currentRange: {
    type: Object,
    default: undefined
  },
  /** 屏幕阅读器模式 */
  screenReaderMode: {
    type: Boolean,
    default: false
  },
  /** 高对比度模式 */
  highContrastMode: {
    type: Boolean,
    default: false
  },
  /** 缩放级别 */
  zoomLevel: {
    type: Number,
    default: 1
  }
});

// Emits 定义
const emit = defineEmits([
  'cell-focused',
  'cell-activated',
  'header-focused',
  'header-activated'
]);

// 引用
const accessibilityTreeRef = ref<HTMLElement>();
const announcerRef = ref<HTMLElement>();
const keyboardHelpRef = ref<HTMLElement>();

// 状态
const announcement = ref('');
const showKeyboardHelp = ref(false);

// 计算属性
const treeStyle = computed(() => ({
  position: 'absolute' as const,
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  opacity: 0,
  transform: `scale(${props.zoomLevel})`,
  transformOrigin: 'top left'
}));

// 键盘快捷键列表
const keyboardShortcuts = [
  { action: '向上移动', key: '↑' },
  { action: '向下移动', key: '↓' },
  { action: '向左移动', key: '←' },
  { action: '向右移动', key: '→' },
  { action: '向上翻页', key: 'Page Up' },
  { action: '向下翻页', key: 'Page Down' },
  { action: '移动到行首', key: 'Home' },
  { action: '移动到行尾', key: 'End' },
  { action: '向前Tab', key: 'Shift + Tab' },
  { action: '向后Tab', key: 'Tab' },
  { action: '激活单元格', key: 'Enter' },
  { action: '编辑单元格', key: 'F2' },
  { action: '取消操作', key: 'Escape' },
  { action: '全选', key: 'Ctrl + A' },
  { action: '复制', key: 'Ctrl + C' },
  { action: '粘贴', key: 'Ctrl + V' },
  { action: '剪切', key: 'Ctrl + X' },
  { action: '撤销', key: 'Ctrl + Z' },
  { action: '重做', key: 'Ctrl + Y' },
  { action: '删除', key: 'Delete' },
  { action: '显示键盘帮助', key: 'Ctrl + /' }
];

// 方法
const announce = (message: string) => {
  announcement.value = message;
  
  // 清除之前的定时器
  if (announcementTimer) {
    clearTimeout(announcementTimer);
  }
  
  // 设置新的定时器清除公告
  announcementTimer = window.setTimeout(() => {
    announcement.value = '';
  }, 1000);
};

let announcementTimer: number | undefined;

const handleHeaderFocus = (header: any, index: number) => {
  emit('header-focused', index);
  announce(`列 ${index + 1}，${header.text}`);
};

const handleHeaderClick = (header: any, index: number) => {
  emit('header-activated', index);
  announce(`已选择列 ${index + 1}，${header.text}`);
};

const handleCellFocus = (cell: any, rowIndex: number, cellIndex: number) => {
  const location: Item = [cellIndex, rowIndex];
  emit('cell-focused', location);
  
  // 构建单元格描述
  let description = `第 ${rowIndex + 1} 行，第 ${cellIndex + 1} 列`;
  
  if (cell['aria-selected']) {
    description += '，已选择';
  }
  
  if (cell['aria-readonly']) {
    description += '，只读';
  }
  
  if (cell.text) {
    description += `，内容：${cell.text}`;
  }
  
  announce(description);
};

const handleCellClick = (cell: any, rowIndex: number, cellIndex: number) => {
  const location: Item = [cellIndex, rowIndex];
  emit('cell-activated', location);
  
  // 构建激活描述
  let description = `已激活第 ${rowIndex + 1} 行，第 ${cellIndex + 1} 列`;
  
  if (cell.text) {
    description += `，内容：${cell.text}`;
  }
  
  announce(description);
};

const showKeyboardHelpOverlay = () => {
  showKeyboardHelp.value = true;
  nextTick(() => {
    keyboardHelpRef.value?.focus();
  });
};

const hideKeyboardHelp = () => {
  showKeyboardHelp.value = false;
};

const handleHelpKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    hideKeyboardHelp();
  }
};

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // Ctrl + / 显示键盘帮助
  if (event.ctrlKey && event.key === '/') {
    event.preventDefault();
    showKeyboardHelpOverlay();
  }
};

// 监听聚焦单元格变化
watch(() => props.focusedCell, (newCell, oldCell) => {
  if (newCell && oldCell && (newCell[0] !== oldCell[0] || newCell[1] !== oldCell[1])) {
    const [col, row] = newCell;
    const cell = props.getCellContent?.([col, row]);
    
    if (cell) {
      let description = `已移动到第 ${row + 1} 行，第 ${col + 1} 列`;
      
      if (cell.kind === 'text' || cell.kind === 'number') {
        description += `，内容：${cell.data}`;
      } else if (cell.kind === 'boolean') {
        description += `，${cell.data ? '已选中' : '未选中'}`;
      }
      
      announce(description);
    }
  }
});

// 监听选择范围变化
watch(() => props.currentRange, (newRange, oldRange) => {
  if (newRange && (!oldRange || 
      newRange.x !== oldRange.x || 
      newRange.y !== oldRange.y || 
      newRange.width !== oldRange.width || 
      newRange.height !== oldRange.height)) {
    
    const startCol = newRange.x + 1;
    const startRow = newRange.y + 1;
    const endCol = newRange.x + newRange.width;
    const endRow = newRange.y + newRange.height;
    
    announce(`已选择从第 ${startRow} 行第 ${startCol} 列到第 ${endRow} 行第 ${endCol} 列的区域`);
  }
});

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyDown);
  if (announcementTimer) {
    clearTimeout(announcementTimer);
  }
});

// 暴露方法
defineExpose({
  announce,
  showKeyboardHelp: showKeyboardHelpOverlay,
  hideKeyboardHelp
});
</script>

<style scoped>
.accessibility-tree {
  /* 隐藏辅助功能树，但对屏幕阅读器可见 */
}

.accessibility-cell {
  /* 确保辅助功能单元格可以被聚焦 */
  outline: none;
}

.accessibility-cell-focused {
  /* 聚焦样式 */
}

.accessibility-cell-selected {
  /* 选中样式 */
}

.sr-only {
  /* 屏幕阅读器专用样式 */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.keyboard-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.keyboard-help-content {
  background-color: var(--gdg-bg-color, #fff);
  color: var(--gdg-text-color, #333);
  border: 1px solid var(--gdg-border-color, #e0e0e0);
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.keyboard-help-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--gdg-accent-color, #007acc);
}

.keyboard-help-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.keyboard-help-content th,
.keyboard-help-content td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--gdg-border-color, #e0e0e0);
}

.keyboard-help-content th {
  font-weight: 600;
  background-color: var(--gdg-hover-color, #f5f5f5);
}

kbd {
  background-color: var(--gdg-hover-color, #f5f5f5);
  border: 1px solid var(--gdg-border-color, #e0e0e0);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.85em;
}

.close-help {
  background-color: var(--gdg-accent-color, #007acc);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.close-help:hover {
  background-color: var(--gdg-accent-color, #005a9e);
}

/* 高对比度模式样式 */
:global([data-high-contrast="true"]) .keyboard-help-content {
  background-color: ButtonFace;
  color: ButtonText;
  border: 2px solid ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-help-content th {
  background-color: Highlight;
  color: HighlightText;
}

:global([data-high-contrast="true"]) kbd {
  background-color: ButtonFace;
  border: 2px solid ButtonText;
}

:global([data-high-contrast="true"]) .close-help {
  background-color: Highlight;
  color: HighlightText;
  border: 2px solid ButtonText;
}
</style>