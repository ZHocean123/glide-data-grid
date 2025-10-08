<template>
  <div class="performance-example">
    <h1>性能优化示例</h1>
    
    <div class="description">
      <p>这个示例展示了Vue Data Grid在处理大数据集时的性能优化能力，包括虚拟滚动、懒加载和其他优化技术。</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label>数据集大小:</label>
        <select v-model="dataSetSize" @change="changeDataSetSize">
          <option value="small">小 (1,000 行 × 50 列)</option>
          <option value="medium">中 (10,000 行 × 100 列)</option>
          <option value="large">大 (100,000 行 × 200 列)</option>
          <option value="xlarge">超大 (1,000,000 行 × 500 列)</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>性能优化选项:</label>
        <label>
          <input type="checkbox" v-model="enableVirtualization" />
          启用虚拟化
        </label>
        <label>
          <input type="checkbox" v-model="enableLazyLoading" />
          启用懒加载
        </label>
        <label>
          <input type="checkbox" v-model="enableCellCaching" />
          启用单元格缓存
        </label>
      </div>
      
      <div class="control-group">
        <button @click="loadData" :disabled="loading">
          {{ loading ? '加载中...' : '加载数据' }}
        </button>
        <button @click="clearData" :disabled="loading">清空数据</button>
        <button @click="scrollToRandomCell">滚动到随机位置</button>
        <button @click="runPerformanceTest" :disabled="performanceTestRunning">
          {{ performanceTestRunning ? '测试中...' : '运行性能测试' }}
        </button>
      </div>
    </div>
    
    <div class="performance-metrics">
      <h3>性能指标</h3>
      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-label">加载时间:</span>
          <span class="metric-value">{{ loadTime }}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">渲染时间:</span>
          <span class="metric-value">{{ renderTime }}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">内存使用:</span>
          <span class="metric-value">{{ memoryUsage }}MB</span>
        </div>
        <div class="metric">
          <span class="metric-label">可见单元格:</span>
          <span class="metric-value">{{ visibleCells }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">FPS:</span>
          <span class="metric-value">{{ fps }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">滚动延迟:</span>
          <span class="metric-value">{{ scrollLatency }}ms</span>
        </div>
      </div>
    </div>
    
    <div class="grid-container" ref="gridContainer">
      <DataEditor
        ref="gridRef"
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="containerWidth"
        :height="containerHeight"
        :row-height="32"
        :header-height="40"
        :virtualization-enabled="enableVirtualization"
        :lazy-loading-enabled="enableLazyLoading"
        :cell-caching-enabled="enableCellCaching"
        :on-visible-region-changed="onVisibleRegionChanged"
        :on-scroll-performance-metrics="onScrollPerformanceMetrics"
        @grid-ready="onGridReady"
        @loading-state-changed="onLoadingStateChanged"
      />
    </div>
    
    <div class="performance-chart">
      <h3>性能图表</h3>
      <div class="chart-container">
        <canvas ref="chartCanvas" width="800" height="200"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind } from '../internal/data-grid/data-grid-types.js';

// 组件引用
const gridRef = ref();
const gridContainer = ref<HTMLElement | null>(null);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

// 数据集大小配置
const dataSetSizes = {
  small: { rows: 1000, cols: 50 },
  medium: { rows: 10000, cols: 100 },
  large: { rows: 100000, cols: 200 },
  xlarge: { rows: 1000000, cols: 500 }
};

// 状态管理
const dataSetSize = ref('small');
const loading = ref(false);
const performanceTestRunning = ref(false);
const enableVirtualization = ref(true);
const enableLazyLoading = ref(true);
const enableCellCaching = ref(true);

// 性能指标
const loadTime = ref(0);
const renderTime = ref(0);
const memoryUsage = ref(0);
const visibleCells = ref(0);
const fps = ref(0);
const scrollLatency = ref(0);

// 容器尺寸
const containerWidth = ref(800);
const containerHeight = ref(600);

// 列定义
const columns = ref<Array<{title: string, width: number}>>([]);
const rows = ref(0);

// 数据缓存
const dataCache = reactive<Record<string, any>>({});

// 性能历史数据
const performanceHistory = reactive<Array<{time: number, loadTime: number, renderTime: number, fps: number}>>([]);

// FPS计算
let frameCount = 0;
let lastFrameTime = performance.now();
let fpsInterval: number | null = null;

// 计算属性
const currentDataSetSize = computed(() => dataSetSizes[dataSetSize.value as keyof typeof dataSetSizes]);

// 初始化列
const initColumns = () => {
  const cols = [];
  const { cols: colCount } = currentDataSetSize.value;
  
  for (let i = 0; i < colCount; i++) {
    cols.push({
      title: `列 ${i + 1}`,
      width: 120
    });
  }
  
  columns.value = cols;
};

// 生成单元格数据
const generateCellData = (col: number, row: number) => {
  const key = `${col}-${row}`;
  
  if (dataCache[key]) {
    return dataCache[key];
  }
  
  let cellData;
  
  if (col === 0) {
    // ID列
    cellData = {
      kind: GridCellKind.Number,
      data: row + 1,
      allowOverlay: false
    };
  } else if (col === 1) {
    // 名称列
    const names = ['项目A', '项目B', '项目C', '项目D', '项目E'];
    cellData = {
      kind: GridCellKind.Text,
      data: `${names[row % names.length]}-${row}`,
      allowOverlay: true
    };
  } else if (col === 2) {
    // 数值列
    cellData = {
      kind: GridCellKind.Number,
      data: Math.floor(Math.random() * 1000),
      allowOverlay: true
    };
  } else if (col === 3) {
    // 状态列
    const statuses = ['进行中', '已完成', '待开始', '已暂停'];
    cellData = {
      kind: GridCellKind.Text,
      data: statuses[row % statuses.length],
      allowOverlay: true
    };
  } else {
    // 其他列
    cellData = {
      kind: GridCellKind.Text,
      data: `数据 ${col}-${row}`,
      allowOverlay: true
    };
  }
  
  if (enableCellCaching.value) {
    dataCache[key] = cellData;
  }
  
  return cellData;
};

// 获取单元格内容
const getCellContent = ([col, row]: [number, number]) => {
  return generateCellData(col, row);
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  const startTime = performance.now();
  
  // 初始化列
  initColumns();
  
  // 设置行数
  rows.value = currentDataSetSize.value.rows;
  
  // 清空缓存
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
  
  // 模拟加载延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const endTime = performance.now();
  loadTime.value = Math.round(endTime - startTime);
  
  // 等待渲染完成
  await nextTick();
  const renderEndTime = performance.now();
  renderTime.value = Math.round(renderEndTime - endTime);
  
  // 更新内存使用
  updateMemoryUsage();
  
  loading.value = false;
  
  // 记录性能历史
  performanceHistory.push({
    time: Date.now(),
    loadTime: loadTime.value,
    renderTime: renderTime.value,
    fps: fps.value
  });
  
  // 限制历史记录数量
  if (performanceHistory.length > 20) {
    performanceHistory.shift();
  }
  
  updateChart();
};

// 清空数据
const clearData = () => {
  rows.value = 0;
  columns.value = [];
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
  loadTime.value = 0;
  renderTime.value = 0;
  memoryUsage.value = 0;
  visibleCells.value = 0;
};

// 改变数据集大小
const changeDataSetSize = () => {
  if (rows.value > 0) {
    loadData();
  }
};

// 滚动到随机位置
const scrollToRandomCell = () => {
  if (!gridRef.value) return;
  
  const randomCol = Math.floor(Math.random() * columns.value.length);
  const randomRow = Math.floor(Math.random() * rows.value);
  
  // 这里需要调用实际的滚动方法
  console.log(`滚动到单元格 (${randomCol}, ${randomRow})`);
};

// 运行性能测试
const runPerformanceTest = async () => {
  performanceTestRunning.value = true;
  
  // 测试不同数据集大小的性能
  const testSizes = ['small', 'medium', 'large'];
  const results = [];
  
  for (const size of testSizes) {
    dataSetSize.value = size;
    await loadData();
    
    // 等待稳定
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.push({
      size,
      loadTime: loadTime.value,
      renderTime: renderTime.value,
      memoryUsage: memoryUsage.value,
      fps: fps.value
    });
  }
  
  console.log('性能测试结果:', results);
  
  // 恢复原始设置
  dataSetSize.value = 'small';
  await loadData();
  
  performanceTestRunning.value = false;
};

// 更新内存使用
const updateMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    memoryUsage.value = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  }
};

