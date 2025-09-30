<template>
  <div class="BubblesOverlayEditorStyle">
    <slot />
  </div>
 </template>

<script setup lang="ts">
/**
 * BubblesOverlayEditor 样式组件
 * 提供气泡布局与隐藏输入框样式包装，供覆盖编辑器使用。
 */
defineOptions({ name: 'BubblesOverlayEditorStyle' });
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