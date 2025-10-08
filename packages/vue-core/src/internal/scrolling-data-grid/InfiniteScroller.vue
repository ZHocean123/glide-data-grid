<template>
  <div ref="containerRef" :style="containerStyle">
    <div class="dvn-underlay">
      <slot></slot>
    </div>
    <div
      ref="scrollerRef"
      class="dvn-scroller"
      :class="className"
      :draggable="draggable"
      @scroll="onScroll"
      @dragstart="onDragStart"
    >
      <div class="dvn-scroll-inner" :class="{ 'dvn-hidden': !rightElement }">
        <div class="dvn-stack">
          <div
            v-for="(padder, index) in padders"
            :key="index"
            :style="padder.style"
          ></div>
        </div>
        <div
          v-if="rightElement"
          ref="rightWrapRef"
          class="right-element-container"
          :style="rightElementStyle"
        >
          <slot name="rightElement">{{ rightElement }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useResizeDetector } from "../../common/resize-detector.js";
import { browserIsSafari } from "../../common/browser-detect.js";
import { useKineticScroll } from "./use-kinetic-scroll.js";
import type { Rectangle } from "../data-grid/data-grid-types.js";

// Browser's maximum div height limit. Varies a bit by browsers.
const BROWSER_MAX_DIV_HEIGHT = 33_554_400;
// Maximum height of a single padder segment to avoid browser performance issues.
const MAX_PADDER_SEGMENT_HEIGHT = 5_000_000;

type ScrollLock = [undefined, number] | [number, undefined] | undefined;

interface Props {
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
  readonly paddingRight?: number;
  readonly paddingBottom?: number;
  readonly draggable: boolean;
  readonly preventDiagonalScrolling?: boolean;
  readonly className?: string;
}

interface Emits {
  (e: 'update', region: Rectangle & { paddingRight: number }): void;
}

const props = withDefaults(defineProps<Props>(), {
  preventDiagonalScrolling: false,
  paddingBottom: 0,
  paddingRight: 0,
  kineticScrollPerfHack: false,
});

const emit = defineEmits<Emits>();

// Refs
const containerRef = ref<HTMLElement | null>(null);
const scrollerRef = ref<HTMLDivElement | null>(null);
const rightWrapRef = ref<HTMLDivElement | null>(null);

// Reactive state
const virtualScrollY = ref(0);
const lastScrollY = ref(0);
const lastScrollPosition = ref({
  scrollLeft: 0,
  scrollTop: 0,
  lockDirection: undefined as ScrollLock,
});

const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
const lastDpr = ref(dpr);

// Touch and idle state
const hasTouches = ref(false);
const isIdle = ref(true);
const idleTimer = ref(0);

// Resize detector
const { ref: resizeRef, width, height } = useResizeDetector(props.initialSize);

// Computed properties
const rightElementSticky = computed(() => props.rightElementProps?.sticky ?? false);
const rightElementFill = computed(() => props.rightElementProps?.fill ?? false);

const containerStyle = computed(() => ({
  maxWidth: width ? `${width}px` : undefined,
  maxHeight: height ? `${height}px` : undefined,
}));

const rightElementStyle = computed(() => ({
  height: `${height}px`,
  maxHeight: props.clientHeight - Math.ceil(dpr % 1),
  position: "sticky" as const,
  top: 0,
  paddingLeft: "1px",
  marginBottom: "-40px",
  marginRight: `${props.paddingRight}px`,
  flexGrow: rightElementFill.value ? 1 : undefined,
  right: rightElementSticky.value ? `${props.paddingRight}px` : undefined,
  pointerEvents: "auto" as const,
}));

// Padders generation
const padders = computed(() => {
  const result: Array<{ style: Record<string, string> }> = [];
  
  // Ensure we don't create padders that exceed browser limits
  const effectiveScrollHeight = Math.min(props.scrollHeight, BROWSER_MAX_DIV_HEIGHT);
  
  result.push({ style: { width: `${props.scrollWidth}px`, height: '0px' } });
  
  let h = 0;
  let key = 1;
  while (h < effectiveScrollHeight) {
    const toAdd = Math.min(MAX_PADDER_SEGMENT_HEIGHT, effectiveScrollHeight - h);
    result.push({ style: { width: '0px', height: `${toAdd}px` } });
    h += toAdd;
    key++;
  }
  
  return result;
});

// Touch handling
const useTouchUpDelayed = (delay: number) => {
  const cbTimer = ref(0);
  
  const onTouchStart = () => {
    window.clearTimeout(cbTimer.value);
    hasTouches.value = true;
  };
  
  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      cbTimer.value = window.setTimeout(() => {
        hasTouches.value = false;
      }, delay);
    }
  };
  
  onMounted(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
    }
  });
  
  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(cbTimer.value);
    }
  });
};

useTouchUpDelayed(200);

// Scroll handling
const onScroll = () => {
  const el = scrollerRef.value;
  if (el === null) return;

  const scrollTop = el.scrollTop;
  const scrollLeft = el.scrollLeft;
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

  const finalScrollLeft = lock?.[0] ?? scrollLeft;
  const finalScrollTop = lock?.[1] ?? scrollTop;
  lastScrollPosition.value.scrollLeft = finalScrollLeft;
  lastScrollPosition.value.scrollTop = finalScrollTop;

  const cWidth = el.clientWidth;
  const cHeight = el.clientHeight;

  const newY = finalScrollTop;
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
    idleTimer.value = window.setTimeout(() => {
      isIdle.value = true;
    }, 200);
  }

  emit('update', {
    x: finalScrollLeft,
    y: virtualY,
    width: cWidth - props.paddingRight,
    height: cHeight - props.paddingBottom,
    paddingRight: rightWrapRef.value?.clientWidth ?? 0,
  });
};

const onDragStart = (e: DragEvent) => {
  if (!props.draggable) {
    e.stopPropagation();
    e.preventDefault();
  }
};

// Setup kinetic scroll
useKineticScroll(
  props.kineticScrollPerfHack && browserIsSafari.value,
  (scrollLeft: number, scrollTop: number) => {
    onScroll();
  },
  scrollerRef
);

// Watch for device pixel ratio changes
watch(
  () => dpr,
  (newDpr) => {
    if (lastDpr.value !== newDpr) {
      virtualScrollY.value = 0;
      lastScrollY.value = 0;
      lastDpr.value = newDpr;
      const el = scrollerRef.value;
      if (el !== null) {
        nextTick(() => {
          onScroll();
        });
      }
    }
  }
);

// Handle idle state and scroll lock
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

// Watch for size changes
watch([width, height], () => {
  if (typeof window !== "undefined" && (width !== undefined || height !== undefined)) {
    window.setTimeout(() => {
      onScroll();
    }, 0);
  }
});

// Set refs
watch(resizeRef, (newRef) => {
  containerRef.value = newRef;
});

// Expose scroller ref
defineExpose({
  scrollerRef,
});
</script>

<style scoped>
.dvn-scroller {
  overflow: v-bind('browserIsSafari ? "scroll" : "auto"');
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