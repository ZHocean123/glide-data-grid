<template>
  <div class="basic-example">
    <h1>Vue Data Grid 基础示例</h1>
    
    <div class="description">
      <p>这是一个简单的基础示例，展示了如何使用Vue版本的Glide Data Grid创建一个基本的数据表格。</p>
    </div>
    
    <div class="grid-container">
      <DataEditor
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="800"
        :height="400"
        :row-height="32"
        :row-marker-offset="1"
        :editable="true"
        @cell-clicked="onCellClicked"
        @cell-edited="onCellEdited"
      />
    </div>
    
    <div class="info-panel">
      <h3>表格信息</h3>
      <p>列数: {{ columns.length }}</p>
      <p>行数: {{ rows }}</p>
      <p>最后点击的单元格: {{ lastClickedCell ? `[${lastClickedCell[0]}, ${lastClickedCell[1]}]` : '无' }}</p>
      <p>最后编辑的单元格: {{ lastEditedCell ? `[${lastEditedCell[0]}, ${lastEditedCell[1]}] = ${lastEditedValue}` : '无' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind } from '../internal/data-grid/data-grid-types.js';

// 列定义
const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '城市', width: 150 },
  { title: '职业', width: 200 }
]);

// 行数
const rows = ref(10);

// 数据存储
const data = reactive<Record<string, any>>({});

// 事件状态
const lastClickedCell = ref<[number, number] | null>(null);
const lastEditedCell = ref<[number, number] | null>(null);
const lastEditedValue = ref<any>(null);

// 示例数据
const sampleNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
const sampleCities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];
const sampleJobs = ['工程师', '设计师', '产品经理', '销售', '市场', '教师', '医生', '律师'];

// 获取单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  const key = `${col}-${row}`;
  
  if (!data[key]) {
    // 初始化默认值
    switch (col) {
      case 0: // 姓名列
        data[key] = {
          kind: GridCellKind.Text,
          data: sampleNames[row % sampleNames.length],
          allowOverlay: true
        };
        break;
      case 1: // 年龄列
        data[key] = {
          kind: GridCellKind.Number,
          data: 20 + (row % 40),
          allowOverlay: true
        };
        break;
      case 2: // 城市列
        data[key] = {
          kind: GridCellKind.Text,
          data: sampleCities[row % sampleCities.length],
          allowOverlay: true
        };
        break;
      case 3: // 职业列
        data[key] = {
          kind: GridCellKind.Text,
          data: sampleJobs[row % sampleJobs.length],
          allowOverlay: true
        };
        break;
      default:
        data[key] = {
          kind: GridCellKind.Text,
          data: '',
          allowOverlay: true
        };
    }
  }
  
  return data[key];
};

// 事件处理器
const onCellClicked = (item: [number, number]) => {
  console.log('单元格被点击:', item);
  lastClickedCell.value = item;
};

const onCellEdited = (item: [number, number], newValue: any) => {
  console.log('单元格被编辑:', item, newValue);
  
  const key = `${item[0]}-${item[1]}`;
  const cell = data[key];
  
  if (cell) {
    // 更新单元格数据
    data[key] = {
      ...cell,
      data: newValue
    };
  }
  
  lastEditedCell.value = item;
  lastEditedValue.value = newValue;
};
</script>

<style scoped>
.basic-example {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1000px;
  margin: 0 auto;
}

.description {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.grid-container {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-panel {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.info-panel h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #303133;
}

.info-panel p {
  margin: 6px 0;
  color: #606266;
}
</style>