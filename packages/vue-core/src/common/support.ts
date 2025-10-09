/**
 * Utility functions for type checking and assertions.
 */

/**
 * Asserts that a condition is true.
 * @param condition The condition to assert.
 * @param message Optional error message.
 */
export function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message ?? "Assertion failed");
    }
}

/**
 * Asserts that a value is never reachable.
 * @param x The value that should never be reachable.
 * @param message Optional error message.
 */
export function assertNever(x: never, message?: string): never {
    throw new Error(message ?? `Unexpected object: ${x}`);
}

/**
 * Proves that a value is of a certain type.
 * @param x The value to prove.
 */
export function proveType<T>(x: T): T {
    return x;
}

/**
 * Makes all properties of T required.
 */
export type FullyDefined<T> = {
    [P in keyof T]-?: T[P];
};