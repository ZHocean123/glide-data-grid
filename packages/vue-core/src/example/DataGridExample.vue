<template>
  <div class="data-grid-container">
    <h2>Data Grid Example</h2>
    <div class="grid-wrapper">
      <DataGrid
        :width="800"
        :height="600"
        :columns="columns"
        :rows="rows.length"
        :cellXOffset="cellXOffset"
        :cellYOffset="cellYOffset"
        :translateX="translateX"
        :translateY="translateY"
        :accessibilityHeight="accessibilityHeight"
        :freezeColumns="freezeColumns"
        :freezeTrailingRows="freezeTrailingRows"
        :hasAppendRow="hasAppendRow"
        :firstColAccessible="firstColAccessible"
        :fixedShadowX="fixedShadowX"
        :fixedShadowY="fixedShadowY"
        :allowResize="allowResize"
        :isResizing="isResizing"
        :resizeColumn="resizeColumn"
        :isDragging="isDragging"
        :isFilling="isFilling"
        :isFocused="isFocused"
        :headerHeight="headerHeight"
        :groupHeaderHeight="groupHeaderHeight"
        :enableGroups="enableGroups"
        :rowHeight="rowHeight"
        :getCellContent="getCellContent"
        :getGroupDetails="getGroupDetails"
        :getRowThemeOverride="getRowThemeOverride"
        :onHeaderMenuClick="onHeaderMenuClick"
        :onHeaderIndicatorClick="onHeaderIndicatorClick"
        :selection="selection"
        :prelightCells="prelightCells"
        :highlightRegions="highlightRegions"
        :fillHandle="fillHandle"
        :disabledRows="disabledRows"
        :imageWindowLoader="imageWindowLoader"
        :onItemHovered="onItemHovered"
        :onMouseMove="onMouseMove"
        :onMouseDown="onMouseDown"
        :onMouseUp="onMouseUp"
        :onContextMenu="onContextMenu"
        :onCanvasFocused="onCanvasFocused"
        :onCanvasBlur="onCanvasBlur"
        :onCellFocused="onCellFocused"
        :onMouseMoveRaw="onMouseMoveRaw"
        :onKeyDown="onKeyDown"
        :onKeyUp="onKeyUp"
        :verticalBorder="verticalBorder"
        :isDraggable="isDraggable"
        :onDragStart="onDragStart"
        :onDragEnd="onDragEnd"
        :onDragOverCell="onDragOverCell"
        :onDragLeave="onDragLeave"
        :onDrop="onDrop"
        :drawHeader="drawHeader"
        :drawCell="drawCell"
        :drawFocusRing="drawFocusRing"
        :dragAndDropState="dragAndDropState"
        :experimental="experimental"
        :headerIcons="headerIcons"
        :smoothScrollX="smoothScrollX"
        :smoothScrollY="smoothScrollY"
        :theme="theme"
        :getCellRenderer="getCellRenderer"
        :resizeIndicator="resizeIndicator"
      />
    </div>
    <div class="controls">
      <button @click="addRow">Add Row</button>
      <button @click="removeRow">Remove Row</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataGrid from '../internal/data-grid/DataGrid.vue';
import type { InnerGridCell, Item, GridSelection } from '../internal/data-grid/data-grid-types.js';
import type { GridMouseEventArgs, GridKeyEventArgs } from '../internal/data-grid/event-args.js';
import { GridCellKind, CompactSelection, Rectangle } from '../internal/data-grid/data-grid-types.js';
import type { FullTheme } from '../common/styles.js';
import type { ImageWindowLoader } from '../internal/data-grid/image-window-loader-interface.js';

// Grid configuration
const columns = ref([
  { id: 'col1', title: 'ID', width: 80 },
  { id: 'col2', title: 'Name', width: 200 },
  { id: 'col3', title: 'Email', width: 250 },
  { id: 'col4', title: 'Phone', width: 150 },
  { id: 'col5', title: 'Active', width: 100 },
]);

const rows = ref(Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `+1 (555) 123-${(i + 1).toString().padStart(4, '0')}`,
  active: i % 2 === 0,
})));

// Grid state
const cellXOffset = ref(0);
const cellYOffset = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const accessibilityHeight = ref(10);
const freezeColumns = ref(0);
const freezeTrailingRows = ref(0);
const hasAppendRow = ref(false);
const firstColAccessible = ref(false);
const fixedShadowX = ref(true);
const fixedShadowY = ref(true);
const allowResize = ref(true);
const isResizing = ref(false);
const resizeColumn = ref(undefined);
const isDragging = ref(false);
const isFilling = ref(false);
const isFocused = ref(false);
const headerHeight = ref(30);
const groupHeaderHeight = ref(0);
const enableGroups = ref(false);
const rowHeight = ref(35);

const selection = ref<GridSelection>({
  current: undefined,
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
});

// Optional state
const prelightCells = ref(undefined);
const highlightRegions = ref(undefined);
const fillHandle = ref(false);
const disabledRows = ref(undefined);

// Create a simple image element for the loader
const createEmptyImage = () => {
  const img = new Image();
  img.width = 1;
  img.height = 1;
  return img;
};

const imageWindowLoader = ref<ImageWindowLoader>({
  setWindow: (newWindow: Rectangle, freezeCols: number, freezeRows: number[]) => {
    // Implementation for setting the visible window
  },
  loadOrGetImage: (url: string, col: number, row: number) => {
    // Return a placeholder image
    return createEmptyImage() as HTMLImageElement;
  },
  setCallback: (imageLoaded: (locations: any) => void) => {
    // Implementation for setting the callback when images are loaded
  },
});

