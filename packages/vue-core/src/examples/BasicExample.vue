<template>
  <div class="example-container">
    <h2>Vue Glide Data Grid - 基本示例</h2>
    <DataEditor
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :grid-selection="gridSelection"
      @update:grid-selection="handleGridSelectionChange"
      @cell-clicked="handleCellClicked"
      @cell-activated="handleCellActivated"
      width="800"
      height="600"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataEditor from '../components/DataEditor.vue'
import type { GridColumn, GridCell, Item, GridSelection } from '../internal/data-grid/data-grid-types.js'

// 列定义
const columns = ref<GridColumn[]>([
  { title: 'ID', width: 80 },
  { title: '姓名', width: 120 },
  { title: '年龄', width: 80 },
  { title: '城市', width: 150 },
  { title: '职业', width: 200 }
])

// 行数
const rows = ref(100)

// 网格选择状态
const gridSelection = ref<GridSelection>({ columns: [], rows: [] })

// 获取单元格内容
const getCellContent = ([col, row]: Item): GridCell => {
  if (col === 0) {
    return {
      kind: 'text',
      data: `ID-${row + 1}`,
      allowOverlay: false
    }
  } else if (col === 1) {
    return {
      kind: 'text',
      data: `用户 ${row + 1}`,
      allowOverlay: true
    }
  } else if (col === 2) {
    return {
      kind: 'number',
      data: Math.floor(Math.random() * 50) + 20,
      allowOverlay: true
    }
  } else if (col === 3) {
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都']
    return {
      kind: 'text',
      data: cities[Math.floor(Math.random() * cities.length)],
      allowOverlay: true
    }
  } else {
    const jobs = ['工程师', '设计师', '产品经理', '运营', '市场', '销售']
    return {
      kind: 'text',
      data: jobs[Math.floor(Math.random() * jobs.length)],
      allowOverlay: true
    }
  }
}

// 事件处理
const handleGridSelectionChange = (newSelection: GridSelection) => {
  gridSelection.value = newSelection
  console.log('选择变化:', newSelection)
}

const handleCellClicked = (cell: Item, event: any) => {
  console.log('单元格点击:', cell, event)
}

const handleCellActivated = (cell: Item, event: any) => {
  console.log('单元格激活:', cell, event)
}
</script>

<style scoped>
.example-container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>
