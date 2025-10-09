/**
 * Vue版本的通用工具函数
 * 与React版本保持一致，但使用Vue的响应式系统
 */

import { ref, computed, watch, h, type Ref, type ComputedRef } from "vue";

/**
 * Sprite组件的属性
 */
export interface SpriteProps {
    bgColor: string;
    fgColor: string;
}

/**
 * 深度比较两个值是否相等
 */
export function isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) return false;
        }
        return true;
    }
    if (typeof a === "object" && typeof b === "object") {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!isEqual(a[key], b[key])) return false;
        }
        return true;
    }
    return false;
}

/**
 * 深度记忆化组合式函数
 */
export function useDeepMemo<T>(value: T): ComputedRef<T> {
    const memoRef = ref<T>(value);
    
    return computed(() => {
        if (!isEqual(memoRef.value, value)) {
            memoRef.value = value;
        }
        return memoRef.value;
    });
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

/**
 * 克隆对象
 */
export function cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => cloneDeep(item)) as unknown as T;
    if (typeof obj === "object") {
        const cloned = {} as T;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = cloneDeep(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
}

/**
 * 获取随机ID
 */
export function getRandomId(): string {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * 限制数字在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * 检查是否为空值
 */
export function isEmpty(value: any): boolean {
    if (value == null) return true;
    if (Array.isArray(value) || typeof value === "string") return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
}

/**
 * 数组去重
 */
export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

/**
 * 数组分组
 */
export function groupBy<T, K extends keyof any>(
    array: T[],
    key: (item: T) => K
): Record<K, T[]> {
    return array.reduce((groups, item) => {
        const group = key(item);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {} as Record<K, T[]>);
}

/**
 * 数组排序
 */
export function sortBy<T>(
    array: T[],
    key: (item: T) => any,
    direction: "asc" | "desc" = "asc"
): T[] {
    return [...array].sort((a, b) => {
        const aVal = key(a);
        const bVal = key(b);
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
    });
}

/**
 * 等待指定时间
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxAttempts) {
                await sleep(delay);
            }
        }
    }
    
    throw lastError!;
}

/**
 * 监听Ref变化
 */
export function watchRef<T>(
    ref: Ref<T>,
    callback: (newValue: T, oldValue: T | undefined) => void,
    options?: { immediate?: boolean; deep?: boolean }
): void {
    watch(
        () => ref.value,
        (newValue, oldValue) => callback(newValue, oldValue),
        {
            immediate: options?.immediate,
            deep: options?.deep,
        }
    );
}

/**
 * 创建只读Ref
 */
export function readonlyRef<T>(value: T): ComputedRef<T> {
    return computed(() => value);
}

/**
 * 创建计算属性的别名
 */
export function createAlias<T>(source: Ref<T>): ComputedRef<T> {
    return computed({
        get: () => source.value,
        set: (value: T) => {
            source.value = value;
        }
    });
}

// Vue版本的节流组合式函数
export function useThrottleFn<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return fn(...args);
        }
    }) as T;
}

// 文本方向检测函数
const rtlRange = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
const ltrRange =
    "A-Za-z\u00C0-\u00D6\u00D8-\u00F6" +
    "\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C" +
    "\uFE00-\uFE6F\uFEFD-\uFFFF";

/* eslint-disable no-misleading-character-class */
const rtl = new RegExp("^[^" + ltrRange + "]*[" + rtlRange + "]");
/* eslint-enable no-misleading-character-class */

export function direction(value: string): "rtl" | "not-rtl" {
    return rtl.test(value) ? "rtl" : "not-rtl";
}

export const getSquareBB = (posX: number, posY: number, squareSideLength: number) => ({
    x1: posX - squareSideLength / 2,
    y1: posY - squareSideLength / 2,
    x2: posX + squareSideLength / 2,
    y2: posY + squareSideLength / 2,
});

export const getSquareXPosFromAlign = (
    alignment: "left" | "center" | "right",
    containerX: number,
    containerWidth: number,
    horizontalPadding: number,
    squareWidth: number
) => {
    switch (alignment) {
        case "left":
            return Math.floor(containerX) + horizontalPadding + squareWidth / 2;
        case "center":
            return Math.floor(containerX + containerWidth / 2);
        case "right":
            return Math.floor(containerX + containerWidth) - horizontalPadding - squareWidth / 2;
    }
};

export const getSquareWidth = (maxSize: number, containerHeight: number, verticalPadding: number) =>
    Math.min(maxSize, containerHeight - verticalPadding * 2);

// Vue版本的防抖组合式函数
export function useDebounceFn<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T {
    let timeoutId: number | null = null;
    return ((...args: Parameters<T>) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    }) as T;
}

/**
 * 为数组创建可访问性字符串
 */
export function makeAccessibilityStringForArray(data: readonly string[]): string {
    if (data.length === 0) return "Empty";
    if (data.length === 1) return data[0];
    if (data.length === 2) return `${data[0]} and ${data[1]}`;
    return `${data[0]}, ${data[1]}, and ${data.length - 2} more`;
}

/**
 * 将度数转换为弧度
 */
export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}