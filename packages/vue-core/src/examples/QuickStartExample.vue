<template>
  <div class="quick-start-example">
    <h1>快速入门示例</h1>
    
    <div class="description">
      <p>这是最简单的Vue Data Grid使用示例，只需要几行代码就可以创建一个功能完整的数据表格。</p>
    </div>
    
    <div class="code-block">
      <h3>核心代码</h3>
      <pre><code><template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="400"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DataEditor } from '@glideapps/vue-data-grid';
import { GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(5);

const getCellContent = ([col, row]) => {
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `用户 ${row + 1}`,
      allowOverlay: true
    };
  } else {
    return {
      kind: GridCellKind.Number,
      data: 20 + row,
      allowOverlay: true
    };
  }
};
</script></code></pre>
    </div>
    
    <div class="grid-container">
      <DataEditor
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="800"
        :height="300"
        :row-height="32"
      />
    </div>
    
    <div class="features">
      <h3>开箱即用的功能</h3>
      <ul>
        <li>✅ 点击单元格进行编辑</li>
        <li>✅ 使用Tab键在单元格间导航</li>
        <li>✅ 使用方向键移动选择</li>
        <li>✅ 点击列标题进行排序</li>
        <li>✅ 调整列宽</li>
        <li>✅ 复制和粘贴数据</li>
        <li>✅ 键盘快捷键支持</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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

// 获取单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京'];
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
</script>

<style scoped>
.quick-start-example {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1000px;
  margin: 0 auto;
}

.description {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #0ea5e9;
}

.code-block {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.code-block h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #334155;
}

.code-block pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.grid-container {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.features {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.features h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #334155;
}

.features ul {
  margin: 0;
  padding-left: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.features li {
  margin: 4px 0;
  color: #475569;
}
</style>