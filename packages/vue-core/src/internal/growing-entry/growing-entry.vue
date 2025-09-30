<template>
  <div class="gdg-growing-entry">
    <div class="shadow-box" :class="className">{{ useText + '\n' }}</div>
    <textarea
      class="input-box gdg-input"
      :class="className"
      :id="inputID"
      ref="inputRef"
      :value="useText"
      :placeholder="placeholder"
      dir="auto"
      @keydown="onKeyDownInner"
      @input="handleInput"
      v-bind="restProps"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated, computed } from 'vue';
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
<style lang="scss">
.gdg-growing-entry {
  position: relative;
    margin-top: 6px;


.shadow-box {
  visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;

    width: max-content;
    max-width: 100%;

    min-width: 100%;

    font-size: var(--gdg-editor-font-size);
    line-height: 16px;
    font-family: var(--gdg-font-family);
    color: var(--gdg-text-dark);
    padding: 0;
    margin: 0;

    padding-bottom: 2px;
}
.input-box {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;

    border-radius: 0px;

    resize: none;
    white-space: pre-wrap;
    min-width: 100%;
    overflow: hidden;
    border: 0;
    background-color: transparent;

    ::placeholder {
        color: var(--gdg-text-light);
    }

    font-size: var(--gdg-editor-font-size);
    line-height: 16px;
    font-family: var(--gdg-font-family);
    -webkit-text-fill-color: var(--gdg-text-dark);
    color: var(--gdg-text-dark);
    padding: 0;
    margin: 0;

    .gdg-invalid & {
        text-decoration: underline;
        text-decoration-color: #d60606;
    }
}
}
</style>
