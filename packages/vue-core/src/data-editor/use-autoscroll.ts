import { ref, watch, onUnmounted } from "vue";
import type { GridMouseCellEventArgs } from "../internal/data-grid/event-args.js";

const maxPxPerMs = 2;
const msToFullSpeed = 1300;

export function useAutoscroll(
    scrollDirection: GridMouseCellEventArgs["scrollEdge"] | undefined,
    scrollRef: { value: HTMLDivElement | null },
    onScroll?: () => void
) {
    const speedScalar = ref(0);
    const [xDir, yDir] = scrollDirection ?? [0, 0] as [number, number];
    let cancelled = false;
    let lastTime = 0;
    let rafId: number | null = null;

    const scrollFn = (curTime: number) => {
        if (cancelled) return;
        if (lastTime === 0) {
            lastTime = curTime;
        } else {
            const step = curTime - lastTime;
            speedScalar.value = Math.min(1, speedScalar.value + step / msToFullSpeed);
            const motion = speedScalar.value ** 1.618 * step * maxPxPerMs;
            scrollRef.value?.scrollBy(xDir * motion, yDir * motion);
            lastTime = curTime;
            onScroll?.();
        }
        rafId = window.requestAnimationFrame(scrollFn);
    };

    const startScrolling = () => {
        if (xDir === 0 && yDir === 0) {
            speedScalar.value = 0;
            return;
        }
        cancelled = false;
        lastTime = 0;
        rafId = window.requestAnimationFrame(scrollFn);
    };

    const stopScrolling = () => {
        cancelled = true;
        speedScalar.value = 0;
        if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    // Watch for scroll direction changes
    watch(() => scrollDirection, (newDirection) => {
        stopScrolling();
        if (newDirection) {
            const [newXDir, newYDir] = newDirection;
            if (newXDir !== 0 || newYDir !== 0) {
                // Update the direction and restart scrolling
                startScrolling();
            }
        }
    }, { immediate: true });

    // Cleanup on unmount
    onUnmounted(() => {
        stopScrolling();
    });

    return {
        startScrolling,
        stopScrolling,
    };
}