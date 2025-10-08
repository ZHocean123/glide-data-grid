<template>
  <div class="accessibility-demo">
    <h1>无障碍功能演示</h1>
    
    <div class="description">
      <p>这个示例展示了Vue Data Grid的无障碍功能，包括键盘导航、屏幕阅读器支持、高对比度模式和其他辅助功能。</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <h3>辅助功能选项</h3>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.screenReaderMode" />
          屏幕阅读器模式
        </label>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.highContrastMode" />
          高对比度模式
        </label>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.keyboardNavigation" />
          增强键盘导航
        </label>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.announceChanges" />
          公告变化
        </label>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.focusIndicators" />
          增强焦点指示器
        </label>
      </div>
      
      <div class="control-group">
        <h3>视觉辅助</h3>
        <label>
          字体大小:
          <select v-model="fontSize" @change="updateFontSize">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
            <option value="xlarge">特大</option>
          </select>
        </label>
        <label>
          缩放级别: {{ Math.round(zoomLevel * 100) }}%
          <input 
            type="range" 
            min="50" 
            max="200" 
            step="10" 
            v-model="zoomLevelPercent" 
            @input="updateZoomLevel"
          />
        </label>
      </div>
      
      <div class="control-group">
        <h3>键盘快捷键</h3>
        <button @click="showKeyboardHelp = !showKeyboardHelp">
          {{ showKeyboardHelp ? '隐藏' : '显示' }}键盘快捷键帮助
        </button>
        <button @click="testKeyboardNavigation">测试键盘导航</button>
        <button @click="testScreenReader">测试屏幕阅读器</button>
      </div>
    </div>
    
    <div class="grid-container" :style="gridContainerStyle">
      <DataEditor
        ref="gridRef"
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="800"
        :height="400"
        :row-height="rowHeight"
        :accessibility-options="accessibilityOptions"
        :theme="currentTheme"
        :aria-label="ariaLabel"
        :aria-describedby="ariaDescribedBy"
        @selection-changed="onSelectionChanged"
        @cell-activated="onCellActivated"
        @cell-edited="onCellEdited"
        @focus-changed="onFocusChanged"
        @accessibility-announcement="onAccessibilityAnnouncement"
      />
      
      <!-- 屏幕阅读器公告区域 -->
      <div 
        ref="announcementRegion"
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ announcementText }}
      </div>
    </div>
    
    <div class="status-panel">
      <h3>当前状态</h3>
      <p>焦点位置: {{ focusPosition }}</p>
      <p>选中单元格: {{ selectedCell }}</p>
      <p>最后公告: {{ lastAnnouncement }}</p>
      <p>键盘焦点: {{ keyboardFocus }}</p>
    </div>
    
    <!-- 键盘快捷键帮助 -->
    <div v-if="showKeyboardHelp" class="keyboard-help">
      <h3>键盘快捷键</h3>
      <table>
        <thead>
          <tr>
            <th>快捷键</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="shortcut in keyboardShortcuts" :key="shortcut.key">
            <td>{{ shortcut.key }}</td>
            <td>{{ shortcut.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 屏幕阅读器测试区域 -->
    <div v-if="showScreenReaderTest" class="screen-reader-test">
      <h3>屏幕阅读器测试</h3>
      <p>这个区域用于测试屏幕阅读器的兼容性。请使用屏幕阅读器软件（如NVDA、JAWS或VoiceOver）来测试以下功能：</p>
      <ul>
        <li>单元格内容的朗读</li>
        <li>行列标题的朗读</li>
        <li>选择变化的公告</li>
        <li>编辑状态的提示</li>
        <li>错误消息的公告</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind } from '../internal/data-grid/data-grid-types.js';

// 组件引用
const gridRef = ref();
const announcementRegion = ref<HTMLElement | null>(null);

// 状态管理
const showKeyboardHelp = ref(false);
const showScreenReaderTest = ref(false);
const fontSize = ref('medium');
const zoomLevelPercent = ref(100);
const zoomLevel = ref(1);

// 辅助功能选项
const accessibilityOptions = reactive({
  screenReaderMode: true,
  highContrastMode: false,
  keyboardNavigation: true,
  announceChanges: true,
  focusIndicators: true
});

// 状态信息
const focusPosition = ref('无');
const selectedCell = ref('无');
const lastAnnouncement = ref('无');
const keyboardFocus = ref('网格');
const announcementText = ref('');

// 列定义
const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '城市', width: 150 },
  { title: '职业', width: 200 },
  { title: '状态', width: 100 }
]);

// 行数
const rows = ref(20);

// 行高（根据字体大小调整）
const rowHeight = computed(() => {
  const sizes = {
    small: 28,
    medium: 32,
    large: 40,
    xlarge: 48
  };
  return sizes[fontSize.value as keyof typeof sizes];
});

