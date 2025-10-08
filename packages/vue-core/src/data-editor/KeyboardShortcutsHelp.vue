<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="helpDialogRef"
      class="keyboard-shortcuts-help-overlay"
      :class="{ 'keyboard-shortcuts-help-overlay-visible': visible }"
      @keydown="handleKeyDown"
      @click="handleOverlayClick"
    >
      <div
        ref="helpContentRef"
        class="keyboard-shortcuts-help-content"
        :style="contentStyle"
        @click.stop
      >
        <div class="keyboard-shortcuts-help-header">
          <h2>键盘快捷键</h2>
          <button
            ref="closeButtonRef"
            class="keyboard-shortcuts-help-close"
            @click="close"
            :aria-label="closeButtonAriaLabel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.343 2.343a1 1 0 011.414 0L8 6.586l4.243-4.243a1 1 0 111.414 1.414L9.414 8l4.243 4.243a1 1 0 01-1.414 1.414L8 9.414l-4.243 4.243a1 1 0 01-1.414-1.414L6.586 8 2.343 3.757a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
        
        <div class="keyboard-shortcuts-help-body">
          <div class="keyboard-shortcuts-help-sections">
            <div
              v-for="(section, sectionIndex) in shortcutSections"
              :key="sectionIndex"
              class="keyboard-shortcuts-help-section"
            >
              <h3>{{ section.title }}</h3>
              <div class="keyboard-shortcuts-help-items">
                <div
                  v-for="(shortcut, shortcutIndex) in section.shortcuts"
                  :key="shortcutIndex"
                  class="keyboard-shortcuts-help-item"
                >
                  <div class="keyboard-shortcuts-help-action">
                    {{ shortcut.action }}
                    <span v-if="shortcut.description" class="keyboard-shortcuts-help-description">
                      {{ shortcut.description }}
                    </span>
                  </div>
                  <div class="keyboard-shortcuts-help-keys">
                    <kbd
                      v-for="(key, keyIndex) in shortcut.keys"
                      :key="keyIndex"
                      class="keyboard-shortcuts-help-key"
                    >
                      {{ key }}
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="keyboard-shortcuts-help-tips">
            <h3>提示</h3>
            <ul>
              <li v-for="(tip, tipIndex) in tips" :key="tipIndex">
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>
        
        <div class="keyboard-shortcuts-help-footer">
          <button
            class="keyboard-shortcuts-help-button"
            @click="close"
            ref="primaryButtonRef"
          >
            关闭 (Esc)
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, type PropType } from 'vue';

