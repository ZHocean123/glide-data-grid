# Vue Core Data Grid

This is a Vue 3 implementation of the Glide Data Grid, a high-performance, feature-rich data grid component for web applications.

## Features

- High-performance rendering with canvas
- Custom cell renderers
- Column resizing and reordering
- Row and column selection
- Keyboard navigation
- Drag and drop support
- Theming support
- Accessibility features

## Installation

```bash
npm install @glideapps/vue-core-data-grid
```

## Usage

```vue
<template>
  <div>
    <DataGrid
      :width="800"
      :height="600"
      :columns="columns"
      :rows="rows.length"
      :getCellContent="getCellContent"
      :selection="selection"
      :theme="theme"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataGrid from './internal/data-grid/DataGrid.vue';
import { GridCellKind, CompactSelection } from './internal/data-grid/data-grid-types.js';

const columns = ref([
  { id: 'col1', title: 'ID', width: 80 },
  { id: 'col2', title: 'Name', width: 200 },
  { id: 'col3', title: 'Email', width: 250 },
]);

const rows = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
]);

const selection = ref({
  current: undefined,
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
});

const theme = ref({
  bgCell: '#ffffff',
  bgHeader: '#f5f5f5',
  borderColor: '#e0e0e0',
  textLight: '#333333',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

const getCellContent = (cell) => {
  const [col, row] = cell;
  
  if (row === -1) {
    return {
      kind: GridCellKind.Text,
      data: columns.value[col]?.title || '',
      displayData: columns.value[col]?.title || '',
      allowOverlay: false,
      readonly: true,
    };
  }
  
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
    default:
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: true,
        readonly: false,
      };
  }
};
</script>
```

## API Reference

### Props

| Prop | Type | Description |
|------|------|-------------|
| width | number | Width of the grid in pixels |
| height | number | Height of the grid in pixels |
| columns | Column[] | Array of column definitions |
| rows | number | Number of rows in the grid |
| getCellContent | (cell: Item) => GridCell | Function that returns the content for a cell |
| selection | GridSelection | Current selection state |
| theme | Theme | Theme configuration |

### Events

| Event | Description |
|-------|-------------|
| onMouseDown | Fired when mouse button is pressed |
| onMouseUp | Fired when mouse button is released |
| onMouseMove | Fired when mouse is moved |
| onKeyDown | Fired when a key is pressed |
| onCellFocused | Fired when a cell is focused |

## Cell Types

The grid supports various cell types:

- Text (GridCellKind.Text)
- Number (GridCellKind.Number)
- Boolean (GridCellKind.Boolean)
- URI (GridCellKind.Uri)
- Image (GridCellKind.Image)
- Custom (GridCellKind.Custom)

## Theming

The grid can be customized with a theme object:

```javascript
const theme = {
  bgCell: '#ffffff',
  bgHeader: '#f5f5f5',
  borderColor: '#e0e0e0',
  textLight: '#333333',
  textMedium: '#666666',
  textDark: '#999999',
  accentColor: '#3b82f6',
  accentLight: '#60a5fa',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};
```

## Development

To run the development server:

```bash
npm run dev
```

To run the tests:

```bash
npm run test
```

To build the library:

```bash
npm run build
```

## License

MIT