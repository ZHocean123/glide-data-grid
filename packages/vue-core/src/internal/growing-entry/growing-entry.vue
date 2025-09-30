<template>
  <GrowingEntryStyle class="gdg-growing-entry">
    <ShadowBox :class="className">{{ useText + '\n' }}</ShadowBox>
    <InputBox
      :class="(className ?? '') + ' gdg-input'"
      :id="inputID"
      ref="inputRef"
      :value="useText"
      :placeholder="placeholder"
      dir="auto"
      @keydown="onKeyDownInner"
      @input="handleInput"
      v-bind="restProps"
    />
  </GrowingEntryStyle>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated, computed } from 'vue';
import { GrowingEntryStyle, ShadowBox, InputBox } from './growing-entry-style.js';
import { assert } from '../../common/support.js';
import type { SelectionRange } from '../data-grid/data-grid-types.js';

interface Props {
  placeholder?: string;
  highlight: boolean;
  altNewline?: boolean;
  validatedSelection?: SelectionRange;
  value?: string;
  onChange?: (event: Event) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

const props = defineProps<Props>();

const inputRef = ref<HTMLTextAreaElement | null>(null);

let globalInputID = 0;
const inputID = ref(`input-box-${(globalInputID = (globalInputID + 1) % 10_000_000)}`);

const useText = computed(() => props.value ?? "");

assert(props.onChange !== undefined, "GrowingEntry must be a controlled input area");

onMounted(() => {
  const ta = inputRef.value;
  if (ta === null) return;

  if (ta.disabled) return;
  const length = useText.value.toString().length;
  ta.focus();
  ta.setSelectionRange(props.highlight ? 0 : length, length);
});

onUpdated(() => {
  if (props.validatedSelection !== undefined) {
    const range = typeof props.validatedSelection === "number" ? [props.validatedSelection, null] : props.validatedSelection;
    inputRef.value?.setSelectionRange(range[0], range[1]);
  }
});

const onKeyDownInner = (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.shiftKey && props.altNewline === true) {
    return;
  }
  props.onKeyDown?.(e);
};

const handleInput = (e: Event) => {
  props.onChange?.(e);
};

// Extract rest props
const restProps = computed(() => {
  const { placeholder, value, onKeyDown, highlight, altNewline, validatedSelection, onChange, className, ...rest } = props;
  return rest;
});
</script>
