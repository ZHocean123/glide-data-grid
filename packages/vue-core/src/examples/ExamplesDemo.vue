<template>
  <div class="examples-demo">
    <header class="demo-header">
      <h1>Vue Data Grid 示例演示</h1>
      <p>探索Vue版本Glide Data Grid的各种功能和用法</p>
    </header>
    
    <nav class="demo-nav">
      <div class="nav-categories">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category"
          :class="{ active: activeCategory === category.id }"
          @click="setActiveCategory(category.id)"
        >
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
        </div>
      </div>
    </nav>
    
    <main class="demo-content">
      <div class="example-selector">
        <h2>{{ currentCategory.name }}</h2>
        <div class="example-list">
          <div 
            v-for="example in currentCategory.examples" 
            :key="example.id"
            class="example-item"
            :class="{ active: activeExample === example.id }"
            @click="setActiveExample(example.id)"
          >
            <h4>{{ example.name }}</h4>
            <p>{{ example.description }}</p>
            <div class="example-tags">
              <span 
                v-for="tag in example.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="example-display">
        <div class="example-header">
          <h3>{{ currentExample.name }}</h3>
          <div class="example-actions">
            <button @click="toggleCode" :class="{ active: showCode }">
              {{ showCode ? '隐藏代码' : '显示代码' }}
            </button>
            <button @click="copyCode" :disabled="!showCode">
              复制代码
            </button>
            <button @click="openInNewTab">
              在新标签页打开
            </button>
          </div>
        </div>
        
        <div class="example-container">
          <div class="example-viewport" ref="exampleViewport">
            <component 
              :is="currentExampleComponent" 
              v-if="currentExampleComponent"
            />
          </div>
          
          <div v-if="showCode" class="code-container">
            <div class="code-header">
              <h4>源代码</h4>
              <select v-model="selectedFile" @change="updateCodeDisplay">
                <option 
                  v-for="file in currentExample.files" 
                  :key="file.name"
                  :value="file.name"
                >
                  {{ file.name }}
                </option>
              </select>
            </div>
            <pre class="code-content"><code>{{ currentFileContent }}</code></pre>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="demo-footer">
      <p>Vue Data Grid 示例演示 - 基于 Vue 3 的高性能数据表格组件</p>
      <div class="footer-links">
        <a href="../docs/API.html" target="_blank">API文档</a>
        <a href="../docs/MIGRATION.html" target="_blank">迁移指南</a>
        <a href="../docs/BEST_PRACTICES.html" target="_blank">最佳实践</a>
        <a href="https://github.com/glideapps/glide-data-grid" target="_blank">GitHub</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue';
import { 
  QuickStartExample, 
  BasicExample, 
  AdvancedExample, 
  PerformanceExample, 
  AccessibilityDemo,
  DataEditorExample,
  ScrollingExample,
  AccessibilityExample
} from '../index.js';

// 示例数据
const categories = ref([
  {
    id: 'basic',
    name: '基础功能',
    description: '了解Vue Data Grid的基本用法和核心功能',
    examples: [
      {
        id: 'quickstart',
        name: '快速入门',
        description: '最简单的使用方式，几分钟内上手',
        tags: ['基础', '入门'],
        component: QuickStartExample,
        files: [
          { name: 'QuickStartExample.vue', content: getQuickStartCode() }
        ]
      },
      {
        id: 'basic',
        name: '基础示例',
        description: '展示基本的数据表格功能',
        tags: ['基础', '数据展示'],
        component: BasicExample,
        files: [
          { name: 'BasicExample.vue', content: getBasicCode() }
        ]
      }
    ]
  },
  {
    id: 'advanced',
    name: '高级功能',
    description: '探索高级功能，包括自定义单元格、主题和事件处理',
    examples: [
      {
        id: 'advanced',
        name: '高级功能演示',
        description: '自定义单元格、主题定制、事件处理',
        tags: ['高级', '自定义', '主题'],
        component: AdvancedExample,
        files: [
          { name: 'AdvancedExample.vue', content: getAdvancedCode() }
        ]
      },
      {
        id: 'data-editor',
        name: '数据编辑器',
        description: '完整的数据编辑功能演示',
        tags: ['编辑', '数据操作'],
        component: DataEditorExample,
        files: [
          { name: 'DataEditorExample.vue', content: getDataEditorCode() }
        ]
      }
    ]
  },
  {
    id: 'performance',
    name: '性能优化',
    description: '学习如何处理大数据集和优化性能',
    examples: [
      {
        id: 'performance',
        name: '性能优化示例',
        description: '大数据集处理、虚拟滚动、性能监控',
        tags: ['性能', '大数据', '虚拟化'],
        component: PerformanceExample,
        files: [
          { name: 'PerformanceExample.vue', content: getPerformanceCode() }
        ]
      },
      {
        id: 'scrolling',
        name: '滚动和虚拟化',
        description: '高级滚动功能和虚拟化实现',
        tags: ['滚动', '虚拟化'],
        component: ScrollingExample,
        files: [
          { name: 'ScrollingExample.vue', content: getScrollingCode() }
        ]
      }
    ]
  },
  {
    id: 'accessibility',
    name: '无障碍功能',
    description: '了解无障碍功能和支持',
    examples: [
      {
        id: 'accessibility-demo',
        name: '无障碍功能演示',
        description: '键盘导航、屏幕阅读器、高对比度模式',
        tags: ['无障碍', '键盘导航', '屏幕阅读器'],
        component: AccessibilityDemo,
        files: [
          { name: 'AccessibilityDemo.vue', content: getAccessibilityDemoCode() }
        ]
      },
      {
        id: 'accessibility',
        name: '辅助功能示例',
        description: '基础的辅助功能实现',
        tags: ['无障碍', '基础'],
        component: AccessibilityExample,
        files: [
          { name: 'AccessibilityExample.vue', content: getAccessibilityCode() }
        ]
      }
    ]
  }
]);