// Props 定义
const props = defineProps({
  /** 是否显示帮助对话框 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 自定义快捷键列表 */
  customShortcuts: {
    type: Array as PropType<Array<{
      action: string;
      description?: string;
      keys: string[];
      category?: string;
    }>>,
    default: () => []
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
  'close',
  'shortcut-activated'
]);

// 引用
const helpDialogRef = ref<HTMLElement>();
const helpContentRef = ref<HTMLElement>();
const closeButtonRef = ref<HTMLElement>();
const primaryButtonRef = ref<HTMLElement>();

// 状态
const focusedShortcutIndex = ref(0);

// 计算属性
const closeButtonAriaLabel = computed(() => 
  props.highContrastMode ? '关闭键盘快捷键帮助对话框' : '关闭'
);

const contentStyle = computed(() => ({
  transform: `scale(${props.zoomLevel})`,
  transformOrigin: 'center center'
}));

// 默认快捷键列表
const defaultShortcuts = [
  // 导航快捷键
  {
    action: '向上移动',
    keys: ['↑'],
    category: 'navigation'
  },
  {
    action: '向下移动',
    keys: ['↓'],
    category: 'navigation'
  },
  {
    action: '向左移动',
    keys: ['←'],
    category: 'navigation'
  },
  {
    action: '向右移动',
    keys: ['→'],
    category: 'navigation'
  },
  {
    action: '向上翻页',
    keys: ['Page Up'],
    category: 'navigation'
  },
  {
    action: '向下翻页',
    keys: ['Page Down'],
    category: 'navigation'
  },
  {
    action: '移动到行首',
    keys: ['Home'],
    category: 'navigation'
  },
  {
    action: '移动到行尾',
    keys: ['End'],
    category: 'navigation'
  },
  {
    action: '移动到第一个单元格',
    keys: ['Ctrl', 'Home'],
    category: 'navigation'
  },
  {
    action: '移动到最后一个单元格',
    keys: ['Ctrl', 'End'],
    category: 'navigation'
  },
  {
    action: '向前Tab',
    keys: ['Shift', 'Tab'],
    category: 'navigation'
  },
  {
    action: '向后Tab',
    keys: ['Tab'],
    category: 'navigation'
  },
  
  // 编辑快捷键
  {
    action: '激活单元格',
    keys: ['Enter'],
    category: 'editing'
  },
  {
    action: '编辑单元格',
    keys: ['F2'],
    category: 'editing'
  },
  {
    action: '保存并编辑下一个',
    keys: ['Enter'],
    description: '编辑模式下',
    category: 'editing'
  },
  {
    action: '保存并编辑上一个',
    keys: ['Shift', 'Enter'],
    description: '编辑模式下',
    category: 'editing'
  },
  {
    action: '取消编辑',
    keys: ['Escape'],
    category: 'editing'
  },
  {
    action: '删除单元格内容',
    keys: ['Delete'],
    category: 'editing'
  },
  {
    action: '删除单元格内容',
    keys: ['Backspace'],
    category: 'editing'
  },
  
  // 选择快捷键
  {
    action: '全选',
    keys: ['Ctrl', 'A'],
    category: 'selection'
  },
  {
    action: '选择行',
    keys: ['Shift', 'Space'],
    category: 'selection'
  },
  {
    action: '选择列',
    keys: ['Ctrl', 'Space'],
    category: 'selection'
  },
  {
    action: '扩展选择（向上）',
    keys: ['Shift', '↑'],
    category: 'selection'
  },
  {
    action: '扩展选择（向下）',
    keys: ['Shift', '↓'],
    category: 'selection'
  },
  {
    action: '扩展选择（向左）',
    keys: ['Shift', '←'],
    category: 'selection'
  },
  {
    action: '扩展选择（向右）',
    keys: ['Shift', '→'],
    category: 'selection'
  },
  
  // 剪贴板快捷键
  {
    action: '复制',
    keys: ['Ctrl', 'C'],
    category: 'clipboard'
  },
  {
    action: '粘贴',
    keys: ['Ctrl', 'V'],
    category: 'clipboard'
  },
  {
    action: '剪切',
    keys: ['Ctrl', 'X'],
    category: 'clipboard'
  },
  
  // 撤销/重做
  {
    action: '撤销',
    keys: ['Ctrl', 'Z'],
    category: 'history'
  },
  {
    action: '重做',
    keys: ['Ctrl', 'Y'],
    category: 'history'
  },
  
  // 搜索快捷键
  {
    action: '搜索',
    keys: ['Ctrl', 'F'],
    category: 'search'
  },
  {
    action: '下一个搜索结果',
    keys: ['F3'],
    category: 'search'
  },
  {
    action: '上一个搜索结果',
    keys: ['Shift', 'F3'],
    category: 'search'
  },
  
  // 辅助功能快捷键
  {
    action: '显示键盘帮助',
    keys: ['Ctrl', '/'],
    category: 'accessibility'
  },
  {
    action: '切换屏幕阅读器模式',
    keys: ['Alt', 'A'],
    category: 'accessibility'
  },
  {
    action: '切换高对比度模式',
    keys: ['Alt', 'H'],
    category: 'accessibility'
  },
  {
    action: '增加缩放',
    keys: ['Ctrl', '+'],
    category: 'accessibility'
  },
  {
    action: '减少缩放',
    keys: ['Ctrl', '-'],
    category: 'accessibility'
  },
  {
    action: '重置缩放',
    keys: ['Ctrl', '0'],
    category: 'accessibility'
  }
];

// 合并自定义快捷键
const allShortcuts = computed(() => {
  const shortcuts = [...defaultShortcuts];
  
  // 添加自定义快捷键
  props.customShortcuts.forEach(customShortcut => {
    const existingIndex = shortcuts.findIndex(s => s.action === customShortcut.action);
    if (existingIndex >= 0) {
      shortcuts[existingIndex] = {
        ...shortcuts[existingIndex],
        ...customShortcut,
        category: customShortcut.category || shortcuts[existingIndex].category
      };
    } else {
      shortcuts.push({
        action: customShortcut.action,
        keys: customShortcut.keys,
        category: customShortcut.category || 'custom',
        description: customShortcut.description
      });
    }
  });
  
  return shortcuts;
});

// 按类别分组快捷键
const shortcutSections = computed(() => {
  const sections = [
    {
      title: '导航',
      shortcuts: allShortcuts.value.filter(s => s.category === 'navigation')
    },
    {
      title: '编辑',
      shortcuts: allShortcuts.value.filter(s => s.category === 'editing')
    },
    {
      title: '选择',
      shortcuts: allShortcuts.value.filter(s => s.category === 'selection')
    },
    {
      title: '剪贴板',
      shortcuts: allShortcuts.value.filter(s => s.category === 'clipboard')
    },
    {
      title: '历史记录',
      shortcuts: allShortcuts.value.filter(s => s.category === 'history')
    },
    {
      title: '搜索',
      shortcuts: allShortcuts.value.filter(s => s.category === 'search')
    },
    {
      title: '辅助功能',
      shortcuts: allShortcuts.value.filter(s => s.category === 'accessibility')
    }
  ];
  
  // 过滤掉空的部分
  return sections.filter(section => section.shortcuts.length > 0);
});

// 提示列表
const tips = [
  '按住 Shift 键可以扩展选择范围',
  '按住 Ctrl 键可以进行列选择',
  '按住 Alt 键可以保留选择状态进行导航',
  '双击单元格可以开始编辑',
  '右键单击单元格可以显示上下文菜单',
  '使用 Ctrl + / 可以随时显示此帮助对话框'
];

// 方法
const close = () => {
  emit('close');
};

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      close();
      break;
    case 'Tab':
      event.preventDefault();
      // 处理Tab键导航
      handleTabNavigation(event.shiftKey);
      break;
    case 'ArrowUp':
      event.preventDefault();
      navigateShortcuts(-1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      navigateShortcuts(1);
      break;
  }
};