// 网格容器样式
const gridContainerStyle = computed(() => ({
  fontSize: fontSize.value === 'small' ? '14px' : 
           fontSize.value === 'medium' ? '16px' : 
           fontSize.value === 'large' ? '18px' : '20px',
  transform: `scale(${zoomLevel.value})`,
  transformOrigin: 'top left'
}));

// 当前主题
const currentTheme = computed(() => {
  if (accessibilityOptions.highContrastMode) {
    return {
      bgCell: '#000000',
      bgCellMedium: '#1a1a1a',
      bgHeader: '#333333',
      textDark: '#ffffff',
      textLight: '#cccccc',
      textHeader: '#ffffff',
      accentColor: '#00ff00',
      accentLight: '#003300',
      borderColor: '#ffffff',
      focusColor: '#ffff00'
    };
  }
  
  return {
    bgCell: '#ffffff',
    bgCellMedium: '#f5f5f5',
    bgHeader: '#f1f1f1',
    textDark: '#333333',
    textLight: '#666666',
    textHeader: '#444444',
    accentColor: '#4285f4',
    accentLight: '#d4e3fc',
    borderColor: '#e0e0e0',
    focusColor: '#4285f4'
  };
});

// ARIA 属性
const ariaLabel = computed(() => 
  accessibilityOptions.screenReaderMode ? '数据表格，使用方向键导航，Enter键编辑' : undefined
);

const ariaDescribedBy = computed(() => 
  accessibilityOptions.screenReaderMode ? 'grid-status' : undefined
);

// 键盘快捷键
const keyboardShortcuts = [
  { key: 'Tab', description: '导航到下一个单元格' },
  { key: 'Shift + Tab', description: '导航到上一个单元格' },
  { key: '↑ ↓ ← →', description: '方向键导航' },
  { key: 'Enter', description: '编辑当前单元格' },
  { key: 'Escape', description: '取消编辑' },
  { key: 'F2', description: '编辑当前单元格' },
  { key: 'Space', description: '选择或取消选择当前单元格' },
  { key: 'Ctrl + A', description: '全选' },
  { key: 'Ctrl + C', description: '复制选中内容' },
  { key: 'Ctrl + V', description: '粘贴内容' },
  { key: 'Ctrl + X', description: '剪切选中内容' },
  { key: 'Ctrl + Z', description: '撤销' },
  { key: 'Ctrl + Y', description: '重做' },
  { key: 'Delete', description: '删除当前单元格内容' },
  { key: 'Home', description: '移动到行首' },
  { key: 'End', description: '移动到行尾' },
  { key: 'Page Up', description: '向上翻页' },
  { key: 'Page Down', description: '向下翻页' },
  { key: 'Ctrl + Home', description: '移动到表格开始' },
  { key: 'Ctrl + End', description: '移动到表格末尾' },
  { key: 'Alt + H', description: '切换高对比度模式' },
  { key: 'Alt + S', description: '切换屏幕阅读器模式' },
  { key: 'F1', description: '显示快捷键帮助' }
];

// 获取单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];
  const jobs = ['工程师', '设计师', '产品经理', '销售', '市场', '教师', '医生', '律师'];
  const statuses = ['活跃', '非活跃', '待定'];
  
  switch (col) {
    case 0: // 姓名列
      return {
        kind: GridCellKind.Text,
        data: names[row % names.length],
        allowOverlay: true,
        ariaLabel: `姓名，${names[row % names.length]}`
      };
    case 1: // 年龄列
      return {
        kind: GridCellKind.Number,
        data: 20 + (row % 50),
        allowOverlay: true,
        ariaLabel: `年龄，${20 + (row % 50)}岁`
      };
    case 2: // 城市列
      return {
        kind: GridCellKind.Text,
        data: cities[row % cities.length],
        allowOverlay: true,
        ariaLabel: `城市，${cities[row % cities.length]}`
      };
    case 3: // 职业列
      return {
        kind: GridCellKind.Text,
        data: jobs[row % jobs.length],
        allowOverlay: true,
        ariaLabel: `职业，${jobs[row % jobs.length]}`
      };
    case 4: // 状态列
      return {
        kind: GridCellKind.Text,
        data: statuses[row % statuses.length],
        allowOverlay: true,
        ariaLabel: `状态，${statuses[row % statuses.length]}`
      };
    default:
      return {
        kind: GridCellKind.Text,
        data: '',
        allowOverlay: true
      };
  }
};

// 事件处理器
const onSelectionChanged = (selection: any) => {
  if (selection && selection.cell) {
    const [col, row] = selection.cell;
    const colTitle = columns.value[col]?.title || `列 ${col + 1}`;
    selectedCell.value = `${colTitle}，行 ${row + 1}`;
    
    if (accessibilityOptions.announceChanges) {
      announce(`选中了${colTitle}，行 ${row + 1}`);
    }
  }
};

