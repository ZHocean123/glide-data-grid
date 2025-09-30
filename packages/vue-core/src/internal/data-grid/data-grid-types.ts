// 在文件末尾添加CompactSelection类
export type FillHandleDirection = "horizontal" | "vertical" | "orthogonal" | "any";

/**
 * Configuration options for the fill-handle (the little drag square in the bottom-right of a selection).
 *
 *  `shape`   – Either a square or a circle. Default is `square`.
 *  `size`    – Width/height (or diameter) in CSS pixels. Default is `4`.
 *  `offsetX` – Horizontal offset from the bottom-right corner of the cell (positive is →). Default is `-2`.
 *  `offsetY` – Vertical offset from the bottom-right corner of the cell (positive is ↓). Default is `-2`.
 *  `outline` – Width of the outline stroke in CSS pixels. Default is `0`.
 */
export type FillHandleConfig = {
    readonly shape: "square" | "circle";
    readonly size: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly outline: number;
};

export type FillHandle = boolean | Partial<FillHandleConfig>;

/**
 * Default configuration used when `fillHandle` is simply `true`.
 */
export const DEFAULT_FILL_HANDLE: Readonly<FillHandleConfig> = {
    shape: "square",
    size: 4,
    offsetX: -2,
    offsetY: -2,
    outline: 0,
} as const;

/** @category Selection */
export type Slice = [start: number, end: number];
/** @category Selection */
export type CompactSelectionRanges = readonly Slice[];

function mergeRanges(input: CompactSelectionRanges) {
    if (input.length === 0) {
        return [];
    }
    const ranges = [...input];

    const stack: [number, number][] = [];

    ranges.sort(function (a, b) {
        return a[0] - b[0];
    });

    stack.push([...ranges[0]]);

    for (const range of ranges.slice(1)) {
        const top = stack[stack.length - 1];

        if (top[1] < range[0]) {
            stack.push([...range]);
        } else if (top[1] < range[1]) {
            top[1] = range[1];
        }
    }

    return stack;
}

let emptyCompactSelection: CompactSelection | undefined;

/** @category Selection */
export class CompactSelection {
    private constructor(public readonly items: CompactSelectionRanges) {}

    static create = (items: CompactSelectionRanges) => {
        return new CompactSelection(mergeRanges(items));
    };

    static empty = (): CompactSelection => {
        return emptyCompactSelection ?? (emptyCompactSelection = new CompactSelection([]));
    };

    static fromSingleSelection = (selection: number | Slice) => {
        return CompactSelection.empty().add(selection);
    };

    static fromArray = (items: readonly number[]): CompactSelection => {
        if (items.length === 0) return CompactSelection.empty();
        const slices = items.map(s => [s, s + 1] as Slice);
        const newItems = mergeRanges(slices);
        return new CompactSelection(newItems);
    };

    public offset(amount: number): CompactSelection {
        if (amount === 0) return this;
        const newItems = this.items.map(x => [x[0] + amount, x[1] + amount] as Slice);
        return new CompactSelection(newItems);
    }

    public add(selection: number | Slice): CompactSelection {
        const slice: Slice = typeof selection === "number" ? [selection, selection + 1] : selection;
        const newItems = mergeRanges([...this.items, slice]);
        return new CompactSelection(newItems);
    }

    public remove(selection: number | Slice): CompactSelection {
        const items = [...this.items];

        const selMin = typeof selection === "number" ? selection : selection[0];
        const selMax = typeof selection === "number" ? selection + 1 : selection[1];

        for (const [i, slice] of items.entries()) {
            const [start, end] = slice;
            // Remove part of slice that intersects removed selection.
            if (start <= selMax && selMin <= end) {
                const toAdd: Slice[] = [];
                if (start < selMin) {
                    toAdd.push([start, selMin]);
                }
                if (selMax < end) {
                    toAdd.push([selMax, end]);
                }
                items.splice(i, 1, ...toAdd);
            }
        }
        return new CompactSelection(items);
    }

    public first(): number | undefined {
        if (this.items.length === 0) return undefined;
        return this.items[0][0];
    }

    public last(): number | undefined {
        if (this.items.length === 0) return undefined;
        return this.items.slice(-1)[0][1] - 1;
    }

    public hasIndex(index: number): boolean {
        for (let i = 0; i < this.items.length; i++) {
            const [start, end] = this.items[i];
            if (index >= start && index < end) return true;
        }
        return false;
    }

    public hasAll(index: Slice): boolean {
        for (let x = index[0]; x < index[1]; x++) {
            if (!this.hasIndex(x)) return false;
        }
        return true;
    }

    public some(predicate: (index: number) => boolean): boolean {
        for (const i of this) {
            if (predicate(i)) return true;
        }
        return false;
    }

    public equals(other: CompactSelection): boolean {
        if (other === this) return true;

        if (other.items.length !== this.items.length) return false;

        for (let i = 0; i < this.items.length; i++) {
            const left = other.items[i];
            const right = this.items[i];

            if (left[0] !== right[0] || left[1] !== right[1]) return false;
        }

        return true;
    }

    // Really old JS wont have access to the iterator and babel will stop people using it
    // when trying to support browsers so old we don't support them anyway. What goes on
    // between an engineer and their bundler in the privacy of their CI server is none of
    // my business anyway.
    public toArray(): number[] {
        const result: number[] = [];
        for (const [start, end] of this.items) {
            for (let x = start; x < end; x++) {
                result.push(x);
            }
        }
        return result;
    }

    get length(): number {
        let len = 0;
        for (const [start, end] of this.items) {
            len += end - start;
        }

        return len;
    }

    *[Symbol.iterator]() {
        for (const [start, end] of this.items) {
            for (let x = start; x < end; x++) {
                yield x;
            }
        }
    }
}
