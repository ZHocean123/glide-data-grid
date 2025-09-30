<template>
  <ImageOverlayEditorStyle v-if="filtered.length > 0" data-testid="GDG-default-image-overlay-editor">
    <Carousel
      :showArrows="allowMove"
      :showThumbs="false"
      :swipeable="allowMove"
      :emulateTouch="allowMove"
      :infiniteLoop="allowMove"
    >
      <div
        v-for="url in filtered"
        :key="url"
        class="gdg-centering-container"
      >
        <slot v-if="$slots.renderImage" :name="renderImage" :url="url" />
        <img v-else draggable="false" :src="url" />
      </div>
    </Carousel>
    <button
      v-if="canWrite && onEditClick"
      class="gdg-edit-icon"
      @click="onEditClick"
    >
      <EditPencil />
    </button>
  </ImageOverlayEditorStyle>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ImageOverlayEditorStyle } from './image-overlay-editor-style.js';
import { Carousel } from 'vue-responsive-carousel';
import { EditPencil } from '../../../common/utils.js';

/** @category Types */
export interface OverlayImageEditorProps {
  readonly urls: readonly string[];
  readonly canWrite: boolean;
  readonly onCancel: () => void;
  readonly onChange: (newImage: string) => void;
  readonly onEditClick?: () => void;
  readonly renderImage?: (url: string) => any;
}

const props = defineProps<OverlayImageEditorProps>();

const filtered = computed(() => props.urls.filter(u => u !== ""));
const allowMove = computed(() => filtered.value.length > 1);

// Import carousel styles
import 'vue-responsive-carousel/lib/carousel/carousel.css';
</script>
