# Vue3移植 - 立即开始指南

## 项目概述

本指南帮助你立即开始Glide Data Grid的Vue3移植工作。

## 前置条件

- Node.js 16+
- pnpm 8+
- Vue 3.3+
- TypeScript 5.0+
- 熟悉Vue3组合式API

## 第一阶段：立即可开始的任务 (本周)

### 1. 创建项目基础结构

```bash
# 创建新项目目录
mkdir vue-glide-data-grid
cd vue-glide-data-grid

# 初始化项目
pnpm init

# 创建workspace配置
echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml

# 创建基础目录结构
mkdir -p packages/core/src/{components,composables,cells,internal,common,types}
mkdir -p packages/cells/src
mkdir -p packages/source/src
mkdir -p examples
mkdir -p playground
mkdir -p docs
```

### 2. 配置基础依赖

**根目录 package.json**:
```json
{
  "name": "vue-glide-data-grid",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint packages/*/src --ext .ts,.vue",
    "type-check": "vue-tsc --noEmit"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vue/eslint-config-typescript": "^12.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-vue": "^9.15.0",
    "prettier": "^3.0.0",
    "typescript": "^5.1.0",
    "vue-tsc": "^1.8.0"
  }
}
```

**packages/core/package.json**:
```json
{
  "name": "@vue-glide/data-grid",
  "version": "1.0.0-alpha.1",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./style": "./dist/style.css"
  },
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "@vue/test-utils": "^2.4.0",
    "vite": "^4.4.0",
    "vite-plugin-dts": "^3.0.0",
    "vitest": "^0.34.0",
    "vue": "^3.3.0"
  }
}
```

### 3. 核心类型定义迁移 (优先任务)

**创建 `packages/core/src/types/base.ts`**:
```typescript
// 基础数据类型
export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Item = readonly [number, number]; // [col, row]

export interface Slice {
  start: number;
  end: number;
}
```

**创建 `packages/core/src/types/grid.ts`**:
```typescript
import type { Component } from 'vue';

// 单元格类型枚举
export enum GridCellKind {
  Uri = "uri",
  Text = "text", 
  Image = "image",
  RowID = "row-id",
  Number = "number",
  Bubble = "bubble",
  Boolean = "boolean",
  Loading = "loading",
  Markdown = "markdown",
  Drilldown = "drilldown",
  Protected = "protected",
  Custom = "custom",
}

// 基础单元格接口
export interface BaseGridCell {
  readonly kind: GridCellKind;
  readonly allowOverlay: boolean;
  readonly readonly?: boolean;
  readonly span?: readonly [number, number];
}

// 文本单元格
export interface TextCell extends BaseGridCell {
  readonly kind: GridCellKind.Text;
  readonly data: string;
  readonly displayData?: string;
  readonly allowWrapping?: boolean;
}

// 数字单元格
export interface NumberCell extends BaseGridCell {
  readonly kind: GridCellKind.Number;
  readonly data: number | undefined;
  readonly displayData?: string;
  readonly formatHint?: string;
}

// 联合类型
export type GridCell = TextCell | NumberCell | /* 其他单元格类型... */;

// 列定义
export interface GridColumn {
  readonly title: string;
  readonly id?: string;
  readonly width: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly grow?: number;
  readonly icon?: string;
  readonly overlayIcon?: string;
  readonly hasMenu?: boolean;
  readonly style?: 'normal' | 'highlight';
  readonly themeOverride?: Partial<Theme>;
}
```

### 4. 主题系统设计

**创建 `packages/core/src/types/theme.ts`**:
```typescript
// 主题接口
export interface Theme {
  accentColor: string;
  accentFg: string;
  accentLight: string;
  textDark: string;
  textMedium: string;
  textLight: string;
  textBubble: string;
  bgIconHeader: string;
  fgIconHeader: string;
  textHeader: string;
  bgCell: string;
  bgCellMedium: string;
  bgHeader: string;
  bgHeaderHovered: string;
  bgHeaderHasFocus: string;
  bgBubble: string;
  bgBubbleSelected: string;
  borderColor: string;
  drilldownBorder: string;
  linkColor: string;
  cellHorizontalPadding: number;
  cellVerticalPadding: number;
  headerFontStyle: string;
  baseFontStyle: string;
  fontFamily: string;
  editorFontSize: string;
  // ... 更多主题属性
}

export type FullTheme = Required<Theme>;
```

