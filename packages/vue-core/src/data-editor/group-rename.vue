<template>
  <ClickOutsideContainer
    :style="containerStyle"
    class="group-rename-container"
    @click-outside="onClose"
  >
    <RenameInput
      :targetHeight="bounds.height"
      data-testid="group-rename-input"
      :value="value"
      @blur="onClose"
      @focus="onFocus"
      @input="onInput"
      @keydown="onKeyDown"
      autofocus
    />
  </ClickOutsideContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { styled } from '@linaria/vue';
import { css } from '@linaria/core';
import ClickOutsideContainer from '../internal/click-outside-container/click-outside-container.vue';
import type { Rectangle } from '../internal/data-grid/data-grid-types.js';

interface Props {
  readonly bounds: Rectangle;
  readonly group: string;
  readonly onClose: () => void;
  readonly onFinish: (newVal: string) => void;
  readonly canvasBounds: DOMRect;
}

const props = defineProps<Props>();

const value = ref(props.group);

const containerStyle = computed(() => ({
  position: 'absolute',
  left: `${props.bounds.x - props.canvasBounds.left + 1}px`,
  top: `${props.bounds.y - props.canvasBounds.top}px`,
  width: `${props.bounds.width - 2}px`,
  height: `${props.bounds.height}px`,
}));

const onFocus = (e: Event) => {
  const target = e.target as HTMLInputElement;
  target.setSelectionRange(0, value.value.length);
};

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  value.value = target.value;
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    props.onFinish(value.value);
  } else if (e.key === 'Escape') {
    props.onClose();
  }
};

const RenameInput = styled.input<{ targetHeight: number }>`
  flex-grow: 1;
  border: none;
  outline: none;
  background-color: var(--gdg-bg-header-has-focus);
  border-radius: 9px;
  padding: 0 8px;
  box-shadow: 0 0 0 1px var(--gdg-border-color);
  color: var(--gdg-text-group-header);
  min-height: ${(p: any) => Math.max(16, p.targetHeight - 10)}px;
  font: var(--gdg-header-font-style) var(--gdg-font-family);
`;

const groupRenameContainer = css`
  padding: 0 8px;
  display: flex;
  align-items: center;
  background-color: var(--gdg-bg-header);
`;
</script>

<style>
.group-rename-container {
  composes: ${groupRenameContainer};
}
</style>
