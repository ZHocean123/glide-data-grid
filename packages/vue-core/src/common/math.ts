import { itemIsInRect } from "../internal/data-grid/render/data-grid-lib.js";
import type { FillHandleDirection, Rectangle } from "../internal/data-grid/data-grid-types.js";

export function getClosestRect(
    rect: Rectangle,
    px: number,
    py: number,
    allowedDirections: FillHandleDirection
): Rectangle | undefined {
    if (allowedDirections === "any") return combineRects(rect, { x: px, y: py, width: 1, height: 1 });
    if (allowedDirections === "vertical") px = rect.x;
    if (allowedDirections === "horizontal") py = rect.y;
    // Check if the point is inside the rectangle
    if (itemIsInRect([px, py], rect)) {
        return undefined;
    }

    // Calculate distances to the closest edges
    const distanceToLeft = px - rect.x;
    const distanceToRight = rect.x + rect.width - px;
    const distanceToTop = py - rect.y + 1;
    const distanceToBottom = rect.y + rect.height - py;

    // Find the minimum distance
    const minDistance = Math.min(
        allowedDirections === "vertical" ? Number.MAX_SAFE_INTEGER : distanceToLeft,
        allowedDirections === "vertical" ? Number.MAX_SAFE_INTEGER : distanceToRight,
        allowedDirections === "horizontal" ? Number.MAX_SAFE_INTEGER : distanceToTop,
        allowedDirections === "horizontal" ? Number.MAX_SAFE_INTEGER : distanceToBottom
    );

    // eslint-disable-next-line unicorn/prefer-switch
    if (minDistance === distanceToBottom) {
        return { x: rect.x, y: rect.y + rect.height, width: rect.width, height: py - rect.y - rect.height + 1 };
    } else if (minDistance === distanceToTop) {
        return { x: rect.x, y: py, width: rect.width, height: rect.y - py };
    } else if (minDistance === distanceToRight) {
        return { x: rect.x + rect.width, y: rect.y, width: px - rect.x - rect.width + 1, height: rect.height };
    } else {
        return { x: px, y: rect.y, width: rect.x - px, height: rect.height };
    }
}


export function intersectRect(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
) {
    return x1 <= x2 + w2 && x2 <= x1 + w1 && y1 <= y2 + h2 && y2 <= y1 + h1;
}

// pointInRect 函数重载，支持多种调用方式
export function pointInRect(rect: Rectangle, x: number, y: number): boolean;
export function pointInRect(rect: Rectangle, point: [number, number]): boolean;
export function pointInRect(x: number, y: number, rect: Rectangle): boolean;

