<template>
  <div class="advanced-example">
    <h1>高级功能示例</h1>
    
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <!-- 自定义单元格示例 -->
    <div v-if="activeTab === 'custom-cells'" class="tab-content">
      <h2>自定义单元格</h2>
      <p>这个示例展示了如何创建不同类型的自定义单元格，包括进度条、星级评分、标签和按钮。</p>
      
      <div class="grid-container">
        <DataEditor
          :columns="customColumns"
          :rows="rows"
          :get-cell-content="getCustomCellContent"
          :width="900"
          :height="400"
          :row-height="40"
          :custom-renderers="customRenderers"
          @cell-clicked="onCustomCellClicked"
        />
      </div>
    </div>
    
    <!-- 主题示例 -->
    <div v-if="activeTab === 'themes'" class="tab-content">
      <h2>主题定制</h2>
      <p>这个示例展示了如何应用不同的主题样式。</p>
      
      <div class="theme-controls">
        <button 
          v-for="theme in themes" 
          :key="theme.id"
          :class="{ active: currentTheme === theme.id }"
          @click="applyTheme(theme.id)"
        >
          {{ theme.name }}
        </button>
      </div>
      
      <div class="grid-container">
        <DataEditor
          :columns="columns"
          :rows="rows"
          :get-cell-content="getCellContent"
          :width="800"
          :height="400"
          :row-height="32"
          :theme="currentThemeObj"
        />
      </div>
    </div>
    
    <!-- 事件处理示例 -->
    <div v-if="activeTab === 'events'" class="tab-content">
      <h2>事件处理</h2>
      <p>这个示例展示了如何处理各种网格事件。</p>
      
      <div class="grid-container">
        <DataEditor
          :columns="columns"
          :rows="rows"
          :get-cell-content="getCellContent"
          :width="800"
          :height="400"
          :row-height="32"
          @cell-clicked="onCellClicked"
          @cell-activated="onCellActivated"
          @cell-edited="onCellEdited"
          @header-clicked="onHeaderClicked"
          @selection-changed="onSelectionChanged"
        />
      </div>
      
      <div class="event-log">
        <h3>事件日志</h3>
        <div class="log-container">
          <div 
            v-for="(event, index) in eventLog" 
            :key="index"
            class="log-entry"
          >
            <span class="log-time">{{ event.time }}</span>
            <span class="log-type">{{ event.type }}</span>
            <span class="log-data">{{ event.data }}</span>
          </div>
        </div>
        <button @click="clearLog">清空日志</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind, type GridColumn } from '../internal/data-grid/data-grid-types.js';

// 标签页管理
const activeTab = ref('custom-cells');
const tabs = [
  { id: 'custom-cells', name: '自定义单元格' },
  { id: 'themes', name: '主题' },
  { id: 'events', name: '事件处理' }
];

// 基础数据
const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '城市', width: 150 },
  { title: '职业', width: 200 }
]);

const customColumns = ref([
  { title: '任务名称', width: 200 },
  { title: '进度', width: 150 },
  { title: '优先级', width: 100 },
  { title: '标签', width: 200 },
  { title: '操作', width: 100 }
]);

const rows = ref(10);

