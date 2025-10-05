<template>
    <div class="gdg-user-profile-cell">
        <div class="avatar-container">
            <div
                class="avatar-background"
                :style="{ backgroundColor: cell.tint }"
            ></div>
            <div class="avatar-initial">{{ cell.initial[0] }}</div>
            <img
                v-if="loadedImage"
                :src="loadedImage"
                class="avatar-image"
                :alt="cell.name || 'User profile'"
            />
        </div>
        <div v-if="cell.name" class="user-name">{{ cell.name }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { UserProfileCell } from "../types";

const props = defineProps<{
    cell: UserProfileCell;
    width: number;
    height: number;
}>();

const loadedImage = ref<string | null>(null);

const loadImage = async () => {
    if (!props.cell.image) {
        loadedImage.value = null;
        return;
    }

    try {
        // 在实际实现中，这里应该使用图片加载器
        // 这里简化实现，直接使用图片URL
        loadedImage.value = props.cell.image;
    } catch (error) {
        console.warn("Failed to load user profile image:", error);
        loadedImage.value = null;
    }
};

onMounted(() => {
    loadImage();
});

watch(
    () => props.cell.image,
    () => {
        loadImage();
    }
);
</script>

<style scoped>
.gdg-user-profile-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    padding: 0 8px;
}

.avatar-container {
    position: relative;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
}

.avatar-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.2;
    border-radius: 50%;
}

.avatar-initial {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: 600;
    color: #333;
    z-index: 1;
}

.avatar-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    z-index: 2;
}

.user-name {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>