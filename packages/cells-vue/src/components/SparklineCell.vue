<template>
    <div class="gdg-sparkline-cell">
        <canvas ref="canvasRef" :width="width" :height="height"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import type { SparklineCell } from "../types";

const props = defineProps<{
    cell: SparklineCell;
    width: number;
    height: number;
}>();

const canvasRef = ref<HTMLCanvasElement>();

const drawSparkline = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { values, graphColor = "#007acc", graphKind = "line" } = props.cell;

    if (!values || values.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, props.width, props.height);

    // Calculate min and max values
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Calculate points
    const points = values.map((value: number, index: number) => {
        const x = (index / (values.length - 1)) * (props.width - 2);
        const y = props.height - 2 - ((value - min) / range) * (props.height - 4);
        return { x, y };
    });

    ctx.strokeStyle = graphColor;
    ctx.fillStyle = graphColor;
    ctx.lineWidth = 1;

    if (graphKind === "line") {
        // Draw line sparkline
        ctx.beginPath();
        points.forEach((point: {x: number, y: number}, index: number) => {
            if (index === 0) {
                ctx.moveTo(point.x + 1, point.y);
            } else {
                ctx.lineTo(point.x + 1, point.y);
            }
        });
        ctx.stroke();
    } else if (graphKind === "bar") {
        // Draw bar sparkline
        const barWidth = props.width / values.length;
        points.forEach((point: {x: number, y: number}, index: number) => {
            const barHeight = props.height - point.y;
            ctx.fillRect(
                index * barWidth + 1,
                point.y,
                barWidth - 2,
                barHeight
            );
        });
    }
};

onMounted(() => {
    nextTick(drawSparkline);
});

watch(
    () => [props.cell, props.width, props.height],
    () => {
        nextTick(drawSparkline);
    },
    { deep: true }
);
</script>

<style scoped>
.gdg-sparkline-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}
</style>