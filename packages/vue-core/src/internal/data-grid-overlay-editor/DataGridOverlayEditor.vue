<template>
  <teleport :to="portalElement">
    <div :style="themeStyle" :class="className">
      <ClickOutsideContainer
        :onClickOutside="onClickOutside"
        :isOutsideClick="isOutsideClick"
        :customEventTarget="customEventTarget"
      >
        <DataGridOverlayEditorStyle
          :ref="(el) => setOverlayRef(el as HTMLElement)"
          :id="id"
          :class="classList"
          :style="styleOverride"
          :as="useLabel ? 'label' : undefined"
          :targetX="target.x - bloomX"
          :targetY="target.y - bloomY"
          :targetWidth="target.width + bloomX * 2"
          :targetHeight="target.height + bloomY * 2"
        >
          <div class="gdg-clip-region" @keydown="onKeyDown">
            <component
              :is="editorComponent"
              v-if="editorComponent"
              :portalElementRef="portalElementRef"
              :isHighlighted="highlight"
              :activation="activation"
              :onChange="setTempValue"
              :value="targetValue"
              :initialValue="initialValue"
              :onFinishedEditing="onEditorFinished"
              :validatedSelection="validatedSelection"
              :forceEditMode="forceEditMode"
              :target="target"
              :imageEditorOverride="imageEditorOverride"
              :markdownDivCreateNode="markdownDivCreateNode"
              :isValid="isValid"
              :theme="theme"
            />
          </div>
        </DataGridOverlayEditorStyle>
      </ClickOutsideContainer>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Component } from "vue";
import { createApp } from "vue";
import { makeCSSStyle, type Theme } from "../../common/styles";
import type { GetCellRendererCallback } from "../../cells/cell-types";
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
} from "../data-grid/data-grid-types";
import type { CellActivatedEventArgs } from "../data-grid/event-args";
import DataGridOverlayEditorStyle from "./DataGridOverlayEditorStyle.vue";
import { useStayOnScreen } from "./use-stay-on-screen";

// Placeholder for ClickOutsideContainer - this would need to be created separately
const ClickOutsideContainer = {
  template: `<div><slot /></div>`,
  props: {
    onClickOutside: Function,
    isOutsideClick: Function,
    customEventTarget: [HTMLElement, Window, Document]
  }
};

interface Props {
  target: Rectangle;
  cell: Item;
  content: GridCell;
  className?: string;
  id: string;
  initialValue?: string;
  bloom?: readonly [number, number];
  theme: Theme;
  onFinishEditing: (newCell: GridCell | undefined, movement: readonly [-1 | 0 | 1, -1 | 0 | 1]) => void;
  forceEditMode: boolean;
  highlight: boolean;
  portalElementRef?: { current: HTMLElement | null };
  imageEditorOverride?: Component;
  getCellRenderer: GetCellRendererCallback;
  markdownDivCreateNode?: (content: string) => DocumentFragment;
  provideEditor?: ProvideEditorCallback<GridCell>;
  activation: CellActivatedEventArgs;
  validateCell?: (
    cell: Item,
    newValue: EditableGridCell,
    prevValue: GridCell
  ) => boolean | ValidatedGridCell;
  isOutsideClick?: (e: MouseEvent | TouchEvent) => boolean;
  customEventTarget?: HTMLElement | Window | Document;
}

const props = defineProps<Props>();

const tempValue = ref<GridCell | undefined>(props.forceEditMode ? props.content : undefined);
const lastValueRef = ref(tempValue.value ?? props.content);
const isValid = ref(true);
if (props.validateCell !== undefined) {
  isValid.value = !(isEditableGridCell(props.content) && props.validateCell?.(props.cell, props.content, lastValueRef.value) === false);
}

const finished = ref(false);
const customMotion = ref<[-1 | 0 | 1, -1 | 0 | 1] | undefined>(undefined);
const overlayRef = ref<HTMLElement | null>(null);
const stayOnScreenStyle = ref<Record<string, any>>({});

