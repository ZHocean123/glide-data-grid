import { ref } from "vue";
import { expect, describe, test } from "vitest";

describe("Vue reactivity utilities", () => {
    test("ref reactivity", () => {
        const count = ref(0);
        expect(count.value).toBe(0);

        count.value = 5;
        expect(count.value).toBe(5);
    });

    test("computed reactivity", () => {
        const count = ref(0);
        const doubled = () => count.value * 2;

        expect(doubled()).toBe(0);

        count.value = 3;
        expect(doubled()).toBe(6);
    });
});