# Glide Data Grid React 到 Vue 3 迁移实施指南

## 迁移状态概览

### 已完成的工作

- ✅ 项目架构分析和依赖评估
- ✅ Vue 包结构和构建配置规划
- ✅ 技术挑战识别和解决方案设计

### 待实施的任务

- 🔄 创建Vue包结构和构建配置
- ⏳ 迁移核心类型定义和工具函数
- ⏳ 转换React Hooks到Vue 3 Composition API
- ⏳ 迁移数据网格核心组件（DataEditor）
- ⏳ 迁移单元格渲染器系统
- ⏳ 迁移数据源钩子
- ⏳ 实现Vue 3等效的第三方依赖
- ⏳ 创建Vue 3 Storybook示例
- ⏳ 迁移测试套件
- ⏳ 性能优化和包大小优化
- ⏳ 文档更新和API对齐
- ⏳ 最终验证和发布准备

## 详细实施步骤

### 阶段 1: 基础架构搭建 (1-2周)

#### 1.1 创建Vue包结构和构建配置

```bash
# 创建核心包结构
mkdir -p packages/core-vue/src/{components,composables,types,utils}
mkdir -p packages/cells-vue/src/{cells,composables}
mkdir -p packages/source-vue/src/composables

# 创建构建配置文件
touch packages/core-vue/{package.json,tsconfig.json,tsconfig.esm.json,tsconfig.cjs.json,build.sh}
touch packages/cells-vue/{package.json,tsconfig.json,build.sh}
touch packages/source-vue/{package.json,tsconfig.json,build.sh}
```

#### 1.2 配置TypeScript和构建系统

- 复制并修改现有的TypeScript配置
- 集成Vue 3类型支持
- 配置Vite用于开发环境
- 设置Linaria CSS-in-JS编译

### 阶段 2: 核心类型和工具迁移 (1周)

#### 2.1 迁移共享类型定义

```typescript
// packages/core-vue/src/types/index.ts
// 直接从React版本复制以下类型：
// - GridCell, GridColumn, GridSelection
// - Rectangle, Item, CompactSelection
// - 所有单元格类型定义
// - 事件类型定义
```

#### 2.2 迁移工具函数

```typescript
// packages/core-vue/src/utils/index.ts
// 迁移以下工具函数：
// - 数学计算函数
// - 颜色处理函数
// - 文本测量函数
// - 选择操作函数
```

### 阶段 3: Composition API 转换 (2-3周)

#### 3.1 React Hooks 到 Vue Composables 映射

| React Hook  | Vue 3 Composition   | 示例转换                                                            |
| ----------- | ------------------- | ------------------------------------------------------------------- |
| useState    | ref / reactive      | `const [state, setState] = useState(0)` → `const state = ref(0)`    |
| useEffect   | watch / watchEffect | `useEffect(() => {}, [dep])` → `watch(dep, () => {})`               |
| useCallback | computed / 函数引用 | `useCallback(() => {}, [])` → `const fn = () => {}`                 |
| useRef      | ref                 | `const ref = useRef(null)` → `const ref = ref(null)`                |
| useMemo     | computed            | `useMemo(() => value, [dep])` → `const value = computed(() => ...)` |

#### 3.2 关键Composables设计

```typescript
// use-selection.ts
export function useSelection() {
    const selection = ref<GridSelection>(emptyGridSelection);
    const setSelection = (newSelection: GridSelection) => {
        selection.value = newSelection;
    };

    return { selection, setSelection };
}

// use-editing.ts
export function useEditing() {
    const overlay = ref<OverlayState>();
    const setOverlay = (newOverlay: OverlayState) => {
        overlay.value = newOverlay;
    };

    return { overlay, setOverlay };
}
```

### 阶段 4: 核心组件迁移 (3-4周)

#### 4.1 DataEditor组件重构

```vue
<!-- packages/core-vue/src/components/DataEditor.vue -->
<template>
  <DataEditorContainer
    :style="cssStyle"
    :className="className"
    :inWidth="computedWidth"
    :inHeight="computedHeight"
  >
    <DataGridSearch
      :columns="mangledCols"
      :selection="gridSelection"
      @select="handleSelect"
      @edit="handleEdit"
      <!-- 其他props -->
    />
    <OverlayEditor
      v-if="overlay"
      :overlay="overlay"
      @finish-editing="handleFinishEditing"
    />
  </DataEditorContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSelection, useEditing, useEvents } from '../composables'

// Props定义
const props = defineProps<DataEditorProps>()
const emit = defineEmits<{
  'grid-selection-change': [GridSelection]
  'cell-edited': [Item, EditableGridCell]
  // 其他事件
}>()

// Composables
const { selection: gridSelection, setSelection } = useSelection()
const { overlay, setOverlay } = useEditing()
const { handleKeyDown, handleMouseDown } = useEvents(props, emit)

// 计算属性
const computedWidth = computed(() => props.width ?? idealWidth.value)
const mangledCols = computed(() => {
  // 列处理逻辑
})
</script>
```

