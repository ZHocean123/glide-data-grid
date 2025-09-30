<template>
  <Wrapper :innerHeight="innerHeight" :innerWidth="innerWidth" v-bind="restProps">
    <slot />
  </Wrapper>
</template>

<script setup lang="ts">
import { styled } from '@linaria/vue';

interface Props {
  inWidth: number | string;
  inHeight: number | string;
}

const props = defineProps<Props>();

function toCss(x: number | string) {
  if (typeof x === "string") return x;
  return `${x}px`;
}

const innerWidth = toCss(props.inWidth);
const innerHeight = toCss(props.inHeight);

// Extract rest props for div attributes
const restProps = {
  ...props,
  inWidth: undefined,
  inHeight: undefined,
};

const Wrapper = styled.div<{ innerWidth: string; innerHeight: string }>`
    position: relative;

    min-width: 10px;
    min-height: 10px;
    max-width: 100%;
    max-height: 100%;

    width: ${(p: any) => p.innerWidth};
    height: ${(p: any) => p.innerHeight};

    overflow: hidden;
    overflow: clip;

    direction: ltr;

    > :first-child {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }
`;
</script>
