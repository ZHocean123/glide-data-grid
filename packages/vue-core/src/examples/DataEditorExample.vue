<template>
  <div class="example-container">
    <h1>Vue DataGrid Example</h1>
    
    <div class="controls">
      <button @click="addRow">Add Row</button>
      <button @click="addColumn">Add Column</button>
      <button @click="clearData">Clear Data</button>
      <button @click="loadSampleData">Load Sample Data</button>
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
        @cell-activated="onCellActivated"
        @cell-clicked="onCellClicked"
        @cell-edited="onCellEdited"
        @selection-changed="onSelectionChanged"
      />
    </div>
    
    <div class="info-panel">
      <h3>Current Selection</h3>
      <p v-if="currentSelection">
        Cell: [{{ currentSelection.cell[0] }}, {{ currentSelection.cell[1] }}]
        <br>
        Range: {{ currentSelection.range.x }}, {{ currentSelection.range.y }}, 
        {{ currentSelection.range.width }}x{{ currentSelection.range.height }}
      </p>
      <p v-else>No selection</p>
      
      <h3>Last Edited Cell</h3>
      <p v-if="lastEditedCell">
        Cell: [{{ lastEditedCell[0] }}, {{ lastEditedCell[1] }}] = {{ lastEditedValue }}
      </p>
      <p v-else>No edits yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind } from '../internal/data-grid/data-grid-types.js';

// 网格数据
const columns = ref([
  { title: 'ID', width: 100 },
  { title: 'Name', width: 200 },
  { title: 'Age', width: 100 },
  { title: 'Active', width: 100 }
]);

const rows = ref(5);

// 数据存储
const data = reactive<Record<string, any>>({});

// 当前选择
const currentSelection = ref<any>(null);

// 最后编辑的单元格
const lastEditedCell = ref<[number, number] | null>(null);
const lastEditedValue = ref<any>(null);

// 获取单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  const key = `${col}-${row}`;
  
  if (!data[key]) {
    // 初始化默认值
    if (col === 0) {
      // ID列
      data[key] = {
        kind: GridCellKind.Number,
        data: row + 1,
        allowOverlay: true
      };
    } else if (col === 1) {
      // Name列
      data[key] = {
        kind: GridCellKind.Text,
        data: `Item ${row + 1}`,
        allowOverlay: true
      };
    } else if (col === 2) {
      // Age列
      data[key] = {
        kind: GridCellKind.Number,
        data: Math.floor(Math.random() * 50) + 20,
        allowOverlay: true
      };
    } else if (col === 3) {
      // Active列
      data[key] = {
        kind: GridCellKind.Boolean,
        data: Math.random() > 0.5,
        allowOverlay: false
      };
    } else {
      // 其他列
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
const onCellActivated = (item: [number, number]) => {
  console.log('Cell activated:', item);
};

const onCellClicked = (item: [number, number]) => {
  console.log('Cell clicked:', item);
};

const onCellEdited = (item: [number, number], newValue: any) => {
  console.log('Cell edited:', item, newValue);
  
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

const onSelectionChanged = (selection: any) => {
  console.log('Selection changed:', selection);
  currentSelection.value = selection;
};

// 控制函数
const addRow = () => {
  rows.value++;
};

const addColumn = () => {
  columns.value.push({
    title: `Column ${columns.value.length + 1}`,
    width: 150
  });
};

const clearData = () => {
  Object.keys(data).forEach(key => delete data[key]);
  rows.value = 0;
  setTimeout(() => {
    rows.value = 5;
  }, 0);
};

const loadSampleData = () => {
  // 加载示例数据
  const sampleNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  
  for (let row = 0; row < rows.value; row++) {
    for (let col = 0; col < columns.value.length; col++) {
      const key = `${col}-${row}`;
      
      if (col === 0) {
        // ID列
        data[key] = {
          kind: GridCellKind.Number,
          data: row + 1,
          allowOverlay: true
        };
      } else if (col === 1) {
        // Name列
        data[key] = {
          kind: GridCellKind.Text,
          data: sampleNames[row % sampleNames.length],
          allowOverlay: true
        };
      } else if (col === 2) {
        // Age列
        data[key] = {
          kind: GridCellKind.Number,
          data: Math.floor(Math.random() * 50) + 20,
          allowOverlay: true
        };
      } else if (col === 3) {
        // Active列
        data[key] = {
          kind: GridCellKind.Boolean,
          data: Math.random() > 0.5,
          allowOverlay: false
        };
      } else {
        // 其他列
        data[key] = {
          kind: GridCellKind.Text,
          data: `Data ${row + 1}-${col}`,
          allowOverlay: true
        };
      }
    }
  }
};

// 初始化示例数据
loadSampleData();
</script>

<style scoped>
.example-container {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.controls {
  margin-bottom: 20px;
}

.controls button {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #005a9e;
}

.grid-container {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.info-panel {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.info-panel h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.info-panel p {
  margin: 4px 0;
  font-family: monospace;
}
</style>