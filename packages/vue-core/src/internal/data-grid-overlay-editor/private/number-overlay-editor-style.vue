<template>
  <div class="NumberOverlayEditorStyle">
    <slot />
  </div>
</template>

<style lang="scss">
.NumberOverlayEditorStyle {
display: flex;
    margin: 6px 0 3px;
    color: var(--gdg-text-dark);

    > input {
        font-size: var(--gdg-editor-font-size);
        padding: 0;
        font-family: var(--gdg-font-family);
        color: var(--gdg-text-dark);
        background-color: var(--gdg-bg-cell);
    }
}
</style>