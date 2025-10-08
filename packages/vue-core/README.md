# Vue Data Grid

[![npm version](https://badge.fury.io/js/@glideapps/vue-data-grid.svg)](https://badge.fury.io/js/@glideapps/vue-data-grid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)

Vue版本的Glide Data Grid - 一个高性能、功能丰富的数据表格组件，专为Vue 3设计。

## ✨ 特性

- 🚀 **高性能** - 支持虚拟滚动，可处理数百万行数据
- 🎨 **高度可定制** - 支持自定义单元格、主题和样式
- ♿ **无障碍友好** - 完整的键盘导航和屏幕阅读器支持
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🔧 **丰富的API** - 提供完整的事件处理和方法调用
- 🌳 **Tree-shaking友好** - 按需导入，减少包体积
- 📦 **TypeScript支持** - 完整的类型定义
- 🔄 **双向绑定** - 支持Vue的响应式数据绑定

## 📦 安装

```bash
npm install @glideapps/vue-data-grid
# 或
yarn add @glideapps/vue-data-grid
# 或
pnpm add @glideapps/vue-data-grid
```

## 🚀 快速开始

```vue
<template>
  <div>
    <DataEditor
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :width="800"
      :height="600"
      @cell-clicked="onCellClicked"
    />
  </div>
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
      data: 20 + (row % 50),
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

const onCellClicked = (cell) => {
  console.log('单元格被点击:', cell);
};
</script>
```

## 📚 文档

- [API文档](./docs/API.md) - 详细的API参考
- [迁移指南](./docs/MIGRATION.md) - 从React版本迁移到Vue版本
- [最佳实践](./docs/BEST_PRACTICES.md) - 性能优化和开发建议
- [示例](./src/examples/) - 各种使用场景的示例代码

## 🎯 示例

### 基础示例

```vue
<template>
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
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(10);

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

### 自定义主题

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="400"
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

### 自定义单元格

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="400"
    :custom-renderers="customRenderers"
  />
</template>

<script setup>
import { reactive } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: '任务', width: 200 },
  { title: '进度', width: 150 },
  { title: '状态', width: 100 }
]);

const rows = ref(20);

const customRenderers = reactive({
  progress: {
    kind: GridCellKind.Custom,
    draw: (cell, ctx, rect) => {
      const { data } = cell;
      const progress = typeof data === 'number' ? data : 0;
      
      // 绘制进度条
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(rect.x, rect.y + 10, rect.width - 20, 20);
      
      ctx.fillStyle = progress > 70 ? '#4caf50' : '#ff9800';
      ctx.fillRect(rect.x, rect.y + 10, (rect.width - 20) * (progress / 100), 20);
      
      // 绘制文本
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${progress}%`, rect.x + rect.width / 2, rect.y + 25);
    },
    provideEditor: () => null
  }
});

const getCellContent = ([col, row]) => {
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `任务 ${row + 1}`,
      allowOverlay: true
    };
  } else if (col === 1) {
    return {
      kind: GridCellKind.Custom,
      data: Math.floor(Math.random() * 100),
      allowOverlay: false,
      customRenderer: 'progress'
    };
  } else {
    return {
      kind: GridCellKind.Text,
      data: Math.random() > 0.5 ? '完成' : '进行中',
      allowOverlay: true
    };
  }
};
</script>
```

## 🎨 主题定制

Vue Data Grid支持完整的主题定制：

```javascript
const customTheme = {
  bgCell: '#ffffff',        // 单元格背景色
  bgCellMedium: '#f5f5f5',  // 斑马纹背景色
  bgHeader: '#f1f1f1',      // 表头背景色
  textDark: '#333333',      // 深色文本
  textLight: '#666666',     // 浅色文本
  textHeader: '#444444',    // 表头文本色
  accentColor: '#4285f4',   // 强调色
  accentLight: '#d4e3fc'    // 浅强调色
};
```

## 🔧 高级功能

### 虚拟滚动

处理大数据集时，启用虚拟滚动以提高性能：

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="100000"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
    :virtualization-enabled="true"
    :lazy-loading-enabled="true"
  />
</template>
```

### 无障碍功能

启用无障碍功能支持：

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
    :accessibility-options="{
      screenReaderMode: true,
      highContrastMode: false,
      keyboardNavigation: true,
      announceChanges: true
    }"
    aria-label="数据表格"
  />
</template>
```

### 组合式函数

使用提供的组合式函数简化开发：

```vue
<script setup>
import { useSelectionBehavior, useKeyboardShortcuts } from '@glideapps/vue-data-grid';

// 使用选择行为
const {
  selection,
  selectCell,
  selectRange,
  clearSelection
} = useSelectionBehavior();

// 使用键盘快捷键
const {
  registerShortcut,
  handleKeyDown
} = useKeyboardShortcuts();

// 注册自定义快捷键
registerShortcut('ctrl+a', () => {
  selectRange({
    x: 0,
    y: 0,
    width: columns.value.length,
    height: rows.value
  });
});
</script>
```

## 🔄 从React版本迁移

如果您正在从React版本的Glide Data Grid迁移，请查看我们的[迁移指南](./docs/MIGRATION.md)，它提供了详细的步骤和示例。

## 🌍 浏览器支持

- Chrome >= 88
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 🤝 贡献

我们欢迎所有形式的贡献！请查看我们的[贡献指南](../../CONTRIBUTING.md)了解如何参与项目开发。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/glideapps/glide-data-grid.git
cd glide-data-grid

# 安装依赖
npm install

# 进入Vue包目录
cd packages/vue-core

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建包
npm run build
```

## 📄 许可证

MIT License - 查看[LICENSE](../../LICENSE)文件了解详情。

## 🙏 致谢

- 感谢[Glide Data Grid](https://github.com/glideapps/glide-data-grid)项目提供的核心功能
- 感谢Vue团队提供的优秀框架
- 感谢所有贡献者的支持

## 📞 联系我们

- GitHub Issues: [提交问题](https://github.com/glideapps/glide-data-grid/issues)
- 讨论区: [GitHub Discussions](https://github.com/glideapps/glide-data-grid/discussions)

---

**Vue Data Grid** - 让数据表格在Vue中变得简单而强大 🚀