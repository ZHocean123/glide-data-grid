import type { Item } from "../internal/data-grid/data-grid-types.js";

export interface RenderStateProvider {
    getValue(item: Item): any;
    setValue(item: Item, value: any): void;
}

// Utility functions for packing/unpacking column and row into a single number
export function packColRowToNumber(col: number, row: number): number {
    // Using a simple approach: pack col into upper bits and row into lower bits
    // This assumes col and row are both less than 2^16 (65536)
    return (col << 16) | row;
}

export function unpackNumberToColRow(num: number): Item {
    // Extract col from upper bits and row from lower bits
    const col = num >> 16;
    const row = num & 0xFFFF; // Mask to get lower 16 bits
    return [col, row];
}