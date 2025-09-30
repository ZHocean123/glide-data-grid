import { ref, watch } from 'vue';
import { type Item } from './data-grid-types.js';
import { CellSet } from './cell-set.js';
import { packColRowToNumber, unpackNumberToColRow } from '../../common/render-state-provider.js';

export type EnqueueCallback = (item: Item) => void;

export function useAnimationQueue(draw: (items: CellSet) => void): EnqueueCallback {
    const queue = ref<number[]>([]);
    const seq = ref(0);
    const drawRef = ref(draw);
    drawRef.value = draw;

    const loop = () => {
        const requeue = () => window.requestAnimationFrame(fn);

        const fn = () => {
            const toDraw = queue.value.map(unpackNumberToColRow);

            queue.value = [];
            drawRef.value(new CellSet(toDraw));
            if (queue.value.length > 0) {
                seq.value++;
            } else {
                seq.value = 0;
            }
        };

        window.requestAnimationFrame(seq.value > 600 ? requeue : fn);
    };

    return (item: Item) => {
        if (queue.value.length === 0) loop();
        const packed = packColRowToNumber(item[0], item[1]);
        if (queue.value.includes(packed)) return;
        queue.value.push(packed);
    };
}
