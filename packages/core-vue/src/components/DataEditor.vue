<template>
  <div
    :class="className"
    :style="{
      width: computedWidth,
      height: computedHeight,
      ...cssStyle
    }"
    class="data-editor-container"
  >
    <div class="data-grid-placeholder">
      <h3>Glide Data Grid Vue - DataEditor Component</h3>
      <p>Rows: {{ mangledRows }}, Columns: {{ mangledCols.length }}</p>
      <p>Selection: {{ gridSelection.current ? 'Active' : 'None' }}</p>
      <p>Theme: {{ theme.accentColor }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { useSelection } from '../composables/use-selection'
import { useEditing } from '../composables/use-editing'
import type { 
  DataEditorProps, 
  DataEditorRef, 
  GridSelection, 
  Item, 
  GridCell, 
  EditableGridCell,
  GridColumn,
  Rectangle,
  ProvideEditorCallback,
  ImageEditorType,
  EditListItem,
  ValidatedGridCell
} from '../types/data-grid-types'
import { CompactSelection, GridCellKind } from '../types/data-grid-types'
import { mergeAndRealizeTheme, makeCSSStyle, getDataEditorTheme } from '../common/styles'
import { getScrollBarWidth, clamp, range, maybe } from '../common/utils'

// Props定义
const props = withDefaults(defineProps<DataEditorProps>(), {
  rows: 0,
  columns: () => [],
  rowHeight: 34,
  headerHeight: 36,
  groupHeaderHeight: 36,
  minColumnWidth: 50,
  maxColumnWidth: 500,
  freezeColumns: 0,
  verticalBorder: true,
  editOnType: true,
  cellActivationBehavior: 'second-click',
  scaleToRem: false,
  scrollToActiveCell: true,
  drawFocusRing: true,
  trapFocus: false
})

const emit = defineEmits<{
  'grid-selection-change': [GridSelection]
  'cell-edited': [Item, EditableGridCell]
  'cells-edited': [readonly EditListItem[]]
  'cell-clicked': [Item, any]
  'cell-activated': [Item, any]
  'header-clicked': [number, any]
  'group-header-clicked': [number, any]
  'finished-editing': [GridCell | undefined, readonly [-1 | 0 | 1, -1 | 0 | 1]]
  'visible-region-changed': [Rectangle, number, number, any]
}>()

// 引用定义
const gridRef = ref<any>(null)

// Composables
const { selection: gridSelection, setSelection, clearSelection } = useSelection()
const { editingCell, editValue, isEditing, startEditing, stopEditing, updateEditValue } = useEditing()

// 响应式状态
const isFocused = ref(false)
const isFilling = ref(false)
const showSearch = ref(false)
const clientSize = ref<readonly [number, number, number]>([0, 0, 0])
const visibleRegion = ref<Rectangle & { tx: number; ty: number; extras?: any }>({
  x: 0, y: 0, width: 1, height: 1, tx: 0, ty: 0
})
const fillHighlightRegion = ref<Rectangle | undefined>()
const scrollDir = ref<[number, number] | undefined>()
const mouseState = ref<any>()
const lastSent = ref<[number, number] | undefined>()
const abortController = ref(new AbortController())

// 计算属性
const computedWidth = computed(() => props.width ?? idealWidth.value)
const computedHeight = computed(() => props.height ?? idealHeight.value)

const rowMarkers = computed(() => {
  if (typeof props.rowMarkers === 'string') return props.rowMarkers
  return props.rowMarkers?.kind ?? 'none'
})

const hasRowMarkers = computed(() => rowMarkers.value !== 'none')
const rowMarkerOffset = computed(() => hasRowMarkers.value ? 1 : 0)
const showTrailingBlankRow = computed(() => props.trailingRowOptions !== undefined)
const mangledRows = computed(() => showTrailingBlankRow.value ? (props.rows ?? 0) + 1 : (props.rows ?? 0))

// 主题和样式
const baseTheme = computed(() => getDataEditorTheme())
const theme = computed(() => mergeAndRealizeTheme(baseTheme.value, props.theme ?? {}))
const cssStyle = computed(() => makeCSSStyle(theme.value))

// 列处理
const mangledCols = computed(() => {
  const baseCols = props.columns ?? []
  if (!hasRowMarkers.value) return baseCols

  const rowMarkerCol: GridColumn = {
    title: '',
    width: 32,
    icon: undefined,
    hasMenu: false,
    style: 'normal',
    themeOverride: props.rowMarkerTheme
  } as GridColumn

  return [rowMarkerCol, ...baseCols]
})

const mangledFreezeColumns = computed(() => {
  const freezeCols = props.freezeColumns ?? 0
  return Math.min(mangledCols.value.length, freezeCols + (hasRowMarkers.value ? 1 : 0))
})

// 尺寸计算
const idealWidth = computed(() => {
  const scrollbarWidth = getScrollBarWidth()
  const totalWidth = mangledCols.value.reduce((acc, col) => {
    const width = 'width' in col ? col.width : 100
    return acc + width
  }, 0) + scrollbarWidth
  return `${Math.min(100_000, totalWidth)}px`
})

const idealHeight = computed(() => {
  const scrollbarWidth = getScrollBarWidth()
  const headerHeight = props.headerHeight ?? 36
  const groupHeaderHeight = props.groupHeaderHeight ?? headerHeight
  const enableGroups = mangledCols.value.some(col => col.group !== undefined)
  const totalHeaderHeight = enableGroups ? headerHeight + groupHeaderHeight : headerHeight
  
  const rowHeight = props.rowHeight ?? 34
  const rowsCount = mangledRows.value
  const totalHeight = totalHeaderHeight + rowsCount * rowHeight + scrollbarWidth
  
  return `${Math.min(100_000, totalHeight)}px`
})

// 单元格内容获取
const getMangledCellContent = (cell: Item): GridCell => {
  const [col, row] = cell
  
  // 行标记列
  if (col === 0 && hasRowMarkers.value) {
    return {
      kind: GridCellKind.Loading,
      allowOverlay: false
    } as GridCell
  }
  
  // 尾行
  if (showTrailingBlankRow.value && row === mangledRows.value - 1) {
    return {
      kind: GridCellKind.Loading,
      allowOverlay: false
    } as GridCell
  }
  
  // 正常单元格
  const outerCol = col - rowMarkerOffset.value
  return props.getCellContent?.([outerCol, row]) ?? {
    kind: GridCellKind.Text,
    data: '',
    displayData: '',
    allowOverlay: true
  } as GridCell
}

// 选择处理
const handleSelect = (args: any) => {
  // 选择逻辑实现
  console.log('Select:', args)
}

const handleEdit = (args: any) => {
  // 编辑逻辑实现
  console.log('Edit:', args)
}

// 事件处理
const onMouseDown = (args: any) => {
  // 鼠标按下处理
}

const onMouseUp = (args: any, isOutside: boolean) => {
  // 鼠标释放处理
}

const onMouseMoveImpl = (args: any) => {
  // 鼠标移动处理
}

const onKeyDown = (args: any) => {
  // 键盘按下处理
}

const onItemHoveredImpl = (args: any) => {
  // 悬停处理
}

const onDragStartImpl = (args: any) => {
  // 拖拽开始处理
}

const onDragEnd = () => {
  // 拖拽结束处理
}

const onContextMenu = (args: any, preventDefault: () => void) => {
  // 右键菜单处理
}

const onCellFocused = (cell: Item) => {
  // 单元格聚焦处理
}

// 列操作
const onColumnResize = (col: GridColumn, width: number, index: number, widthGroup: number) => {
  props.onColumnResize?.(col, width, index - rowMarkerOffset.value, widthGroup)
}

const onColumnResizeEnd = (col: GridColumn, width: number, index: number, widthGroup: number) => {
  props.onColumnResizeEnd?.(col, width, index - rowMarkerOffset.value, widthGroup)
}

const onColumnResizeStart = (col: GridColumn, width: number, index: number, widthGroup: number) => {
  props.onColumnResizeStart?.(col, width, index - rowMarkerOffset.value, widthGroup)
}

const onColumnMovedImpl = (startIndex: number, endIndex: number) => {
  props.onColumnMoved?.(startIndex - rowMarkerOffset.value, endIndex - rowMarkerOffset.value)
}

const onColumnProposeMoveImpl = (startIndex: number, endIndex: number) => {
  return props.onColumnProposeMove?.(startIndex - rowMarkerOffset.value, endIndex - rowMarkerOffset.value) !== false
}

const onHeaderMenuClickInner = (col: number, screenPosition: Rectangle) => {
  props.onHeaderMenuClick?.(col - rowMarkerOffset.value, screenPosition)
}

const onHeaderIndicatorClickInner = (col: number, screenPosition: Rectangle) => {
  props.onHeaderIndicatorClick?.(col - rowMarkerOffset.value, screenPosition)
}

// 组详情
const mangledGetGroupDetails = (group: string) => {
  return props.getGroupDetails?.(group)
}

// 可见区域变化
const onVisibleRegionChangedImpl = (
  region: Rectangle,
  clientWidth: number,
  clientHeight: number,
  rightElWidth: number,
  tx: number,
  ty: number
) => {
  const newRegion = {
    ...region,
    x: region.x - rowMarkerOffset.value,
    tx,
    ty,
    extras: {
      selected: gridSelection.value.current?.cell
        ? [gridSelection.value.current.cell[0] - rowMarkerOffset.value, gridSelection.value.current.cell[1]]
        : undefined
    }
  }
  
  visibleRegion.value = newRegion
  clientSize.value = [clientWidth, clientHeight, rightElWidth]
  
  emit('visible-region-changed', newRegion, tx, ty, newRegion.extras)
}

// 搜索处理
const onSearchClose = () => {
  showSearch.value = false
  props.onSearchClose?.()
}

const onSearchResultsChanged = (results: readonly Item[], navIndex: number) => {
  props.onSearchResultsChanged?.(results, navIndex)
}

const onSearchValueChange = (value: string) => {
  props.onSearchValueChange?.(value)
}

// 编辑完成
const handleFinishEditing = (newValue: GridCell | undefined, movement: readonly [-1 | 0 | 1, -1 | 0 | 1]) => {
  if (editingCell.value && newValue && 'kind' in newValue) {
    emit('cell-edited', editingCell.value, newValue as EditableGridCell)
  }
  
  stopEditing()
  emit('finished-editing', newValue, movement)
}

// 单元格渲染器
const getCellRenderer = (cell: GridCell) => {
  // 渲染器逻辑实现
  return undefined
}

// 验证单元格
const validateCell = (cell: Item, newValue: EditableGridCell, prevValue: GridCell): boolean | ValidatedGridCell => {
  return props.validateCell?.(cell, newValue, prevValue) ?? true
}

// 其他计算属性
const highlightRegions = computed(() => {
  // 高亮区域逻辑
  return undefined
})

const mangledVerticalBorder = (col: number) => {
  if (typeof props.verticalBorder === 'boolean') return props.verticalBorder
  return props.verticalBorder?.(col - rowMarkerOffset.value) ?? true
}

const drawFocusRing = computed(() => {
  if (props.drawFocusRing === 'no-editor') return !isEditing.value
  return props.drawFocusRing ?? true
})

const disabledRows = computed(() => {
  if (showTrailingBlankRow.value && props.trailingRowOptions?.tint === true) {
    return CompactSelection.fromSingleSelection(mangledRows.value - 1)
  }
  return CompactSelection.empty()
})

// 生命周期
onMounted(() => {
  // 初始化逻辑
})

onUnmounted(() => {
  abortController.value.abort()
})

// 公开方法
defineExpose<DataEditorRef>({
  appendRow: async (col: number, openOverlay?: boolean) => {
    // 添加行实现
    console.log('Append row at column:', col)
  },
  appendColumn: async (row: number, openOverlay?: boolean) => {
    // 添加列实现
    console.log('Append column at row:', row)
  },
  updateCells: (damageList) => {
    return gridRef.value?.damage(damageList)
  },
  getBounds: (col?: number, row?: number) => {
    return gridRef.value?.getBounds((col ?? 0) + rowMarkerOffset.value, row)
  },
  focus: () => {
    gridRef.value?.focus()
  },
  emit: async (eventName) => {
    // 事件发射实现
    console.log('Emit event:', eventName)
  },
  scrollTo: (col, row, dir = 'both', paddingX = 0, paddingY = 0, options) => {
    // 滚动实现
    console.log('Scroll to:', col, row)
  },
  remeasureColumns: (cols) => {
    // 重新测量列实现
    console.log('Remeasure columns:', cols)
  },
  getMouseArgsForPosition: (posX: number, posY: number, ev?: MouseEvent | TouchEvent) => {
    const args = gridRef.value?.getMouseArgsForPosition(posX, posY, ev)
    if (!args) return undefined
    
    return {
      ...args,
      location: [args.location[0] - rowMarkerOffset.value, args.location[1]]
    }
  }
})
</script>

<style scoped>
.data-editor-container {
  position: relative;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
}

.data-grid-placeholder {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 4px;
  margin: 10px;
}

.data-grid-placeholder h3 {
  margin: 0 0 10px 0;
  color: #374151;
}

.data-grid-placeholder p {
  margin: 5px 0;
}
</style>