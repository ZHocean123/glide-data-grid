import { ref, computed } from "vue";
import type { Rectangle } from "../internal/data-grid/data-grid-types.js";

export interface ScrollPosition {
  x: number;
  y: number;
}

export function useScrollPosition(
  initialPosition: ScrollPosition = { x: 0, y: 0 }
) {
  const scrollPosition = ref<ScrollPosition>({ ...initialPosition });
  const isScrolling = ref(false);
  const scrollDirection = ref<ScrollPosition>({ x: 0, y: 0 });

  let scrollTimeout: number | null = null;

  const setScrollPosition = (x: number, y: number) => {
    const oldX = scrollPosition.value.x;
    const oldY = scrollPosition.value.y;
    
    scrollPosition.value = { x, y };
    scrollDirection.value = {
      x: x > oldX ? 1 : x < oldX ? -1 : 0,
      y: y > oldY ? 1 : y < oldY ? -1 : 0,
    };

    if (!isScrolling.value) {
      isScrolling.value = true;
    }

    // Clear existing timeout
    if (scrollTimeout !== null) {
      clearTimeout(scrollTimeout);
    }

    // Set a timeout to mark scrolling as finished
    scrollTimeout = window.setTimeout(() => {
      isScrolling.value = false;
      scrollDirection.value = { x: 0, y: 0 };
      scrollTimeout = null;
    }, 150);
  };

  const scrollToPosition = (x: number, y: number, smooth = false) => {
    // This would be implemented by the component using this composable
    // The component would call setScrollPosition when the scroll actually happens
    return { x, y, smooth };
  };

  const scrollBy = (deltaX: number, deltaY: number, smooth = false) => {
    const newX = scrollPosition.value.x + deltaX;
    const newY = scrollPosition.value.y + deltaY;
    return scrollToPosition(newX, newY, smooth);
  };

  const scrollToElement = (
    element: HTMLElement,
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest' }
  ) => {
    element.scrollIntoView(options);
    // The actual position update would happen in the scroll event handler
  };

  // Cleanup
  const cleanup = () => {
    if (scrollTimeout !== null) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
  };

  return {
    scrollPosition: computed(() => scrollPosition.value),
    isScrolling: computed(() => isScrolling.value),
    scrollDirection: computed(() => scrollDirection.value),
    setScrollPosition,
    scrollToPosition,
    scrollBy,
    scrollToElement,
    cleanup,
  };
}

export function useViewportCalculation(
  containerSize: { width: number; height: number },
  contentSize: { width: number; height: number },
  scrollPosition: { x: number; y: number }
) {
  const viewport = computed<Rectangle>(() => ({
    x: scrollPosition.x,
    y: scrollPosition.y,
    width: containerSize.width,
    height: containerSize.height,
  }));

  const canScrollLeft = computed(() => scrollPosition.x > 0);
  const canScrollRight = computed(() => 
    scrollPosition.x < contentSize.width - containerSize.width
  );
  const canScrollUp = computed(() => scrollPosition.y > 0);
  const canScrollDown = computed(() => 
    scrollPosition.y < contentSize.height - containerSize.height
  );

  const scrollPercentageX = computed(() => {
    const maxScrollX = Math.max(0, contentSize.width - containerSize.width);
    return maxScrollX > 0 ? scrollPosition.x / maxScrollX : 0;
  });

  const scrollPercentageY = computed(() => {
    const maxScrollY = Math.max(0, contentSize.height - containerSize.height);
    return maxScrollY > 0 ? scrollPosition.y / maxScrollY : 0;
  });

  return {
    viewport,
    canScrollLeft,
    canScrollRight,
    canScrollUp,
    canScrollDown,
    scrollPercentageX,
    scrollPercentageY,
  };
}