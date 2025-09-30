<template>
  <MarkdownOverlayEditorStyle :targetWidth="editMode ? targetRect.width - 20 : targetRect.width">
    <template v-if="editMode">
      <GrowingEntry
        autoFocus
        :highlight="false"
        :validatedSelection="validatedSelection"
        :value="markdown"
        @keydown="onKeyDown"
        @change="onChange"
      />
      <div
        :class="`gdg-edit-icon gdg-checkmark-hover ${addLeftPad}`"
        @click="onFinish(value)"
      >
        <Checkmark />
      </div>
    </template>
    <template v-else>
      <MarkdownDiv :contents="markdown" :createNode="createNode" />
      <div v-if="!readonly" class="spacer" />
      <div
        v-if="!readonly"
        :class="`gdg-edit-icon gdg-edit-hover ${addLeftPad}`"
        @click="onEditClick"
      >
        <EditPencil />
      </div>
      <textarea class="gdg-md-edit-textarea gdg-input" autofocus />
    </template>
  </MarkdownOverlayEditorStyle>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import MarkdownDiv from '../../markdown-div/markdown-div.vue';
import { GrowingEntry } from '../../growing-entry/growing-entry.vue';
import { MarkdownOverlayEditorStyle } from './markdown-overlay-editor-style.js';
import { EditPencil, Checkmark } from '../../../common/utils.js';
import type { MarkdownCell, Rectangle, SelectionRange } from '../../data-grid/data-grid-types.js';

interface Props {
  readonly targetRect: Rectangle;
  readonly onChange: (ev: Event) => void;
  readonly forceEditMode: boolean;
  readonly onFinish: (newValue?: MarkdownCell | undefined) => void;
  readonly validatedSelection?: SelectionRange;
  readonly value: MarkdownCell;
  readonly createNode?: (content: string) => DocumentFragment;
}

const props = defineProps<Props>();

const markdown = computed(() => props.value.data);
const readonly = computed(() => props.value.readonly === true);

const editMode = ref(markdown.value === "" || props.forceEditMode);

const onEditClick = () => {
  editMode.value = !editMode.value;
};

const addLeftPad = computed(() => markdown.value ? "gdg-ml-6" : "");

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter") e.stopPropagation();
};
</script>
