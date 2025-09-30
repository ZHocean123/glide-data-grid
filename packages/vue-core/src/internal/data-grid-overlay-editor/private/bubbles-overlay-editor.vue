<template>
  <BubblesOverlayEditorStyle>
    <div
      v-for="(b, i) in bubbles"
      :key="i"
      class="boe-bubble"
    >
      {{ b }}
    </div>
    <textarea class="gdg-input" autofocus />
  </BubblesOverlayEditorStyle>
</template>

<script setup lang="ts">
import BubblesOverlayEditorStyle from './bubbles-overlay-editor-style.vue';

interface Props {
  readonly bubbles: readonly string[];
}

const props = defineProps<Props>();
</script>