// 自定义单元格渲染器
const customRenderers = reactive({
  progress: {
    kind: GridCellKind.Custom,
    draw: (cell: any, ctx: CanvasRenderingContext2D, rect: any) => {
      const { data } = cell;
      const progress = typeof data === 'number' ? data : 0;
      
      // 绘制背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(rect.x, rect.y + 10, rect.width - 20, 20);
      
      // 绘制进度条
      ctx.fillStyle = progress > 70 ? '#4caf50' : progress > 30 ? '#ff9800' : '#f44336';
      ctx.fillRect(rect.x, rect.y + 10, (rect.width - 20) * (progress / 100), 20);
      
      // 绘制文本
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${progress}%`, rect.x + rect.width / 2, rect.y + 25);
    },
    provideEditor: () => null
  },
  
  rating: {
    kind: GridCellKind.Custom,
    draw: (cell: any, ctx: CanvasRenderingContext2D, rect: any) => {
      const { data } = cell;
      const rating = typeof data === 'number' ? data : 0;
      
      ctx.fillStyle = '#ffc107';
      ctx.font = '16px Arial';
      
      for (let i = 0; i < 5; i++) {
        const x = rect.x + 10 + i * 20;
        const y = rect.y + 15;
        
        if (i < rating) {
          ctx.fillText('★', x, y);
        } else {
          ctx.fillText('☆', x, y);
        }
      }
    },
    provideEditor: () => null
  },
  
  tags: {
    kind: GridCellKind.Custom,
    draw: (cell: any, ctx: CanvasRenderingContext2D, rect: any) => {
      const { data } = cell;
      const tags = Array.isArray(data) ? data : [];
      
      let x = rect.x + 10;
      const y = rect.y + 15;
      
      tags.forEach((tag: string, index: number) => {
        if (index > 0 && x > rect.width - 100) return; // 防止溢出
        
        const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
        const color = colors[index % colors.length];
        
        // 绘制标签背景
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 10, 60, 20);
        
        // 绘制标签文本
        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(tag.substring(0, 8), x + 30, y + 2);
        
        x += 70;
      });
    },
    provideEditor: () => null
  },
  
  button: {
    kind: GridCellKind.Custom,
    draw: (cell: any, ctx: CanvasRenderingContext2D, rect: any) => {
      const { data } = cell;
      const text = typeof data === 'string' ? data : '按钮';
      
      // 绘制按钮背景
      ctx.fillStyle = '#2196f3';
      ctx.fillRect(rect.x + 10, rect.y + 5, rect.width - 20, 30);
      
      // 绘制按钮文本
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, rect.x + rect.width / 2, rect.y + 25);
    },
    provideEditor: () => null,
    onClick: (cell: any) => {
      console.log('按钮被点击:', cell);
    }
  }
});

// 获取自定义单元格内容
const getCustomCellContent = ([col, row]: [number, number]) => {
  const tasks = ['设计UI', '开发功能', '测试代码', '部署应用', '文档编写'];
  const priorities = [1, 2, 3, 4, 5];
  const tagSets = [
    ['前端', '紧急'],
    ['后端', '重要'],
    ['测试', '常规'],
    ['部署', '高优先级'],
    ['文档', '低优先级']
  ];
  
  switch (col) {
    case 0: // 任务名称
      return {
        kind: GridCellKind.Text,
        data: tasks[row % tasks.length],
        allowOverlay: true
      };
    case 1: // 进度
      return {
        kind: GridCellKind.Custom,
        data: Math.floor(Math.random() * 100),
        allowOverlay: false,
        customRenderer: 'progress'
      };
    case 2: // 优先级
      return {
        kind: GridCellKind.Custom,
        data: priorities[row % priorities.length],
        allowOverlay: false,
        customRenderer: 'rating'
      };
    case 3: // 标签
      return {
        kind: GridCellKind.Custom,
        data: tagSets[row % tagSets.length],
        allowOverlay: false,
        customRenderer: 'tags'
      };
    case 4: // 操作
      return {
        kind: GridCellKind.Custom,
        data: '查看',
        allowOverlay: false,
        customRenderer: 'button'
      };
    default:
      return {
        kind: GridCellKind.Text,
        data: '',
        allowOverlay: true
      };
  }
};

// 获取基础单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  const names = ['张三', '李四', '王五', '赵六', '钱七'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州'];
  const jobs = ['工程师', '设计师', '产品经理', '销售', '市场'];
  
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: names[row % names.length],
      allowOverlay: true
    };
  } else if (col === 1) {
    return {
      kind: GridCellKind.Number,
      data: 20 + (row % 30),
      allowOverlay: true
    };
  } else if (col === 2) {
    return {
      kind: GridCellKind.Text,
      data: cities[row % cities.length],
      allowOverlay: true
    };
  } else {
    return {
      kind: GridCellKind.Text,
      data: jobs[row % jobs.length],
      allowOverlay: true
    };
  }
};

// 主题相关
const currentTheme = ref('default');
const themes = [
  { id: 'default', name: '默认主题' },
  { id: 'dark', name: '深色主题' },
  { id: 'blue', name: '蓝色主题' },
  { id: 'green', name: '绿色主题' }
];

const themeDefinitions = reactive({
  default: {
    bgCell: '#ffffff',
    bgCellMedium: '#f5f5f5',
    bgHeader: '#f1f1f1',
    textDark: '#333333',
    textLight: '#666666',
    textHeader: '#444444',
    accentColor: '#4285f4',
    accentLight: '#d4e3fc'
  },
  dark: {
    bgCell: '#2d2d2d',
    bgCellMedium: '#3d3d3d',
    bgHeader: '#4d4d4d',
    textDark: '#ffffff',
    textLight: '#cccccc',
    textHeader: '#ffffff',
    accentColor: '#64b5f6',
    accentLight: '#1a237e'
  },
  blue: {
    bgCell: '#e3f2fd',
    bgCellMedium: '#bbdefb',
    bgHeader: '#90caf9',
    textDark: '#0d47a1',
    textLight: '#1565c0',
    textHeader: '#ffffff',
    accentColor: '#2196f3',
    accentLight: '#e3f2fd'
  },
  green: {
    bgCell: '#e8f5e8',
    bgCellMedium: '#c8e6c9',
    bgHeader: '#a5d6a7',
    textDark: '#1b5e20',
    textLight: '#2e7d32',
    textHeader: '#ffffff',
    accentColor: '#4caf50',
    accentLight: '#e8f5e8'
  }
});

const currentThemeObj = computed(() => themeDefinitions[currentTheme.value as keyof typeof themeDefinitions]);

const applyTheme = (themeId: string) => {
  currentTheme.value = themeId;
};

// 事件处理
const eventLog = ref<Array<{time: string, type: string, data: string}>>([]);

const addLogEntry = (type: string, data: string) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  eventLog.value.unshift({ time, type, data });
  
  // 限制日志数量
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50);
  }
};

const onCustomCellClicked = ([col, row]: [number, number]) => {
  if (col === 4) { // 操作列
    addLogEntry('按钮点击', `行 ${row + 1} 的操作按钮被点击`);
  }
};

const onCellClicked = ([col, row]: [number, number]) => {
  addLogEntry('单元格点击', `列 ${col + 1}, 行 ${row + 1}`);
};

const onCellActivated = ([col, row]: [number, number]) => {
  addLogEntry('单元格激活', `列 ${col + 1}, 行 ${row + 1}`);
};

const onCellEdited = ([col, row]: [number, number], newValue: any) => {
  addLogEntry('单元格编辑', `列 ${col + 1}, 行 ${row + 1} = ${newValue}`);
};

const onHeaderClicked = (col: number) => {
  addLogEntry('表头点击', `列 ${col + 1}`);
};

const onSelectionChanged = (selection: any) => {
  if (selection && selection.cell) {
    addLogEntry('选择变化', `当前选中: 列 ${selection.cell[0] + 1}, 行 ${selection.cell[1] + 1}`);
  }
};

const clearLog = () => {
  eventLog.value = [];
};
</script>

<style scoped>
.advanced-example {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #333;
}

.tabs button.active {
  border-bottom-color: #4285f4;
  color: #4285f4;
  font-weight: 600;
}

.tab-content {
  margin-top: 20px;
}

.grid-container {
  margin: 20px 0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.theme-controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-controls button:hover {
  background-color: #e0e0e0;
}

.theme-controls button.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

.event-log {
  margin-top: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.event-log h3 {
  margin-top: 0;
  margin-bottom: 12px;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.log-entry {
  display: flex;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  margin-right: 12px;
  min-width: 60px;
}

.log-type {
  color: #4285f4;
  margin-right: 12px;
  min-width: 100px;
  font-weight: 500;
}

.log-data {
  color: #333;
  flex: 1;
}

.event-log button {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.event-log button:hover {
  background-color: #e0e0e0;
}
</style>