const handleOverlayClick = () => {
  close();
};

const handleTabNavigation = (shiftKey: boolean) => {
  // 简单的Tab导航实现
  if (shiftKey) {
    // Shift+Tab: 向前导航
    if (document.activeElement === primaryButtonRef.value) {
      closeButtonRef.value?.focus();
    } else {
      primaryButtonRef.value?.focus();
    }
  } else {
    // Tab: 向后导航
    if (document.activeElement === closeButtonRef.value) {
      primaryButtonRef.value?.focus();
    } else {
      closeButtonRef.value?.focus();
    }
  }
};

const navigateShortcuts = (direction: number) => {
  const totalShortcuts = allShortcuts.value.length;
  focusedShortcutIndex.value = (focusedShortcutIndex.value + direction + totalShortcuts) % totalShortcuts;
  
  // 滚动到可见区域
  const shortcutElements = helpContentRef.value?.querySelectorAll('.keyboard-shortcuts-help-item');
  if (shortcutElements && shortcutElements[focusedShortcutIndex.value]) {
    shortcutElements[focusedShortcutIndex.value].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }
};

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      // 聚焦到关闭按钮
      closeButtonRef.value?.focus();
      
      // 添加事件监听器
      document.addEventListener('keydown', handleKeyDown);
    });
  } else {
    // 移除事件监听器
    document.removeEventListener('keydown', handleKeyDown);
  }
});

