import type { ReadonlyPoint } from "../types";
export type FillHandleDirection = "horizontal" | "vertical" | "orthogonal" | "any";
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare function itemIsInRect(location: ReadonlyPoint, rect: Rectangle): boolean;
export declare function getClosestRect(rect: Rectangle, px: number, py: number, allowedDirections: FillHandleDirection): Rectangle | undefined;
export declare function intersectRect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean;
export declare function pointInRect(rect: Rectangle, x: number, y: number): boolean;
export declare function combineRects(a: Rectangle, b: Rectangle): Rectangle;
export declare function rectContains(a: Rectangle, b: Rectangle): boolean;
export declare function hugRectToTarget(rect: Rectangle, width: number, height: number, mod: number): Rectangle | undefined;
interface SplitRect {
    rect: Rectangle;
    clip: Rectangle;
}
export declare function splitRectIntoRegions(rect: Rectangle, splitIndicies: readonly [number, number, number, number], width: number, height: number, splitLocations: readonly [number, number, number, number]): SplitRect[];
export {};
