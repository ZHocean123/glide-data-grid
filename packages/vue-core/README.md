# @glideapps/glide-data-grid-vue

Vue 3 版本的 Glide Data Grid - 高性能数据网格组件，用于美观地显示和编辑大量数据。

## 特性

- 🚀 **高性能**：基于 Canvas 渲染，支持百万级数据
- 🎨 **美观易用**：现代化的设计和流畅的交互
- 📱 **响应式**：支持各种屏幕尺寸和设备
- 🔧 **可定制**：丰富的主题和自定义选项
- ⌨️ **键盘友好**：完整的键盘导航支持
- 📋 **复制粘贴**：支持 Excel 风格的复制粘贴
- 🔍 **搜索过滤**：内置搜索和过滤功能
- 🎯 **精确选择**：单元格、行、列选择
- ✏️ **内联编辑**：覆盖编辑器支持

## 安装

```bash
npm install @glideapps/glide-data-grid-vue
```

## 快速开始

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="100"
    :get-cell-content="getCellContent"
    :grid-selection="gridSelection"
    @update:grid-selection="handleGridSelectionChange"
    @cell-clicked="handleCellClicked"
    width="800"
    height="600"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataEditor from '@glideapps/glide-data-grid-vue'
import type { GridColumn, GridCell, Item, GridSelection } from '@glideapps/glide-data-grid-vue'

// 列定义
const columns = ref<GridColumn[]>([
  { title: 'ID', width: 80 },
  { title: '姓名', width: 120 },
  { title: '年龄', width: 80 },
  { title: '城市', width: 150 },
])

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
  } else {
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都']
    return {
      kind: 'text',
      data: cities[Math.floor(Math.random() * cities.length)],
      allowOverlay: true
    }
  }
}

// 事件处理
const handleGridSelectionChange = (newSelection: GridSelection) => {
  gridSelection.value = newSelection
}

const handleCellClicked = (cell: Item, event: any) => {
  console.log('单元格点击:', cell)
}
</script>
```

## 支持的单元格类型

### 文本单元格 (TextCell)
```typescript
{
  kind: 'text',
  data: '单元格内容',
  allowOverlay: true,
  displayData: '显示内容', // 可选
  contentAlign: 'left' | 'center' | 'right' // 可选
}
```

### 数字单元格 (NumberCell)
```typescript
{
  kind: 'number',
  data: 123.45,
  allowOverlay: true,
  format: {
    type: 'number' | 'currency' | 'percent',
    decimalPlaces: 2,
    currency: 'USD' // 仅用于 currency 类型
  }
}
```

### 布尔单元格 (BooleanCell)
```typescript
{
  kind: 'boolean',
  data: true, // true, false 或 undefined (不确定状态)
  allowOverlay: true
}
```

### 图片单元格 (ImageCell)
```typescript
{
  kind: 'image',
  data: ['https://example.com/image.jpg'],
  allowOverlay: true
}
```

## 主题定制

```vue
<template>
  <DataEditor
    :theme="customTheme"
    :columns="columns"
    :rows="100"
    :get-cell-content="getCellContent"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataEditor from '@glideapps/glide-data-grid-vue'

const customTheme = ref({
  accentColor: '#ff6b35',
  textDark: '#2d3748',
  textLight: '#718096',
  bgCell: '#f7fafc',
  bgHeader: '#edf2f7',
  fontFamily: 'Inter, system-ui, sans-serif'
})
</script>
```

## API 参考

### DataEditor Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| columns | GridColumn[] | [] | 列定义 |
| rows | number | 0 | 行数 |
| getCellContent | (cell: Item) => GridCell | - | 获取单元格内容 |
| gridSelection | GridSelection | - | 网格选择状态 |
| width | number \| string | - | 网格宽度 |
| height | number \| string | - | 网格高度 |
| rowHeight | number | 34 | 行高 |
| headerHeight | number | 36 | 表头高度 |
| theme | Partial<Theme> | - | 主题配置 |
| rowMarkers | 'none' \| RowMarkerOptions | 'none' | 行标记配置 |

### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| update:grid-selection | GridSelection | 选择状态变化 |
| cell-clicked | Item, MouseEvent | 单元格点击 |
| cell-activated | Item, CellActivatedEventArgs | 单元格激活 |
| cell-edited | Item, any | 单元格编辑 |
| finished-editing | any, Item | 编辑完成 |

## 开发

### 本地开发

```bash
# 进入包目录
cd packages/vue-core

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

### 项目结构

```
packages/vue-core/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── DataEditor.vue
│   │   ├── DataGridOverlayEditor.vue
│   │   └── DataGridSearch.vue
│   ├── cells/              # 单元格渲染器
│   │   ├── text-cell.ts
│   │   ├── number-cell.ts
│   │   ├── boolean-cell.ts
│   │   └── cell-renderer-manager.ts
│   ├── internal/           # 内部实现
│   │   └── data-grid/
│   │       ├── data-grid-types.ts
│   │       └── render/
│   ├── common/             # 工具函数
│   │   ├── math.ts
│   │   ├── styles.ts
│   │   └── support.ts
│   └── examples/           # 示例
├── package.json
├── vite.config.ts
└── README.md
```

## 许可证

MIT

## 相关链接

- [React 版本](https://github.com/glideapps/glide-data-grid)
- [文档网站](https://grid.glideapps.com)
- [问题反馈](https://github.com/glideapps/glide-data-grid/issues)