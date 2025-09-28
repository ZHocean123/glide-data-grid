<template>
  <div class="demo-container">
    <div class="header">
      <h1>Vue3 Glide Data Grid Demo</h1>
      <p>高性能Canvas数据网格 - Vue3版本测试</p>
    </div>

    <div class="controls">
      <button @click="addRow">添加行 (当前: {{ rows }})</button>
      <button @click="changeTheme">切换主题 ({{ currentTheme }})</button>
    </div>

    <div class="grid-container">
      <DataGrid
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="1000"
        :height="400"
        @cell-clicked="onCellClicked"
      />
    </div>

    <div class="demo-info">
      <h3>功能展示</h3>
      <p>这是Vue3版本的数据网格演示，展示了基本的文本、数字和布尔类型单元格。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataGrid from '../../core/src/components/DataGrid.vue';
import { provideTheme } from '../../core/src/composables/useTheme.js';
import { createTextCell, createNumberCell, createBooleanCell } from '../../core/src/cells/index.js';
import type { GridColumn, GridCell, Item } from '../../core/src/types/base.js';

// 列定义
const columns = ref<GridColumn[]>([
  { title: 'ID', width: 80 },
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '活跃', width: 100 },
  { title: '邮箱', width: 200 },
  { title: '分数', width: 100 },
]);

// 行数
const rows = ref(50);

// 主题
const currentTheme = ref<'light' | 'dark'>('light');

const themeConfig = computed(() => {
  if (currentTheme.value === 'dark') {
    return {
      accentColor: '#3b82f6',
      textDark: '#e5e7eb',
      textMedium: '#9ca3af',
      textLight: '#6b7280',
      bgCell: '#1f2937',
      bgHeader: '#111827',
      borderColor: '#374151',
      headerFontStyle: 'bold 14px',
      baseFontStyle: '13px',
      fontFamily: 'Inter, sans-serif',
      cellHorizontalPadding: 8,
      cellVerticalPadding: 3,
    };
  }

  return {
    accentColor: '#3b82f6',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    textLight: '#9ca3af',
    bgCell: '#ffffff',
    bgHeader: '#f3f4f6',
    borderColor: '#e5e7eb',
    headerFontStyle: 'bold 14px',
    baseFontStyle: '13px',
    fontFamily: 'Inter, sans-serif',
    cellHorizontalPadding: 8,
    cellVerticalPadding: 3,
  };
});

// 提供主题给所有子组件
const { updateTheme } = provideTheme(themeConfig);

// 生成单元格内容
const getCellContent = (cell: Item): GridCell => {
  const [col, row] = cell;

  switch (col) {
    case 0: // ID
      return createTextCell(`${row + 1}`);

    case 1: // 姓名
      return createTextCell(`用户 ${row + 1}`);

    case 2: // 年龄
      return createNumberCell(20 + (row % 50));

    case 3: // 活跃
      return createBooleanCell(row % 3 !== 0);

    case 4: // 邮箱
      return createTextCell(`user${row + 1}@example.com`);

    case 5: // 分数
      return createNumberCell(Math.floor(Math.random() * 100));

    default:
      return createTextCell('');
  }
};

// 添加行
const addRow = () => {
  rows.value += 20;
};

// 切换主题
const changeTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  updateTheme(themeConfig.value);
};

// 单元格点击事件
const onCellClicked = (args: any) => {
  console.log('Cell clicked:', args);
};
</script>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 10px;
}

.header p {
  font-size: 16px;
  color: #6b7280;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.controls button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:hover {
  background: #2563eb;
}

.grid-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.demo-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-info h3 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 10px;
}

.demo-info p {
  color: #4b5563;
  line-height: 1.5;
}
</style>