#### 4.2 Canvas渲染逻辑保持

- 直接移植现有的Canvas渲染代码
- 在Vue组件中通过ref访问Canvas元素
- 保持现有的性能优化策略

### 阶段 5: 单元格渲染器迁移 (2-3周)

#### 5.1 渲染器接口适配

```typescript
// Vue 3 自定义渲染器接口
interface VueCustomRenderer<T extends GridCell> {
    kind: GridCellKind;
    isMatch: (cell: GridCell) => cell is T;
    draw: (args: DrawArgs, cell: T) => boolean;
    provideEditor?: () => VueEditorComponent<T>;
}
```

#### 5.2 编辑器组件转换

```vue
<!-- packages/cells-vue/src/cells/multi-select-cell.vue -->
<template>
    <div class="multi-select-cell" @keydown="onKeyDown">
        <VSelect :modelValue="selectedValues" @update:modelValue="onChange" multiple :options="options" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
    cell: MultiSelectCell;
    initialValue?: string;
}>();

const emit = defineEmits<{
    change: [MultiSelectCell];
    "finish-editing": [MultiSelectCell, readonly [-1 | 0 | 1, -1 | 0 | 1]];
}>();

const selectedValues = ref(props.cell.data.values ?? []);
</script>
```

### 阶段 6: 数据源钩子迁移 (1-2周)

#### 6.1 Composables转换

```typescript
// packages/source-vue/src/composables/use-async-data-source.ts
export function useAsyncDataSource<TRowType>(
    pageSize: number,
    maxConcurrency: number,
    getRowData: RowCallback<TRowType>,
    toCell: RowToCell<TRowType>,
    onEdited: RowEditedCallback<TRowType>
) {
    const data = ref<TRowType[]>([]);
    const loading = ref(new Set<number>());

    const getCellContent = (cell: Item): GridCell => {
        const [col, row] = cell;
        const rowData = data.value[row];
        if (rowData !== undefined) {
            return toCell(rowData, col);
        }
        return loadingCell;
    };

    return {
        getCellContent,
        onVisibleRegionChanged,
        onCellEdited,
        getCellsForSelection,
    };
}
```

### 阶段 7: 第三方依赖替换 (1-2周)

#### 7.1 依赖映射实施

- **react-select** → **vue-select** 或自定义选择器
- **react-number-format** → 自定义数字格式化组件
- **@toast-ui/react-editor** → **@toast-ui/editor** + Vue包装器
- **react-responsive-carousel** → **vue3-carousel**

### 阶段 8: 测试和文档 (1-2周)

#### 8.1 测试迁移策略

- 从React Testing Library迁移到Vue Test Utils
- 保持现有的测试用例结构
- 添加Vue特定的组件测试

#### 8.2 文档更新

- 创建Vue专用的使用文档
- 提供与React版本的对比示例
- 更新API文档中的Vue用法

## 关键技术决策

### 1. 状态管理策略

- 使用Vue 3的响应式系统而非Pinia/Vuex
- 保持组件级别的状态管理
- 使用provide/inject进行深层状态共享

### 2. 性能优化重点

- Canvas渲染性能保持
- 响应式数据优化（shallowRef, markRaw）
- 事件处理优化
- 内存泄漏预防

### 3. API兼容性保证

- 保持完全相同的公共API
- 类型定义完全兼容
- 事件系统行为一致

## 风险评估和缓解

### 高风险项目

1. **Canvas性能回归**
    - 缓解：直接移植渲染代码，充分测试

2. **复杂状态逻辑迁移**
    - 缓解：分阶段迁移，每个阶段充分测试

3. **第三方依赖替换**
    - 缓解：提前评估替代方案，创建回滚计划

### 质量保证措施

- 每个迁移阶段完成后进行功能验证
- 性能基准测试对比
- 自动化测试覆盖
- 真实场景测试

## 下一步行动建议

### 立即开始 (切换到Code模式)

1. **创建基础包结构**
    - 创建package.json文件
    - 配置TypeScript编译
    - 设置构建脚本

2. **迁移核心类型定义**
    - 复制共享类型
    - 创建Vue特定的类型扩展

3. **实现第一个Composable**
    - 选择简单的钩子开始（如useSelection）
    - 建立开发模式验证

### 推荐实施顺序

1. 基础架构搭建
2. 类型和工具迁移
3. 简单Composables实现
4. 核心DataEditor组件
5. 单元格渲染器系统
6. 数据源钩子
7. 第三方依赖替换
8. 测试和文档

这个实施指南提供了从React到Vue 3迁移的完整路线图，建议现在切换到Code模式开始具体的实施工作。