// 可见区域变化处理
const onVisibleRegionChanged = (region: any) => {
  visibleCells.value = region.width * region.height;
};

// 滚动性能指标处理
const onScrollPerformanceMetrics = (metrics: any) => {
  scrollLatency.value = metrics.latency || 0;
};

// 网格就绪处理
const onGridReady = () => {
  console.log('网格已就绪');
  startFPSMonitoring();
};

// 加载状态变化处理
const onLoadingStateChanged = (isLoading: boolean) => {
  loading.value = isLoading;
};

// FPS监控
const startFPSMonitoring = () => {
  if (fpsInterval) {
    clearInterval(fpsInterval);
  }
  
  fpsInterval = setInterval(() => {
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    if (deltaTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / deltaTime);
      frameCount = 0;
      lastFrameTime = currentTime;
    }
  }, 100);
};

// 更新图表
const updateChart = () => {
  if (!chartCanvas.value) return;
  
  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const width = chartCanvas.value.width;
  const height = chartCanvas.value.height;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  if (performanceHistory.length < 2) return;
  
  // 绘制背景
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, width, height);
  
  // 绘制网格线
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // 绘制数据线
  const maxLoadTime = Math.max(...performanceHistory.map(h => h.loadTime), 1);
  const maxRenderTime = Math.max(...performanceHistory.map(h => h.renderTime), 1);
  
  // 加载时间线
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  performanceHistory.forEach((point, index) => {
    const x = (width / (performanceHistory.length - 1)) * index;
    const y = height - (point.loadTime / maxLoadTime) * height * 0.8;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 渲染时间线
  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  performanceHistory.forEach((point, index) => {
    const x = (width / (performanceHistory.length - 1)) * index;
    const y = height - (point.renderTime / maxRenderTime) * height * 0.8;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 绘制图例
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(width - 150, 10, 15, 15);
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.fillText('加载时间', width - 130, 22);
  
  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(width - 150, 30, 15, 15);
  ctx.fillStyle = '#333';
  ctx.fillText('渲染时间', width - 130, 42);
};

// 生命周期
onMounted(async () => {
  // 设置容器尺寸
  if (gridContainer.value) {
    const rect = gridContainer.value.getBoundingClientRect();
    containerWidth.value = rect.width;
    containerHeight.value = rect.height;
  }
  
  // 加载初始数据
  await loadData();
  
  // 定期更新内存使用
  setInterval(updateMemoryUsage, 2000);
  
  // 定期更新图表
  setInterval(updateChart, 1000);
});
</script>

<style scoped>
.performance-example {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.description {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #0ea5e9;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: #333;
}

.control-group select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.control-group input[type="checkbox"] {
  margin-right: 6px;
}

.control-group button {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-group button:hover:not(:disabled) {
  background-color: #3367d6;
}

.control-group button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.performance-metrics {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.performance-metrics h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.grid-container {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 600px;
}

.performance-chart {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.performance-chart h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.chart-container {
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  padding: 10px;
  overflow: hidden;
}
</style>