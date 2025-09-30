<template>
  <div ref="wrapperRef" v-bind="restProps">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  onClickOutside: () => void;
  isOutsideClick?: (event: MouseEvent | TouchEvent) => boolean;
  customEventTarget?: HTMLElement | Window | Document;
}

const props = defineProps<Props>();

const wrapperRef = ref<HTMLDivElement>();

// Extract rest props for div attributes
const restProps = {
  ...props,
  onClickOutside: undefined,
  isOutsideClick: undefined,
  customEventTarget: undefined,
};

const clickOutside = (event: Event) => {
  if (props.isOutsideClick && !props.isOutsideClick(event as MouseEvent | TouchEvent)) {
    return;
  }
  if (wrapperRef.value !== undefined && !wrapperRef.value.contains(event.target as Node | null)) {
    let node = event.target as Element | null;
    while (node !== null) {
      if (node.classList.contains("click-outside-ignore")) {
        return;
      }

      node = node.parentElement;
    }
    props.onClickOutside();
  }
};

onMounted(() => {
  const eventTarget = props.customEventTarget ?? document;
  eventTarget.addEventListener("pointerdown", clickOutside, true);
  eventTarget.addEventListener("contextmenu", clickOutside, true);
});

onUnmounted(() => {
  const eventTarget = props.customEventTarget ?? document;
  eventTarget.removeEventListener("pointerdown", clickOutside, true);
  eventTarget.removeEventListener("contextmenu", clickOutside, true);
});
</script>
