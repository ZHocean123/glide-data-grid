<template>
  <div class="canvas-renderer-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="data-grid-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @wheel="handleWheel"
      @keydown="handleKeyDown"
      tabindex="0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue'
import type { 
  GridSelection, 
  Item, 
  GridCell, 
  GridColumn,
  Rectangle
} from '../types/data-grid-types'
import { GridCellKind } from '../types/data-grid-types'
import { getDataEditorTheme } from '../common/styles'
import { clamp } from '../common/utils'

interface Props {
  columns: readonly GridColumn[]
  rows: number
  getCellContent: (cell: Item) => GridCell
  selection?: GridSelection
  theme?: any // 使用 any 类型避免 Theme 类型问题
  rowHeight?: number
  headerHeight?: number
  freezeColumns?: number
  verticalBorder?: boolean
  width?: number | string
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  rowHeight: 34,
  headerHeight: 36,
  freezeColumns: 0,
  verticalBorder: true,
  width: '100%',
  height: '100%'
})

const emit = defineEmits<{
  'cell-clicked': [Item, MouseEvent]
  'cell-activated': [Item, MouseEvent]
  'selection-changed': [GridSelection]
  'scroll-changed': [number, number]
}>()

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const isDragging = ref(false)
const dragStart = ref<Item | null>(null)
const scrollX = ref(0)
const scrollY = ref(0)
const hoveredCell = ref<Item | null>(null)

// 计算属性
const canvasWidth = computed(() => {
  if (typeof props.width === 'number') return props.width
  return 800 // 默认宽度
})

const canvasHeight = computed(() => {
  if (typeof props.height === 'number') return props.height
  return 600 // 默认高度
})

const theme = computed(() => {
  const baseTheme = getDataEditorTheme()
  return { ...baseTheme, ...props.theme }
})

const totalWidth = computed(() => {
  return props.columns.reduce((acc, col) => {
    const width = 'width' in col ? col.width : 100
    return acc + width
  }, 0)
})

const totalHeight = computed(() => {
  const headerHeight = props.headerHeight
  const rowHeight = props.rowHeight
  return headerHeight + props.rows * rowHeight
})

// 渲染方法
const clearCanvas = () => {
  if (!ctx.value) return
  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
}

const drawBackground = () => {
  if (!ctx.value) return
  ctx.value.fillStyle = theme.value.bgCell
  ctx.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
}

const drawHeaders = () => {
  if (!ctx.value) return
  const headerHeight = props.headerHeight
  let x = -scrollX.value
  
  // 绘制列标题
  ctx.value.fillStyle = theme.value.bgHeader
  ctx.value.fillRect(0, 0, canvasWidth.value, headerHeight)
  
  ctx.value.fillStyle = theme.value.textHeader
  ctx.value.font = theme.value.headerFontStyle
  ctx.value.textBaseline = 'middle'
  
  for (let col = 0; col < props.columns.length; col++) {
    const column = props.columns[col]
    const width = 'width' in column ? column.width : 100
    
    if (x + width > 0 && x < canvasWidth.value) {
      // 绘制列标题背景
      ctx.value.fillStyle = theme.value.bgHeader
      ctx.value.fillRect(x, 0, width, headerHeight)
      
      // 绘制列标题文本
      ctx.value.fillStyle = theme.value.textHeader
      ctx.value.fillText(
        column.title,
        x + 8,
        headerHeight / 2,
        width - 16
      )
      
      // 绘制垂直边框
      if (props.verticalBorder && col < props.columns.length - 1) {
        ctx.value.strokeStyle = theme.value.verticalBorderColor || theme.value.borderColor
        ctx.value.lineWidth = 1
        ctx.value.beginPath()
        ctx.value.moveTo(x + width - 0.5, 0)
        ctx.value.lineTo(x + width - 0.5, headerHeight)
        ctx.value.stroke()
      }
    }
    
    x += width
  }
  
  // 绘制水平边框
  ctx.value.strokeStyle = theme.value.horizontalBorderColor || theme.value.borderColor
  ctx.value.lineWidth = 1
  ctx.value.beginPath()
  ctx.value.moveTo(0, headerHeight - 0.5)
  ctx.value.lineTo(canvasWidth.value, headerHeight - 0.5)
  ctx.value.stroke()
}

