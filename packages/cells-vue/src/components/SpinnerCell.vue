<template>
    <div class="gdg-spinner-cell">
        <div class="spinner" :style="spinnerStyle"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { SpinnerCell } from "../types";

defineProps<{
    cell: SpinnerCell;
    width: number;
    height: number;
}>();

const progress = ref(0);
let animationFrameId: number | null = null;

const updateProgress = () => {
    progress.value = (performance.now() % 1000) / 1000;
    animationFrameId = requestAnimationFrame(updateProgress);
};

onMounted(() => {
    updateProgress();
});

onUnmounted(() => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});

const spinnerStyle = {
    '--progress': progress.value
};
</script>

<style scoped>
.gdg-spinner-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-top: 2px solid #007acc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>