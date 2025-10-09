<template>
  <div class="drilldown-overlay-editor">
    <div
      v-for="(drilldown, index) in drilldowns"
      :key="index"
      class="doe-bubble"
    >
      <img
        v-if="(drilldown as any).img"
        :src="(drilldown as any).img"
        alt=""
      />
      <div>{{ (drilldown as any).text }}</div>
    </div>
    <textarea class="gdg-input" ref="textareaRef" autofocus />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { DrilldownCellData } from "../../data-grid/data-grid-types";

interface Props {
  readonly drilldowns: readonly DrilldownCellData[];
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
.drilldown-overlay-editor {
  display: flex;
  flex-wrap: wrap;
}

.doe-bubble {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
  height: 24px;
  background-color: var(--gdg-bg-cell);
  color: var(--gdg-text-dark);
  margin: 2px;
  border-radius: var(--gdg-rounding-radius, 6px);
  box-shadow:
    0 0 1px rgba(62, 65, 86, 0.4),
    0 1px 3px rgba(62, 65, 86, 0.4);
}

.doe-bubble img {
  height: 16px;
  object-fit: contain;
  margin-right: 4px;
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