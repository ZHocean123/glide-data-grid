# @glideapps/glide-data-grid-vue

Vue 3 版本的 Glide Data Grid，提供高性能的数据表格组件。

## 安装

```bash
npm install @glideapps/glide-data-grid-vue
```

## 快速开始

```vue
<template>
    <DataEditor
        :columns="columns"
        :rows="rows"
        :getCellContent="getCellContent"
        @cell-clicked="handleCellClick"
        @selection-changed="handleSelectionChange"
    />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { DataEditor } from "@glideapps/glide-data-grid-vue";
import type { GridColumn, Item, GridCell, GridSelection } from "@glideapps/glide-data-grid-vue";

const columns = ref<GridColumn[]>([
    { title: "ID", width: 60 },
    { title: "Name", width: 150 },
    { title: "Age", width: 80 },
]);

const rows = ref(100);

const getCellContent = (cell: Item): GridCell => {
    const [col, row] = cell;
    switch (col) {
        case 0:
            return { kind: "number", data: row + 1, displayData: String(row + 1), allowOverlay: false };
        case 1:
            return { kind: "text", data: `User ${row + 1}`, displayData: `User ${row + 1}`, allowOverlay: true };
        case 2:
            return { kind: "number", data: 20 + (row % 40), displayData: String(20 + (row % 40)), allowOverlay: true };
        default:
            return { kind: "text", data: "", displayData: "", allowOverlay: true };
    }
};

const handleCellClick = (cell: Item, event: MouseEvent) => {
    console.log("Cell clicked:", cell);
};

const handleSelectionChange = (selection: GridSelection) => {
    console.log("Selection changed:", selection);
};
</script>
```

## 组件

### DataEditor

主要的表格组件，提供完整的表格功能。

```vue
<DataEditor
    :columns="columns"
    :rows="rows"
    :getCellContent="getCellContent"
    :selection="selection"
    :theme="theme"
    @cell-clicked="handleCellClick"
    @selection-changed="handleSelectionChange"
    @cell-edited="handleCellEdit"
/>
```

### CanvasRenderer

基于 Canvas 的渲染器，提供高性能的表格渲染。

```vue
<CanvasRenderer
    :columns="columns"
    :rows="rows"
    :getCellContent="getCellContent"
    :selection="selection"
    @cell-clicked="handleCellClick"
    @selection-changed="handleSelectionChange"
/>
```

## Composables

### useSelection

管理表格选择状态。

```ts
import { useSelection } from "@glideapps/glide-data-grid-vue";

const { selection, selectedCells, hasSelection, setSelection, clearSelection } = useSelection();
```

### useEditing

管理表格编辑状态。

```ts
import { useEditing } from "@glideapps/glide-data-grid-vue";

const { editingCell, editValue, isEditing, startEditing, stopEditing, updateEditValue } = useEditing();
```

### useEvents

管理表格事件处理。

```ts
import { useEvents } from "@glideapps/glide-data-grid-vue";

const { eventHandlers, updateHandlers } = useEvents();
```

## 类型

完整的 TypeScript 类型支持：

```ts
import type {
    GridSelection,
    Item,
    GridCell,
    GridColumn,
    DataEditorProps,
    DataEditorRef,
    TextCell,
    NumberCell,
    BooleanCell,
} from "@glideapps/glide-data-grid-vue";

import { GridCellKind, CompactSelection } from "@glideapps/glide-data-grid-vue";
```

## 主题

自定义表格主题：

```ts
import { getDataEditorTheme, mergeAndRealizeTheme } from "@glideapps/glide-data-grid-vue";

const customTheme = mergeAndRealizeTheme(getDataEditorTheme(), {
    accentColor: "#FF6B6B",
    textDark: "#2D3748",
    bgCell: "#F7FAFC",
});
```

## 特性

- ✅ Vue 3 Composition API
- ✅ TypeScript 支持
- ✅ 高性能 Canvas 渲染
- ✅ 单元格选择和编辑
- ✅ 自定义主题
- ✅ 键盘导航
- ✅ 滚动优化
- ✅ 事件处理

## 开发状态

当前版本为开发预览版，主要功能已实现：

- [x] 基础组件结构
- [x] 类型定义迁移
- [x] Composables 实现
- [x] Canvas 渲染器
- [x] 单元格渲染器
- [x] 选择管理
- [x] 编辑管理
- [x] 事件系统
- [x] 主题系统

## 待完成功能

- [ ] 完整的单元格类型支持
- [ ] 高级编辑功能
- [ ] 性能优化
- [ ] 测试覆盖
- [ ] 文档完善

## 许可证

MIT