const drawCells = () => {
  if (!ctx.value) return
  const headerHeight = props.headerHeight
  const rowHeight = props.rowHeight
  
  ctx.value.font = theme.value.baseFontStyle
  ctx.value.textBaseline = 'middle'
  
  // 计算可见区域
  const startCol = Math.max(0, Math.floor(scrollX.value / 100))
  const endCol = Math.min(props.columns.length, Math.ceil((scrollX.value + canvasWidth.value) / 100))
  const startRow = Math.max(0, Math.floor((scrollY.value) / rowHeight))
  const endRow = Math.min(props.rows, Math.ceil((scrollY.value + canvasHeight.value - headerHeight) / rowHeight))
  
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const column = props.columns[col]
      const width = 'width' in column ? column.width : 100
      const x = col * width - scrollX.value
      const y = headerHeight + row * rowHeight - scrollY.value
      
      // 只绘制可见单元格
      if (x + width > 0 && x < canvasWidth.value && y + rowHeight > 0 && y < canvasHeight.value) {
        drawCell(col, row, x, y, width, rowHeight)
      }
    }
  }
}

const drawCell = (col: number, row: number, x: number, y: number, width: number, height: number) => {
  if (!ctx.value) return
  
  const cell: Item = [col, row]
  const cellContent = props.getCellContent(cell)
  
  // 绘制单元格背景
  const isSelected = isCellSelected(col, row)
  const isHovered = hoveredCell.value?.[0] === col && hoveredCell.value?.[1] === row
  
  if (isSelected) {
    ctx.value.fillStyle = theme.value.accentLight
  } else if (isHovered) {
    ctx.value.fillStyle = theme.value.bgHeaderHovered
  } else {
    ctx.value.fillStyle = theme.value.bgCell
  }
  
  ctx.value.fillRect(x, y, width, height)
  
  // 绘制单元格内容
  ctx.value.fillStyle = theme.value.textDark
  
  switch (cellContent.kind) {
    case GridCellKind.Text:
      ctx.value.fillText(
        cellContent.displayData || cellContent.data,
        x + 8,
        y + height / 2,
        width - 16
      )
      break
    case GridCellKind.Number:
      ctx.value.fillText(
        cellContent.displayData || String(cellContent.data || ''),
        x + 8,
        y + height / 2,
        width - 16
      )
      break
    case GridCellKind.Loading:
      // 绘制加载状态
      ctx.value.fillStyle = theme.value.textLight
      ctx.value.fillText('Loading...', x + 8, y + height / 2, width - 16)
      break
    default:
      ctx.value.fillText(`[${cellContent.kind}]`, x + 8, y + height / 2, width - 16)
  }
  
  // 绘制垂直边框
  if (props.verticalBorder && col < props.columns.length - 1) {
    ctx.value.strokeStyle = theme.value.verticalBorderColor || theme.value.borderColor
    ctx.value.lineWidth = 1
    ctx.value.beginPath()
    ctx.value.moveTo(x + width - 0.5, y)
    ctx.value.lineTo(x + width - 0.5, y + height)
    ctx.value.stroke()
  }
  
  // 绘制水平边框
  if (row < props.rows - 1) {
    ctx.value.strokeStyle = theme.value.horizontalBorderColor || theme.value.borderColor
    ctx.value.lineWidth = 1
    ctx.value.beginPath()
    ctx.value.moveTo(x, y + height - 0.5)
    ctx.value.lineTo(x + width, y + height - 0.5)
    ctx.value.stroke()
  }
}

const isCellSelected = (col: number, row: number): boolean => {
  if (!props.selection?.current) return false
  
  const { range } = props.selection.current
  return (
    col >= range.x &&
    col < range.x + range.width &&
    row >= range.y &&
    row < range.y + range.height
  )
}

