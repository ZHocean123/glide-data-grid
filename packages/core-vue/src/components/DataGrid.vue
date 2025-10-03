<template>
    <div
        class="gdg-vue-placeholder"
        role="grid"
        :data-version="effectiveVersion"
    >
        <slot>
            Glide Data Grid Vue placeholder
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    version?: string;
}>();

const effectiveVersion = computed(() => props.version ?? "experimental");
</script>

<style scoped>
.gdg-vue-placeholder {
    align-items: center;
    border: 1px dashed currentColor;
    display: inline-flex;
    font-family: var(--gdg-font-family, system-ui, sans-serif);
    font-size: 0.875rem;
    justify-content: center;
    min-height: 200px;
    min-width: 320px;
    padding: 1rem;
}
</style>
