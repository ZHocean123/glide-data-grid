<template>
    <div ref="containerRef">
        <div :class="['dvn-scroller', className]"
             ref="scrollerRef"
             :draggable="draggable"
             @scroll="onScroll"
             @dragstart="onDragStart">
            <div :class="['dvn-scroll-inner', { 'dvn-hidden': !rightElement }]">
                <div class="dvn-stack">
                    <div v-for="padder in padders" :key="padder.key" :style="padder.style" />
                </div>
                <template v-if="rightElement">
                    <div v-if="!rightElementFill" class="dvn-spacer" />
                    <div ref="rightWrapRef"
                         :style="rightElementStyle">
                        <slot name="right-element">{{ rightElement }}</slot>
                    </div>
                </template>
            </div>
        </div>
        <div class="dvn-underlay">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useEventListener } from '../../common/utils.js';
import { useResizeDetector } from '../../common/resize-detector.js';
import { browserIsSafari } from '../../common/browser-detect.js';
import { useKineticScroll } from './use-kinetic-scroll.js';
import type { Rectangle } from '../../index.js';

interface Props {
    readonly children?: any;
    readonly className?: string;
    readonly preventDiagonalScrolling?: boolean;
    readonly draggable: boolean;
    readonly paddingRight?: number;
    readonly paddingBottom?: number;
    readonly clientHeight: number;
    readonly scrollWidth: number;
    readonly scrollHeight: number;
    readonly initialSize?: readonly [width: number, height: number];
    readonly rightElementProps?: {
        readonly sticky?: boolean;
        readonly fill?: boolean;
    };
    readonly rightElement?: any;
    readonly kineticScrollPerfHack?: boolean;
    readonly scrollRef?: { value: HTMLDivElement | null };
    readonly update: (region: Rectangle & { paddingRight: number }) => void;
}

const props = withDefaults(defineProps<Props>(), {
    preventDiagonalScrolling: false,
    paddingBottom: 0,
    paddingRight: 0,
    kineticScrollPerfHack: false,
});

// Browser's maximum div height limit. Varies a bit by browsers.
const BROWSER_MAX_DIV_HEIGHT = 33_554_400;
// Maximum height of a single padder segment to avoid browser performance issues.
const MAX_PADDER_SEGMENT_HEIGHT = 5_000_000;

type ScrollLock = [undefined, number] | [number, undefined] | undefined;

const scrollerRef = ref<HTMLDivElement | null>(null);
const rightWrapRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const virtualScrollY = ref(0);
const lastScrollY = ref(0);
const lastScrollPosition = ref({
    scrollLeft: 0,
    scrollTop: 0,
    lockDirection: undefined as ScrollLock,
});

const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
const lastDpr = ref(dpr);

const hasTouches = ref(false);
const isIdle = ref(true);
const idleTimer = ref(0);
const didFirstScroll = ref(false);

// Generate padders for virtual scrolling
const padders = computed(() => {
    const result: Array<{ key: number; style: { width: number; height: number } }> = [];
    let key = 0;
    let h = 0;

    // Ensure we don't create padders that exceed browser limits
    const effectiveScrollHeight = Math.min(props.scrollHeight, BROWSER_MAX_DIV_HEIGHT);

    result.push({ key: key++, style: { width: props.scrollWidth, height: 0 } });
    while (h < effectiveScrollHeight) {
        const toAdd = Math.min(MAX_PADDER_SEGMENT_HEIGHT, effectiveScrollHeight - h);
        result.push({ key: key++, style: { width: 0, height: toAdd } });
        h += toAdd;
    }

    return result;
});

const rightElementSticky = computed(() => props.rightElementProps?.sticky ?? false);
const rightElementFill = computed(() => props.rightElementProps?.fill ?? false);

const rightElementStyle = computed(() => ({
    height: size.value?.height,
    maxHeight: props.clientHeight - Math.ceil(dpr % 1),
    position: 'sticky' as const,
    top: 0,
    paddingLeft: 1,
    marginBottom: -40,
    marginRight: props.paddingRight,
    flexGrow: rightElementFill.value ? 1 : undefined,
    right: rightElementSticky.value ? (props.paddingRight ?? 0) : undefined,
    pointerEvents: 'auto' as const,
}));

// Touch handling
const useTouchUpDelayed = (delay: number) => {
    const cbTimer = ref(0);

    useEventListener(
        'touchstart',
        () => {
            window.clearTimeout(cbTimer.value);
            hasTouches.value = true;
        },
        typeof window === 'undefined' ? null : window,
        true,
        false
    );

    useEventListener(
        'touchend',
        (e: TouchEvent) => {
            if (e.touches.length === 0) {
                cbTimer.value = window.setTimeout(() => hasTouches.value = false, delay);
            }
        },
        typeof window === 'undefined' ? null : window,
        true,
        false
    );
};

useTouchUpDelayed(200);

// Reset scroll tracking when device pixel ratio changes
watch(() => dpr, (newDpr) => {
    if (lastDpr.value !== newDpr) {
        virtualScrollY.value = 0;
        lastScrollY.value = 0;
        lastDpr.value = newDpr;
        const el = scrollerRef.value;
        if (el !== null) {
            onScrollRef.value(el.scrollLeft, el.scrollTop);
        }
    }
});

// Handle scroll lock release when idle
watch([isIdle, hasTouches], ([idle, touches]) => {
    if (!idle || touches || lastScrollPosition.value.lockDirection === undefined) return;
    const el = scrollerRef.value;
    if (el === null) return;
    const [lx, ly] = lastScrollPosition.value.lockDirection;
    if (lx !== undefined) {
        el.scrollLeft = lx;
    } else if (ly !== undefined) {
        el.scrollTop = ly;
    }
    lastScrollPosition.value.lockDirection = undefined;
});

