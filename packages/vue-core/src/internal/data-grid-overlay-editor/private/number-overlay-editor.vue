<template>
  <NumberOverlayEditorStyle>
    <VueNumberFormat
      autoFocus
      :getInputRef="inputRef"
      class="gdg-input"
      @focus="onFocus"
      :disabled="disabled === true"
      :decimalScale="fixedDecimals"
      :allowNegative="allowNegative"
      :thousandSeparator="thousandSeparator ?? getThousandSeparator()"
      :decimalSeparator="decimalSeparator ?? getDecimalSeparator()"
      :value="Object.is(value, -0) ? '-' : value ?? ''"
      @valueChange="onChange"
    />
  </NumberOverlayEditorStyle>
</template>

<script setup lang="ts">
import { ref, onUpdated } from 'vue';
import NumberOverlayEditorStyle from './number-overlay-editor-style.vue';
import { VueNumberFormat } from 'vue-number-format';
import type { SelectionRange } from '../../data-grid/data-grid-types.js';
import type { NumberFormatValues } from 'vue-number-format/types/types.js';

interface Props {
  readonly value: number | undefined;
  readonly disabled?: boolean;
  readonly onChange: (values: NumberFormatValues) => void;
  readonly highlight: boolean;
  readonly validatedSelection?: SelectionRange;
  readonly fixedDecimals?: number;
  readonly allowNegative?: boolean;
  readonly thousandSeparator?: boolean | string;
  readonly decimalSeparator?: string;
}

const props = defineProps<Props>();

const inputRef = ref<HTMLInputElement>();

function getDecimalSeparator() {
  const numberWithDecimalSeparator = 1.1;
  const result = Intl.NumberFormat()
    ?.formatToParts(numberWithDecimalSeparator)
    ?.find(part => part.type === "decimal")?.value;

  return result ?? ".";
}

function getThousandSeparator() {
  return getDecimalSeparator() === "." ? "," : ".";
}

onUpdated(() => {
  if (props.validatedSelection !== undefined) {
    const range = typeof props.validatedSelection === "number" ? [props.validatedSelection, null] : props.validatedSelection;
    inputRef.value?.setSelectionRange(range[0], range[1]);
  }
});

const onFocus = (e: Event) => {
  const target = e.target as HTMLInputElement;
  target.setSelectionRange(props.highlight ? 0 : target.value.length, target.value.length);
};
</script>
