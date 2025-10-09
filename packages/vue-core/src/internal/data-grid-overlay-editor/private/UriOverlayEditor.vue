<template>
  <div v-if="editMode" class="uri-overlay-editor">
    <GrowingEntry
      ref="growingEntryRef"
      :model-value="uri"
      :highlight="true"
      :validated-selection="validatedSelection"
      @update:model-value="onChange"
    />
  </div>
  <div v-else class="uri-overlay-editor">
    <a
      :href="uri"
      class="gdg-link-area"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ preview }}
    </a>
    <div
      v-if="!readonly"
      class="gdg-edit-icon"
      @click="onEditClick"
    >
      <EditPencil />
    </div>
    <textarea class="gdg-input" ref="textareaRef" autofocus />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import GrowingEntry from "./GrowingEntry.vue";
import type { SelectionRange } from "../../data-grid/data-grid-types";

// 简化的编辑铅笔图标组件
const EditPencil = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`
};

interface Props {
  readonly uri: string;
  readonly readonly: boolean;
  readonly preview: string;
  readonly forceEditMode: boolean;
  readonly validatedSelection?: SelectionRange;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  forceEditMode: false,
});

const emit = defineEmits<{
  change: [event: { target: { value: string } }];
}>();

const editMode = ref(!props.readonly && (props.uri === "" || props.forceEditMode));
const growingEntryRef = ref<InstanceType<typeof GrowingEntry>>();
const textareaRef = ref<HTMLTextAreaElement>();

const onEditClick = () => {
  editMode.value = true;
};

const onChange = (value: string) => {
  emit("change", { target: { value } });
};

onMounted(() => {
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
});
</script>

<style scoped>
.uri-overlay-editor {
  display: flex;
  flex-grow: 1;
  align-items: center;
  min-height: 21px;
}

.gdg-link-area {
  flex-grow: 1;
  flex-shrink: 1;
  cursor: pointer;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gdg-link-color);
  text-decoration: underline !important;
}

.gdg-edit-icon {
  flex-shrink: 0;
  width: 32px;
  color: var(--gdg-accent-color);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
}

.gdg-edit-icon > * {
  width: 24px;
  height: 24px;
}

textarea {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 0px;
  height: 0px;
  opacity: 0;
}
</style>