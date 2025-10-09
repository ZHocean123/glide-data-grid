<template>
  <div
    :class="classList"
    :style="computedStyle"
    :as="as"
    class="data-grid-overlay-editor"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  class?: string;
  style?: Record<string, any>;
  as?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: undefined,
});

const classList = computed(() => {
  return [
    props.class,
    "data-grid-overlay-editor",
  ].filter(Boolean).join(" ");
});

const computedStyle = computed(() => ({
  left: `${props.targetX}px`,
  top: `${props.targetY}px`,
  minWidth: `${props.targetWidth}px`,
  minHeight: `${props.targetHeight}px`,
  "--overlay-top": `${props.targetY}px`,
  ...props.style,
}));
</script>

<style scoped>
.data-grid-overlay-editor {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  width: max-content;
  max-width: 400px;
  max-height: calc(100vh - var(--overlay-top) - 10px);
  font-family: var(--gdg-font-family);
  font-size: var(--gdg-editor-font-size);
  text-align: start;
}

@keyframes glide_fade_in {
  from {
    opacity: 0%;
  }
  to {
    opacity: 100%;
  }
}

.gdg-style {
  border-radius: 2px;
  background-color: var(--gdg-bg-cell);
  box-shadow:
    0 0 0 1px var(--gdg-accent-color),
    0px 0px 1px rgba(62, 65, 86, 0.4),
    0px 6px 12px rgba(62, 65, 86, 0.15);
  animation: glide_fade_in 60ms 1;
}

.gdg-pad {
  padding: calc(max(0, (var(--target-height) - 28px) / 2)) 8.5px 3px;
}

.gdg-clip-region {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 2px;
  flex-grow: 1;
}

.gdg-clip-region .gdg-growing-entry {
  height: 100%;
}

.gdg-clip-region input.gdg-input {
  width: 100%;
  border: none;
  border-width: 0;
  outline: none;
}

.gdg-clip-region textarea.gdg-input {
  border: none;
  border-width: 0;
  outline: none;
}

.gdg-invalid {
  /* Invalid state styles */
}
</style>