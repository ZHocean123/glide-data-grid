import { ref, computed, watch, type Ref } from "vue";
import type { VisibleRegion } from "./visible-region.js";

export function useInitialScrollOffset(
    scrollOffsetX: number | undefined,
    scrollOffsetY: number | undefined,
    rowHeight: number | ((row: number) => number),
    visibleRegionRef: Ref<VisibleRegion>,
    onDidScroll: () => void
) {
    const visibleRegionY = computed(() => {
        return scrollOffsetY !== undefined && typeof rowHeight === "number" ? Math.floor(scrollOffsetY / rowHeight) : 0;
    });
    
    const visibleRegionTy = computed(() => {
        return scrollOffsetY !== undefined && typeof rowHeight === "number" ? -(scrollOffsetY % rowHeight) : 0;
    });

    const visibleRegionInput = computed<VisibleRegion>(() => ({
        x: visibleRegionRef.value.x,
        y: visibleRegionY.value,
        width: visibleRegionRef.value.width ?? 1,
        height: visibleRegionRef.value.height ?? 1,
        // tx: 'TODO',
        ty: visibleRegionTy.value,
    }));

    const visibleRegion = ref<VisibleRegion>(visibleRegionInput.value);
    const scrollRef = ref<HTMLDivElement | null>(null);

    const onDidScrollRef = ref(onDidScroll);
    onDidScrollRef.value = onDidScroll;

    // Watch for changes in visibleRegionInput and update visibleRegion
    watch(visibleRegionInput, (newRegion) => {
        visibleRegion.value = { ...newRegion };
    }, { deep: true });

    // Watch for scrollOffsetY changes and update scroll position
    watch([scrollOffsetY, visibleRegion], () => {
        const vScrollReady = (visibleRegion.value.height ?? 1) > 1;
        if (scrollOffsetY !== undefined && scrollRef.value !== null && vScrollReady) {
            if (scrollRef.value.scrollTop === scrollOffsetY) return;
            scrollRef.value.scrollTop = scrollOffsetY;
            if (scrollRef.value.scrollTop !== scrollOffsetY) {
                visibleRegion.value = visibleRegionInput.value;
            }
            onDidScrollRef.value();
        }
    }, { immediate: true });

    // Watch for scrollOffsetX changes and update scroll position
    watch([scrollOffsetX, visibleRegion], () => {
        const hScrollReady = (visibleRegion.value.width ?? 1) > 1;
        if (scrollOffsetX !== undefined && scrollRef.value !== null && hScrollReady) {
            if (scrollRef.value.scrollLeft === scrollOffsetX) return;
            scrollRef.value.scrollLeft = scrollOffsetX;
            if (scrollRef.value.scrollLeft !== scrollOffsetX) {
                visibleRegion.value = visibleRegionInput.value;
            }
            onDidScrollRef.value();
        }
    }, { immediate: true });

    const setScrollRef = (element: HTMLDivElement | null) => {
        scrollRef.value = element;
        if (element !== null) {
            if (scrollOffsetY !== undefined) {
                element.scrollTop = scrollOffsetY;
            } else if (scrollOffsetX !== undefined) {
                element.scrollLeft = scrollOffsetX;
            }
        }
    };

    return {
        visibleRegion,
        setVisibleRegion: (region: VisibleRegion) => {
            visibleRegion.value = region;
        },
        scrollRef: scrollRef,
        setScrollRef,
    };
}