const getCellAtPosition = (x: number, y: number): Item | null => {
  const headerHeight = props.headerHeight
  const rowHeight = props.rowHeight
  
  // 检查是否在标题区域
  if (y < headerHeight) {
    return null
  }
  
  // 计算单元格坐标
  const adjustedY = y + scrollY.value - headerHeight
  const row = Math.floor(adjustedY / rowHeight)
  
  if (row < 0 || row >= props.rows) return null
  
  let currentX = -scrollX.value
  for (let col = 0; col < props.columns.length; col++) {
    const column = props.columns[col]
    const width = 'width' in column ? column.width : 100
    
    if (x >= currentX && x < currentX + width) {
      return [col, row]
    }
    
    currentX += width
  }
  
  return null
}

// 事件处理
const handleMouseDown = (event: MouseEvent) => {
  if (!canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const cell = getCellAtPosition(x, y)
  if (cell) {
    isDragging.value = true
    dragStart.value = cell
    
    // 发出单元格点击事件
    emit('cell-clicked', cell, event)
    
    // 创建选择
    const selection: GridSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell,
        range: { x: cell[0], y: cell[1], width: 1, height: 1 },
        rangeStack: []
      }
    }
    
    emit('selection-changed', selection)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // 更新悬停单元格
  const cell = getCellAtPosition(x, y)
  hoveredCell.value = cell
  
  // 处理拖拽选择
  if (isDragging.value && dragStart.value && cell) {
    const [startCol, startRow] = dragStart.value
    const [currentCol, currentRow] = cell
    
    const range: Rectangle = {
      x: Math.min(startCol, currentCol),
      y: Math.min(startRow, currentRow),
      width: Math.abs(currentCol - startCol) + 1,
      height: Math.abs(currentRow - startRow) + 1
    }
    
    const selection: GridSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell: dragStart.value,
        range,
        rangeStack: []
      }
    }
    
    emit('selection-changed', selection)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  dragStart.value = null
}

const handleMouseLeave = () => {
  hoveredCell.value = null
  if (isDragging.value) {
    handleMouseUp()
  }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  const deltaX = event.deltaX
  const deltaY = event.deltaY
  
  scrollX.value = clamp(scrollX.value + deltaX, 0, Math.max(0, totalWidth.value - canvasWidth.value))
  scrollY.value = clamp(scrollY.value + deltaY, 0, Math.max(0, totalHeight.value - canvasHeight.value + props.headerHeight))
  
  emit('scroll-changed', scrollX.value, scrollY.value)
  render()
}

const handleKeyDown = (event: KeyboardEvent) => {
  // 键盘导航逻辑
  if (props.selection?.current) {
    const { cell } = props.selection.current
    let [col, row] = cell
    
    switch (event.key) {
      case 'ArrowUp':
        row = Math.max(0, row - 1)
        break
      case 'ArrowDown':
        row = Math.min(props.rows - 1, row + 1)
        break
      case 'ArrowLeft':
        col = Math.max(0, col - 1)
        break
      case 'ArrowRight':
        col = Math.min(props.columns.length - 1, col + 1)
        break
      default:
        return
    }
    
    const newCell: Item = [col, row]
    const selection: GridSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell: newCell,
        range: { x: col, y: row, width: 1, height: 1 },
        rangeStack: []
      }
    }
    
    emit('selection-changed', selection)
    event.preventDefault()
  }
}

// 渲染循环
const render = () => {
  clearCanvas()
  drawBackground()
  drawHeaders()
  drawCells()
}

// 生命周期
onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    render()
  }
})

// 监听变化
watch(() => props.columns, render, { deep: true })
watch(() => props.rows, render)
watch(() => props.selection, render, { deep: true })
watch(() => props.theme, render, { deep: true })
watch([scrollX, scrollY], render)

// 导入必要的类型
import { CompactSelection } from '../types/data-grid-types.js'
</script>

<style scoped>
.canvas-renderer-container {
  position: relative;
  overflow: hidden;
}

.data-grid-canvas {
  display: block;
  outline: none;
  cursor: default;
}

.data-grid-canvas:focus {
  outline: 2px solid var(--gdg-accent-color, #4F46E5);
  outline-offset: -2px;
}
</style>