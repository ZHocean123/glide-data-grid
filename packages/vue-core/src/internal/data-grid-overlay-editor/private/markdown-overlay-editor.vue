<template>
  <div class="MarkdownOverlayEditorStyle">
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
      <div v-if="!readonly" class="gdg-spacer" />
      <div
        v-if="!readonly"
        :class="`gdg-edit-icon gdg-edit-hover ${addLeftPad}`"
        @click="onEditClick"
      >
        <EditPencil />
      </div>
      <textarea class="gdg-md-edit-textarea gdg-input" autofocus />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import MarkdownDiv from '../../markdown-div/markdown-div.vue';
import GrowingEntry from '../../growing-entry/growing-entry.vue';
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

const targetWidth = computed(() => `${editMode.value ? props.targetRect.width - 20 : props.targetRect.width}px`);

const onEditClick = () => {
  editMode.value = !editMode.value;
};

const addLeftPad = computed(() => markdown.value ? "gdg-ml-6" : "");

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter") e.stopPropagation();
};
</script>
<style lang="scss">
.MarkdownOverlayEditorStyle {
    min-width: v-bind(targetWidth);
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;
    color: var(--gdg-text-dark);

    // ${GrowingEntryStyle} {
    //     flex-shrink: 1;
    //     min-width: 0;
    // }

    .gdg-spacer {
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

        > * {
            width: 16px;
            height: 16px;
        }
    }

    .gdg-edit-hover {
        :hover {
            background-color: var(--gdg-accent-light);
            transition: background-color 150ms;
        }
    }

    .gdg-checkmark-hover {
        :hover {
            color: #ffffff;
            background-color: var(--gdg-accent-color);
        }
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
}
</style>