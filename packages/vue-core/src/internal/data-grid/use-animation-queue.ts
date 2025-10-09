import { ref, watch, onUnmounted, type Ref } from "vue";
import { type Item } from "./data-grid-types.js";
import { CellSet } from "./cell-set.js";
import { packColRowToNumber, unpackNumberToColRow } from "../../common/render-state-provider.js";

export type EnqueueCallback = (item: Item) => void;

export function useAnimationQueue(draw: (items: CellSet) => void): EnqueueCallback {
    const queue: Ref<number[]> = ref([]);
    const seq: Ref<number> = ref(0);
    let drawRef = draw;
    let animationFrameId: number | null = null;

    const loop = () => {
        const requeue = () => {
            animationFrameId = window.requestAnimationFrame(fn);
        };

        const fn = () => {
            const toDraw = queue.value.map(unpackNumberToColRow);

            queue.value = [];
            drawRef(new CellSet(toDraw));
            if (queue.value.length > 0) {
                seq.value++;
            } else {
                seq.value = 0;
            }
        };

        animationFrameId = window.requestAnimationFrame(seq.value > 600 ? requeue : fn);
    };

    const enqueue = (item: Item) => {
        if (queue.value.length === 0) loop();
        const packed = packColRowToNumber(item[0], item[1]);
        if (queue.value.includes(packed)) return;
        queue.value.push(packed);
    };

    onUnmounted(() => {
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
        }
    });

    return enqueue;
}