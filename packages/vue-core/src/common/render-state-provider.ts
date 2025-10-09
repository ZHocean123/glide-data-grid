/**
 * Utility functions for packing and unpacking cell coordinates.
 */

/**
 * Packs column and row numbers into a single number.
 * @param col The column number.
 * @param row The row number.
 * @returns A packed number.
 */
export function packColRowToNumber(col: number, row: number): number {
    // Using bit shifting to pack two numbers into one
    // This is a simplified implementation and may need adjustment based on expected ranges
    return (col << 16) | (row & 0xffff);
}

/**
 * Unpacks a packed number into column and row numbers.
 * @param packed The packed number.
 * @returns An array with [col, row].
 */
export function unpackNumberToColRow(packed: number): [number, number] {
    const col = packed >> 16;
    const row = packed & 0xffff;
    // Handle negative row numbers
    const signedRow = row > 0x7fff ? row - 0x10000 : row;
    return [col, signedRow];
}

/**
 * Unpacks a packed number and returns only the row number.
 * @param packed The packed number.
 * @returns The row number.
 */
export function unpackRow(packed: number): number {
    const row = packed & 0xffff;
    // Handle negative row numbers
    return row > 0x7fff ? row - 0x10000 : row;
}