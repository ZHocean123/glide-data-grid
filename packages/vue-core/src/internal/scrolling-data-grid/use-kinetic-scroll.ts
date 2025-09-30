import { ref, onMounted, onUnmounted, watch } from 'vue';

export const useKineticScroll = (
    isEnabled: boolean,
    callback: (scrollLeft: number, scrollTop: number) => void,
    targetScroller: { value: HTMLDivElement | null }
) => {
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

    watch([() => isEnabled, () => targetScroller.value], ([enabled, scroller]) => {
        if (enabled && scroller !== null) {
            const element = scroller;
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
    }, { immediate: true });

    onUnmounted(() => {
        if (rafId.value !== null) {
            window.clearTimeout(rafId.value);
        }
    });
};