const onScroll = (scrollLeft?: number, scrollTop?: number) => {
    const el = scrollerRef.value;
    if (el === null) return;

    scrollTop = scrollTop ?? el.scrollTop;
    scrollLeft = scrollLeft ?? el.scrollLeft;
    const lastScrollTop = lastScrollPosition.value.scrollTop;
    const lastScrollLeft = lastScrollPosition.value.scrollLeft;

    const dx = scrollLeft - lastScrollLeft;
    const dy = scrollTop - lastScrollTop;

    if (
        hasTouches.value &&
        dx !== 0 &&
        dy !== 0 &&
        (Math.abs(dx) > 3 || Math.abs(dy) > 3) &&
        props.preventDiagonalScrolling &&
        lastScrollPosition.value.lockDirection === undefined
    ) {
        lastScrollPosition.value.lockDirection =
            Math.abs(dx) < Math.abs(dy) ? [lastScrollLeft, undefined] : [undefined, lastScrollTop];
    }

    const lock = lastScrollPosition.value.lockDirection;

    scrollLeft = lock?.[0] ?? scrollLeft;
    scrollTop = lock?.[1] ?? scrollTop;
    lastScrollPosition.value.scrollLeft = scrollLeft;
    lastScrollPosition.value.scrollTop = scrollTop;

    const cWidth = el.clientWidth;
    const cHeight = el.clientHeight;

    const newY = scrollTop;
    const delta = lastScrollY.value - newY;
    const scrollableHeight = el.scrollHeight - cHeight;
    lastScrollY.value = newY;

    // Calculate the virtual Y position
    let virtualY: number;

    // When content height exceeds browser limits, use hybrid approach
    if (scrollableHeight > 0 && props.scrollHeight > el.scrollHeight + 5) {
        // For large jumps (scrollbar interaction) or edge positions,
        // recalculate position based on percentage
        if (Math.abs(delta) > 2000 || newY === 0 || newY === scrollableHeight) {
            const scrollProgress = Math.max(0, Math.min(1, newY / scrollableHeight));
            const virtualScrollableHeight = props.scrollHeight - cHeight;
            virtualY = scrollProgress * virtualScrollableHeight;
            // Update our tracked position for subsequent smooth scrolling
            virtualScrollY.value = virtualY;
        } else {
            // For smooth scrolling, apply the delta directly to virtual position
            // This preserves 1:1 pixel movement for smooth scrolling
            virtualScrollY.value -= delta;
            virtualY = virtualScrollY.value;
        }
    } else {
        // Direct mapping when within browser limits
        virtualY = newY;
        virtualScrollY.value = virtualY;
    }

    // Ensure virtual Y is within valid bounds
    virtualY = Math.max(0, Math.min(virtualY, props.scrollHeight - cHeight));
    virtualScrollY.value = virtualY; // Keep tracked position in bounds too

    if (lock !== undefined) {
        window.clearTimeout(idleTimer.value);
        isIdle.value = false;
        idleTimer.value = window.setTimeout(() => isIdle.value = true, 200);
    }

    props.update({
        x: scrollLeft,
        y: virtualY,
        width: cWidth - props.paddingRight,
        height: cHeight - props.paddingBottom,
        paddingRight: rightWrapRef.value?.clientWidth ?? 0,
    });
};

const onScrollRef = ref(onScroll);

const onDragStart = (e: DragEvent) => {
    if (!props.draggable) {
        e.stopPropagation();
        e.preventDefault();
    }
};

// Use kinetic scroll for Safari
useKineticScroll(
    props.kineticScrollPerfHack && browserIsSafari.value,
    onScroll,
    scrollerRef
);

// Set refs for external access
const setRefs = (instance: HTMLDivElement | null) => {
    scrollerRef.value = instance;
    if (props.scrollRef !== undefined) {
        props.scrollRef.value = instance;
    }
};

// Resize detection
const { ref: resizeRef, width, height } = useResizeDetector<HTMLDivElement>(props.initialSize);
const size = ref<{ width?: number; height?: number }>({ width, height });

watch([width, height], ([newWidth, newHeight]) => {
    if (typeof window !== 'undefined' && (size.value.width !== newWidth || size.value.height !== newHeight)) {
        window.setTimeout(() => onScrollRef.value(), 0);
        size.value = { width: newWidth, height: newHeight };
    }
});

// Initial scroll setup
onMounted(() => {
    if (didFirstScroll.value) onScroll();
    else didFirstScroll.value = true;
});

// Cleanup
onUnmounted(() => {
    if (idleTimer.value) {
        window.clearTimeout(idleTimer.value);
    }
});
</script>

<style>
.dvn-scroller {
    overflow: v-bind('browserIsSafari.value ? "scroll" : "auto"');
    transform: translate3d(0, 0, 0);
}

.dvn-hidden {
    visibility: hidden;
}

.dvn-scroll-inner {
    display: flex;
    pointer-events: none;
}

.dvn-scroll-inner > * {
    flex-shrink: 0;
}

.dvn-spacer {
    flex-grow: 1;
}

.dvn-stack {
    display: flex;
    flex-direction: column;
}

.dvn-underlay > * {
    position: absolute;
    left: 0;
    top: 0;
}

canvas {
    outline: none;
}

canvas * {
    height: 0;
}
</style>
