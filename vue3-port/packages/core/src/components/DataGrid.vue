<template>
  <div
    ref="containerRef"
    class="vue-glide-data-grid"
    :style="containerStyle"
    :tabindex="tabindex"
    @focus="onFocus"
    @blur="onBlur"
  >
    <!-- Canvas 主渲染层 -->
    <canvas
      ref="canvasRef"
      class="vue-glide-data-grid__canvas"
      :width="canvasSize.width"
      :height="canvasSize.height"
      :style="canvasStyle"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel="onWheel"
      @contextmenu="onContextMenu"
    />

    <!-- 覆盖层容器 -->
    <div
      v-if="overlayVisible"
      class="vue-glide-data-grid__overlay"
      :style="overlayStyle"
    >
      <component
        :is="overlayComponent"
        v-bind="overlayProps"
        @update="onOverlayUpdate"
        @close="onOverlayClose"
        @finished="onOverlayFinished"
      />
    </div>

    <!-- 搜索组件 -->
    <div
      v-if="searchVisible"
      class="vue-glide-data-grid__search"
      :style="searchStyle"
    >
      <component
        :is="searchComponent"
        v-bind="searchProps"
        @search="onSearch"
        @close="onSearchClose"
      />
    </div>

    <!-- 调试信息 (开发模式) -->
    <div
      v-if="showDebugInfo && isDevelopment"
      class="vue-glide-data-grid__debug"
    >
      <div>Render Time: {{ renderTime.toFixed(2) }}ms</div>
      <div>FPS: {{ fps }}</div>
      <div>Visible Region: {{ visibleRegion }}</div>
      <div>Selection: {{ selectionInfo }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  provide,
  type Component
} from 'vue';

// 导入类型
import type { GridColumn } from '../types/grid-column.js';
import type { GridCell } from '../types/grid-cell.js';
import type { Item, GridSelection, Rectangle } from '../types/base.js';
import type { FullTheme } from '../types/theme.js';
import type { DataGridEmits } from '../types/events.js';
import type { GetCellRendererCallback } from '../types/cell-renderer.js';

// 导入组合式函数
import { useTheme, provideTheme } from '../composables/useTheme.js';
import { useCanvasRender, type CanvasRenderConfig } from '../composables/useCanvasRender.js';
import { useGridEvents } from '../composables/useGridEvents.js';

// Props 定义
interface Props {
  columns: GridColumn[];
  rows: number;
  getCellContent: (cell: Item) => GridCell;
  getCellRenderer?: GetCellRendererCallback;

  // 尺寸相关
  width?: number;
  height?: number;
  rowHeight?: number;
  headerHeight?: number;

  // 选择相关
  selection?: GridSelection;

  // 滚动相关
  scrollX?: number;
  scrollY?: number;
  smoothScrollX?: boolean;
  smoothScrollY?: boolean;

  // 冻结相关
  freezeColumns?: number;
  freezeRows?: number;

  // 主题相关
  theme?: Partial<FullTheme>;

  // 交互相关
  readonly?: boolean;
  tabindex?: number;

  // 功能开关
  enableSearch?: boolean;
  enableKeyboardNavigation?: boolean;
  enableColumnResize?: boolean;
  enableRowResize?: boolean;

  // 调试相关
  showDebugInfo?: boolean;
}

// 设置默认值
const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 400,
  rowHeight: 32,
  headerHeight: 36,
  scrollX: 0,
  scrollY: 0,
  smoothScrollX: true,
  smoothScrollY: true,
  freezeColumns: 0,
  freezeRows: 0,
  readonly: false,
  tabindex: 0,
  enableSearch: true,
  enableKeyboardNavigation: true,
  enableColumnResize: true,
  enableRowResize: false,
  showDebugInfo: false,
});

// Emits 定义
const emit = defineEmits<DataGridEmits>();

// 模板引用
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 主题系统
const themeProvider = provideTheme(computed(() => props.theme || {}));
const { theme, cssVariables } = useTheme();

// Canvas渲染配置
const renderConfig = computed<CanvasRenderConfig>(() => ({
  width: props.width,
  height: props.height,
  columns: props.columns,
  rows: props.rows,
  getCellContent: props.getCellContent,
  getCellRenderer: props.getCellRenderer,
  selection: props.selection,
  scrollX: props.scrollX,
  scrollY: props.scrollY,
  freezeColumns: props.freezeColumns,
  freezeRows: props.freezeRows,
  rowHeight: props.rowHeight,
  headerHeight: props.headerHeight,
  smoothScrollX: props.smoothScrollX,
  smoothScrollY: props.smoothScrollY,
}));

// Canvas渲染管理
const {
  canvasSize,
  displaySize,
  renderState,
  requestRedraw,
  forceRedraw,
  getCanvasPoint,
  getCellAtPoint,
} = useCanvasRender(canvasRef, renderConfig, theme);

// 事件管理
const {
  eventState,
  isFocused,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onKeyDown,
  onKeyUp,
  onWheel,
  onFocus,
  onBlur,
} = useGridEvents(containerRef, getCellAtPoint, emit);

// 覆盖层状态
const overlayVisible = ref(false);
const overlayComponent = ref<Component | null>(null);
const overlayProps = ref<Record<string, any>>({});
const overlayPosition = ref<Rectangle>({ x: 0, y: 0, width: 0, height: 0 });

// 搜索状态
const searchVisible = ref(false);
const searchComponent = ref<Component | null>(null);
const searchProps = ref<Record<string, any>>({});

// 性能监控
const renderTime = ref(0);
const fps = ref(0);
const frameCount = ref(0);
const lastFpsUpdate = ref(Date.now());

// 开发模式检测
const isDevelopment = process.env.NODE_ENV === 'development';

