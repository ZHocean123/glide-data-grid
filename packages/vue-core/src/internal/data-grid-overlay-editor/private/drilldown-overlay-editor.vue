<template>
  <DrilldownOverlayEditorStyle>
    <div
      v-for="(d, i) in drilldowns"
      :key="i"
      class="doe-bubble"
    >
      <img v-if="d.img !== undefined" :src="d.img" />
      <div>{{ d.text }}</div>
    </div>
  </DrilldownOverlayEditorStyle>
</template>

<script setup lang="ts">
import { styled } from '@linaria/vue';
import type { DrilldownCellData } from '../../data-grid/data-grid-types.js';

interface Props {
  readonly drilldowns: readonly DrilldownCellData[];
}

const props = defineProps<Props>();

const DrilldownOverlayEditorStyle = styled.div`
    display: flex;
    flex-wrap: wrap;

    .doe-bubble {
        display: flex;
        justify-content: center;
        align-items: center;

        padding: 0 8px;
        height: 24px;

        background-color: var(--gdg-bg-cell);
        color: var(--gdg-text-dark);
        margin: 2px;

        border-radius: var(--gdg-rounding-radius, 6px);

        box-shadow:
            0 0 1px rgba(62, 65, 86, 0.4),
            0 1px 3px rgba(62, 65, 86, 0.4);

        img {
            height: 16px;
            object-fit: contain;

            margin-right: 4px;
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
`;
</script>
