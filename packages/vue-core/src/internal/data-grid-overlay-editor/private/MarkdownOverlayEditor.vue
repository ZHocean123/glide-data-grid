<template>
  <div v-if="editMode" class="markdown-overlay-editor" :style="{ minWidth: `${targetWidth - 20}px` }">
    <GrowingEntry
      ref="growingEntryRef"
      :model-value="markdown"
      :highlight="false"
      :validated-selection="validatedSelection"
      @update:model-value="onChange"
      @keydown="onKeyDown"
    />
    <div :class="['gdg-edit-icon', 'gdg-checkmark-hover', addLeftPad]" @click="onFinish">
      <Checkmark />
    </div>
  </div>
  <div v-else class="markdown-overlay-editor" :style="{ minWidth: `${targetWidth}px` }">
    <div class="markdown-content" v-html="renderedMarkdown" />
    <template v-if="!readonly">
      <div class="spacer" />
      <div :class="['gdg-edit-icon', 'gdg-edit-hover', addLeftPad]" @click="onEditClick">
        <EditPencil />
      </div>
    </template>
    <textarea class="gdg-md-edit-textarea gdg-input" ref="textareaRef" autofocus />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import GrowingEntry from "./GrowingEntry.vue";
import type { MarkdownCell, Rectangle, SelectionRange } from "../../data-grid/data-grid-types";

// 简化的编辑铅笔图标组件
const EditPencil = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`
};

// 简化的勾选图标组件
const Checkmark = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

interface Props {
  readonly targetRect: Rectangle;
  readonly value: MarkdownCell;
  readonly forceEditMode: boolean;
  readonly validatedSelection?: SelectionRange;
  readonly createNode?: (content: string) => DocumentFragment;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  change: [event: { target: { value: string } }];
  finish: [newValue?: MarkdownCell];
}>();

const editMode = ref(props.value.data === "" || props.forceEditMode);
const growingEntryRef = ref<InstanceType<typeof GrowingEntry>>();
const textareaRef = ref<HTMLTextAreaElement>();

const markdown = computed(() => props.value.data);
const readonly = computed(() => props.value.readonly === true);
const targetWidth = computed(() => props.targetRect.width);
const addLeftPad = computed(() => markdown.value ? "gdg-ml-6" : "");

// 简化的Markdown渲染
const renderedMarkdown = computed(() => {
  // 这里应该使用真正的Markdown解析器，现在只是简单的文本显示
  return markdown.value.replace(/\n/g, "<br>");
});

const onEditClick = () => {
  editMode.value = !editMode.value;
};

const onChange = (value: string) => {
  emit("change", { target: { value } });
};

const onFinish = () => {
  emit("finish", props.value);
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.stopPropagation();
  }
};

onMounted(() => {
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
});
</script>

<style scoped>
.markdown-overlay-editor {
  min-width: 100%;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  color: var(--gdg-text-dark);
}

.markdown-content {
  flex-shrink: 1;
  min-width: 0;
  line-height: 1.5;
}

.spacer {
  flex: 1;
}

.gdg-edit-icon {
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--gdg-accent-color);
  padding: 0;
  height: 24px;
  width: 24px;
  flex-shrink: 0;
  transition: all "0.125s ease";
  border-radius: 6px;
  background: none;
  border: none;
}

.gdg-edit-icon > * {
  width: 16px;
  height: 16px;
}

.gdg-edit-hover:hover {
  background-color: var(--gdg-accent-light);
  transition: background-color 150ms;
}

.gdg-checkmark-hover:hover {
  color: #ffffff;
  background-color: var(--gdg-accent-color);
}

.gdg-md-edit-textarea {
  position: relative;
  top: 0px;
  left: 0px;
  width: 0px;
  height: 0px;
  margin-top: 25px;
  opacity: 0;
  padding: 0;
}

.gdg-ml-6 {
  margin-left: 6px;
}
</style>