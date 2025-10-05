<template>
    <div class="gdg-star-cell">
        <div class="stars-container">
            <button
                v-for="i in 5"
                :key="i"
                type="button"
                class="star-button"
                :class="{ active: i <= rating }"
                @click="handleStarClick(i)"
                @mouseenter="hoverRating = i"
                @mouseleave="hoverRating = null"
            >
                <svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor">
                    <path
                        d="M47.1468 13.7811C48.0449 11.0172 51.9551 11.0172 52.8532 13.7812L60.5522 37.4762C60.9538 38.7123 62.1056 39.5491 63.4053 39.5491H88.3198C91.226 39.5491 92.4343 43.268 90.0831 44.9762L69.9269 59.6205C68.8755 60.3845 68.4355 61.7386 68.8371 62.9746L76.5361 86.6697C77.4342 89.4336 74.2707 91.732 71.9196 90.0238L51.7634 75.3794C50.7119 74.6155 49.2881 74.6155 48.2366 75.3795L28.0804 90.0238C25.7293 91.732 22.5659 89.4336 23.4639 86.6697L31.1629 62.9746C31.5645 61.7386 31.1245 60.3845 30.0731 59.6205L9.91686 44.9762C7.56572 43.268 8.77405 39.5491 11.6802 39.5491H36.5947C37.8944 39.5491 39.0462 38.7123 39.4478 37.4762L47.1468 13.7811Z"
                    />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { StarCell } from "../types";

const props = defineProps<{
    cell: StarCell;
}>();

const emit = defineEmits<{
    (event: "update", cell: StarCell): void;
}>();

const rating = ref(props.cell.rating);
const hoverRating = ref<number | null>(null);

const handleStarClick = (starRating: number) => {
    rating.value = starRating;
    const updatedCell: StarCell = {
        ...props.cell,
        rating: starRating
    };
    emit("update", updatedCell);
};
</script>

<style scoped>
.gdg-star-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.stars-container {
    display: flex;
    gap: 2px;
}

.star-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    color: #e0e0e0;
    transition: color 0.2s ease;
}

.star-button:hover {
    color: #ffc107;
}

.star-button.active {
    color: #ffc107;
}

.star-button:hover ~ .star-button {
    color: #e0e0e0;
}
</style>