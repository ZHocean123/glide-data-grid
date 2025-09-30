<template>
  <div v-if="visible" class="overlay-editor" :style="overlayStyle">
    <input
      ref="inputRef"
      v-model="editValue"
      class="overlay-input"
      @keydown="handleKeyDown"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Rectangle, GridCell } from '../internal/data-grid/data-grid-types.js'

interface Props {
  target?: Rectangle
  cell?: GridCell
  theme?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'finished-editing': [newValue: any, movement: [number, number]]
}>()

const inputRef = ref<HTMLInputElement>()
const editValue = ref('')

const visible = computed(() => !!props.target)

const overlayStyle = computed(() => {
  if (!props.target) return {}

  return {
    position: 'absolute',
    left: `${props.target.x}px`,
    top: `${props.target.y}px`,
    width: `${props.target.width}px`,
    height: `${props.target.height}px`,
    backgroundColor: props.theme?.bgCell || '#ffffff',
    border: `2px solid ${props.theme?.accentColor || '#007acc'}`,
    zIndex: 1000
  }
})

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      finishEditing([0, 1])
      break
    case 'Escape':
      event.preventDefault()
      finishEditing([0, 0])
      break
    case 'Tab':
      event.preventDefault()
      finishEditing(event.shiftKey ? [-1, 0] : [1, 0])
      break
  }
}

const handleBlur = () => {
  finishEditing([0, 0])
}

const finishEditing = (movement: [number, number]) => {
  emit('finished-editing', editValue.value, movement)
}

onMounted(() => {
  if (props.cell) {
    // 根据单元格类型设置初始值
    if (props.cell.kind === 'text') {
      editValue.value = props.cell.data || ''
    } else if (props.cell.kind === 'number') {
      editValue.value = props.cell.data?.toString() || ''
    }
  }

  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
})
</script>

<style scoped>
.overlay-editor {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.overlay-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 8px;
  font-family: inherit;
  font-size: inherit;
  background: transparent;
}
</style>
