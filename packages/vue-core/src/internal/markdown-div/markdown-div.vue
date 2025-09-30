<template>
  <MarkdownContainer ref="targetElementRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { marked } from 'marked';
import { MarkdownContainer } from './private/markdown-container.vue';

export interface MarkdownDivProps {
  contents: string;
  createNode?: (content: string) => DocumentFragment;
}

const props = defineProps<MarkdownDivProps>();

const targetElementRef = ref<HTMLElement | null>(null);

const renderMarkdownIntoDiv = () => {
  const targetElement = targetElementRef.value;
  if (targetElement === null) return;

  const { contents, createNode } = props;

  const innerHTML: string = (marked as any)(contents);

  const childRange = document.createRange();
  childRange.selectNodeContents(targetElement);
  childRange.deleteContents();

  let newChild: DocumentFragment | undefined = createNode?.(innerHTML);
  if (newChild === undefined) {
    const childDoc = document.createElement("template");
    childDoc.innerHTML = innerHTML;
    newChild = childDoc.content;
  }
  targetElement.append(newChild);

  const tags = targetElement.getElementsByTagName("a");
  for (const tag of tags) {
    tag.target = "_blank";
    tag.rel = "noreferrer noopener";
  }
};

onMounted(() => {
  nextTick(() => {
    renderMarkdownIntoDiv();
  });
});

watch(() => props.contents, () => {
  nextTick(() => {
    renderMarkdownIntoDiv();
  });
});
</script>
