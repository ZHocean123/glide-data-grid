<template>
  <div class="number-overlay-editor">
    <input
      ref="inputRef"
      v-model="displayValue"
      type="text"
      class="gdg-input"
      :disabled="disabled"
      @focus="onFocus"
      @input="onInput"
      @keydown="onKeyDown"
      @blur="onBlur"
      autofocus
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { SelectionRange } from "../../data-grid/data-grid-types";

interface NumberFormatValues {
  floatValue?: number;
  formattedValue: string;
  value: string;
}

interface Props {
  readonly value: number | undefined;
  readonly disabled?: boolean;
  readonly highlight: boolean;
  readonly validatedSelection?: SelectionRange;
  readonly fixedDecimals?: number;
  readonly allowNegative?: boolean;
  readonly thousandSeparator?: boolean | string;
  readonly decimalSeparator?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  highlight: false,
  allowNegative: true,
  thousandSeparator: undefined,
  decimalSeparator: undefined,
});

const emit = defineEmits<{
  change: [values: NumberFormatValues];
}>();

const inputRef = ref<HTMLInputElement>();
const displayValue = ref("");

// 获取本地化的数字分隔符
const getDecimalSeparator = (): string => {
  if (props.decimalSeparator !== undefined) return props.decimalSeparator;
  
  const numberWithDecimalSeparator = 1.1;
  const result = Intl.NumberFormat()
    ?.formatToParts(numberWithDecimalSeparator)
    ?.find(part => part.type === "decimal")?.value;

  return result ?? ".";
};

const getThousandSeparator = (): string => {
  if (props.thousandSeparator !== undefined) {
    return typeof props.thousandSeparator === "string" ? props.thousandSeparator : ",";
  }
  return getDecimalSeparator() === "." ? "," : ".";
};

// 格式化数字显示
const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return "";
  
  // 处理-0的特殊情况
  if (Object.is(num, -0)) return "-";
  
  const decimalSep = getDecimalSeparator();
  const thousandSep = getThousandSeparator();
  
  let options: Intl.NumberFormatOptions = {
    useGrouping: props.thousandSeparator !== false,
  };
  
  if (props.fixedDecimals !== undefined) {
    options.minimumFractionDigits = props.fixedDecimals;
    options.maximumFractionDigits = props.fixedDecimals;
  }
  
  const formatter = new Intl.NumberFormat(undefined, options);
  let formatted = formatter.format(num);
  
  // 替换分隔符
  if (decimalSep !== ".") {
    formatted = formatted.replace(".", decimalSep);
  }
  
  return formatted;
};

// 解析输入的数字
const parseNumber = (input: string): number | undefined => {
  if (!input || input === "-") return undefined;
  
  const decimalSep = getDecimalSeparator();
  const thousandSep = getThousandSeparator();
  
  // 移除千位分隔符
  let cleanInput = input.replace(new RegExp(`\\${thousandSep}`, "g"), "");
  
  // 替换小数分隔符为标准的小数点
  if (decimalSep !== ".") {
    cleanInput = cleanInput.replace(new RegExp(`\\${decimalSep}`, "g"), ".");
  }
  
  const parsed = parseFloat(cleanInput);
  return isNaN(parsed) ? undefined : parsed;
};

// 处理输入变化
const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const inputValue = target.value;
  const floatValue = parseNumber(inputValue);
  
  emit("change", {
    floatValue,
    formattedValue: inputValue,
    value: inputValue,
  });
};

const onFocus = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement;
  if (props.highlight) {
    target.select();
  } else {
    // 将光标移动到末尾
    target.setSelectionRange(target.value.length, target.value.length);
  }
};

const onKeyDown = (event: KeyboardEvent) => {
  // 可以在这里添加特殊的键盘处理
};

const onBlur = (event: FocusEvent) => {
  // 可以在这里添加失焦处理
};

// 设置选择范围
const setSelectionRange = (range: SelectionRange) => {
  if (inputRef.value) {
    const [start, end] = typeof range === "number" ? [range, null] : range;
    inputRef.value.setSelectionRange(start, end ?? start);
  }
};

// 监听props.value变化，更新显示值
watch(() => props.value, (newValue) => {
  displayValue.value = formatNumber(newValue);
}, { immediate: true });

// 监听选择范围变化
watch(() => props.validatedSelection, (newRange) => {
  if (newRange !== undefined) {
    setSelectionRange(newRange);
  }
});

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus();
    
    // 设置初始选择范围
    if (props.validatedSelection !== undefined) {
      setSelectionRange(props.validatedSelection);
    } else if (props.highlight) {
      inputRef.value.select();
    }
  }
});

// 暴露方法给父组件
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  setSelectionRange,
});
</script>

<style scoped>
.number-overlay-editor {
  display: flex;
  margin: 6px 0 3px;
  color: var(--gdg-text-dark);
}

.gdg-input {
  font-size: var(--gdg-editor-font-size);
  padding: 0;
  font-family: var(--gdg-font-family);
  color: var(--gdg-text-dark);
  background-color: var(--gdg-bg-cell);
  border: none;
  outline: none;
  width: 100%;
}
</style>