// Initialize useStayOnScreen
const targetLocation = ref<"center" | "below" | "above" | undefined>(undefined);
const containerRect = ref<Rectangle>({
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: window.innerHeight
});

const getIdealBounds = () => {
  return {
    x: props.target.x,
    y: props.target.y,
    width: props.target.width,
    height: props.target.height
  };
};

const updateBounds = (bounds: Partial<Rectangle>) => {
  stayOnScreenStyle.value = {
    position: "absolute",
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`
  };
};

// Set up useStayOnScreen with proper parameters
const cleanup = useStayOnScreen(
  overlayRef,
  containerRect,
  computed(() => props.target),
  targetLocation,
  getIdealBounds,
  updateBounds
);

const setOverlayRef = (el: HTMLElement | null) => {
  overlayRef.value = el;
};

const themeStyle = computed(() => makeCSSStyle(props.theme));

const classList = computed(() => {
  let classWrap = style.value ? "gdg-style" : "gdg-unstyle";
  if (!isValid.value) {
    classWrap += " gdg-invalid";
  }
  if (pad.value) {
    classWrap += " gdg-pad";
  }
  return classWrap;
});

const validatedSelection = computed(() => {
  const cell = targetValue.value as any;
  return isEditableGridCell(targetValue.value) ? cell.selectionRange : undefined;
});

const targetValue = computed(() => tempValue.value ?? props.content);

const editorProvider = computed(() => {
  if (isInnerOnlyCell(props.content)) return undefined;
  const cellWithLocation = { ...props.content, location: props.cell, activation: props.activation } as GridCell & {
    location: Item;
    activation: CellActivatedEventArgs;
  };
  const external = props.provideEditor?.(cellWithLocation);
  if (external !== undefined) return external;
  return props.getCellRenderer(props.content)?.provideEditor?.(cellWithLocation);
});

const useLabel = computed(() => false);

const pad = computed(() => {
  const provider = editorProvider.value;
  return provider !== undefined && provider.disablePadding !== true;
});

const style = computed(() => {
  const provider = editorProvider.value as any;
  return provider !== undefined && provider.disableStyling !== true;
});

let editorComponent: Component | undefined;
let styleOverride: Record<string, any> = {};

const provider = editorProvider.value;
if (provider !== undefined) {
  const isObjectEditor = isObjectEditorCallbackResult(provider);
  if (isObjectEditor) {
    styleOverride = provider.styleOverride || {};
  }
  editorComponent = isObjectEditor ? provider.editor : provider as Component;
}

styleOverride = { ...styleOverride, ...stayOnScreenStyle.value };

const portalElement = computed(() => {
  return props.portalElementRef?.current ?? document.getElementById("portal");
});

const bloomX = computed(() => props.bloom?.[0] ?? 1);
const bloomY = computed(() => props.bloom?.[1] ?? 1);

const onClickOutside = () => {
  props.onFinishEditing(tempValue.value, [0, 0]);
  finished.value = true;
};

const onEditorFinished = (newValue: GridCell | undefined, movement?: readonly [-1 | 0 | 1, -1 | 0 | 1]) => {
  props.onFinishEditing(newValue, movement ?? customMotion.value ?? [0, 0]);
  finished.value = true;
};

const onKeyDown = (event: KeyboardEvent) => {
  let save = false;
  if (event.key === "Escape") {
    event.stopPropagation();
    event.preventDefault();
    customMotion.value = [0, 0];
  } else if (
    event.key === "Enter" &&
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
      props.onFinishEditing(save ? tempValue.value : undefined, customMotion.value);
      finished.value = true;
    }
  }, 0);
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

watch(() => props.content, (newContent) => {
  lastValueRef.value = tempValue.value ?? newContent;
});

onUnmounted(() => {
  cleanup?.();
});
</script>