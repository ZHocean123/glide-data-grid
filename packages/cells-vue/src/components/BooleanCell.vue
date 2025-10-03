<template>
    <button
        type="button"
        role="checkbox"
        class="gdg-boolean-cell"
        :aria-checked="value"
        @click="toggle"
    >
        <span>{{ value ? trueLabel : falseLabel }}</span>
    </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    value: boolean;
    trueLabel?: string;
    falseLabel?: string;
}>();

const emit = defineEmits<{
    (event: "toggle", nextValue: boolean): void;
}>();

const trueLabel = computed(() => props.trueLabel ?? "True");
const falseLabel = computed(() => props.falseLabel ?? "False");

const toggle = () => {
    emit("toggle", !props.value);
};
</script>

<style scoped>
.gdg-boolean-cell {
    align-items: center;
    background: none;
    border: 1px solid currentColor;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
}
</style>
