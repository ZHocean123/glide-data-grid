<template>
  <div v-if="filtered.length === 0" class="image-overlay-editor" />
  <div v-else class="image-overlay-editor" data-testid="GDG-default-image-overlay-editor">
    <!-- 简化的轮播组件实现 -->
    <div class="carousel-container">
      <div
        v-for="(url, index) in filtered"
        :key="url"
        v-show="currentIndex === index"
        class="gdg-centering-container"
      >
        <slot name="image" :url="url">
          <img draggable="false" :src="url" alt="" />
        </slot>
      </div>
      
      <!-- 轮播控制按钮 -->
      <button
        v-if="allowMove && currentIndex > 0"
        class="carousel-control prev"
        @click="currentIndex--"
      >
        ‹
      </button>
      <button
        v-if="allowMove && currentIndex < filtered.length - 1"
        class="carousel-control next"
        @click="currentIndex++"
      >
        ›
      </button>
    </div>
    
    <!-- 编辑按钮 -->
    <button
      v-if="canWrite && onEditClick"
      class="gdg-edit-icon"
      @click="onEditClick"
    >
      <EditPencil />
    </button>
    
    <textarea class="gdg-input" ref="textareaRef" autofocus />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { OverlayImageEditorProps } from "../../data-grid/data-grid-types";

// 简化的编辑铅笔图标组件
const EditPencil = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`
};

interface Props extends OverlayImageEditorProps {}

const props = defineProps<Props>();

const currentIndex = ref(0);
const textareaRef = ref<HTMLTextAreaElement>();

const filtered = computed(() => props.urls.filter(u => u !== ""));
const allowMove = computed(() => filtered.value.length > 1);

const emit = defineEmits<{
  change: [newImage: string];
}>();

onMounted(() => {
  // 自动聚焦到文本区域
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
});

// 暴露方法给父组件
defineExpose({
  currentIndex,
  filtered
});
</script>

<style scoped>
.image-overlay-editor {
  display: flex;
  height: 100%;
  position: relative;
}

.carousel-container {
  display: flex;
  height: 100%;
  position: relative;
  flex: 1;
}

.gdg-centering-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.gdg-centering-container img,
.gdg-centering-container canvas {
  max-height: calc(100vh - var(--overlay-top) - 20px);
  object-fit: contain;
  user-select: none;
}

.gdg-centering-container canvas {
  max-width: 380px;
}

.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-control.prev {
  left: 10px;
}

.carousel-control.next {
  right: 10px;
}

.gdg-edit-icon {
  position: absolute;
  top: 12px;
  right: 0;
  width: 48px;
  height: 48px;
  color: var(--gdg-accent-color);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  z-index: 10;
}

.gdg-edit-icon > * {
  width: 24px;
  height: 24px;
}

textarea {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 0px;
  height: 0px;
  opacity: 0;
}
</style>