export function pointInRect(
    rectOrX: Rectangle | number,
    yOrPoint: number | [number, number],
    rectOrY?: Rectangle | number
): boolean {
    if (typeof rectOrX === 'object') {
        const rectObj = rectOrX;
        
        if (Array.isArray(yOrPoint)) {
            // pointInRect(rect, [x, y]) 调用方式
            const [x, y] = yOrPoint;
            return x >= rectObj.x && x <= rectObj.x + rectObj.width &&
                   y >= rectObj.y && y <= rectObj.y + rectObj.height;
        } else if (typeof yOrPoint === 'number' && typeof rectOrY === 'number') {
            // pointInRect(rect, x, y) 调用方式
            const x = yOrPoint;
            const y = rectOrY;
            return x >= rectObj.x && x <= rectObj.x + rectObj.width &&
                   y >= rectObj.y && y <= rectObj.y + rectObj.height;
        }
    } else if (typeof rectOrX === 'number' && typeof yOrPoint === 'number' && typeof rectOrY === 'object') {
        // pointInRect(x, y, rect) 调用方式
        const x = rectOrX;
        const y = yOrPoint;
        const rect = rectOrY;
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    return false;
}

export function combineRects(a: Rectangle, b: Rectangle): Rectangle {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const width = Math.max(a.x + a.width, b.x + b.width) - x;
    const height = Math.max(a.y + a.height, b.y + b.height) - y;
    return { x, y, width, height };
}

export function rectContains(a: Rectangle, b: Rectangle): boolean {
    return a.x <= b.x && a.y <= b.y && a.x + a.width >= b.x + b.width && a.y + a.height >= b.y + b.height;
}

/**
 * 这个函数对于填充手柄和高亮区域的性能至关重要。如果不将虚线矩形"拥抱"到合适的大小，
 * 当它们非常大时会导致巨大的GPU停滞。使用mod的原因是如果不考虑虚线笔划大小，
 * 当矩形大小变化时会出现奇怪的伪影（虚线在帧与帧之间不会对齐）。
 */
export function hugRectToTarget(rect: Rectangle, width: number, height: number, mod: number): Rectangle | undefined {
    // 合并检查以便提前返回
    if (
        rect.x > width ||
        rect.y > height ||
        (rect.x < 0 && rect.y < 0 && rect.x + rect.width > width && rect.y + rect.height > height)
    ) {
        return undefined;
    }

    // 如果矩形完全在边界内，直接返回
    if (rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height) {
        return rect;
    }

    // 预计算边界常量，我们在这里给自己留一些余地，因为不想在应用缩放时出现奇怪的问题。
    // 4px的余地绰绰有余。
    const leftMax = -4;
    const topMax = -4;
    const rightMax = width + 4;
    const bottomMax = height + 4;

    // 预计算边界溢出
    const leftOverflow = leftMax - rect.x;
    const rightOverflow = rect.x + rect.width - rightMax;
    const topOverflow = topMax - rect.y;
    const bottomOverflow = rect.y + rect.height - bottomMax;

    // 如有必要则调整，使用简化计算
    const left = leftOverflow > 0 ? rect.x + Math.floor(leftOverflow / mod) * mod : rect.x;
    const right = rightOverflow > 0 ? rect.x + rect.width - Math.floor(rightOverflow / mod) * mod : rect.x + rect.width;
    const top = topOverflow > 0 ? rect.y + Math.floor(topOverflow / mod) * mod : rect.y;
    const bottom =
        bottomOverflow > 0 ? rect.y + rect.height - Math.floor(bottomOverflow / mod) * mod : rect.y + rect.height;

    return { x: left, y: top, width: right - left, height: bottom - top };
}

export interface SplitRect {
    rect: Rectangle;
    clip: Rectangle;
}

/**
 * 将矩形分割成多个区域，用于处理跨越多个单元格的复杂渲染场景。
 * 目标是根据提供的分割索引（基本上是切割线）将输入矩形分割成最多9个区域。
 */
export function splitRectIntoRegions(
    rect: Rectangle,
    splitIndicies: readonly [number, number, number, number],
    width: number,
    height: number,
    splitLocations: readonly [number, number, number, number]
): SplitRect[] {
    const [lSplit, tSplit, rSplit, bSplit] = splitIndicies;
    const [lClip, tClip, rClip, bClip] = splitLocations;
    const { x: inX, y: inY, width: inW, height: inH } = rect;

    const result: SplitRect[] = [];

    if (inW <= 0 || inH <= 0) return result;

    const inRight = inX + inW;
    const inBottom = inY + inH;

    // 目标是根据提供的分割索引（基本上是切割线）将输入矩形分割成最多9个区域。
    // 切割线和矩形都是整数。我们正在分割表格上的单元格。
    // 理论上最多可以返回9个区域，所以我们需要小心确保获取所有区域，
    // 并且不返回任何空区域。

    // 计算一些便利值
    const isOverLeft = inX < lSplit;
    const isOverTop = inY < tSplit;
    const isOverRight = inX + inW > rSplit;
    const isOverBottom = inY + inH > bSplit;

    const isOverCenterVert =
        (inX >= lSplit && inX < rSplit) ||
        (inRight > lSplit && inRight <= rSplit) ||
        (inX < lSplit && inRight > rSplit);
    const isOverCenterHoriz =
        (inY >= tSplit && inY < bSplit) ||
        (inBottom > tSplit && inBottom <= bSplit) ||
        (inY < tSplit && inBottom > bSplit);

    const isOverCenter = isOverCenterVert && isOverCenterHoriz;

    // 中心
    if (isOverCenter) {
        const x = Math.max(inX, lSplit);
        const y = Math.max(inY, tSplit);
        const right = Math.min(inRight, rSplit);
        const bottom = Math.min(inBottom, bSplit);
        result.push({
            rect: { x, y, width: right - x, height: bottom - y },
            clip: {
                x: lClip,
                y: tClip,
                width: rClip - lClip + 1,
                height: bClip - tClip + 1,
            },
        });
    }

    // 左上
    if (isOverLeft && isOverTop) {
        const x = inX;
        const y = inY;
        const right = Math.min(inRight, lSplit);
        const bottom = Math.min(inBottom, tSplit);
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: 0,
                y: 0,
                width: lClip + 1,
                height: tClip + 1,
            },
        });
    }

    // 上中
    if (isOverTop && isOverCenterVert) {
        const x = Math.max(inX, lSplit);
        const y = inY;
        const right = Math.min(inRight, rSplit);
        const bottom = Math.min(inBottom, tSplit);
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: lClip,
                y: 0,
                width: rClip - lClip + 1,
                height: tClip + 1,
            },
        });
    }

    // 右上
    if (isOverTop && isOverRight) {
        const x = Math.max(inX, rSplit);
        const y = inY;
        const right = inRight;
        const bottom = Math.min(inBottom, tSplit);
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: rClip,
                y: 0,
                width: width - rClip + 1,
                height: tClip + 1,
            },
        });
    }

    // 中左
    if (isOverLeft && isOverCenterHoriz) {
        const x = inX;
        const y = Math.max(inY, tSplit);
        const right = Math.min(inRight, lSplit);
        const bottom = Math.min(inBottom, bSplit);
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: 0,
                y: tClip,
                width: lClip + 1,
                height: bClip - tClip + 1,
            },
        });
    }

    // 中右
    if (isOverRight && isOverCenterHoriz) {
        const x = Math.max(inX, rSplit);
        const y = Math.max(inY, tSplit);
        const right = inRight;
        const bottom = Math.min(inBottom, bSplit);
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: rClip,
                y: tClip,
                width: width - rClip + 1,
                height: bClip - tClip + 1,
            },
        });
    }

    // 左下
    if (isOverLeft && isOverBottom) {
        const x = inX;
        const y = Math.max(inY, bSplit);
        const right = Math.min(inRight, lSplit);
        const bottom = inBottom;
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: 0,
                y: bClip,
                width: lClip + 1,
                height: height - bClip + 1,
            },
        });
    }

    // 下中
    if (isOverBottom && isOverCenterVert) {
        const x = Math.max(inX, lSplit);
        const y = Math.max(inY, bSplit);
        const right = Math.min(inRight, rSplit);
        const bottom = inBottom;
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: lClip,
                y: bClip,
                width: rClip - lClip + 1,
                height: height - bClip + 1,
            },
        });
    }

    // 右下
    if (isOverRight && isOverBottom) {
        const x = Math.max(inX, rSplit);
        const y = Math.max(inY, bSplit);
        const right = inRight;
        const bottom = inBottom;
        result.push({
            rect: {
                x,
                y,
                width: right - x,
                height: bottom - y,
            },
            clip: {
                x: rClip,
                y: bClip,
                width: width - rClip + 1,
                height: height - bClip + 1,
            },
        });
    }

    return result;
}

// 线性插值函数
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

// 计算两点之间的距离
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 重新导出clamp函数，并处理min > max的情况
export function clamp(value: number, min: number, max: number): number {
    // 如果min > max，交换它们
    if (min > max) {
        const temp = min;
        min = max;
        max = temp;
    }
    return Math.min(Math.max(value, min), max);
}