<template>
  <div class="accessibility-example">
    <h2>辅助功能示例</h2>
    <div class="controls">
      <button @click="toggleHighContrast" :class="{ active: highContrastMode }">
        {{ highContrastMode ? '关闭' : '开启' }}高对比度
      </button>
      <button @click="toggleScreenReader" :class="{ active: screenReaderMode }">
        {{ screenReaderMode ? '关闭' : '开启' }}屏幕阅读器模式
      </button>
      <button @click="increaseZoom">放大</button>
      <button @click="decreaseZoom">缩小</button>
      <button @click="resetZoom">重置缩放</button>
      <button @click="toggleShortcutsHelp">
        {{ showShortcutsHelp ? '隐藏' : '显示' }}快捷键帮助
      </button>
    </div>
    <div class="zoom-indicator">缩放级别: {{ Math.round(zoomLevel * 100) }}%</div>
    <div class="grid-container" :style="gridStyle">
      <DataEditor
        ref="gridRef"
        :columns="columns"
        :get-cell-content="getCellContent"
        :rows="rows"
        :theme="theme"
        :accessibility-options="accessibilityOptions"
        @selection-changed="onSelectionChanged"
        @cell-activated="onCellActivated"
      />
    </div>
    <KeyboardShortcutsHelp
      v-if="showShortcutsHelp"
      :shortcuts="keyboardShortcuts"
      :high-contrast-mode="highContrastMode"
      :zoom-level="zoomLevel"
      @close="showShortcutsHelp = false"
    />
    <div class="status-info">
      <p>当前选中: {{ currentSelection ? `列 ${currentSelection.cell[0]}, 行 ${currentSelection.cell[1]}` : '无' }}</p>
      <p>辅助功能状态: {{ accessibilityStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import KeyboardShortcutsHelp from '../data-editor/KeyboardShortcutsHelp.vue';
import { GridCellKind, type GridColumn, type Item } from '../internal/data-grid/data-grid-types';
// 响应式状态
const gridRef = ref();
const showShortcutsHelp = ref(false);
const currentSelection = ref<{ cell: Item; range: any } | null>(null);

// 辅助功能状态
const highContrastMode = ref(false);
const screenReaderMode = ref(false);
const zoomLevel = ref(1);

// 主题
const theme = reactive({
  bgCell: '#ffffff',
  bgCellMedium: '#f5f5f5',
  bgHeader: '#f1f1f1',
  textDark: '#333333',
  textLight: '#666666',
  textHeader: '#444444',
  accentColor: '#4285f4',
  accentLight: '#d4e3fc',
  // 高对比度主题将在切换时动态更新
});

// 计算属性
const gridStyle = computed(() => ({
  transform: `scale(${zoomLevel.value})`,
  transformOrigin: 'top left',
  width: `${100 / zoomLevel.value}%`,
  height: `${100 / zoomLevel.value}%`,
}));

const accessibilityStatus = computed(() => {
  const status = [];
  if (highContrastMode.value) status.push('高对比度');
  if (screenReaderMode.value) status.push('屏幕阅读器');
  status.push(`${Math.round(zoomLevel.value * 100)}%缩放`);
  return status.join(', ');
});

const accessibilityOptions = computed(() => ({
  highContrastMode: highContrastMode.value,
  screenReaderMode: screenReaderMode.value,
  zoomLevel: zoomLevel.value,
}));

// 列定义
const columns: GridColumn[] = [
  {
    title: '姓名',
    width: 150,
    icon: 'user',
  },
  {
    title: '年龄',
    width: 100,
    icon: 'calendar',
  },
  {
    title: '职业',
    width: 200,
    icon: 'briefcase',
  },
  {
    title: '城市',
    width: 150,
    icon: 'location',
  },
];

// 行数
const rows = 100;

// 获取单元格内容
const getCellContent = (cell: Item) => {
  const [col, row] = cell;
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `用户 ${row + 1}`,
      allowOverlay: true,
      displayData: `用户 ${row + 1}`,
    };
  } else if (col === 1) {
    return {
      kind: GridCellKind.Number,
      data: 20 + (row % 50),
      allowOverlay: true,
      displayData: `${20 + (row % 50)}`,
    };
  } else if (col === 2) {
    const jobs = ['工程师', '设计师', '产品经理', '销售', '市场', '人力资源'];
    return {
      kind: GridCellKind.Text,
      data: jobs[row % jobs.length],
      allowOverlay: true,
      displayData: jobs[row % jobs.length],
    };
  } else {
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
    return {
      kind: GridCellKind.Text,
      data: cities[row % cities.length],
      allowOverlay: true,
      displayData: cities[row % cities.length],
    };
  }
};