**创建 `packages/core/src/composables/useTheme.ts`**:
```typescript
import { inject, provide, readonly, ref, type Ref } from 'vue';
import type { Theme, FullTheme } from '../types/theme';

// 默认主题
export const defaultTheme: FullTheme = {
  accentColor: "#4F5DFD",
  accentFg: "#FFFFFF", 
  accentLight: "rgba(79, 93, 253, 0.1)",
  textDark: "#313139",
  textMedium: "#737383",
  textLight: "#B2B2C0",
  // ... 完整的默认主题配置
};

// 主题注入键
const THEME_KEY = Symbol('glide-theme');

// 提供主题
export function provideTheme(theme: Ref<Partial<Theme>> | Partial<Theme>) {
  const themeRef = ref(theme);
  const mergedTheme = computed(() => ({
    ...defaultTheme,
    ...themeRef.value
  }));
  
  provide(THEME_KEY, readonly(mergedTheme));
  return mergedTheme;
}

// 使用主题
export function useTheme(): Ref<FullTheme> {
  const theme = inject(THEME_KEY);
  if (!theme) {
    console.warn('Theme not provided, using default theme');
    return readonly(ref(defaultTheme));
  }
  return theme;
}
```

### 5. 基础组件结构

**创建 `packages/core/src/components/DataGrid.vue`**:
```vue
<template>
  <div 
    ref="containerRef"
    class="glide-data-grid"
    :style="containerStyle"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @keydown="onKeyDown"
    @wheel="onWheel"
  >
    <canvas
      ref="canvasRef"
      :width="canvasSize.width"
      :height="canvasSize.height"
      :style="canvasStyle"
    />
    
    <!-- 覆盖层内容 -->
    <div 
      v-if="overlay.visible"
      class="glide-overlay"
      :style="overlayStyle"
    >
      <component 
        :is="overlay.component"
        v-bind="overlay.props"
        @update="onOverlayUpdate"
        @close="onOverlayClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { GridColumn, GridCell, GridSelection } from '../types';
import { useTheme } from '../composables/useTheme';
import { useCanvasRender } from '../composables/useCanvasRender';
import { useSelection } from '../composables/useSelection';
import { useEvents } from '../composables/useEvents';

// Props定义
interface Props {
  columns: GridColumn[];
  rows: number;
  getCellContent: (cell: Item) => GridCell;
  selection?: GridSelection;
  onSelectionChange?: (selection: GridSelection) => void;
  theme?: Partial<Theme>;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
});

// Emits定义  
interface Emits {
  'update:selection': [selection: GridSelection];
  'cell-click': [args: CellClickedEventArgs];
  'cell-activated': [args: CellActivatedEventArgs];
  'header-click': [args: HeaderClickedEventArgs];
}

const emit = defineEmits<Emits>();

// 响应式数据
const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();

// 使用组合式函数
const theme = useTheme();
const { render, canvasSize } = useCanvasRender(canvasRef, props, theme);
const { selection, updateSelection } = useSelection(props);
const { onMouseDown, onMouseMove, onMouseUp, onKeyDown, onWheel } = useEvents();

// 样式计算
const containerStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative',
  overflow: 'hidden',
}));

const canvasStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
}));

// 覆盖层状态
const overlay = ref({
  visible: false,
  component: null,
  props: {},
});

const overlayStyle = computed(() => ({
  position: 'absolute',
  // ... 覆盖层样式
}));

// 生命周期
onMounted(() => {
  // 初始化渲染
  render();
});

// 监听属性变化
watch(() => props.columns, () => {
  render();
}, { deep: true });

watch(() => props.rows, () => {
  render();
});

// 事件处理函数
function onOverlayUpdate(data: any) {
  // 处理覆盖层更新
}

function onOverlayClose() {
  overlay.value.visible = false;
}

// 暴露给父组件的方法
defineExpose({
  scrollTo,
  focus,
  getBounds,
});

function scrollTo(col: number, row: number) {
  // 滚动到指定位置
}

function focus() {
  containerRef.value?.focus();
}

function getBounds() {
  return containerRef.value?.getBoundingClientRect();
}
</script>

<style scoped>
.glide-data-grid {
  font-family: var(--gdg-font-family, 'Inter', sans-serif);
  user-select: none;
}

.glide-overlay {
  z-index: 1000;
  background: white;
  border: 1px solid var(--gdg-border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
```

### 6. 立即可执行的下一步

1. **今天**: 
   - 创建项目结构
   - 配置基础依赖
   - 设置开发环境

2. **明天**:
   - 完成基础类型定义
   - 实现主题系统
   - 创建DataGrid组件骨架

3. **本周内**:
   - 实现基础的Canvas渲染
   - 创建简单的文本单元格渲染器
   - 完成基础事件处理

## 开发建议

### 渐进式迁移策略
1. 先创建最小可工作版本
2. 逐步增加功能
3. 保持与React版本的API一致性
4. 充分利用Vue3的响应式特性

### 调试和测试
- 使用Vue DevTools进行组件调试
- 对比React版本的渲染结果
- 建立性能基准测试

### 关键注意点
- Canvas渲染逻辑与框架无关，重点关注状态管理
- 事件处理需要仔细适配Vue的事件系统
- 充分利用Vue3的Composition API优势
- 保持TypeScript类型安全

## 联系和支持

- 参考详细计划: `VUE3_MIGRATION_PLAN.md`
- 任务跟踪: `VUE3_MIGRATION_TRACKER.md`
- 遇到问题时，可以参考原React版本的实现逻辑

开始愉快的Vue3移植之旅！ 🚀