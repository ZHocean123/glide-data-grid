<template>
  <div class="BubblesOverlayEditorStyle">
    <div
      v-for="(b, i) in bubbles"
      :key="i"
      class="boe-bubble"
    >
      {{ b }}
    </div>
    <textarea class="gdg-input" autofocus />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bubbles: readonly string[]
}>();
</script>
<style lang="scss">
.BubblesOverlayEditorStyle {
  display: flex;
    flex-wrap: wrap;
    margin-top: auto;
    margin-bottom: auto;
    overflow: auto;

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
}
</style>