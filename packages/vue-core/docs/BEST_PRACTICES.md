# Vue Data Grid 最佳实践指南

本指南提供了使用Vue版本的Glide Data Grid的最佳实践，帮助您构建高性能、可维护的数据表格应用。

## 目录

- [性能优化](#性能优化)
- [内存管理](#内存管理)
- [响应式数据设计](#响应式数据设计)
- [组件设计模式](#组件设计模式)
- [事件处理](#事件处理)
- [样式和主题](#样式和主题)
- [无障碍功能](#无障碍功能)
- [测试策略](#测试策略)
- [常见陷阱](#常见陷阱)
- [故障排除](#故障排除)

## 性能优化

### 1. 使用虚拟化

对于大数据集，确保启用虚拟化：

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :virtualization-enabled="true"
    :lazy-loading-enabled="true"
  />
</template>
```

### 2. 优化getCellContent函数

`getCellContent`是性能关键函数，应该尽可能高效：

```vue
<script setup>
import { ref, shallowRef } from 'vue';

// 使用shallowRef避免深度响应式
const data = shallowRef(new Map());

// 预计算数据
const precomputedData = computed(() => {
  const result = new Map();
  for (let row = 0; row < rows.value; row++) {
    for (let col = 0; col < columns.value.length; col++) {
      const key = `${col}-${row}`;
      result.set(key, generateCellData(col, row));
    }
  }
  return result;
});

// 优化的getCellContent
const getCellContent = ([col, row]) => {
  const key = `${col}-${row}`;
  return precomputedData.value.get(key) || createDefaultCell(col, row);
};
</script>
```

### 3. 使用计算属性缓存

```vue
<script setup>
import { computed } from 'vue';

// 缓存列定义
const columns = computed(() => [
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 },
  { title: '城市', width: 150 }
]);

// 缓存主题
const theme = computed(() => isDark.value ? darkTheme : lightTheme);
</script>
```

### 4. 避免不必要的重新渲染

```vue
<script setup>
import { ref, shallowRef, markRaw } from 'vue';

// 使用markRaw标记不需要响应式的对象
const staticColumns = markRaw([
  { title: 'ID', width: 100 },
  { title: '名称', width: 200 }
]);

// 使用shallowRef减少响应式开销
const largeDataSet = shallowRef([]);
</script>
```

## 内存管理

### 1. 及时清理资源

```vue
<script setup>
import { onUnmounted } from 'vue';

let intervalId = null;

onMounted(() => {
  intervalId = setInterval(updateData, 5000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>
```

### 2. 使用WeakMap存储临时数据

```vue
<script setup>
// 使用WeakMap避免内存泄漏
const cellMetadata = new WeakMap();

const addCellMetadata = (cell, metadata) => {
  cellMetadata.set(cell, metadata);
};

const getCellMetadata = (cell) => {
  return cellMetadata.get(cell);
};
</script>
```

### 3. 限制数据缓存大小

```vue
<script setup>
const MAX_CACHE_SIZE = 1000;
const dataCache = new Map();

const getCachedData = (key) => {
  if (dataCache.has(key)) {
    // 移动到最后（LRU）
    const value = dataCache.get(key);
    dataCache.delete(key);
    dataCache.set(key, value);
    return value;
  }
  return null;
};

const setCachedData = (key, value) => {
  if (dataCache.size >= MAX_CACHE_SIZE) {
    // 删除最旧的条目
    const firstKey = dataCache.keys().next().value;
    dataCache.delete(firstKey);
  }
  dataCache.set(key, value);
};
</script>
```

## 响应式数据设计

### 1. 合理使用ref和reactive

```vue
<script setup>
import { ref, reactive } from 'vue';

// 基本类型使用ref
const rows = ref(100);
const selectedCell = ref(null);

// 对象使用reactive
const gridState = reactive({
  isEditing: false,
  currentTheme: 'light',
  selection: null
});

// 大型数据使用shallowRef
const largeDataSet = shallowRef([]);
</script>
```

### 2. 避免深度响应式

```vue
<script setup>
import { ref, shallowRef } from 'vue';

// ❌ 避免对大型对象使用ref
const largeData = ref({
  items: new Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    // ...更多属性
  }))
});

// ✅ 使用shallowRef
const largeData = shallowRef({
  items: new Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    // ...更多属性
  }))
});
</script>
```

### 3. 使用computed派生状态

```vue
<script setup>
import { computed } from 'vue';

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(1000);

// 派生状态
const totalWidth = computed(() => 
  columns.value.reduce((sum, col) => sum + col.width, 0)
);

const hasData = computed(() => rows.value > 0);
</script>
```

## 组件设计模式

### 1. 组合式函数封装

```vue
<!-- useDataGrid.js -->
<script setup>
import { ref, computed } from 'vue';

export function useDataGrid(initialColumns, initialRows) {
  const columns = ref(initialColumns);
  const rows = ref(initialRows);
  const selection = ref(null);
  
  const hasSelection = computed(() => selection.value !== null);
  
  const selectCell = (col, row) => {
    selection.value = { cell: [col, row] };
  };
  
  const clearSelection = () => {
    selection.value = null;
  };
  
  return {
    columns,
    rows,
    selection,
    hasSelection,
    selectCell,
    clearSelection
  };
}
</script>
```

```vue
<!-- MyGrid.vue -->
<script setup>
import { useDataGrid } from './useDataGrid';

const {
  columns,
  rows,
  selection,
  hasSelection,
  selectCell,
  clearSelection
} = useDataGrid(
  [
    { title: '姓名', width: 150 },
    { title: '年龄', width: 100 }
  ],
  100
);
</script>
```

### 2. 组件通信模式

```vue
<!-- ParentGrid.vue -->
<template>
  <div>
    <DataGrid
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      @selection-changed="handleSelectionChanged"
    />
    <GridDetails
      v-if="selectedCell"
      :cell="selectedCell"
      @edit="handleEdit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DataGrid from './DataGrid.vue';
import GridDetails from './GridDetails.vue';

const selectedCell = ref(null);

const handleSelectionChanged = (selection) => {
  selectedCell.value = selection;
};

const handleEdit = (newValue) => {
  // 处理编辑
};
</script>
```

### 3. 插槽扩展模式

```vue
<!-- EnhancedDataGrid.vue -->
<template>
  <div class="enhanced-grid">
    <DataEditor
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      @cell-clicked="handleCellClicked"
    >
      <!-- 自定义工具栏 -->
      <template #toolbar>
        <div class="toolbar">
          <slot name="toolbar-actions" />
        </div>
      </template>
      
      <!-- 自定义单元格 -->
      <template #cell="{ cell, col, row }">
        <slot 
          name="custom-cell" 
          :cell="cell" 
          :col="col" 
          :row="row"
        >
          {{ cell.data }}
        </slot>
      </template>
    </DataEditor>
  </div>
</template>
```

## 事件处理

### 1. 事件防抖和节流

```vue
<script setup>
import { ref } from 'vue';
import { useDebounceFn, useThrottleFn } from '@glideapps/vue-data-grid';

const searchQuery = ref('');

// 防抖搜索
const debouncedSearch = useDebounceFn((query) => {
  console.log('搜索:', query);
}, 300);

// 节流滚动
const throttledScroll = useThrottleFn((event) => {
  console.log('滚动:', event);
}, 100);

const handleSearchInput = (event) => {
  searchQuery.value = event.target.value;
  debouncedSearch(searchQuery.value);
};
</script>
```

### 2. 事件委托

```vue
<template>
  <div class="grid-container" @click="handleContainerClick">
    <DataEditor
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
    />
  </div>
</template>

<script setup>
const handleContainerClick = (event) => {
  // 检查点击的是否是特定元素
  if (event.target.matches('.custom-button')) {
    handleCustomButtonClick(event);
  }
};

const handleCustomButtonClick = (event) => {
  console.log('自定义按钮被点击:', event);
};
</script>
```

### 3. 事件清理

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

let keydownHandler = null;

onMounted(() => {
  keydownHandler = (event) => {
    if (event.key === 'Escape') {
      handleEscapeKey();
    }
  };
  document.addEventListener('keydown', keydownHandler);
});

onUnmounted(() => {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }
});

const handleEscapeKey = () => {
  console.log('Escape键被按下');
};
</script>
```

## 样式和主题

### 1. 主题系统设计

```vue
<script setup>
import { computed } from 'vue';

// 基础主题
const baseTheme = {
  bgCell: '#ffffff',
  bgCellMedium: '#f5f5f5',
  bgHeader: '#f1f1f1',
  textDark: '#333333',
  textLight: '#666666',
  textHeader: '#444444',
  accentColor: '#4285f4',
  accentLight: '#d4e3fc'
};

// 主题变体
const themes = {
  light: baseTheme,
  dark: {
    ...baseTheme,
    bgCell: '#2d2d2d',
    bgCellMedium: '#3d3d3d',
    bgHeader: '#4d4d4d',
    textDark: '#ffffff',
    textLight: '#cccccc',
    textHeader: '#ffffff',
    accentColor: '#64b5f6',
    accentLight: '#1a237e'
  },
  blue: {
    ...baseTheme,
    bgCell: '#e3f2fd',
    bgCellMedium: '#bbdefb',
    bgHeader: '#90caf9',
    accentColor: '#2196f3'
  }
};

const currentTheme = computed(() => themes[themeName.value]);
</script>
```

### 2. CSS变量使用

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :style="gridStyle"
    :class="['data-grid', `theme-${themeName}`]"
  />
</template>

<script setup>
import { computed } from 'vue';

const gridStyle = computed(() => ({
  '--bg-cell': currentTheme.value.bgCell,
  '--bg-cell-medium': currentTheme.value.bgCellMedium,
  '--bg-header': currentTheme.value.bgHeader,
  '--text-dark': currentTheme.value.textDark,
  '--text-light': currentTheme.value.textLight,
  '--text-header': currentTheme.value.textHeader,
  '--accent-color': currentTheme.value.accentColor,
  '--accent-light': currentTheme.value.accentLight
}));
</script>

<style scoped>
.data-grid {
  background-color: var(--bg-cell);
  color: var(--text-dark);
}

.data-grid.theme-dark {
  /* 深色主题特定样式 */
}

.data-grid.theme-blue {
  /* 蓝色主题特定样式 */
}
</style>
```

### 3. 响应式设计

```vue
<template>
  <DataEditor
    :columns="responsiveColumns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :width="gridWidth"
    :height="gridHeight"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

const updateWindowSize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener('resize', updateWindowSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize);
});

const gridWidth = computed(() => {
  if (windowWidth.value < 768) return windowWidth.value - 32;
  if (windowWidth.value < 1024) return windowWidth.value - 64;
  return Math.min(windowWidth.value - 128, 1200);
});

const gridHeight = computed(() => {
  return Math.min(windowHeight.value - 200, 800);
});

const responsiveColumns = computed(() => {
  if (windowWidth.value < 768) {
    // 移动端只显示重要列
    return columns.value.filter(col => col.important);
  }
  return columns.value;
});
</script>
```

## 无障碍功能

### 1. ARIA属性设置

```vue
<template>
  <DataEditor
    :columns="columns"
    :rows="rows"
    :get-cell-content="getCellContent"
    :aria-label="gridAriaLabel"
    :aria-describedby="gridAriaDescribedBy"
    :accessibility-options="accessibilityOptions"
    @accessibility-announcement="handleAnnouncement"
  />
  
  <!-- 屏幕阅读器公告区域 -->
  <div
    ref="announcementRegion"
    class="sr-only"
    aria-live="polite"
    aria-atomic="true"
  >
    {{ announcementText }}
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const announcementRegion = ref(null);
const announcementText = ref('');

const gridAriaLabel = computed(() => 
  isScreenReaderMode.value ? '数据表格，使用方向键导航，Enter键编辑' : undefined
);

const gridAriaDescribedBy = computed(() => 
  isScreenReaderMode.value ? 'grid-help' : undefined
);

const accessibilityOptions = computed(() => ({
  screenReaderMode: isScreenReaderMode.value,
  highContrastMode: isHighContrastMode.value,
  keyboardNavigation: true,
  announceChanges: true,
  focusIndicators: true
}));

const handleAnnouncement = (message) => {
  announcementText.value = message;
  
  // 清空公告区域以便下次可以公告相同内容
  nextTick(() => {
    if (announcementRegion.value) {
      announcementRegion.value.textContent = message;
      setTimeout(() => {
        announcementRegion.value.textContent = '';
      }, 100);
    }
  });
};
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### 2. 键盘导航增强

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

const handleKeyDown = (event) => {
  // 处理全局键盘快捷键
  switch (event.key) {
    case 'F1':
      event.preventDefault();
      showHelp.value = !showHelp.value;
      announce(showHelp.value ? '帮助已显示' : '帮助已隐藏');
      break;
    case 'F6':
      event.preventDefault();
      // 在网格和其他元素之间切换焦点
      toggleFocus();
      break;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
```

## 测试策略

### 1. 单元测试

```vue
<!-- MyGrid.spec.js -->
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MyGrid from './MyGrid.vue';

describe('MyGrid', () => {
  it('应该正确渲染数据网格', () => {
    const wrapper = mount(MyGrid);
    expect(wrapper.find('.data-grid').exists()).toBe(true);
  });
  
  it('应该处理单元格点击', async () => {
    const wrapper = mount(MyGrid);
    await wrapper.vm.handleCellClicked([0, 0]);
    expect(wrapper.vm.selectedCell).toEqual([0, 0]);
  });
  
  it('应该正确计算总宽度', () => {
    const wrapper = mount(MyGrid, {
      props: {
        columns: [
          { title: 'A', width: 100 },
          { title: 'B', width: 200 }
        ]
      }
    });
    expect(wrapper.vm.totalWidth).toBe(300);
  });
});
```

### 2. 集成测试

```vue
<!-- GridIntegration.spec.js -->
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DataEditor from '@glideapps/vue-data-grid';

describe('DataEditor Integration', () => {
  it('应该正确处理大数据集', async () => {
    const columns = [
      { title: 'ID', width: 100 },
      { title: 'Name', width: 200 }
    ];
    
    const rows = 10000;
    
    const getCellContent = vi.fn(([col, row]) => ({
      kind: 'text',
      data: `Cell ${col}-${row}`,
      allowOverlay: true
    }));
    
    const wrapper = mount(DataEditor, {
      props: {
        columns,
        rows,
        getCellContent,
        width: 800,
        height: 600
      }
    });
    
    // 验证虚拟化是否正常工作
    expect(wrapper.vm.visibleCells).toBeLessThan(rows);
  });
});
```

### 3. 性能测试

```vue
<!-- Performance.spec.js -->
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MyGrid from './MyGrid.vue';

describe('Performance', () => {
  it('应该在合理时间内渲染大数据集', () => {
    const startTime = performance.now();
    
    const wrapper = mount(MyGrid, {
      props: {
        rows: 10000,
        columns: Array.from({ length: 50 }, (_, i) => ({
          title: `Column ${i}`,
          width: 120
        }))
      }
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 渲染时间应该在合理范围内
    expect(renderTime).toBeLessThan(1000);
  });
});
```

## 常见陷阱

### 1. 避免在getCellContent中进行重计算

```vue
<script setup>
// ❌ 错误：每次都进行重计算
const getCellContent = ([col, row]) => {
  // 每次都创建新对象，影响性能
  return {
    kind: GridCellKind.Text,
    data: heavyComputation(col, row), // 耗时计算
    allowOverlay: true
  };
};

// ✅ 正确：使用缓存
const cellCache = new Map();

const getCellContent = ([col, row]) => {
  const key = `${col}-${row}`;
  
  if (cellCache.has(key)) {
    return cellCache.get(key);
  }
  
  const cell = {
    kind: GridCellKind.Text,
    data: heavyComputation(col, row),
    allowOverlay: true
  };
  
  cellCache.set(key, cell);
  return cell;
};
</script>
```

### 2. 避免频繁更新大数据集

```vue
<script setup>
// ❌ 错误：频繁更新整个数据集
const updateData = () => {
  // 每次都替换整个数组，导致大量重新渲染
  data.value = generateNewData();
};

// ✅ 正确：增量更新
const updateData = () => {
  // 只更新变化的部分
  const newData = generateNewData();
  for (let i = 0; i < newData.length; i++) {
    if (newData[i] !== data.value[i]) {
      data.value[i] = newData[i];
    }
  }
};
</script>
```

### 3. 避免深度监听大型对象

```vue
<script setup>
import { ref, watch } from 'vue';

const largeData = ref({});

// ❌ 错误：深度监听大型对象
watch(largeData, (newVal) => {
  console.log('数据变化:', newVal);
}, { deep: true });

// ✅ 正确：监听特定属性
watch(() => largeData.value.importantProperty, (newVal) => {
  console.log('重要属性变化:', newVal);
});
</script>
```

## 故障排除

### 1. 性能问题诊断

```vue
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // 使用Performance API监控性能
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 100) {
        console.warn('慢操作检测到:', entry.name, entry.duration);
      }
    }
  });
  
  observer.observe({ entryTypes: ['measure', 'navigation'] });
  
  // 标记关键操作
  performance.mark('grid-render-start');
  
  // 网格渲染完成后
  nextTick(() => {
    performance.mark('grid-render-end');
    performance.measure('grid-render', 'grid-render-start', 'grid-render-end');
  });
});
</script>
```

### 2. 内存泄漏检测

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const components = ref(new Set());

onMounted(() => {
  // 定期检查内存使用
  const memoryCheckInterval = setInterval(() => {
    if (performance.memory) {
      const memory = performance.memory;
      console.log('内存使用:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }, 5000);
  
  // 清理定时器
  onUnmounted(() => {
    clearInterval(memoryCheckInterval);
  });
});
</script>
```

### 3. 调试工具

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const debugMode = ref(process.env.NODE_ENV === 'development');

watchEffect(() => {
  if (debugMode.value) {
    // 开发环境下启用详细日志
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
  } else {
    // 生产环境下移除监听器
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handlePromiseRejection);
  }
});

const handleError = (event) => {
  console.error('全局错误:', event.error);
};

const handlePromiseRejection = (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
};

// 提供调试方法
window.debugGrid = {
  getSelection: () => selection.value,
  setSelection: (cell) => selectCell(...cell),
  getVisibleCells: () => visibleCells.value,
  getPerformanceMetrics: () => performanceMetrics.value
};
</script>
```

## 总结

遵循这些最佳实践可以帮助您构建高性能、可维护的Vue Data Grid应用：

1. **性能优先**：始终考虑性能影响，特别是在处理大数据集时
2. **合理使用响应式**：避免不必要的深度响应式，使用shallowRef和markRaw优化
3. **组件化设计**：使用组合式函数封装逻辑，提高代码复用性
4. **无障碍友好**：确保应用对所有用户都可访问
5. **测试覆盖**：编写全面的测试确保代码质量
6. **监控和调试**：使用工具监控性能和内存使用

通过遵循这些指南，您可以充分发挥Vue Data Grid的潜力，构建出色的数据表格应用。