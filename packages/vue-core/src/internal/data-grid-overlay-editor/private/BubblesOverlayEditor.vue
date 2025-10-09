<template>
  <div class="bubbles-overlay-editor">
    <div
      v-for="(bubble, index) in bubbles"
      :key="index"
      class="boe-bubble"
    >
      {{ bubble }}
    </div>
    <textarea class="gdg-input" ref="textareaRef" autofocus />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Props {
  readonly bubbles: readonly string[];
}

defineProps<Props>();

const textareaRef = ref<HTMLTextAreaElement>();

onMounted(() => {
  // 自动聚焦到文本区域
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
});
</script>

<style scoped>
.bubbles-overlay-editor {
  display: flex;
  flex-wrap: wrap;
  margin-top: auto;
  margin-bottom: auto;
  overflow: auto;
}

.boe-bubble {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--gdg-rounding-radius, calc(var(--gdg-bubble-height) / 2));
  padding: 0 var(--gdg-bubble-padding);
  height: var(--gdg-bubble-height);
  background-color: var(--gdg-bg-bubble);
  color: var(--gdg-text-dark);
  margin: var(--gdg-bubble-margin);
  white-space: nowrap;
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