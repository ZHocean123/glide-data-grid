<template>
  <Teleport :to="portalElement">
    <ThemeContext.Provider :value="theme">
      <ClickOutsideContainer
        :style="makeCSSStyle(theme)"
        :class="className"
        @click-outside="onClickOutside"
        :isOutsideClick="isOutsideClick"
        :customEventTarget="customEventTarget"
      >
        <div class="DataGridOverlayEditorStyle"
          ref="editorRef"
          :id="id"
          :class="classWrap"
          :style="styleOverride"
          :as="useLabel === true ? 'label' : undefined"
          :targetX="target.x - bloomX"
          :targetY="target.y - bloomY"
          :targetWidth="target.width + bloomX * 2"
          :targetHeight="target.height + bloomY * 2"
        >
          <div class="gdg-clip-region" @keydown="onKeyDown">
            <component
              v-if="editorProvider"
              :is="editorComponent"
              :portalElementRef="portalElementRef"
              :isHighlighted="highlight"
              :activation="activation"
              :onChange="setTempValue"
              :value="targetValue"
              :initialValue="initialValue"
              :onFinishedEditing="onEditorFinished"
              :validatedSelection="isEditableGridCell(targetValue) ? targetValue.selectionRange : undefined"
              :forceEditMode="forceEditMode"
              :target="target"
              :imageEditorOverride="imageEditorOverride"
              :markdownDivCreateNode="markdownDivCreateNode"
              :isValid="isValid"
              :theme="theme"
            />
          </div>
        </div>
      </ClickOutsideContainer>
    </ThemeContext.Provider>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Teleport } from 'vue';
import ClickOutsideContainer from '../click-outside-container/click-outside-container.vue';
import { makeCSSStyle, type Theme, ThemeContext } from '../../common/styles.js';
import type { GetCellRendererCallback } from '../../cells/cell-types.js';
import {
    type EditableGridCell,
    type GridCell,
    isEditableGridCell,
    isInnerOnlyCell,
    isObjectEditorCallbackResult,
    type Item,
    type ProvideEditorCallback,
    type ProvideEditorCallbackResult,
    type Rectangle,
    type ValidatedGridCell,
} from '../data-grid/data-grid-types.js';

import type { CellActivatedEventArgs } from '../data-grid/event-args.js';
import { useStayOnScreen } from './use-stay-on-screen.js';

type ImageEditorType = any;

interface DataGridOverlayEditorProps {
    readonly target: Rectangle;
    readonly cell: Item;
    readonly content: GridCell;
    readonly className?: string;
    readonly id: string;
    readonly initialValue?: string;
    readonly bloom?: readonly [number, number];
    readonly theme: Theme;
    readonly onFinishEditing: (newCell: GridCell | undefined, movement: readonly [-1 | 0 | 1, -1 | 0 | 1]) => void;
    readonly forceEditMode: boolean;
    readonly highlight: boolean;
    readonly portalElementRef?: { value: HTMLElement | null };
    readonly imageEditorOverride?: ImageEditorType;
    readonly getCellRenderer: GetCellRendererCallback;
    readonly markdownDivCreateNode?: (content: string) => DocumentFragment;
    readonly provideEditor?: ProvideEditorCallback<GridCell>;
    readonly activation: CellActivatedEventArgs;
    readonly validateCell?: (
        cell: Item,
        newValue: EditableGridCell,
        prevValue: GridCell
    ) => boolean | ValidatedGridCell;
    readonly isOutsideClick?: (e: MouseEvent | TouchEvent) => boolean;
    readonly customEventTarget?: HTMLElement | Window | Document;
}

const props = defineProps<DataGridOverlayEditorProps>();

const tempValue = ref<GridCell | undefined>(props.forceEditMode ? props.content : undefined);
const lastValueRef = ref(tempValue.value ?? props.content);

const isValid = ref<boolean>((() => {
  if (props.validateCell === undefined) return true;
  return !(isEditableGridCell(props.content) && props.validateCell?.(props.cell, props.content, lastValueRef.value) === false);
})());

const finished = ref(false);
const customMotion = ref<[-1 | 0 | 1, -1 | 0 | 1] | undefined>(undefined);
const editorRef = ref();

const { style: stayOnScreenStyle } = useStayOnScreen(editorRef);

const targetValue = computed(() => tempValue.value ?? props.content);

const editorProviderParams = computed((): [ProvideEditorCallbackResult<GridCell>, boolean] | [] => {
  if (isInnerOnlyCell(props.content)) return [];
  const cellWithLocation = { ...props.content, location: props.cell, activation: props.activation } as GridCell & {
      location: Item;
      activation: CellActivatedEventArgs;
  };
  const external = props.provideEditor?.(cellWithLocation);
  if (external !== undefined) return [external, false];
  return [props.getCellRenderer(props.content)?.provideEditor?.(cellWithLocation), false];
});

const editorProvider = computed(()=> editorProviderParams.value[0]);
const useLabel = computed(()=> editorProviderParams.value[1]);

const editorComponent = computed(() => {
  if (!editorProvider.value) return null;
  const isObjectEditor = isObjectEditorCallbackResult(editorProvider.value);
  return isObjectEditor ? editorProvider.value.editor : editorProvider.value;
});