// 生命周期
onMounted(() => {
  if (props.visible) {
    document.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// 暴露方法
defineExpose({
  close,
  focus: () => {
    closeButtonRef.value?.focus();
  }
});
</script>

<style scoped>
.keyboard-shortcuts-help-overlay {
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
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
}

.keyboard-shortcuts-help-overlay-visible {
  opacity: 1;
  visibility: visible;
}

.keyboard-shortcuts-help-content {
  background-color: var(--gdg-bg-color, #fff);
  color: var(--gdg-text-color, #333);
  border: 1px solid var(--gdg-border-color, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  max-height: 80vh;
  width: 90vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.keyboard-shortcuts-help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gdg-border-color, #e0e0e0);
}

.keyboard-shortcuts-help-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--gdg-accent-color, #007acc);
}

.keyboard-shortcuts-help-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gdg-text-color, #333);
  transition: background-color 0.2s;
}

.keyboard-shortcuts-help-close:hover {
  background-color: var(--gdg-hover-color, #f5f5f5);
}

.keyboard-shortcuts-help-close:focus {
  outline: 2px solid var(--gdg-accent-color, #007acc);
  outline-offset: 2px;
}

.keyboard-shortcuts-help-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.keyboard-shortcuts-help-sections {
  margin-bottom: 24px;
}

.keyboard-shortcuts-help-section {
  margin-bottom: 24px;
}

.keyboard-shortcuts-help-section:last-child {
  margin-bottom: 0;
}

.keyboard-shortcuts-help-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--gdg-text-color, #333);
  border-bottom: 1px solid var(--gdg-border-color, #e0e0e0);
  padding-bottom: 6px;
}

.keyboard-shortcuts-help-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyboard-shortcuts-help-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.keyboard-shortcuts-help-action {
  flex: 1;
  font-size: 14px;
}

.keyboard-shortcuts-help-description {
  display: block;
  font-size: 12px;
  color: var(--gdg-text-color, #666);
  margin-top: 2px;
}

.keyboard-shortcuts-help-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
}

.keyboard-shortcuts-help-key {
  background-color: var(--gdg-hover-color, #f5f5f5);
  border: 1px solid var(--gdg-border-color, #e0e0e0);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 500;
  color: var(--gdg-text-color, #333);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.keyboard-shortcuts-help-tips {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--gdg-border-color, #e0e0e0);
}

.keyboard-shortcuts-help-tips h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--gdg-text-color, #333);
}

.keyboard-shortcuts-help-tips ul {
  margin: 0;
  padding-left: 20px;
}

.keyboard-shortcuts-help-tips li {
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--gdg-text-color, #666);
}

.keyboard-shortcuts-help-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--gdg-border-color, #e0e0e0);
  display: flex;
  justify-content: flex-end;
}

.keyboard-shortcuts-help-button {
  background-color: var(--gdg-accent-color, #007acc);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.keyboard-shortcuts-help-button:hover {
  background-color: var(--gdg-accent-color, #005a9e);
}

.keyboard-shortcuts-help-button:focus {
  outline: 2px solid var(--gdg-accent-color, #007acc);
  outline-offset: 2px;
}

/* 高对比度模式样式 */
:global([data-high-contrast="true"]) .keyboard-shortcuts-help-content {
  background-color: ButtonFace;
  color: ButtonText;
  border: 2px solid ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-header {
  border-bottom: 2px solid ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-section h3 {
  border-bottom: 1px solid ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-key {
  background-color: ButtonFace;
  border: 2px solid ButtonText;
  color: ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-button {
  background-color: Highlight;
  color: HighlightText;
  border: 2px solid ButtonText;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-close:focus {
  outline: 2px solid ButtonText;
  outline-offset: 2px;
}

:global([data-high-contrast="true"]) .keyboard-shortcuts-help-button:focus {
  outline: 2px solid ButtonText;
  outline-offset: 2px;
}
</style>