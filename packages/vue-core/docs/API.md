# Vue Data Grid API 文档

本文档详细介绍了Vue版本的Glide Data Grid的所有API，包括组件属性、事件、方法和类型定义。

## 目录

- [DataEditor 组件](#dataeditor-组件)
- [属性 (Props)](#属性-props)
- [事件 (Events)](#事件-events)
- [方法 (Methods)](#方法-methods)
- [插槽 (Slots)](#插槽-slots)
- [类型定义](#类型定义)
- [组合式函数](#组合式函数)
- [工具函数](#工具函数)

## DataEditor 组件

`DataEditor` 是Vue Data Grid的核心组件，提供高性能的数据表格功能。

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
    @cell-clicked="onCellClicked"
  />
</template>

<script setup>
import { DataEditor } from '@glideapps/vue-data-grid';
</script>
```

## 属性 (Props)

### 基础属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `columns` | `GridColumn[]` | `[]` | 列定义数组 |
| `rows` | `number` | `0` | 行数 |
| `getCellContent` | `(cell: Item) => GridCell` | `undefined` | 获取单元格内容的函数 |
| `width` | `number` | `800` | 表格宽度 |
| `height` | `number` | `400` | 表格高度 |
| `rowHeight` | `number` | `32` | 行高 |
| `headerHeight` | `number` | `36` | 表头高度 |

### 行为属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `editable` | `boolean` | `false` | 是否启用编辑 |
| `rowMarkerOffset` | `number` | `0` | 行标记偏移量 |
| `freezeColumns` | `number` | `0` | 冻结列数 |
| `freezeRows` | `number` | `0` | 冻结行数 |
| `minimumHeight` | `number` | `200` | 最小高度 |
| `maximumHeight` | `number` | `Infinity` | 最大高度 |

### 样式和主题

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `theme` | `Theme` | `defaultTheme` | 表格主题 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `style` | `CSSProperties` | `{}` | 自定义样式 |

### 无障碍功能

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `accessibilityOptions` | `AccessibilityOptions` | `{}` | 无障碍功能选项 |
| `ariaLabel` | `string` | `undefined` | ARIA标签 |
| `ariaDescribedBy` | `string` | `undefined` | ARIA描述 |

### 性能选项

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `virtualizationEnabled` | `boolean` | `true` | 是否启用虚拟化 |
| `lazyLoadingEnabled` | `boolean` | `false` | 是否启用懒加载 |
| `cellCachingEnabled` | `boolean` | `true` | 是否启用单元格缓存 |

## 事件 (Events)

### 单元格事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `cell-clicked` | `(item: Item) => void` | 单元格被点击时触发 |
| `cell-activated` | `(item: Item) => void` | 单元格被激活时触发 |
| `cell-edited` | `(item: Item, newValue: any) => void` | 单元格内容被编辑时触发 |
| `cell-double-clicked` | `(item: Item) => void` | 单元格被双击时触发 |
| `cell-right-clicked` | `(item: Item, event: MouseEvent) => void` | 单元格被右键点击时触发 |

### 选择事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `selection-changed` | `(selection: GridSelection) => void` | 选择发生变化时触发 |
| `range-selection-changed` | `(range: Rectangle) => void` | 范围选择发生变化时触发 |

### 表头事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `header-clicked` | `(col: number, event: MouseEvent) => void` | 表头被点击时触发 |
| `header-double-clicked` | `(col: number, event: MouseEvent) => void` | 表头被双击时触发 |
| `header-right-clicked` | `(col: number, event: MouseEvent) => void` | 表头被右键点击时触发 |
| `column-resized` | `(col: number, width: number) => void` | 列宽被调整时触发 |

### 滚动事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `visible-region-changed` | `(region: VisibleRegion) => void` | 可见区域发生变化时触发 |
| `scroll-position-changed` | `(scrollLeft: number, scrollTop: number) => void` | 滚动位置发生变化时触发 |

### 焦点事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `focus-changed` | `(element: string) => void` | 焦点发生变化时触发 |
| `blur` | `(event: FocusEvent) => void` | 组件失去焦点时触发 |

### 无障碍事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `accessibility-announcement` | `(message: string) => void` | 需要向屏幕阅读器公告时触发 |

### 生命周期事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `grid-ready` | `() => void` | 网格初始化完成时触发 |
| `loading-state-changed` | `(isLoading: boolean) => void` | 加载状态发生变化时触发 |

## 方法 (Methods)

通过模板引用可以调用以下方法：

```vue
<template>
  <DataEditor ref="gridRef" />
  <button @click="focusGrid">聚焦网格</button>
</template>

<script setup>
const gridRef = ref();

const focusGrid = () => {
  gridRef.value.focus();
};
</script>
```

### 焦点方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `focus` | `() => void` | `void` | 使网格获得焦点 |
| `blur` | `() => void` | `void` | 使网格失去焦点 |
| `focusCell` | `(col: number, row: number) => void` | `void` | 聚焦指定单元格 |

### 滚动方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `scrollToCell` | `(col: number, row: number) => void` | `void` | 滚动到指定单元格 |
| `scrollToColumn` | `(col: number) => void` | `void` | 滚动到指定列 |
| `scrollToRow` | `(row: number) => void` | `void` | 滚动到指定行 |
| `scrollToTop` | `() => void` | `void` | 滚动到顶部 |
| `scrollToBottom` | `() => void` | `void` | 滚动到底部 |

### 选择方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `selectCell` | `(col: number, row: number) => void` | `void` | 选择指定单元格 |
| `selectRange` | `(range: Rectangle) => void` | `void` | 选择指定范围 |
| `selectAll` | `() => void` | `void` | 选择所有单元格 |
| `clearSelection` | `() => void` | `void` | 清除选择 |

### 数据方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `getCellContent` | `(col: number, row: number) => GridCell` | `GridCell` | 获取指定单元格内容 |
| `setCellContent` | `(col: number, row: number, content: GridCell) => void` | `void` | 设置指定单元格内容 |
| `refreshCell` | `(col: number, row: number) => void` | `void` | 刷新指定单元格 |
| `refreshAll` | `() => void` | `void` | 刷新所有单元格 |

### 布局方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `recalculateLayout` | `() => void` | `void` | 重新计算布局 |
| `resize` | `(width: number, height: number) => void` | `void` | 调整网格大小 |

## 插槽 (Slots)

### 默认插槽

用于在网格内部添加自定义内容：

```vue
<DataEditor>
  <template #default>
    <div class="overlay">自定义覆盖层</div>
  </template>
</DataEditor>
```

### 单元格插槽

用于自定义单元格渲染：

```vue
<DataEditor>
  <template #cell="{ cell, col, row }">
    <CustomCell :content="cell" />
  </template>
</DataEditor>
```

### 表头插槽

用于自定义表头渲染：

```vue
<DataEditor>
  <template #header="{ column, col }">
    <CustomHeader :column="column" />
  </template>
</DataEditor>
```

## 类型定义

### GridColumn

```typescript
interface GridColumn {
  title: string;
  width: number;
  icon?: string;
  hasMenu?: boolean;
  menu?: readonly MenuItem[];
  overlayIcon?: string;
  style?: ColumnStyle;
  grow?: number;
  minWidth?: number;
  themeOverride?: PartialTheme;
  id?: string;
}
```

### GridCell

```typescript
interface GridCell {
  kind: GridCellKind;
  data: any;
  displayData?: string;
  allowOverlay: boolean;
  readonly?: boolean;
  contentAlign?: 'left' | 'center' | 'right';
  themeOverride?: PartialTheme;
  lastEdited?: number;
  validation?: ValidationFunc;
  customRenderer?: string;
  ariaLabel?: string;
}
```

### GridCellKind

```typescript
enum GridCellKind {
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  Uri = 'uri',
  Image = 'image',
  Markdown = 'markdown',
  Custom = 'custom',
  Loading = 'loading',
  Bubble = 'bubble'
}
```

### GridSelection

```typescript
interface GridSelection {
  readonly cell: Item;
  readonly range: Rectangle;
  readonly columns: CompactSelection;
  readonly rows: CompactSelection;
}
```

### Item

```typescript
type Item = [number, number]; // [col, row]
```

### Rectangle

```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Theme

```typescript
interface Theme {
  bgCell: string;
  bgCellMedium: string;
  bgHeader: string;
  textDark: string;
  textLight: string;
  textHeader: string;
  accentColor: string;
  accentLight: string;
  borderColor?: string;
  focusColor?: string;
}
```

### AccessibilityOptions

```typescript
interface AccessibilityOptions {
  screenReaderMode?: boolean;
  highContrastMode?: boolean;
  keyboardNavigation?: boolean;
  announceChanges?: boolean;
  focusIndicators?: boolean;
}
```

## 组合式函数

Vue Data Grid提供了一些组合式函数来简化常见操作：

### useSelectionBehavior

```typescript
import { useSelectionBehavior } from '@glideapps/vue-data-grid';

const {
  selection,
  selectCell,
  selectRange,
  clearSelection,
  isSelected
} = useSelectionBehavior();
```

### useKeyboardShortcuts

```typescript
import { useKeyboardShortcuts } from '@glideapps/vue-data-grid';

const {
  registerShortcut,
  unregisterShortcut,
  handleKeyDown
} = useKeyboardShortcuts();
```

### useCellEditor

```typescript
import { useCellEditor } from '@glideapps/vue-data-grid';

const {
  isEditing,
  editCell,
  saveEdit,
  cancelEdit,
  editorValue
} = useCellEditor();
```

### useAccessibility

```typescript
import { useAccessibility } from '@glideapps/vue-data-grid';

const {
  announce,
  setAriaLabel,
  setAriaDescribedBy
} = useAccessibility();
```

## 工具函数

### copyToClipboard

```typescript
import { copyToClipboard } from '@glideapps/vue-data-grid';

// 复制文本到剪贴板
await copyToClipboard('Hello, World!');
```

### unquote

```typescript
import { unquote } from '@glideapps/vue-data-grid';

// 移除字符串两端的引号
const result = unquote('"Hello, World!"'); // 'Hello, World!'
```

### useKeybindingsWithDefaults

```typescript
import { useKeybindingsWithDefaults } from '@glideapps/vue-data-grid';

// 使用默认键盘绑定
const keybindings = useKeybindingsWithDefaults(customKeybindings);
```

## 示例

### 基础用法

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
    :editable="true"
    @cell-clicked="onCellClicked"
    @cell-edited="onCellEdited"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '城市', width: 150 }
]);

const rows = ref(100);

const getCellContent = ([col, row]) => {
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `用户 ${row + 1}`,
      allowOverlay: true
    };
  } else if (col === 1) {
    return {
      kind: GridCellKind.Number,
      data: 20 + row,
      allowOverlay: true
    };
  } else {
    return {
      kind: GridCellKind.Text,
      data: '北京',
      allowOverlay: true
    };
  }
};

const onCellClicked = (item) => {
  console.log('单元格被点击:', item);
};

const onCellEdited = (item, newValue) => {
  console.log('单元格被编辑:', item, newValue);
};
</script>
```

### 自定义主题

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
    :theme="darkTheme"
  />
</template>

<script setup>
import { reactive } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const darkTheme = reactive({
  bgCell: '#2d2d2d',
  bgCellMedium: '#3d3d3d',
  bgHeader: '#4d4d4d',
  textDark: '#ffffff',
  textLight: '#cccccc',
  textHeader: '#ffffff',
  accentColor: '#64b5f6',
  accentLight: '#1a237e'
});

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(50);

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
</script>
```

### 使用组合式函数

```vue
<template>
  <div>
    <DataEditor
      ref="gridRef"
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :width="800"
      :height="600"
      @cell-clicked="selectCell"
      @keydown="handleKeyDown"
    />
    
    <div>当前选择: {{ selection }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { DataEditor, GridCellKind, useSelectionBehavior, useKeyboardShortcuts } from '@glideapps/vue-data-grid';

const gridRef = ref();
const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(50);

// 使用选择行为组合式函数
const {
  selection,
  selectCell,
  selectRange,
  clearSelection
} = useSelectionBehavior();

// 使用键盘快捷键组合式函数
const {
  registerShortcut,
  handleKeyDown
} = useKeyboardShortcuts();

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

onMounted(() => {
  // 注册自定义快捷键
  registerShortcut('ctrl+a', () => {
    selectRange({
      x: 0,
      y: 0,
      width: columns.value.length,
      height: rows.value
    });
  });
});
</script>
```

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新信息。