const dragAndDropState = ref(undefined);
const experimental = ref(undefined);
const headerIcons = ref(undefined);
const smoothScrollX = ref(false);
const smoothScrollY = ref(false);
const resizeIndicator = ref<"full" | "header" | "none">("full");

// Theme configuration
const theme = ref({
  bgCell: '#ffffff',
  bgHeader: '#f5f5f5',
  borderColor: '#e0e0e0',
  textLight: '#333333',
  textMedium: '#666666',
  textDark: '#999999',
  accentColor: '#3b82f6',
  accentLight: '#60a5fa',
  fontFamily: 'system-ui, -apple-system, sans-serif',
} as FullTheme);

// Cell content provider
const getCellContent = (cell: Item): InnerGridCell => {
  const [col, row] = cell;
  
  // Header cells
  if (row === -1) {
    return {
      kind: GridCellKind.Text,
      data: columns.value[col]?.title || '',
      displayData: columns.value[col]?.title || '',
      allowOverlay: false,
      readonly: true,
    };
  }
  
  // Data cells
  if (row >= 0 && row < rows.value.length) {
    const rowData = rows.value[row];
    
    switch (col) {
      case 0: // ID
        return {
          kind: GridCellKind.Text,
          data: rowData.id.toString(),
          displayData: rowData.id.toString(),
          allowOverlay: true,
          readonly: false,
        };
      case 1: // Name
        return {
          kind: GridCellKind.Text,
          data: rowData.name,
          displayData: rowData.name,
          allowOverlay: true,
          readonly: false,
        };
      case 2: // Email
        return {
          kind: GridCellKind.Uri,
          data: `mailto:${rowData.email}`,
          displayData: rowData.email,
          allowOverlay: true,
          readonly: false,
        };
      case 3: // Phone
        return {
          kind: GridCellKind.Text,
          data: rowData.phone,
          displayData: rowData.phone,
          allowOverlay: true,
          readonly: false,
        };
      case 4: // Active
        return {
          kind: GridCellKind.Boolean,
          data: rowData.active,
          allowOverlay: false,
          readonly: false,
        };
      default:
        return {
          kind: GridCellKind.Text,
          data: '',
          displayData: '',
          allowOverlay: true,
          readonly: false,
        };
    }
  }
  
  // Default empty cell
  return {
    kind: GridCellKind.Text,
    data: '',
    displayData: '',
    allowOverlay: true,
    readonly: false,
  };
};

// Optional callbacks
const getGroupDetails = (name: string) => ({ name });
const getRowThemeOverride = () => undefined;
const onHeaderMenuClick = () => {};
const onHeaderIndicatorClick = () => {};
const onItemHovered = () => {};
const onMouseMove = () => {};
const onMouseUp = () => {};
const onMouseDown = () => {};
const onContextMenu = () => {};
const onCanvasFocused = () => {};
const onCanvasBlur = () => {};
const onCellFocused = () => {};
const onMouseMoveRaw = () => {};
const onKeyDown = () => {};
const onKeyUp = () => {};
const verticalBorder = () => true;
const isDraggable = ref(false);
const onDragStart = () => {};
const onDragEnd = () => {};
const onDragOverCell = () => {};
const onDragLeave = () => {};
const onDrop = () => {};
const drawHeader = () => {};
const drawCell = () => {};
const drawFocusRing = ref(true);
const getCellRenderer = () => undefined;

// Event handlers
const handleMouseDown = (args: GridMouseEventArgs) => {
  console.log('Mouse down:', args);
  if (args.kind === 'mouse' && args.cell !== undefined) {
    const [col, row] = args.location;
    
    // Update selection
    selection.value = {
      current: {
        cell: args.location,
        range: { x: col, y: row, width: 1, height: 1 } as Rectangle,
        rangeStack: [],
      },
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
    };
  }
};

const handleMouseUp = (args: GridMouseEventArgs) => {
  console.log('Mouse up:', args);
};

const handleMouseMove = (args: GridMouseEventArgs) => {
  // console.log('Mouse move:', args);
};

const handleKeyDown = (args: GridKeyEventArgs) => {
  console.log('Key down:', args);
  
  if (selection.value.current !== undefined) {
    const [col, row] = selection.value.current.cell;
    let newX = col;
    let newY = row;
    
    switch (args.key) {
      case 'ArrowUp':
        newY = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newY = Math.min(rows.value.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        newX = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newX = Math.min(columns.value.length - 1, col + 1);
        break;
      default:
        return;
    }
    
    // Update selection
    selection.value = {
      current: {
        cell: [newX, newY],
        range: { x: newX, y: newY, width: 1, height: 1 } as Rectangle,
        rangeStack: [],
      },
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
    };
    
    args.preventDefault();
  }
};

// Control functions
const addRow = () => {
  const newId = rows.value.length > 0 ? Math.max(...rows.value.map(r => r.id)) + 1 : 1;
  rows.value.push({
    id: newId,
    name: `User ${newId}`,
    email: `user${newId}@example.com`,
    phone: `+1 (555) 123-${newId.toString().padStart(4, '0')}`,
    active: Math.random() > 0.5,
  });
};

const removeRow = () => {
  if (selection.value.current !== undefined && rows.value.length > 0) {
    const [, row] = selection.value.current.cell;
    if (row >= 0 && row < rows.value.length) {
      rows.value.splice(row, 1);
      
      // Clear selection if the removed row was outside the grid bounds
      if (selection.value.current?.cell[1] >= rows.value.length) {
        selection.value = {
          current: undefined,
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty(),
        };
      }
    }
  }
};
</script>

<style scoped>
.data-grid-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.grid-wrapper {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #2563eb;
}
</style>