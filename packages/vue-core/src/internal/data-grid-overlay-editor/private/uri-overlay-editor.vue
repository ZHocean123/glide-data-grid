<template>
  <GrowingEntry
    v-if="editMode"
    :validatedSelection="validatedSelection"
    :highlight="true"
    autoFocus
    :value="uri"
    @change="onChange"
  />
  <UriOverlayEditorStyle v-else>
    <a class="gdg-link-area" :href="uri" target="_blank" rel="noopener noreferrer">
      {{ preview }}
    </a>
    <div
      v-if="!readonly"
      class="gdg-edit-icon"
      @click="onEditClick"
    >
      <EditPencil />
    </div>
    <textarea class="gdg-input" autofocus />
  </UriOverlayEditorStyle>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EditPencil } from '../../../common/utils.js';
import { GrowingEntry } from '../../growing-entry/growing-entry.vue';
import { UriOverlayEditorStyle } from './uri-overlay-editor-style.js';
import type { SelectionRange } from '../../data-grid/data-grid-types.js';

interface Props {
  readonly uri: string;
  readonly onChange: (ev: Event) => void;
  readonly forceEditMode: boolean;
  readonly readonly: boolean;
  readonly preview: string;
  readonly validatedSelection?: SelectionRange;
}

const props = defineProps<Props>();

const editMode = ref(!props.readonly && (props.uri === "" || props.forceEditMode));

const onEditClick = () => {
  editMode.value = true;
};
</script>
