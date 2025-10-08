<template>
  <div class="scrolling-example">
    <h2>Vue版本滚动和虚拟化系统示例</h2>
    
    <div class="controls">
      <button @click="scrollToTop">滚动到顶部</button>
      <button @click="scrollToBottom">滚动到底部</button>
      <button @click="scrollToLeft">滚动到左侧</button>
      <button @click="scrollToRight">滚动到右侧</button>
      <button @click="scrollToCell(50, 100)">滚动到单元格(50, 100)</button>
    </div>
    
    <div class="grid-container" ref="containerRef">
      <ScrollingDataGrid
        ref="scrollingDataGridRef"
        class-name="data-grid"
        :client-size="[containerWidth, containerHeight, 0]"
        :columns="columns"
        :rows="rows"
        :row-height="rowHeight"
        :header-height="40"
        :group-header-height="0"
        :enable-groups="false"
        :freeze-columns="2"
        :freeze-trailing-rows="2"
        :non-grow-width="totalWidth"
        :on-visible-region-changed="onVisibleRegionChanged"
        :scroll-ref="scrollRef"
        :overscroll-x="0"
        :overscroll-y="0"
        :initial-size="[containerWidth, containerHeight]"
        :prevent-diagonal-scrolling="false"
        :right-element-props="undefined"
        :right-element="undefined"
      />
    </div>
    
    <div class="info">
      <h3>可见区域信息</h3>
      <p>位置: ({{ visibleRegion.x }}, {{ visibleRegion.y }})</p>
      <p>大小: {{ visibleRegion.width }} × {{ visibleRegion.height }}</p>
      <p>偏移: ({{ visibleRegion.tx }}, {{ visibleRegion.ty }})</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ScrollingDataGrid } from "../index.js";
import type { VisibleRegion } from "../data-editor/visible-region.js";

// 示例数据
const rows = 10000;
const columns = Array.from({ length: 100 }, (_, i) => ({
  id: `col-${i}`,
  title: `列 ${i + 1}`,
  width: 120,
}));

const rowHeight = 35;

// 容器尺寸
const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(800);
const containerHeight = ref(600);

// 计算总宽度
const totalWidth = computed(() => 
  columns.reduce((sum, col) => sum + col.width, 0)
);

// 可见区域
const visibleRegion = ref<VisibleRegion>({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  tx: 0,
  ty: 0,
});

// 组件引用
const scrollingDataGridRef = ref<InstanceType<typeof ScrollingDataGrid> | null>(null);
const scrollRef = ref({ value: null as HTMLDivElement | null });

// 事件处理
const onVisibleRegionChanged = (
  region: VisibleRegion,
  clientWidth: number,
  clientHeight: number,
  rightElWidth: number,
  tx: number,
  ty: number
) => {
  visibleRegion.value = {
    ...region,
    tx,
    ty,
  };
  console.log("可见区域变化:", region);
};

// 滚动方法
const scrollToTop = () => {
  if (scrollingDataGridRef.value) {
    // 这里需要调用实际的滚动方法
    console.log("滚动到顶部");
  }
};

const scrollToBottom = () => {
  if (scrollingDataGridRef.value) {
    // 这里需要调用实际的滚动方法
    console.log("滚动到底部");
  }
};

const scrollToLeft = () => {
  if (scrollingDataGridRef.value) {
    // 这里需要调用实际的滚动方法
    console.log("滚动到左侧");
  }
};

const scrollToRight = () => {
  if (scrollingDataGridRef.value) {
    // 这里需要调用实际的滚动方法
    console.log("滚动到右侧");
  }
};

const scrollToCell = (col: number, row: number) => {
  if (scrollingDataGridRef.value) {
    // 这里需要调用实际的滚动方法
    console.log(`滚动到单元格(${col}, ${row})`);
  }
};

// 初始化
onMounted(() => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    containerWidth.value = rect.width;
    containerHeight.value = rect.height;
  }
});
</script>

<style scoped>
.scrolling-example {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.controls button {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #357abd;
}

.grid-container {
  flex: 1;
  border: 1px solid #ddd;
  overflow: hidden;
  position: relative;
}

.data-grid {
  width: 100%;
  height: 100%;
}

.info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.info h3 {
  margin-top: 0;
}
</style>