<template>
  <div class="demo-container">
    <div class="header">
      <h1>Vue3 Glide Data Grid Demo</h1>
      <p>高性能Canvas数据网格 - Vue3版本</p>
    </div>

    <div class="controls">
      <button @click="addRow">添加行</button>
      <button @click="changeTheme">切换主题</button>
      <button @click="showPerformance = !showPerformance">
        {{ showPerformance ? '隐藏' : '显示' }}性能信息
      </button>
    </div>

    <div v-if="showPerformance" class="performance-info">
      <div>总行数: {{ rows }}</div>
      <div>总列数: {{ columns.length }}</div>
      <div>单元格总数: {{ rows * columns.length }}</div>
      <div>当前主题: {{ currentTheme }}</div>
    </div>

    <div class="grid-container">
      <DataGrid
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :theme="theme"
        :width="1200"
        :height="600"
        @cell-clicked="onCellClicked"
      />
    </div>

    <div class="demo-info">
      <h3>功能展示</h3>
      <ul>
        <li>✅ 高性能Canvas渲染</li>
        <li>✅ 多种单元格类型（文本、数字、布尔、图片等）</li>
        <li>✅ 虚拟滚动支持</li>
        <li>✅ 主题切换</li>
        <li>✅ 响应式数据更新</li>
        <li>✅ TypeScript完整支持</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DataGrid } from '@vue-glide/core';
import {
  createTextCell,
  createNumberCell,
  createBooleanCell,
  createImageCell,
  createBubbleCell
} from '@vue-glide/core';
import type { GridColumn, GridCell, Item } from '@vue-glide/core';

// 列定义
const columns = ref<GridColumn[]>([
  { title: 'ID', width: 80 },
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '活跃', width: 100 },
  { title: '头像', width: 120 },
  { title: '标签', width: 200 },
  { title: '邮箱', width: 200 },
  { title: '分数', width: 100 }
]);

// 行数
const rows = ref(1000);

// 主题
const currentTheme = ref<'light' | 'dark'>('light');
const showPerformance = ref(true);

const theme = computed(() => {
  if (currentTheme.value === 'dark') {
    return {
      accentColor: '#3b82f6',
      accentLight: '#60a5fa',
      textDark: '#e5e7eb',
      textMedium: '#9ca3af',
      textLight: '#6b7280',
      textBubble: '#1f2937',
      bgIconHeader: '#374151',
      fgIconHeader: '#e5e7eb',
      textHeader: '#f3f4f6',
      textGroupHeader: '#d1d5db',
      textHeaderSelected: '#ffffff',
      bgCell: '#1f2937',
      bgCellMedium: '#374151',
      bgHeader: '#111827',
      bgHeaderHasFocus: '#1f2937',
      bgHeaderHovered: '#374151',
      bgBubble: '#374151',
      bgBubbleSelected: '#4b5563',
      bgSearchResult: '#1e3a8a',
      borderColor: '#374151',
      drilldownBorder: '#4b5563',
      linkColor: '#60a5fa',
      headerFontStyle: 'bold 14px',
      baseFontStyle: '13px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
  }

  return {
    accentColor: '#3b82f6',
    accentLight: '#dbeafe',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    textLight: '#9ca3af',
    textBubble: '#1f2937',
    bgIconHeader: '#f3f4f6',
    fgIconHeader: '#374151',
    textHeader: '#374151',
    textGroupHeader: '#6b7280',
    textHeaderSelected: '#1f2937',
    bgCell: '#ffffff',
    bgCellMedium: '#f9fafb',
    bgHeader: '#f3f4f6',
    bgHeaderHasFocus: '#e5e7eb',
    bgHeaderHovered: '#e5e7eb',
    bgBubble: '#f3f4f6',
    bgBubbleSelected: '#dbeafe',
    bgSearchResult: '#dbeafe',
    borderColor: '#e5e7eb',
    drilldownBorder: '#d1d5db',
    linkColor: '#2563eb',
    headerFontStyle: 'bold 14px',
    baseFontStyle: '13px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
});

// 生成单元格内容
const getCellContent = (cell: Item): GridCell => {
  const [col, row] = cell;

  switch (col) {
    case 0: // ID
      return createNumberCell(row + 1);

    case 1: // 姓名
      return createTextCell(`用户 ${row + 1}`);

    case 2: // 年龄
      return createNumberCell(20 + (row % 50), {
        fixedDecimals: 0
      });

    case 3: // 活跃
      return createBooleanCell(row % 3 !== 0, {
        style: 'checkbox',
        allowEdit: false
      });

    case 4: // 头像
      return createImageCell(
        `https://i.pravatar.cc/100?img=${(row % 70) + 1}`,
        { allowOverlay: false }
      );

    case 5: // 标签
      const tags = ['前端', '后端', 'Vue', 'React', 'TypeScript', 'Node.js'];
      const userTags = [
        tags[row % tags.length],
        tags[(row + 1) % tags.length]
      ];
      return createBubbleCell(userTags);

    case 6: // 邮箱
      return createTextCell(`user${row + 1}@example.com`);

    case 7: // 分数
      return createNumberCell((Math.random() * 100).toFixed(2), {
        fixedDecimals: 2
      });

    default:
      return createTextCell('');
  }
};

// 添加行
const addRow = () => {
  rows.value += 100;
};

// 切换主题
const changeTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
};

// 单元格点击事件
const onCellClicked = (args: any) => {
  console.log('Cell clicked:', args);
};
</script>

<style scoped>
.demo-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 32px;
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
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.controls button:hover {
  background: #2563eb;
}

.controls button:active {
  background: #1d4ed8;
}

.performance-info {
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.performance-info div {
  font-size: 14px;
  color: #374151;
}

.grid-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.demo-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.demo-info h3 {
  font-size: 20px;
  color: #1f2937;
  margin-bottom: 15px;
}

.demo-info ul {
  list-style: none;
}

.demo-info li {
  padding: 8px 0;
  font-size: 14px;
  color: #4b5563;
}

.demo-info li:before {
  content: '✓ ';
  color: #10b981;
  font-weight: bold;
  margin-right: 8px;
}
</style>
