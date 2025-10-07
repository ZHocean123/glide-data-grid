<template>
  <div
    :class="cellClasses"
    :style="cellStyles"
    class="text-cell-renderer"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <span class="cell-content">{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextCell, Item } from '../types/data-grid-types'

interface Props {
  cell: TextCell
  location: Item
  isSelected: boolean
  isHovered: boolean
  theme: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'cell-clicked': [Item, MouseEvent]
  'cell-activated': [Item, MouseEvent]
}>()

const displayText = computed(() => {
  return props.cell.displayData || props.cell.data || ''
})

const cellClasses = computed(() => ({
  'text-cell': true,
  'cell-selected': props.isSelected,
  'cell-hovered': props.isHovered,
  'cell-readonly': props.cell.readonly,
  'cell-allow-wrapping': props.cell.allowWrapping
}))

const cellStyles = computed(() => {
  const styles: Record<string, string> = {
    color: props.theme.textDark,
    backgroundColor: props.isSelected ? props.theme.accentLight : props.theme.bgCell,
    cursor: props.cell.cursor || 'default'
  }

  if (props.cell.themeOverride) {
    if (props.cell.themeOverride.textDark) {
      styles.color = props.cell.themeOverride.textDark
    }
    if (props.cell.themeOverride.bgCell) {
      styles.backgroundColor = props.isSelected 
        ? props.theme.accentLight 
        : props.cell.themeOverride.bgCell
    }
  }

  if (props.cell.contentAlign) {
    styles.textAlign = props.cell.contentAlign
  }

  if (props.cell.style === 'faded') {
    styles.opacity = '0.6'
  }

  return styles
})

const handleClick = (event: MouseEvent) => {
  emit('cell-clicked', props.location, event)
}

const handleDoubleClick = (event: MouseEvent) => {
  emit('cell-activated', props.location, event)
}
</script>

<style scoped>
.text-cell-renderer {
  width: 100%;
  height: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  overflow: hidden;
  font: v-bind('theme.baseFontStyle');
  font-family: v-bind('theme.fontFamily');
}

.cell-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-allow-wrapping .cell-content {
  white-space: normal;
  word-break: break-word;
}

.cell-selected {
  background-color: var(--gdg-accent-light, #EEF2FF) !important;
}

.cell-hovered {
  background-color: var(--gdg-bg-header-hovered, #E5E7EB) !important;
}

.cell-readonly {
  opacity: 0.7;
  cursor: not-allowed !important;
}
</style>