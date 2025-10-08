<template>
  <div
    v-if="visible"
    ref="scrollbarRef"
    class="scrollbar"
    :class="[
      `scrollbar-${orientation}`,
      { 'scrollbar-visible': isVisible },
      customClass
    ]"
    @mousedown="onMouseDown"
  >
    <div
      ref="thumbRef"
      class="scrollbar-thumb"
      :class="{ 'scrollbar-thumb-dragging': isDragging }"
      :style="thumbStyle"
      @mousedown="onThumbMouseDown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

interface Props {
  orientation: "horizontal" | "vertical";
  size: number; // Size of the viewport (width for horizontal, height for vertical)
  contentSize: number; // Total size of the content
  position: number; // Current scroll position
  visible?: boolean; // Whether the scrollbar should be visible
  customClass?: string; // Custom CSS class
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
});

interface Emits {
  (e: 'scroll', position: number): void;
}

const emit = defineEmits<Emits>();

// Refs
const scrollbarRef = ref<HTMLElement | null>(null);
const thumbRef = ref<HTMLElement | null>(null);

// State
const isDragging = ref(false);
const dragStartPos = ref(0);
const dragStartScrollPos = ref(0);
const isVisible = ref(false);

// Computed properties
const scrollRatio = computed(() => {
  if (props.contentSize <= props.size) return 0;
  return props.size / props.contentSize;
});

const thumbSize = computed(() => {
  const size = props.size * scrollRatio.value;
  // Minimum thumb size
  return Math.max(size, 30);
});

const thumbPosition = computed(() => {
  if (props.contentSize <= props.size) return 0;
  const maxScrollPos = props.contentSize - props.size;
  const maxThumbPos = props.size - thumbSize.value;
  return (props.position / maxScrollPos) * maxThumbPos;
});

const thumbStyle = computed(() => {
  if (props.orientation === "horizontal") {
    return {
      width: `${thumbSize.value}px`,
      left: `${thumbPosition.value}px`,
    };
  } else {
    return {
      height: `${thumbSize.value}px`,
      top: `${thumbPosition.value}px`,
    };
  }
});

// Methods
 const updateVisibility = () => {
  isVisible.value = props.visible && props.contentSize > props.size;
};

const onMouseDown = (e: MouseEvent) => {
  if (!scrollbarRef.value || !thumbRef.value) return;
  
  const rect = scrollbarRef.value.getBoundingClientRect();
  let clickPos: number;
  
  if (props.orientation === "horizontal") {
    clickPos = e.clientX - rect.left;
  } else {
    clickPos = e.clientY - rect.top;
  }
  
  // Check if click is on the thumb
  const thumbRect = thumbRef.value.getBoundingClientRect();
  let thumbPos: number;
  let thumbSize: number;
  
  if (props.orientation === "horizontal") {
    thumbPos = thumbRect.left - rect.left;
    thumbSize = thumbRect.width;
  } else {
    thumbPos = thumbRect.top - rect.top;
    thumbSize = thumbRect.height;
  }
  
  if (clickPos < thumbPos || clickPos > thumbPos + thumbSize) {
    // Click is outside the thumb, jump to that position
    const clickRatio = (clickPos - thumbSize / 2) / (props.size - thumbSize);
    const maxScrollPos = props.contentSize - props.size;
    const newPosition = Math.max(0, Math.min(clickRatio * maxScrollPos, maxScrollPos));
    emit('scroll', newPosition);
  }
};

const onThumbMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!thumbRef.value) return;
  
  isDragging.value = true;
  
  const thumbRect = thumbRef.value.getBoundingClientRect();
  
  if (props.orientation === "horizontal") {
    dragStartPos.value = e.clientX - thumbRect.left;
  } else {
    dragStartPos.value = e.clientY - thumbRect.top;
  }
  
  dragStartScrollPos.value = props.position;
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  
  // Prevent text selection while dragging
  document.body.style.userSelect = 'none';
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !scrollbarRef.value) return;
  
  const rect = scrollbarRef.value.getBoundingClientRect();
  let currentPos: number;
  
  if (props.orientation === "horizontal") {
    currentPos = e.clientX - rect.left - dragStartPos.value;
  } else {
    currentPos = e.clientY - rect.top - dragStartPos.value;
  }
  
  const maxThumbPos = props.size - thumbSize.value;
  const thumbRatio = Math.max(0, Math.min(currentPos / maxThumbPos, 1));
  const maxScrollPos = props.contentSize - props.size;
  const newPosition = thumbRatio * maxScrollPos;
  
  emit('scroll', newPosition);
};

const onMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.body.style.userSelect = '';
};

// Watch for prop changes
watch([() => props.size, () => props.contentSize, () => props.visible], updateVisibility, { immediate: true });

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.body.style.userSelect = '';
});
</script>

<style scoped>
.scrollbar {
  position: relative;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: opacity 0.2s ease;
}

.scrollbar-horizontal {
  height: 12px;
  width: 100%;
  cursor: pointer;
}

.scrollbar-vertical {
  width: 12px;
  height: 100%;
  cursor: pointer;
}

.scrollbar-thumb {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.scrollbar-thumb-dragging {
  background-color: rgba(0, 0, 0, 0.7);
}

.scrollbar-horizontal .scrollbar-thumb {
  height: 100%;
  top: 0;
}

.scrollbar-vertical .scrollbar-thumb {
  width: 100%;
  left: 0;
}

/* Custom scrollbar styles */
.scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar by default, show only when needed */
.scrollbar:not(.scrollbar-visible) {
  opacity: 0;
  pointer-events: none;
}

.scrollbar.scrollbar-visible {
  opacity: 1;
}
</style>