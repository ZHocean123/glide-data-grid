<template>
  <div class="example-container">
    <h2>Vue DataGrid Basic Example</h2>
    <DataGrid
      :columns="columns"
      :rows="100"
      :width="800"
      :height="600"
      :headerHeight="40"
      :cellXOffset="cellXOffset"
      :cellYOffset="cellYOffset"
      :gridSelection="selection"
      :isFocused="true"
      :getCellContent="getCellContent"
      @update:gridSelection="handleSelectionChange"
      @update:cellXOffset="handleCellXOffsetChange"
      @update:cellYOffset="handleCellYOffsetChange"
      @onCellActivated="handleCellActivated"
    />

    <div class="info-panel">
      <p>Current Selection: {{ selection?.current?.cell || 'None' }}</p>
      <p>Scroll Offset: ({{ cellXOffset }}, {{ cellYOffset }})</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataGrid from '../src/components/DataGrid.vue'
import type { GridSelection, InnerGridCell, InnerGridColumn } from '../src/types'

// Grid columns
const columns = ref<InnerGridColumn[]>([
  { title: 'ID', width: 100 },
  { title: 'Name', width: 150 },
  { title: 'Age', width: 100 },
  { title: 'Email', width: 200 },
  { title: 'Status', width: 120 }
])

// Grid state
const cellXOffset = ref(0)
const cellYOffset = ref(0)
const selection = ref<GridSelection>({
  current: {
    cell: [0, 0]
  }
})

// Cell content provider
const getCellContent = ([col, row]: [number, number]): InnerGridCell => {
  switch (col) {
    case 0: // ID column
      return {
        kind: 'text',
        data: `ID-${row + 1}`,
        displayData: `ID-${row + 1}`,
        allowOverlay: false
      }
    case 1: // Name column
      return {
        kind: 'text',
        data: `User ${row + 1}`,
        displayData: `User ${row + 1}`,
        allowOverlay: true
      }
    case 2: // Age column
      return {
        kind: 'number',
        data: Math.floor(Math.random() * 80) + 18,
        displayData: String(Math.floor(Math.random() * 80) + 18),
        allowOverlay: false
      }
    case 3: // Email column
      return {
        kind: 'uri',
        data: `user${row + 1}@example.com`,
        displayData: `user${row + 1}@example.com`,
        allowOverlay: true
      }
    case 4: // Status column
      const status = Math.random() > 0.5
      return {
        kind: 'boolean',
        data: status,
        displayData: status ? 'Active' : 'Inactive',
        allowOverlay: false
      }
    default:
      return {
        kind: 'text',
        data: '',
        displayData: '',
        allowOverlay: false
      }
  }
}

// Event handlers
const handleSelectionChange = (newSelection: GridSelection) => {
  selection.value = newSelection
}

const handleCellXOffsetChange = (offset: number) => {
  cellXOffset.value = offset
}

const handleCellYOffsetChange = (offset: number) => {
  cellYOffset.value = offset
}

const handleCellActivated = (event: { location: [number, number] }) => {
  console.log('Cell activated:', event.location)
}
</script>

<style scoped>
.example-container {
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.info-panel {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.info-panel p {
  margin: 5px 0;
  font-size: 14px;
}
</style>