<template>
  <div v-if="visible" class="search-overlay">
    <div class="search-container">
      <input
        ref="inputRef"
        v-model="localSearchValue"
        class="search-input"
        placeholder="搜索..."
        @input="handleInput"
        @keydown="handleKeyDown"
      />
      <button class="search-close" @click="handleClose">
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Props {
  searchValue?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:search-value': [value: string]
  'close': []
}>()

const inputRef = ref<HTMLInputElement>()
const localSearchValue = ref(props.searchValue || '')

const visible = computed(() => true)

const handleInput = () => {
  emit('update:search-value', localSearchValue.value)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleClose()
  }
}

const handleClose = () => {
  emit('close')
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style scoped>
.search-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
}

.search-container {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.search-input {
  border: none;
  outline: none;
  padding: 4px;
  font-size: 14px;
  min-width: 200px;
}

.search-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  color: #666;
}

.search-close:hover {
  color: #333;
}
</style>