const onCellActivated = (item: [number, number]) => {
  const [col, row] = item;
  const colTitle = columns.value[col]?.title || `列 ${col + 1}`;
  focusPosition.value = `${colTitle}，行 ${row + 1}`;
  
  if (accessibilityOptions.announceChanges) {
    announce(`激活了${colTitle}，行 ${row + 1}`);
  }
};

const onCellEdited = (item: [number, number], newValue: any) => {
  const [col, row] = item;
  const colTitle = columns.value[col]?.title || `列 ${col + 1}`;
  
  if (accessibilityOptions.announceChanges) {
    announce(`${colTitle}，行 ${row + 1}已更改为${newValue}`);
  }
};

const onFocusChanged = (element: string) => {
  keyboardFocus.value = element;
};

const onAccessibilityAnnouncement = (message: string) => {
  announce(message);
};

// 公告方法
const announce = (message: string) => {
  announcementText.value = message;
  lastAnnouncement.value = message;
  
  // 清空之前的公告
  nextTick(() => {
    if (announcementRegion.value) {
      announcementRegion.value.textContent = message;
      
      // 清空公告区域，以便下次可以公告相同的内容
      setTimeout(() => {
        if (announcementRegion.value) {
          announcementRegion.value.textContent = '';
        }
      }, 100);
    }
  });
};

// 控制方法
const updateFontSize = () => {
  // 字体大小变化时可能需要重新计算布局
  nextTick(() => {
    if (gridRef.value) {
      // 通知网格重新计算布局
      gridRef.value.recalculateLayout?.();
    }
  });
};

const updateZoomLevel = () => {
  zoomLevel.value = zoomLevelPercent.value / 100;
};

const testKeyboardNavigation = () => {
  announce('键盘导航测试已开始。使用Tab键或方向键在网格中导航。');
  if (gridRef.value) {
    gridRef.value.focus?.();
  }
};

const testScreenReader = () => {
  showScreenReaderTest.value = !showScreenReaderTest.value;
  announce(showScreenReaderTest.value ? '屏幕阅读器测试区域已显示' : '屏幕阅读器测试区域已隐藏');
};

// 生命周期
onMounted(() => {
  // 设置初始焦点
  if (gridRef.value) {
    gridRef.value.focus?.();
  }
  
  // 监听全局键盘事件
  document.addEventListener('keydown', handleGlobalKeyDown);
});

// 清理
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // Alt + H: 切换高对比度模式
  if (event.altKey && event.key === 'h') {
    accessibilityOptions.highContrastMode = !accessibilityOptions.highContrastMode;
    announce(accessibilityOptions.highContrastMode ? '高对比度模式已开启' : '高对比度模式已关闭');
  }
  
  // Alt + S: 切换屏幕阅读器模式
  if (event.altKey && event.key === 's') {
    accessibilityOptions.screenReaderMode = !accessibilityOptions.screenReaderMode;
    announce(accessibilityOptions.screenReaderMode ? '屏幕阅读器模式已开启' : '屏幕阅读器模式已关闭');
  }
  
  // F1: 显示快捷键帮助
  if (event.key === 'F1') {
    event.preventDefault();
    showKeyboardHelp.value = !showKeyboardHelp.value;
    announce(showKeyboardHelp.value ? '键盘快捷键帮助已显示' : '键盘快捷键帮助已隐藏');
  }
};
</script>

<style scoped>
.accessibility-demo {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.description {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #0ea5e9;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}

.control-group h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.control-group button {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.control-group button:hover {
  background-color: #3367d6;
}

.grid-container {
  margin-bottom: 20px;
  border: 2px solid;
  border-color: v-bind('currentTheme.borderColor');
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-panel {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.status-panel h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.status-panel p {
  margin: 6px 0;
  color: #555;
  font-family: monospace;
}

.keyboard-help {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.keyboard-help h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.keyboard-help table {
  width: 100%;
  border-collapse: collapse;
}

.keyboard-help th,
.keyboard-help td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.keyboard-help th {
  background-color: #f1f1f1;
  font-weight: 600;
  color: #333;
}

.screen-reader-test {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #0ea5e9;
}

.screen-reader-test h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #0c4a6e;
}

.screen-reader-test p {
  margin-bottom: 12px;
  color: #0c4a6e;
}

.screen-reader-test ul {
  margin: 0;
  padding-left: 20px;
}

.screen-reader-test li {
  margin-bottom: 6px;
  color: #0c4a6e;
}

/* 屏幕阅读器专用样式 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* 高对比度模式样式 */
:deep(.high-contrast) {
  border-color: #ffffff !important;
  box-shadow: 0 0 0 2px #ffffff !important;
}

:deep(.high-contrast:focus) {
  outline: 2px solid #ffff00 !important;
  outline-offset: 2px !important;
}

/* 增强焦点指示器 */
:deep(.enhanced-focus:focus) {
  outline: 3px solid v-bind('currentTheme.focusColor') !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 2px v-bind('currentTheme.focusColor') !important;
}
</style>