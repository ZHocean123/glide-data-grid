import { expect, describe, test } from "vitest";

describe("Common utilities", () => {
    test("Array operations", () => {
        const arr = [1, 2, 3];
        expect(arr.length).toBe(3);
        expect(arr.includes(2)).toBe(true);
    });

    test("Object operations", () => {
        const obj = { a: 1, b: 2 };
        expect(Object.keys(obj)).toEqual(["a", "b"]);
        expect(obj.a).toBe(1);
    });

    test("String operations", () => {
        const str = "hello world";
        expect(str.length).toBe(11);
        expect(str.includes("world")).toBe(true);
    });
});