<template>
  <div class="ImageOverlayEditorStyle" v-if="filtered.length > 0" data-testid="GDG-default-image-overlay-editor">
    <Carousel
      :showArrows="allowMove"
      :showThumbs="false"
      :swipeable="allowMove"
      :emulateTouch="allowMove"
      :infiniteLoop="allowMove"
    >
      <Slide
        v-for="url in filtered"
        :key="url"
        class="gdg-centering-container"
      >
        <slot name="renderImage" :url="url">
          <img draggable="false" :src="url" />
        </slot>
      </Slide>
    </Carousel>
    <button
      v-if="canWrite && onEditClick"
      class="gdg-edit-icon"
      @click="onEditClick"
    >
      <EditPencil />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Carousel, Slide  } from 'vue3-carousel';
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
import 'vue3-carousel/carousel.css'
</script>
.ImageOverlayEditorStyle {
    display: flex;
    height: 100%;

    .gdg-centering-container {
        display: flex;
        justify-content: center;
        align-items: center;

        height: 100%;

        img,
        canvas {
            max-height: calc(100vh - var(--overlay-top) - 20px);
            object-fit: contain;
            user-select: none;
        }

        canvas {
            max-width: 380px;
        }
    }

    .gdg-edit-icon {
        position: absolute;
        top: 12px;
        right: 0;
        width: 48px;
        height: 48px;
        color: var(--gdg-accent-color);

        cursor: pointer;

        display: flex;
        justify-content: center;
        align-items: center;

        >* {
            width: 24px;
            height: 24px;
        }
    }

    textarea {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 0px;
        height: 0px;

        opacity: 0;
    }
}