// 键盘快捷键
const keyboardShortcuts = [
  { key: 'Tab', description: '导航到下一个单元格' },
  { key: 'Shift+Tab', description: '导航到上一个单元格' },
  { key: 'Arrow Keys', description: '方向键导航' },
  { key: 'Enter', description: '编辑单元格' },
  { key: 'Escape', description: '取消编辑' },
  { key: 'Ctrl+C', description: '复制' },
  { key: 'Ctrl+V', description: '粘贴' },
  { key: 'Ctrl+Z', description: '撤销' },
  { key: 'Ctrl+Y', description: '重做' },
  { key: 'Ctrl+A', description: '全选' },
  { key: 'F2', description: '编辑单元格' },
  { key: 'Delete', description: '删除内容' },
  { key: 'Ctrl+Plus', description: '放大' },
  { key: 'Ctrl+Minus', description: '缩小' },
  { key: 'Ctrl+0', description: '重置缩放' },
  { key: 'Alt+H', description: '切换高对比度' },
  { key: 'Alt+S', description: '切换屏幕阅读器模式' },
  { key: 'F1', description: '显示快捷键帮助' },
];

// 方法
const toggleHighContrast = () => {
  highContrastMode.value = !highContrastMode.value;
  updateTheme();
};

const toggleScreenReader = () => {
  screenReaderMode.value = !screenReaderMode.value;
};

const increaseZoom = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
};

const decreaseZoom = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5);
};

const resetZoom = () => {
  zoomLevel.value = 1;
};

const toggleShortcutsHelp = () => {
  showShortcutsHelp.value = !showShortcutsHelp.value;
};

const updateTheme = () => {
  if (highContrastMode.value) {
    // 高对比度主题
    theme.bgCell = '#000000';
    theme.bgCellMedium = '#1a1a1a';
    theme.bgHeader = '#333333';
    theme.textDark = '#ffffff';
    theme.textLight = '#cccccc';
    theme.textHeader = '#ffffff';
    theme.accentColor = '#00ff00';
    theme.accentLight = '#003300';
  } else {
    // 默认主题
    theme.bgCell = '#ffffff';
    theme.bgCellMedium = '#f5f5f5';
    theme.bgHeader = '#f1f1f1';
    theme.textDark = '#333333';
    theme.textLight = '#666666';
    theme.textHeader = '#444444';
    theme.accentColor = '#4285f4';
    theme.accentLight = '#d4e3fc';
  }
};

const onSelectionChanged = (selection: { cell: Item; range: any }) => {
  currentSelection.value = selection;
};

const onCellActivated = (cell: Item) => {
  console.log('Cell activated:', cell);
};

// 生命周期
onMounted(() => {
  updateTheme();
});
</script>

<style scoped>
.accessibility-example {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #e0e0e0;
}

.controls button.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

.zoom-indicator {
  margin-bottom: 10px;
  font-weight: bold;
}

.grid-container {
  overflow: auto;
  max-width: 100%;
  max-height: 500px;
  border: 1px solid #ccc;
  margin-bottom: 20px;
}

.status-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.status-info p {
  margin: 5px 0;
}
</style>