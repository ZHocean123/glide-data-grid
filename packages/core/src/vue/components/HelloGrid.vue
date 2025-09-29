<template>
    <div class="gdg-vue-placeholder">
        <h2>{{ title }}</h2>
        <p>
            This placeholder component validates the Vue toolchain. Replace it with the real Data Grid during later
            phases of the migration.
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title?: string;
}>();
</script>

<style scoped>
.gdg-vue-placeholder {
    padding: 1.5rem;
    border: 1px dashed var(--gdg-border-color, #cbd5f5);
    border-radius: 8px;
    background: var(--gdg-bg-cell, #f9fbff);
    color: var(--gdg-text-dark, #1f2933);
    font-family: var(--gdg-font-family, 'Inter', sans-serif);
}

.gdg-vue-placeholder h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.gdg-vue-placeholder p {
    margin: 0;
    line-height: 1.5;
}
</style>
