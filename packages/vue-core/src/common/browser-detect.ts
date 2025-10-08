/**
 * Vue版本的浏览器检测工具
 * 与React版本保持一致，但使用Vue的响应式系统
 */

import { computed } from "vue";

// 检测操作系统
export const browserIsOSX = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /mac/i.test(navigator.platform);
});

export const browserIsSafari = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
});

export const browserIsFirefox = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /firefox/i.test(navigator.userAgent);
});

export const browserIsIOS = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /ipad|iphone|ipod/i.test(navigator.userAgent);
});

export const browserIsAndroid = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /android/i.test(navigator.userAgent);
});

export const browserIsMobile = computed(() => {
    return browserIsIOS.value || browserIsAndroid.value;
});

export const browserIsTouchDevice = computed(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
});

export const browserIsChrome = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
});

export const browserIsEdge = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /edge/i.test(navigator.userAgent);
});

export const browserIsWindows = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /win/i.test(navigator.platform);
});

export const browserIsLinux = computed(() => {
    if (typeof navigator === "undefined") return false;
    return /linux/i.test(navigator.platform);
});