// 计算属性
const containerStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  outline: 'none',
  ...cssVariables.value,
}));

const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  top: '0',
  left: '0',
  width: `${displaySize.value.width}px`,
  height: `${displaySize.value.height}px`,
  cursor: eventState.value.isDragging ? 'grabbing' : 'default',
}));

const overlayStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${overlayPosition.value.x}px`,
  top: `${overlayPosition.value.y}px`,
  width: `${overlayPosition.value.width}px`,
  height: `${overlayPosition.value.height}px`,
  zIndex: 1000,
  pointerEvents: 'auto' as const,
}));

const searchStyle = computed(() => ({
  position: 'absolute' as const,
  top: '10px',
  right: '10px',
  zIndex: 1001,
}));

const visibleRegion = computed(() => {
  const region = renderState.value.visibleRegion;
  return `${region.x},${region.y} ${region.width}x${region.height}`;
});

const selectionInfo = computed(() => {
  if (!props.selection?.current) return 'None';
  const sel = props.selection.current;
  return `${sel.cell[0]},${sel.cell[1]}`;
});

// 方法
const showOverlay = (
  component: Component,
  position: Rectangle,
  componentProps: Record<string, any> = {}
) => {
  overlayComponent.value = component;
  overlayPosition.value = position;
  overlayProps.value = componentProps;
  overlayVisible.value = true;
};

const hideOverlay = () => {
  overlayVisible.value = false;
  overlayComponent.value = null;
  overlayProps.value = {};
};

const showSearch = (component: Component, componentProps: Record<string, any> = {}) => {
  searchComponent.value = component;
  searchProps.value = componentProps;
  searchVisible.value = true;
};

const hideSearch = () => {
  searchVisible.value = false;
  searchComponent.value = null;
  searchProps.value = {};
};

// 滚动到指定位置
const scrollTo = (col: number, row: number, behavior: 'auto' | 'smooth' = 'smooth') => {
  const newScrollX = col * 150; // 简化的列宽计算
  const newScrollY = row * props.rowHeight;

  emit('scroll-to', { col, row });
};

// 获取单元格边界
const getCellBounds = (col: number, row: number): Rectangle => {
  // 简化的边界计算
  return {
    x: col * 150,
    y: row * props.rowHeight,
    width: 150,
    height: props.rowHeight,
  };
};

// 事件处理
const onContextMenu = (event: MouseEvent) => {
  event.preventDefault();
};

const onOverlayUpdate = (data: any) => {
  // 处理覆盖层数据更新
  console.log('Overlay update:', data);
};

const onOverlayClose = () => {
  hideOverlay();
};

const onOverlayFinished = (result: any) => {
  console.log('Overlay finished:', result);
  hideOverlay();
};

const onSearch = (query: string) => {
  emit('search', { query, results: [] }); // 简化的搜索结果
};

const onSearchClose = () => {
  hideSearch();
  emit('search-close');
};

// 性能监控
const updatePerformanceMetrics = () => {
  frameCount.value++;
  renderTime.value = renderState.value.lastRenderTime;

  const now = Date.now();
  if (now - lastFpsUpdate.value >= 1000) {
    fps.value = Math.round((frameCount.value * 1000) / (now - lastFpsUpdate.value));
    frameCount.value = 0;
    lastFpsUpdate.value = now;
  }
};

// 监听渲染状态变化
watch(renderState, updatePerformanceMetrics, { deep: true });

// 监听props变化，触发重绘
watch(() => [props.columns, props.rows, props.selection], () => {
  requestRedraw();
}, { deep: true });

// 组件挂载
onMounted(() => {
  nextTick(() => {
    emit('ready');
  });
});

// 暴露给父组件的方法
defineExpose({
  // 渲染控制
  requestRedraw,
  forceRedraw,

  // 滚动控制
  scrollTo,

  // 覆盖层控制
  showOverlay,
  hideOverlay,

  // 搜索控制
  showSearch,
  hideSearch,

  // 获取信息
  getCellAtPoint,
  getCellBounds,
  getCanvasPoint,

  // 焦点控制
  focus: () => containerRef.value?.focus(),
  blur: () => containerRef.value?.blur(),

  // 性能信息
  getPerformanceMetrics: () => ({
    renderTime: renderTime.value,
    fps: fps.value,
    visibleRegion: renderState.value.visibleRegion,
  }),
});

// 提供给子组件的数据
provide('dataGridInstance', {
  getCellAtPoint,
  getCellBounds,
  requestRedraw,
  theme,
});
</script>

<style scoped>
.vue-glide-data-grid {
  font-family: var(--gdg-font-family, 'Inter', 'Helvetica Neue', Arial, sans-serif);
  user-select: none;
  position: relative;
  box-sizing: border-box;
}

.vue-glide-data-grid__canvas {
  display: block;
  touch-action: none;
}

.vue-glide-data-grid__overlay {
  background: var(--gdg-bg-cell, white);
  border: 1px solid var(--gdg-border-color, #e1e2e5);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.vue-glide-data-grid__search {
  background: var(--gdg-bg-cell, white);
  border: 1px solid var(--gdg-border-color, #e1e2e5);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 8px;
}

.vue-glide-data-grid__debug {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  z-index: 2000;
  pointer-events: none;
}

.vue-glide-data-grid__debug > div {
  margin-bottom: 2px;
}

.vue-glide-data-grid__debug > div:last-child {
  margin-bottom: 0;
}

/* 确保Canvas不会被选中 */
.vue-glide-data-grid__canvas {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

/* 焦点样式 */
.vue-glide-data-grid:focus {
  outline: 2px solid var(--gdg-accent-color, #4f5dfd);
  outline-offset: -2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .vue-glide-data-grid {
    border: 1px solid;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .vue-glide-data-grid * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
