# 从React到Vue的迁移指南

本指南帮助您将现有的React版本的Glide Data Grid迁移到Vue版本。Vue版本提供了与React版本相同的功能，但使用Vue 3的Composition API和响应式系统。

## 目录

- [核心概念对比](#核心概念对比)
- [安装和设置](#安装和设置)
- [基础迁移](#基础迁移)
- [组件属性映射](#组件属性映射)
- [事件处理映射](#事件处理映射)
- [状态管理迁移](#状态管理迁移)
- [生命周期对比](#生命周期对比)
- [常见迁移问题](#常见迁移问题)
- [完整迁移示例](#完整迁移示例)

## 核心概念对比

| React概念 | Vue概念 | 说明 |
|-----------|---------|------|
| 组件 (Component) | 组件 (Component) | 两者都是UI的基本构建块 |
| Props | Props | 属性传递方式相同 |
| State | Ref/Reactive | Vue使用ref和reactive替代useState |
| Hooks | Composition API | Vue的Composition API与React Hooks类似 |
| useEffect | watch/watchEffect | Vue使用watch和watchEffect处理副作用 |
| JSX | 模板语法 | Vue使用模板语法而非JSX |
| Context | Provide/Inject | Vue使用provide/inject进行依赖注入 |

## 安装和设置

### React版本安装

```bash
npm install @glideapps/glide-data-grid
```

### Vue版本安装

```bash
npm install @glideapps/vue-data-grid
```

## 基础迁移

### React版本代码

```jsx
import React, { useState, useCallback } from 'react';
import DataEditor from '@glideapps/glide-data-grid';

const MyGrid = () => {
  const [cols] = useState([
    { title: 'Name', width: 200 },
    { title: 'Age', width: 100 }
  ]);
  
  const [rows] = useState(100);
  
  const getContent = useCallback((cell) => {
    const [col, row] = cell;
    if (col === 0) {
      return {
        kind: GridCellKind.Text,
        data: `User ${row}`,
        allowOverlay: true
      };
    } else {
      return {
        kind: GridCellKind.Number,
        data: 20 + row,
        allowOverlay: true
      };
    }
  }, []);
  
  return (
    <DataEditor
      columns={cols}
      rows={rows}
      getCellContent={getContent}
      width={800}
      height={600}
    />
  );
};
```

### Vue版本代码

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="800"
    :height="600"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: 'Name', width: 200 },
  { title: 'Age', width: 100 }
]);

const rows = ref(100);

const getCellContent = ([col, row]) => {
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `User ${row}`,
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

## 组件属性映射

大多数组件属性在React和Vue版本中是相同的，但有一些细微差别：

### 相同属性

| 属性名 | React | Vue |
|--------|-------|-----|
| `columns` | `columns={cols}` | `:columns="columns"` |
| `rows` | `rows={rows}` | `:rows="rows"` |
| `width` | `width={800}` | `:width="800"` |
| `height` | `height={600}` | `:height="600"` |
| `editable` | `editable={true}` | `:editable="true"` |
| `theme` | `theme={myTheme}` | `:theme="myTheme"` |

### 事件处理属性

| 事件名 | React | Vue |
|--------|-------|-----|
| `onCellClicked` | `onCellClicked={handleClick}` | `@cell-clicked="handleClick"` |
| `onCellEdited` | `onCellEdited={handleEdit}` | `@cell-edited="handleEdit"` |
| `onSelectionChanged` | `onSelectionChanged={handleSelection}` | `@selection-changed="handleSelection"` |

## 事件处理映射

### React版本

```jsx
const handleCellClicked = useCallback((cell) => {
  console.log('Cell clicked:', cell);
}, []);

const handleCellEdited = useCallback((cell, newValue) => {
  console.log('Cell edited:', cell, newValue);
}, []);

<DataEditor
  onCellClicked={handleCellClicked}
  onCellEdited={handleCellEdited}
  // ...其他属性
/>
```

### Vue版本

```vue
<script setup>
const handleCellClicked = (cell) => {
  console.log('Cell clicked:', cell);
};

const handleCellEdited = (cell, newValue) => {
  console.log('Cell edited:', cell, newValue);
};
</script>

<template>
  <DataEditor
    @cell-clicked="handleCellClicked"
    @cell-edited="handleCellEdited"
    <!-- ...其他属性 -->
  />
</template>
```

## 状态管理迁移

### React版本 (使用useState)

```jsx
import React, { useState } from 'react';

const MyGrid = () => {
  const [selection, setSelection] = useState(null);
  const [editing, setEditing] = useState(false);
  
  const handleSelectionChanged = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);
  
  return (
    <DataEditor
      onSelectionChanged={handleSelectionChanged}
      // ...其他属性
    />
  );
};
```

### Vue版本 (使用ref)

```vue
<script setup>
import { ref } from 'vue';

const selection = ref(null);
const editing = ref(false);

const handleSelectionChanged = (newSelection) => {
  selection.value = newSelection;
};
</script>

<template>
  <DataEditor
    @selection-changed="handleSelectionChanged"
    <!-- ...其他属性 -->
  />
</template>
```

### 复杂状态迁移

#### React版本 (使用useReducer)

```jsx
import React, { useReducer } from 'react';

const gridReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'SET_EDITING':
      return { ...state, editing: action.payload };
    default:
      return state;
  }
};

const MyGrid = () => {
  const [state, dispatch] = useReducer(gridReducer, {
    selection: null,
    editing: false
  });
  
  const handleSelectionChanged = useCallback((selection) => {
    dispatch({ type: 'SET_SELECTION', payload: selection });
  }, []);
  
  return (
    <DataEditor
      onSelectionChanged={handleSelectionChanged}
      // ...其他属性
    />
  );
};
```

#### Vue版本 (使用reactive)

```vue
<script setup>
import { reactive } from 'vue';

const state = reactive({
  selection: null,
  editing: false
});

const handleSelectionChanged = (selection) => {
  state.selection = selection;
};
</script>

<template>
  <DataEditor
    @selection-changed="handleSelectionChanged"
    <!-- ...其他属性 -->
  />
</template>
```

## 生命周期对比

### React版本

```jsx
import React, { useEffect, useRef } from 'react';

const MyGrid = () => {
  const gridRef = useRef(null);
  
  useEffect(() => {
    // 组件挂载后
    if (gridRef.current) {
      gridRef.current.focus();
    }
    
    return () => {
      // 组件卸载前
    };
  }, []);
  
  return (
    <DataEditor ref={gridRef} />
  );
};
```

### Vue版本

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const gridRef = ref(null);

onMounted(() => {
  // 组件挂载后
  if (gridRef.value) {
    gridRef.value.focus();
  }
});

onUnmounted(() => {
  // 组件卸载前
});
</script>

<template>
  <DataEditor ref="gridRef" />
</template>
```

## 常见迁移问题

### 1. 条件渲染

#### React版本

```jsx
{showGrid && (
  <DataEditor
    columns={columns}
    rows={rows}
    getCellContent={getContent}
  />
)}
```

#### Vue版本

```vue
<DataEditor
  v-if="showGrid"
  :columns="columns"
  :rows="rows"
  :get-cell-content="getContent"
/>
```

### 2. 列表渲染

#### React版本

```jsx
{columns.map((col, index) => (
  <div key={index}>
    <h3>{col.title}</h3>
    <DataEditor
      columns={[col]}
      rows={rows}
      getCellContent={getContent}
    />
  </div>
))}
```

#### Vue版本

```vue
<div v-for="(col, index) in columns" :key="index">
  <h3>{{ col.title }}</h3>
  <DataEditor
    :columns="[col]"
    :rows="rows"
    :get-cell-content="getContent"
  />
</div>
```

### 3. 样式处理

#### React版本

```jsx
<DataEditor
  style={{
    border: '1px solid #ccc',
    borderRadius: '4px'
  }}
  className="my-grid"
/>
```

#### Vue版本

```vue
<DataEditor
  :style="{
    border: '1px solid #ccc',
    borderRadius: '4px'
  }"
  class="my-grid"
/>
```

### 4. 动态类名

#### React版本

```jsx
<DataEditor
  className={`grid ${isEditing ? 'editing' : ''}`}
/>
```

#### Vue版本

```vue
<DataEditor
  :class="['grid', { editing: isEditing }]"
/>
```

## 完整迁移示例

### React版本 (完整组件)

```jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import DataEditor, { GridCellKind } from '@glideapps/glide-data-grid';

const MyDataGrid = () => {
  const gridRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [editing, setEditing] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const columns = [
    { title: 'Name', width: 200 },
    { title: 'Age', width: 100 },
    { title: 'City', width: 150 }
  ];
  
  const rows = 100;
  
  const getCellContent = useCallback((cell) => {
    const [col, row] = cell;
    if (col === 0) {
      return {
        kind: GridCellKind.Text,
        data: `User ${row}`,
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
        data: 'New York',
        allowOverlay: true
      };
    }
  }, []);
  
  const handleCellClicked = useCallback((cell) => {
    console.log('Cell clicked:', cell);
  }, []);
  
  const handleCellEdited = useCallback((cell, newValue) => {
    console.log('Cell edited:', cell, newValue);
  }, []);
  
  const handleSelectionChanged = useCallback((newSelection) => {
    setSelection(newSelection);
  }, []);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const gridTheme = theme === 'light' ? {
    bgCell: '#ffffff',
    bgCellMedium: '#f5f5f5',
    bgHeader: '#f1f1f1',
    textDark: '#333333',
    textLight: '#666666',
    textHeader: '#444444',
    accentColor: '#4285f4',
    accentLight: '#d4e3fc'
  } : {
    bgCell: '#2d2d2d',
    bgCellMedium: '#3d3d3d',
    bgHeader: '#4d4d4d',
    textDark: '#ffffff',
    textLight: '#cccccc',
    textHeader: '#ffffff',
    accentColor: '#64b5f6',
    accentLight: '#1a237e'
  };
  
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, []);
  
  return (
    <div>
      <div>
        <button onClick={toggleTheme}>
          Toggle Theme ({theme})
        </button>
        <div>
          Selection: {selection ? `${selection.cell[0]}, ${selection.cell[1]}` : 'None'}
        </div>
      </div>
      <DataEditor
        ref={gridRef}
        columns={columns}
        rows={rows}
        getCellContent={getCellContent}
        width={800}
        height={600}
        theme={gridTheme}
        editable={true}
        onCellClicked={handleCellClicked}
        onCellEdited={handleCellEdited}
        onSelectionChanged={handleSelectionChanged}
      />
    </div>
  );
};

export default MyDataGrid;
```

### Vue版本 (完整组件)

```vue
<template>
  <div>
    <div class="controls">
      <button @click="toggleTheme">
        Toggle Theme ({{ theme }})
      </button>
      <div>
        Selection: {{ selection ? `${selection.cell[0]}, ${selection.cell[1]}` : 'None' }}
      </div>
    </div>
    <DataEditor
      ref="gridRef"
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :width="800"
      :height="600"
      :theme="gridTheme"
      :editable="true"
      @cell-clicked="handleCellClicked"
      @cell-edited="handleCellEdited"
      @selection-changed="handleSelectionChanged"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const gridRef = ref(null);
const selection = ref(null);
const editing = ref(false);
const theme = ref('light');

const columns = [
  { title: 'Name', width: 200 },
  { title: 'Age', width: 100 },
  { title: 'City', width: 150 }
];

const rows = 100;

const getCellContent = ([col, row]) => {
  if (col === 0) {
    return {
      kind: GridCellKind.Text,
      data: `User ${row}`,
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
      data: 'New York',
      allowOverlay: true
    };
  }
};

const handleCellClicked = (cell) => {
  console.log('Cell clicked:', cell);
};

const handleCellEdited = (cell, newValue) => {
  console.log('Cell edited:', cell, newValue);
};

const handleSelectionChanged = (newSelection) => {
  selection.value = newSelection;
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

const gridTheme = computed(() => {
  return theme.value === 'light' ? {
    bgCell: '#ffffff',
    bgCellMedium: '#f5f5f5',
    bgHeader: '#f1f1f1',
    textDark: '#333333',
    textLight: '#666666',
    textHeader: '#444444',
    accentColor: '#4285f4',
    accentLight: '#d4e3fc'
  } : {
    bgCell: '#2d2d2d',
    bgCellMedium: '#3d3d3d',
    bgHeader: '#4d4d4d',
    textDark: '#ffffff',
    textLight: '#cccccc',
    textHeader: '#ffffff',
    accentColor: '#64b5f6',
    accentLight: '#1a237e'
  };
});

onMounted(() => {
  if (gridRef.value) {
    gridRef.value.focus();
  }
});
</script>

<style scoped>
.controls {
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.controls button {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #3367d6;
}
</style>
```

## 迁移检查清单

- [ ] 更新包依赖：从 `@glideapps/glide-data-grid` 到 `@glideapps/vue-data-grid`
- [ ] 将JSX语法转换为Vue模板语法
- [ ] 将React Hooks转换为Vue Composition API
- [ ] 更新事件处理器命名（从驼峰到短横线）
- [ ] 将属性绑定从 `{}` 更新为 `v-bind:` 或 `:`
- [ ] 更新条件渲染语法
- [ ] 更新列表渲染语法
- [ ] 更新样式和类名绑定
- [ ] 更新生命周期钩子
- [ ] 测试所有功能是否正常工作

## 获取帮助

如果在迁移过程中遇到问题，可以：

1. 查看 [API文档](./API.md) 了解详细的API信息
2. 查看 [示例代码](../src/examples/) 了解更多用法
3. 在GitHub上提交Issue
4. 查看Vue官方文档了解Vue和React的差异

## 总结

Vue版本的Glide Data Grid保持了与React版本相同的API设计，使得迁移过程相对简单。主要的变化在于：

1. 语法从JSX转换为Vue模板语法
2. 状态管理从React Hooks转换为Vue Composition API
3. 事件处理命名从驼峰式转换为短横线式

大多数情况下，只需要进行简单的语法转换即可完成迁移。