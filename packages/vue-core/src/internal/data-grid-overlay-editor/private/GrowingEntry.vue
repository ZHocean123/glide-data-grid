<template>
  <div class="growing-entry">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :class="['gdg-input', { 'gdg-highlight': highlight }]"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="onInput"
      @keydown="onKeyDown"
      @focus="onFocus"
      @blur="onBlur"
      autofocus
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import type { SelectionRange } from "../../data-grid/data-grid-types";

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  highlight?: boolean;
  autoFocus?: boolean;
  validatedSelection?: SelectionRange;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  readonly: false,
  highlight: false,
  autoFocus: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const textareaRef = ref<HTMLTextAreaElement>();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  emit("input", event);
  
  // 自动调整高度
  adjustHeight();
};

const onKeyDown = (event: KeyboardEvent) => {
  emit("keydown", event);
};

const onFocus = (event: FocusEvent) => {
  emit("focus", event);
};

const onBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto";
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
};

const setSelectionRange = (range: SelectionRange) => {
  if (textareaRef.value) {
    const [start, end] = typeof range === "number" ? [range, null] : range;
    textareaRef.value.setSelectionRange(start, end ?? start);
  }
};

onMounted(() => {
  if (props.autoFocus && textareaRef.value) {
    textareaRef.value.focus();
  }
  
  // 设置初始选择范围
  if (props.validatedSelection !== undefined) {
    setSelectionRange(props.validatedSelection);
  }
  
  // 初始调整高度
  nextTick(() => {
    adjustHeight();
  });
});

// 监听值变化，调整高度
watch(() => props.modelValue, () => {
  nextTick(() => {
    adjustHeight();
  });
});

// 监听选择范围变化
watch(() => props.validatedSelection, (newRange) => {
  if (newRange !== undefined) {
    setSelectionRange(newRange);
  }
});

// 暴露方法给父组件
defineExpose({
  setSelectionRange,
  adjustHeight,
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
});
</script>

<style scoped>
.growing-entry {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.gdg-input {
  width: 100%;
  border: none;
  border-width: 0;
  outline: none;
  resize: none;
  min-height: 1.5em;
  font-family: var(--gdg-font-family);
  font-size: var(--gdg-editor-font-size);
  color: var(--gdg-text-dark);
  background-color: var(--gdg-bg-cell);
  line-height: 1.5;
  padding: 0;
  margin: 0;
}

.gdg-highlight {
  /* 高亮样式 */
}
</style>