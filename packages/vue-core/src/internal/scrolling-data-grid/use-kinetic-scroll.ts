import { ref, watch, onUnmounted, computed } from "vue";

export function useKineticScroll(
    isEnabled: boolean,
    callback: (scrollLeft: number, scrollTop: number) => void,
    targetScroller: { value: HTMLDivElement | null }
) {
    const rafId = ref<number | null>(null);
    const isTouching = ref<boolean | null>(null);
    const lastScrollPosition = ref<readonly [number, number] | null>(null);
    const sameCount = ref(0);

    const callbackRef = ref(callback);
    callbackRef.value = callback;

    const scrollEl = targetScroller.value;

    const handleScroll = () => {
        if (isTouching.value === false && scrollEl !== null) {
            const currentScrollPosition = [scrollEl.scrollLeft, scrollEl.scrollTop] as const;
            if (
                lastScrollPosition.value?.[0] === currentScrollPosition[0] &&
                lastScrollPosition.value?.[1] === currentScrollPosition[1]
            ) {
                if (sameCount.value > 10) {
                    // Scroll position hasn't changed, stop the animation frame
                    lastScrollPosition.value = null;
                    isTouching.value = null;
                    return;
                } else {
                    sameCount.value++;
                }
            } else {
                sameCount.value = 0;
                callbackRef.value(currentScrollPosition[0], currentScrollPosition[1]);
                lastScrollPosition.value = currentScrollPosition;
            }

            rafId.value = window.setTimeout(handleScroll, 1000 / 120);
        }
    };

    const startTouch = () => {
        isTouching.value = true;
        lastScrollPosition.value = null; // Reset last scroll position on touch start
        if (rafId.value !== null) {
            window.clearTimeout(rafId.value);
            rafId.value = null;
        }
    };

    const endTouch = (event: TouchEvent) => {
        if (event.touches.length === 0) {
            // All touches have ended
            isTouching.value = false;
            sameCount.value = 0;
            rafId.value = window.setTimeout(handleScroll, 1000 / 120);
        }
    };

    const setupEventListeners = () => {
        if (isEnabled && scrollEl !== null) {
            const element = scrollEl;
            element.addEventListener("touchstart", startTouch);
            element.addEventListener("touchend", endTouch);

            return () => {
                element.removeEventListener("touchstart", startTouch);
                element.removeEventListener("touchend", endTouch);
                if (rafId.value !== null) {
                    window.clearTimeout(rafId.value);
                }
            };
        }
        return () => {};
    };

    // Watch for changes in the scroll element
    watch(targetScroller, () => {
        // Clean up previous listeners
        const cleanup = setupEventListeners();
        
        // Return cleanup function for next watch
        return cleanup;
    }, { immediate: true });

    // Watch for changes in isEnabled
    const isEnabledRef = computed(() => isEnabled);
    watch(isEnabledRef, (newValue) => {
        if (newValue && scrollEl !== null) {
            const element = scrollEl;
            element.addEventListener("touchstart", startTouch);
            element.addEventListener("touchend", endTouch);
        } else if (scrollEl !== null) {
            const element = scrollEl;
            element.removeEventListener("touchstart", startTouch);
            element.removeEventListener("touchend", endTouch);
        }
    });

    // Cleanup on unmount
    onUnmounted(() => {
        if (rafId.value !== null) {
            window.clearTimeout(rafId.value);
        }
        if (scrollEl !== null) {
            scrollEl.removeEventListener("touchstart", startTouch);
            scrollEl.removeEventListener("touchend", endTouch);
        }
    });
}