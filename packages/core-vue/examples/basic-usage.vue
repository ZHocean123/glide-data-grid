<template>
  <div class="example-container">
    <h1>Glide Data Grid Vue - Basic Usage Example</h1>
    
    <div class="controls">
      <button @click="addRow">Add Row</button>
      <button @click="clearSelection">Clear Selection</button>
      <span class="info">Selected: {{ selectedCells.length }} cells</span>
    </div>

    <div class="grid-container">
      <!-- Canvas 渲染器示例 -->
      <CanvasRenderer
        :columns="columns"
        :rows="rows"
        :getCellContent="getCellContent"
        :selection="selection"
        :theme="theme"
        @cell-clicked="handleCellClicked"
        @selection-changed="handleSelectionChanged"
        @scroll-changed="handleScrollChanged"
        width="800"
        height="400"
      />
    </div>

    <div class="info-panel">
      <h3>Grid Information</h3>
      <p>Rows: {{ rows }}, Columns: {{ columns.length }}</p>
      <p>Last Clicked: {{ lastClicked ? `[${lastClicked[0]}, ${lastClicked[1]}]` : 'None' }}</p>
      <p>Scroll Position: X: {{ scrollX }}, Y: {{ scrollY }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CanvasRenderer from '../src/components/CanvasRenderer.vue'
import type { 
  GridSelection, 
  Item, 
  GridCell, 
  GridColumn,
  TextCell,
  NumberCell
} from '../src/types/data-grid-types.js'
import { GridCellKind } from '../src/types/data-grid-types.js'
import { getDataEditorTheme } from '../src/common/styles.js'

// 响应式状态
const rows = ref(50)
const columns = ref<GridColumn[]>([
  { title: 'ID', width: 60 },
  { title: 'Name', width: 150 },
  { title: 'Age', width: 80 },
  { title: 'Email', width: 200 },
  { title: 'Status', width: 100 },
  { title: 'Score', width: 80 }
])

const selection = ref<GridSelection>({
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty()
})

const lastClicked = ref<Item | null>(null)
const scrollX = ref(0)
const scrollY = ref(0)

// 主题
const theme = computed(() => getDataEditorTheme())

// 计算属性
const selectedCells = computed(() => {
  const cells: Item[] = []
  const sel = selection.value
  
  if (sel.current) {
    const { range } = sel.current
    for (let col = range.x; col < range.x + range.width; col++) {
      for (let row = range.y; row < range.y + range.height; row++) {
        cells.push([col, row])
      }
    }
  }
  
  return cells
})

// 单元格内容获取函数
const getCellContent = (cell: Item): GridCell => {
  const [col, row] = cell
  
  // 根据列类型返回不同的单元格内容
  switch (col) {
    case 0: // ID 列
      return {
        kind: GridCellKind.Number,
        data: row + 1,
        displayData: String(row + 1),
        allowOverlay: false
      } as NumberCell
      
    case 1: // Name 列
      return {
        kind: GridCellKind.Text,
        data: `User ${row + 1}`,
        displayData: `User ${row + 1}`,
        allowOverlay: true
      } as TextCell
      
    case 2: // Age 列
      return {
        kind: GridCellKind.Number,
        data: 20 + (row % 40),
        displayData: String(20 + (row % 40)),
        allowOverlay: true
      } as NumberCell
      
    case 3: // Email 列
      return {
        kind: GridCellKind.Text,
        data: `user${row + 1}@example.com`,
        displayData: `user${row + 1}@example.com`,
        allowOverlay: true
      } as TextCell
      
    case 4: // Status 列
      const statuses = ['Active', 'Inactive', 'Pending', 'Completed']
      return {
        kind: GridCellKind.Text,
        data: statuses[row % statuses.length],
        displayData: statuses[row % statuses.length],
        allowOverlay: true
      } as TextCell
      
    case 5: // Score 列
      return {
        kind: GridCellKind.Number,
        data: Math.floor(Math.random() * 100),
        displayData: String(Math.floor(Math.random() * 100)),
        allowOverlay: true
      } as NumberCell
      
    default:
      return {
        kind: GridCellKind.Text,
        data: `Cell [${col}, ${row}]`,
        displayData: `Cell [${col}, ${row}]`,
        allowOverlay: true
      } as TextCell
  }
}

// 事件处理
const handleCellClicked = (cell: Item, event: MouseEvent) => {
  console.log('Cell clicked:', cell, event)
  lastClicked.value = cell
}

const handleSelectionChanged = (newSelection: GridSelection) => {
  console.log('Selection changed:', newSelection)
  selection.value = newSelection
}

const handleScrollChanged = (x: number, y: number) => {
  scrollX.value = x
  scrollY.value = y
}

// 操作方法
const addRow = () => {
  rows.value++
}

const clearSelection = () => {
  selection.value = {
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty()
  }
}

// 导入必要的类型
import { CompactSelection } from '../src/types/data-grid-types.js'
</script>

<style scoped>
.example-container {
  padding: 20px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.controls button {
  padding: 8px 16px;
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:hover {
  background-color: #4338CA;
}

.info {
  margin-left: 20px;
  color: #6B7280;
  font-size: 14px;
}

.grid-container {
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.info-panel {
  background-color: #F9FAFB;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #E5E7EB;
}

.info-panel h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 16px;
}

.info-panel p {
  margin: 4px 0;
  color: #6B7280;
  font-size: 14px;
}
</style>