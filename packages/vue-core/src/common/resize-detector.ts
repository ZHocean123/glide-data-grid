import { ref, onMounted, onUnmounted } from "vue";

interface ResizeDetectorDimensions {
    height?: number;
    width?: number;
}

export function useResizeDetector(
    initialSize?: readonly [width: number, height: number]
): ResizeDetectorDimensions & { ref: any } {
    const elementRef = ref<any>(null);
    const width = ref(initialSize?.[0]);
    const height = ref(initialSize?.[1]);

    let resizeObserver: ResizeObserver | null = null;

    onMounted(() => {
        if (typeof window !== "undefined" && "ResizeObserver" in window) {
            resizeObserver = new window.ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width: entryWidth, height: entryHeight } = (entry && entry.contentRect) || {};
                    width.value = entryWidth;
                    height.value = entryHeight;
                }
            });

            if (elementRef.value) {
                resizeObserver.observe(elementRef.value);
            }
        }
    });

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    });

    return {
        ref: elementRef,
        width: width.value,
        height: height.value,
    };
}