const pad = computed(() => editorProvider.value?.disablePadding !== true);
const style = computed(() => editorProvider.value?.disableStyling !== true);

const styleOverride = computed(() => {
  const baseStyle = editorProvider.value && isObjectEditorCallbackResult(editorProvider.value)
    ? editorProvider.value.styleOverride
    : {};
  return { ...baseStyle, ...stayOnScreenStyle.value };
});

const classWrap = computed(() => {
  let result = style.value ? "gdg-style" : "gdg-unstyle";
  if (!isValid.value) {
      result += " gdg-invalid";
  }
  if (pad.value) {
      result += " gdg-pad";
  }
  return result;
});

const bloomX = computed(() => props.bloom?.[0] ?? 1);
const bloomY = computed(() => props.bloom?.[1] ?? 1);

const portalElement = computed(() => {
  return props.portalElementRef?.value ?? document.getElementById("portal");
});

const onFinishEditing = (newCell: GridCell | undefined, movement: readonly [-1 | 0 | 1, -1 | 0 | 1]) => {
  props.onFinishEditing(isValid.value ? newCell : undefined, movement);
};

const setTempValue = (newVal: GridCell | undefined) => {
  if (props.validateCell !== undefined && newVal !== undefined && isEditableGridCell(newVal)) {
      const validResult = props.validateCell(props.cell, newVal, lastValueRef.value);
      if (validResult === false) {
          isValid.value = false;
      } else if (typeof validResult === "object") {
          newVal = validResult;
          isValid.value = true;
      } else {
          isValid.value = true;
      }
  }
  tempValue.value = newVal;
};

const onClickOutside = () => {
  onFinishEditing(tempValue.value, [0, 0]);
  finished.value = true;
};

const onEditorFinished = (newValue: GridCell | undefined, movement?: readonly [-1 | 0 | 1, -1 | 0 | 1]) => {
  onFinishEditing(newValue, movement ?? customMotion.value ?? [0, 0]);
  finished.value = true;
};

const onKeyDown = async (event: KeyboardEvent) => {
  let save = false;
  if (event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      customMotion.value = [0, 0];
  } else if (
      event.key === "Enter" &&
      // The shift key is reserved for multi-line editing
      // to allow inserting new lines without closing the editor.
      !event.shiftKey
  ) {
      event.stopPropagation();
      event.preventDefault();
      customMotion.value = [0, 1];
      save = true;
  } else if (event.key === "Tab") {
      event.stopPropagation();
      event.preventDefault();
      customMotion.value = [event.shiftKey ? -1 : 1, 0];
      save = true;
  }

  window.setTimeout(() => {
      if (!finished.value && customMotion.value !== undefined) {
          onFinishEditing(save ? tempValue.value : undefined, customMotion.value);
          finished.value = true;
      }
  }, 0);
};

onMounted(() => {
  if (portalElement.value === null) {
      console.error(
          'Cannot open Data Grid overlay editor, because portal not found. Please, either provide a portalElementRef or add `<div id="portal" />` as the last child of your `<body>`.'
      );
  }
});

const targetX = computed(() => `${props.target.x - bloomX.value}px`);
const targetY = computed(() => `${props.target.y - bloomY.value}px`);
const targetWidth = computed(() => `${props.target.width + bloomX.value * 2}px`);
const targetHeight = computed(() => `${props.target.height + bloomY.value * 2}px`);
const paddingTop = computed(() => `${Math.max(0, (props.target.height - 28) / 2)}px`);
const maxHeight = computed(() => `calc(100vh - ${targetY.value}px)`);
</script>
<style lang="scss" scoped>
.DataGridOverlayEditorStyle {
   position: absolute;

    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;

    --overlay-top: ${p => p.targetY}px;

    left: v-bind(targetX);
    top: v-bind(targetY);
    min-width: v-bind(targetWidth);
    min-height: v-bind(targetHeight);
    width: max-content;
    max-width: 400px;
    max-height: v-bind(maxHeight);

    font-family: var(--gdg-font-family);
    font-size: var(--gdg-editor-font-size);

    @keyframes glide_fade_in {
        from {
            opacity: 0%;
        }

        to {
            opacity: 100%;
        }
    }

    &.gdg-style {
        border-radius: 2px;
        background-color: var(--gdg-bg-cell);

        box-shadow:
            0 0 0 1px var(--gdg-accent-color),
            0px 0px 1px rgba(62, 65, 86, 0.4),
            0px 6px 12px rgba(62, 65, 86, 0.15);

        animation: glide_fade_in 60ms 1;
    }

    &.gdg-pad {
        padding: v-bind(paddingTop) 8.5px 3px;
    }

    .gdg-clip-region {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 2px;
        flex-grow: 1;

        .gdg-growing-entry {
            height: 100%;
        }

        & input.gdg-input {
            width: 100%;
            border: none;
            border-width: 0;
            outline: none;
        }

        & textarea.gdg-input {
            border: none;
            border-width: 0;
            outline: none;
        }
    }

    text-align: start;
}
}