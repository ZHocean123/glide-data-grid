import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';
import debounce from 'lodash/debounce.js';
import { deepEqual } from './support.js';

export function useEventListener<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    element: HTMLElement | Window | Document | null,
    passive: boolean,
    capture = false
) {
    const savedHandler = ref(handler);

    watch([savedHandler], () => {
        savedHandler.value = handler;
    });

    onMounted(() => {
        if (element === null || element.addEventListener === undefined) return;
        const el = element as HTMLElement;

        const eventListener = (event: HTMLElementEventMap[K]) => {
            savedHandler.value?.call(el, event);
        };

        el.addEventListener(eventName, eventListener, { passive, capture });

        onUnmounted(() => {
            el.removeEventListener(eventName, eventListener, { capture });
        });
    });
}

export function whenDefined<T>(obj: any, result: T) {
    return obj === undefined ? undefined : result;
}

const PI = Math.PI;
export function degreesToRadians(degrees: number) {
    return (degrees * PI) / 180;
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

type BoundingBox = { x1: number; y1: number; x2: number; y2: number };
export const pointIsWithinBB = (x: number, y: number, bb: BoundingBox) =>
    bb.x1 <= x && x <= bb.x2 && bb.y1 <= y && y <= bb.y2;

/**
 * The input provided to a sprite function.
 *
 * @category Columns
 */
export interface SpriteProps {
    fgColor: string;
    bgColor: string;
}

export const EditPencil = (props: Partial<SpriteProps>) => {
    const fg = props.fgColor ?? "currentColor";
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12.7073 7.05029C7.87391 11.8837 10.4544 9.30322 6.03024 13.7273C5.77392 13.9836 5.58981 14.3071 5.50189 14.6587L4.52521 18.5655C4.38789 19.1148 4.88543 19.6123 5.43472 19.475L9.34146 18.4983C9.69313 18.4104 10.0143 18.2286 10.2706 17.9722L16.9499 11.2929"
                stroke={fg}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d="M20.4854 4.92901L19.0712 3.5148C18.2901 2.73375 17.0238 2.73375 16.2428 3.5148L14.475 5.28257C15.5326 7.71912 16.4736 8.6278 18.7176 9.52521L20.4854 7.75744C21.2665 6.97639 21.2665 5.71006 20.4854 4.92901Z"
                stroke={fg}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

export const Checkmark = (props: Partial<SpriteProps>) => {
    const fg = props.fgColor ?? "currentColor";

    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M19 6L10.3802 17L5.34071 11.8758"
                vectorEffect="non-scaling-stroke"
                stroke={fg}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export function useDebouncedMemo<T>(factory: () => T, deps: any[], time: number): Ref<T> {
    const state = ref(factory()) as Ref<T>;

    const mountedRef = ref(true);
    onUnmounted(() => {
        mountedRef.value = false;
    });

    const debouncedSetState = ref(
        debounce((newValue: T) => {
            if (mountedRef.value) {
                state.value = newValue;
            }
        }, time)
    );

    watch(deps, () => {
        if (mountedRef.value) {
            debouncedSetState.value(() => factory());
        }
    }, { immediate: true });

    return state;
}

// Shamelessly inline direction to avoid conflicts with 1.0 and 2.0.
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

let scrollbarWidthCache: number | undefined = undefined;
export function getScrollBarWidth(): number {
    if (typeof document === "undefined") return 0;
    if (scrollbarWidthCache !== undefined) return scrollbarWidthCache;
    const inner = document.createElement("p");
    inner.style.width = "100%";
    inner.style.height = "200px";

    const outer = document.createElement("div");
    outer.id = "testScrollbar";

    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.append(inner);

    document.body.append(outer);
    const w1 = inner.offsetWidth;
    outer.style.overflow = "scroll";
    let w2 = inner.offsetWidth;
    if (w1 === w2) {
        w2 = outer.clientWidth;
    }

    outer.remove();

    scrollbarWidthCache = w1 - w2;
    return scrollbarWidthCache;
}

const empty = Symbol();
export function useStateWithReactiveInput<T>(inputState: T): [Ref<T>, (value: T | ((prev: T) => T)) => void, () => void] {
    const inputStateRef = ref<[T | typeof empty, T]>([empty, inputState]);

    if (inputStateRef.value[1] !== inputState) {
        inputStateRef.value[0] = inputState;
    }
    inputStateRef.value[1] = inputState;

    const state = ref(inputState) as Ref<T>;
    const forceRender = ref({});

    const setStateOuter = (nv: T | ((prev: T) => T)) => {
        const s = inputStateRef.value[0];
        if (s !== empty) {
            nv = typeof nv === "function" ? (nv as (pv: T) => T)(s) : nv;
            if (nv === s) return;
        }
        if (s !== empty) forceRender.value = {};
        state.value = typeof nv === "function" ? (nv as (pv: T) => T)(s === empty ? state.value : s) : nv;
        inputStateRef.value[0] = empty;
    };

    const onEmpty = () => {
        inputStateRef.value[0] = empty;
        forceRender.value = {};
    };

    return [inputStateRef.value[0] === empty ? state : ref(inputStateRef.value[0]), setStateOuter, onEmpty];
}

export function makeAccessibilityStringForArray(arr: readonly string[]): string {
    if (arr.length === 0) {
        return "";
    }

    let index = 0;
    let count = 0;
    for (const str of arr) {
        count += str.length;
        if (count > 10_000) break;
        index++;
    }
    return arr.slice(0, index).join(", ");
}

export function useDeepMemo<T>(value: T): Ref<T> {
    const refValue = ref(value) as Ref<T>;

    if (!deepEqual(value, refValue.value)) {
        refValue.value = value;
    }

    return refValue;
}
