import { ref, computed, onUnmounted } from "vue";
import { useThrottleFn, useDebounceFn } from "../common/utils.js";

export interface ScrollEventOptions {
  throttleMs?: number;
  debounceMs?: number;
  enableSmoothScrolling?: boolean;
  enableKineticScrolling?: boolean;
  enableMomentumScrolling?: boolean;
}

export function useScrollEvents(options: ScrollEventOptions = {}) {
  const {
    throttleMs = 16, // ~60fps
    debounceMs = 150,
    enableSmoothScrolling = false,
    enableKineticScrolling = false,
    enableMomentumScrolling = false,
  } = options;

  // State
  const isScrolling = ref(false);
  const scrollVelocity = ref({ x: 0, y: 0 });
  const lastScrollPosition = ref({ x: 0, y: 0 });
  const scrollDirection = ref({ x: 0, y: 0 });
  const scrollStartTime = ref(0);
  const scrollEndTime = ref(0);

  // Event listeners registry
  const eventListeners = ref<Map<string, Set<Function>>>(new Map());

  // Timers
  let scrollEndTimer: number | null = null;
  let velocityTimer: number | null = null;
  let momentumTimer: number | null = null;

  // Computed properties
  const isScrollingHorizontally = computed(() => scrollDirection.value.x !== 0);
  const isScrollingVertically = computed(() => scrollDirection.value.y !== 0);
  const scrollDuration = computed(() => scrollEndTime.value - scrollStartTime.value);

  // Throttled and debounced functions
  const updateScrollVelocity = useThrottleFn((currentPosition: { x: number; y: number }) => {
    const deltaX = currentPosition.x - lastScrollPosition.value.x;
    const deltaY = currentPosition.y - lastScrollPosition.value.y;
    
    scrollVelocity.value = {
      x: deltaX,
      y: deltaY,
    };
    
    lastScrollPosition.value = { ...currentPosition };
  }, throttleMs);

  const handleScrollEnd = useDebounceFn(() => {
    isScrolling.value = false;
    scrollDirection.value = { x: 0, y: 0 };
    scrollVelocity.value = { x: 0, y: 0 };
    scrollEndTime.value = Date.now();
    
    // Trigger scroll end event
    emitEvent('scrollEnd', {
      position: lastScrollPosition.value,
      velocity: scrollVelocity.value,
      duration: scrollDuration.value,
    });
    
    // Clear momentum scrolling
    if (momentumTimer !== null) {
      cancelAnimationFrame(momentumTimer);
      momentumTimer = null;
    }
  }, debounceMs);

  // Event handling
  const emitEvent = (eventName: string, data?: any) => {
    const listeners = eventListeners.value.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in scroll event listener for ${eventName}:`, error);
        }
      });
    }
  };

  const onScroll = (event: Event, currentPosition: { x: number; y: number }) => {
    // Update scroll state
    if (!isScrolling.value) {
      isScrolling.value = true;
      scrollStartTime.value = Date.now();
      emitEvent('scrollStart', { position: currentPosition });
    }

    // Update scroll direction
    const deltaX = currentPosition.x - lastScrollPosition.value.x;
    const deltaY = currentPosition.y - lastScrollPosition.value.y;
    
    if (deltaX !== 0) {
      scrollDirection.value.x = deltaX > 0 ? 1 : -1;
    }
    if (deltaY !== 0) {
      scrollDirection.value.y = deltaY > 0 ? 1 : -1;
    }

    // Update velocity
    updateScrollVelocity(currentPosition);

    // Reset scroll end timer
    if (scrollEndTimer !== null) {
      clearTimeout(scrollEndTimer);
    }
    scrollEndTimer = window.setTimeout(handleScrollEnd, debounceMs);

    // Emit scroll event
    emitEvent('scroll', {
      position: currentPosition,
      velocity: scrollVelocity.value,
      direction: scrollDirection.value,
      nativeEvent: event,
    });

    // Handle kinetic scrolling
    if (enableKineticScrolling && velocityTimer === null) {
      velocityTimer = window.requestAnimationFrame(updateKineticScrolling);
    }

    // Handle momentum scrolling
    if (enableMomentumScrolling && momentumTimer === null) {
      momentumTimer = window.requestAnimationFrame(updateMomentumScrolling);
    }
  };

  const updateKineticScrolling = () => {
    if (!isScrolling.value) {
      velocityTimer = null;
      return;
    }

    // Apply kinetic scrolling logic
    emitEvent('kineticScroll', {
      velocity: scrollVelocity.value,
      position: lastScrollPosition.value,
    });

    velocityTimer = window.requestAnimationFrame(updateKineticScrolling);
  };

  const updateMomentumScrolling = () => {
    if (!isScrolling.value) {
      momentumTimer = null;
      return;
    }

    // Apply momentum scrolling logic
    emitEvent('momentumScroll', {
      velocity: scrollVelocity.value,
      position: lastScrollPosition.value,
    });

    momentumTimer = window.requestAnimationFrame(updateMomentumScrolling);
  };

  // Event listener management
  const addEventListener = (eventName: string, callback: Function) => {
    if (!eventListeners.value.has(eventName)) {
      eventListeners.value.set(eventName, new Set());
    }
    eventListeners.value.get(eventName)!.add(callback);
  };

  const removeEventListener = (eventName: string, callback: Function) => {
    const listeners = eventListeners.value.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        eventListeners.value.delete(eventName);
      }
    }
  };

  const removeAllEventListeners = () => {
    eventListeners.value.clear();
  };

  // Smooth scrolling
  const scrollToPosition = (
    element: HTMLElement,
    targetPosition: { x: number; y: number },
    duration: number = 300
  ) => {
    if (!enableSmoothScrolling) {
      element.scrollLeft = targetPosition.x;
      element.scrollTop = targetPosition.y;
      return;
    }

    const startPosition = {
      x: element.scrollLeft,
      y: element.scrollTop,
    };
    
    const distance = {
      x: targetPosition.x - startPosition.x,
      y: targetPosition.y - startPosition.y,
    };
    
    const startTime = Date.now();
    
    const animateScroll = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentPosition = {
        x: startPosition.x + distance.x * easeProgress,
        y: startPosition.y + distance.y * easeProgress,
      };
      
      element.scrollLeft = currentPosition.x;
      element.scrollTop = currentPosition.y;
      
      emitEvent('smoothScroll', {
        position: currentPosition,
        progress,
        startPosition,
        targetPosition,
      });
      
      if (progress < 1) {
        window.requestAnimationFrame(animateScroll);
      }
    };
    
    window.requestAnimationFrame(animateScroll);
  };

  // Scroll to element
  const scrollToElement = (
    container: HTMLElement,
    element: HTMLElement,
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest' }
  ) => {
    if (enableSmoothScrolling && options.behavior === 'smooth') {
      // Custom smooth scrolling implementation
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      const targetPosition = {
        x: elementRect.left - containerRect.left + container.scrollLeft,
        y: elementRect.top - containerRect.top + container.scrollTop,
      };
      
      // Adjust for block and inline positioning
      if (options.block === 'start') {
        targetPosition.y = elementRect.top - containerRect.top + container.scrollTop;
      } else if (options.block === 'center') {
        targetPosition.y = elementRect.top - containerRect.top + container.scrollTop - (container.clientHeight - elementRect.height) / 2;
      } else if (options.block === 'end') {
        targetPosition.y = elementRect.bottom - containerRect.top + container.scrollTop - container.clientHeight;
      }
      
      if (options.inline === 'start') {
        targetPosition.x = elementRect.left - containerRect.left + container.scrollLeft;
      } else if (options.inline === 'center') {
        targetPosition.x = elementRect.left - containerRect.left + container.scrollLeft - (container.clientWidth - elementRect.width) / 2;
      } else if (options.inline === 'end') {
        targetPosition.x = elementRect.right - containerRect.left + container.scrollLeft - container.clientWidth;
      }
      
      scrollToPosition(container, targetPosition);
    } else {
      // Use native scrollIntoView
      element.scrollIntoView(options);
    }
  };

  // Cleanup
  const cleanup = () => {
    if (scrollEndTimer !== null) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    }
    
    if (velocityTimer !== null) {
      cancelAnimationFrame(velocityTimer);
      velocityTimer = null;
    }
    
    if (momentumTimer !== null) {
      cancelAnimationFrame(momentumTimer);
      momentumTimer = null;
    }
    
    removeAllEventListeners();
  };

  onUnmounted(cleanup);

  return {
    // State
    isScrolling,
    scrollVelocity,
    scrollDirection,
    lastScrollPosition,
    scrollDuration,
    
    // Computed
    isScrollingHorizontally,
    isScrollingVertically,
    
    // Methods
    onScroll,
    scrollToPosition,
    scrollToElement,
    addEventListener,
    removeEventListener,
    removeAllEventListeners,
    cleanup,
  };
}