// 状态管理
const activeCategory = ref('basic');
const activeExample = ref('quickstart');
const showCode = ref(false);
const selectedFile = ref('');
const exampleViewport = ref<HTMLElement | null>(null);

// 计算属性
const currentCategory = computed(() => 
  categories.value.find(cat => cat.id === activeCategory.value) || categories.value[0]
);

const currentExample = computed(() => 
  currentCategory.value.examples.find(ex => ex.id === activeExample.value) || currentCategory.value.examples[0]
);

const currentExampleComponent = computed(() => currentExample.value.component);

const currentFileContent = computed(() => {
  const file = currentExample.value.files.find(f => f.name === selectedFile.value);
  return file ? file.content : '';
});

// 方法
const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId;
  const firstExample = categories.value.find(cat => cat.id === categoryId)?.examples[0];
  if (firstExample) {
    setActiveExample(firstExample.id);
  }
};

const setActiveExample = (exampleId: string) => {
  activeExample.value = exampleId;
  showCode.value = false;
  const firstFile = currentExample.value.files[0];
  if (firstFile) {
    selectedFile.value = firstFile.name;
  }
};

const toggleCode = () => {
  showCode.value = !showCode.value;
};

const copyCode = async () => {
  if (!currentFileContent.value) return;
  
  try {
    await navigator.clipboard.writeText(currentFileContent.value);
    // 可以添加成功提示
    console.log('代码已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
  }
};

const openInNewTab = () => {
  // 在新标签页中打开当前示例
  const url = new URL(window.location.href);
  url.searchParams.set('example', activeExample.value);
  window.open(url.toString(), '_blank');
};

const updateCodeDisplay = () => {
  // 代码显示已通过计算属性自动更新
};

// 生命周期
onMounted(() => {
  // 初始化第一个示例
  setActiveExample('quickstart');
});

// 获取示例代码的函数（简化版，实际项目中可能需要从文件读取）
function getQuickStartCode() {
  return `<template>
  <div class="quick-start-example">
    <h1>快速入门示例</h1>
    
    <div class="grid-container">
      <DataEditor
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="800"
        :height="300"
        :row-height="32"
      />
    </div>
  </div>
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
      data: \`用户 \${row + 1}\`,
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
<\/script>`;
}

function getBasicCode() {
  return `<template>
  <div class="basic-example">
    <h1>Vue Data Grid 基础示例</h1>
    
    <div class="grid-container">
      <DataEditor
        :columns="columns"
        :rows="rows"
        :get-cell-content="getCellContent"
        :width="800"
        :height="400"
        :row-height="32"
        :editable="true"
        @cell-clicked="onCellClicked"
        @cell-edited="onCellEdited"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

const columns = ref([
  { title: '姓名', width: 150 },
  { title: '年龄', width: 100 }
]);

const rows = ref(10);

const data = reactive({});

const getCellContent = ([col, row]) => {
  const key = \`\${col}-\${row}\`;
  
  if (!data[key]) {
    if (col === 0) {
      data[key] = {
        kind: GridCellKind.Text,
        data: \`用户 \${row + 1}\`,
        allowOverlay: true
      };
    } else {
      data[key] = {
        kind: GridCellKind.Number,
        data: 20 + row,
        allowOverlay: true
      };
    }
  }
  
  return data[key];
};

const onCellClicked = (item) => {
  console.log('单元格被点击:', item);
};

const onCellEdited = (item, newValue) => {
  console.log('单元格被编辑:', item, newValue);
};
<\/script>`;
}

function getAdvancedCode() {
  return `<!-- 高级功能示例代码较长，这里只显示部分 -->
<template>
  <div class="advanced-example">
    <h1>高级功能示例</h1>
    
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.id" 
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id">
        {{ tab.name }}
      </button>
    </div>
    
    <!-- 自定义单元格示例 -->
    <div v-if="activeTab === 'custom-cells'" class="tab-content">
      <DataEditor
        :columns="customColumns"
        :rows="rows"
        :get-cell-content="getCustomCellContent"
        :custom-renderers="customRenderers"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

// 自定义渲染器
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
    },
    provideEditor: () => null
  }
});

// 更多代码...
<\/script>`;
}

function getPerformanceCode() {
  return `<template>
  <div class="performance-example">
    <h1>性能优化示例</h1>
    
    <div class="controls">
      <div class="control-group">
        <label>数据集大小:</label>
        <select v-model="dataSetSize" @change="changeDataSetSize">
          <option value="small">小 (1,000 行 × 50 列)</option>
          <option value="medium">中 (10,000 行 × 100 列)</option>
          <option value="large">大 (100,000 行 × 200 列)</option>
        </select>
      </div>
      
      <button @click="loadData" :disabled="loading">
        {{ loading ? '加载中...' : '加载数据' }}
      </button>
    </div>
    
    <div class="performance-metrics">
      <h3>性能指标</h3>
      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-label">加载时间:</span>
          <span class="metric-value">{{ loadTime }}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">内存使用:</span>
          <span class="metric-value">{{ memoryUsage }}MB</span>
        </div>
      </div>
    </div>
    
    <DataEditor
      ref="gridRef"
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :virtualization-enabled="enableVirtualization"
      :lazy-loading-enabled="enableLazyLoading"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

// 性能监控和优化代码...
<\/script>`;
}

function getAccessibilityDemoCode() {
  return `<template>
  <div class="accessibility-demo">
    <h1>无障碍功能演示</h1>
    
    <div class="controls">
      <div class="control-group">
        <h3>辅助功能选项</h3>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.screenReaderMode" />
          屏幕阅读器模式
        </label>
        <label>
          <input type="checkbox" v-model="accessibilityOptions.highContrastMode" />
          高对比度模式
        </label>
      </div>
    </div>
    
    <DataEditor
      :columns="columns"
      :rows="rows"
      :get-cell-content="getCellContent"
      :accessibility-options="accessibilityOptions"
      :aria-label="ariaLabel"
      @accessibility-announcement="onAccessibilityAnnouncement"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { DataEditor, GridCellKind } from '@glideapps/vue-data-grid';

// 无障碍功能实现...
<\/script>`;
}

function getDataEditorCode() {
  return `// DataEditor示例代码
// 这是一个完整的数据编辑器示例，展示了各种编辑功能`;
}

function getScrollingCode() {
  return `// 滚动示例代码
// 展示了高级滚动功能和虚拟化实现`;
}

function getAccessibilityCode() {
  return `// 基础无障碍示例代码
// 展示了基本的辅助功能实现`;
}
</script>

<style scoped>
.examples-demo {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.demo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.demo-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 600;
}

.demo-header p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.demo-nav {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 1.5rem 2rem;
}

.nav-categories {
  display: flex;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.category {
  flex: 1;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.category:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.category.active {
  border-color: #667eea;
  background-color: #f8f6ff;
}

.category h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.category p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.demo-content {
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  width: 100%;
}

.example-selector {
  width: 300px;
  flex-shrink: 0;
}

.example-selector h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.example-item {
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.example-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.example-item.active {
  border-color: #667eea;
  background-color: #f8f6ff;
}

.example-item h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.example-item p {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 4px;
  font-size: 0.8rem;
}

.example-display {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.example-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.example-actions {
  display: flex;
  gap: 0.5rem;
}

.example-actions button {
  padding: 0.5rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.example-actions button:hover {
  background-color: #5a6fd8;
}

.example-actions button.active {
  background-color: #5a6fd8;
}

.example-actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.example-container {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.example-viewport {
  height: 500px;
  overflow: auto;
  border-bottom: 1px solid #e9ecef;
}

.code-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.code-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.code-header select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
}

.code-content {
  flex: 1;
  margin: 0;
  padding: 1rem;
  background-color: #f8f9fa;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #333;
}

.demo-footer {
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 2rem;
  text-align: center;
}

.demo-footer p {
  margin: 0 0 1rem 0;
  color: #666;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.footer-links a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.footer-links a:hover {
  text-decoration: underline;
}

/* 屏幕阅读器专用样式 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .demo-content {
    flex-direction: column;
  }
  
  .example-selector {
    width: 100%;
  }
  
  .nav-categories {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .demo-header p {
    font-size: 1rem;
  }
  
  .example-actions {
    flex-wrap: wrap;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>