import type { Rectangle } from '../internal/data-grid/data-grid-types.js';

/**
 * 获取两个矩形的并集
 */
export function combineRects(a: Rectangle, b: Rectangle): Rectangle {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const x2 = Math.max(a.x + a.width, b.x + b.width);
    const y2 = Math.max(a.y + a.height, b.y + b.height);
    return {
        x,
        y,
        width: x2 - x,
        height: y2 - y,
    };
}

/**
 * 检查点是否在矩形内
 */
export function pointInRect(rect: Rectangle, x: number, y: number): boolean;
export function pointInRect(rect: Rectangle, point: readonly [number, number]): boolean;
export function pointInRect(
    rect: Rectangle,
    xOrPoint: number | readonly [number, number],
    y?: number
): boolean {
    let x: number;
    let yCoord: number;
    
    if (typeof xOrPoint === 'number') {
        x = xOrPoint;
        yCoord = y!;
    } else {
        [x, yCoord] = xOrPoint;
    }
    
    return x >= rect.x && x < rect.x + rect.width && yCoord >= rect.y && yCoord < rect.y + rect.height;
}

/**
 * 获取最近的矩形
 */
export function getClosestRect(
    source: Rectangle,
    x: number,
    y: number,
    allowedDirections: 'horizontal' | 'vertical' | 'orthogonal' | 'any' = 'orthogonal'
): Rectangle {
    const sourceRight = source.x + source.width;
    const sourceBottom = source.y + source.height;
    
    let resultX = source.x;
    let resultY = source.y;
    let resultWidth = source.width;
    let resultHeight = source.height;
    
    // 确定填充方向
    const isRight = x >= sourceRight;
    const isLeft = x < source.x;
    const isDown = y >= sourceBottom;
    const isUp = y < source.y;
    
    // 根据允许的方向调整
    if (allowedDirections === 'horizontal') {
        if (isRight) {
            resultWidth = x - source.x + 1;
        } else if (isLeft) {
            resultX = x;
            resultWidth = sourceRight - x;
        }
    } else if (allowedDirections === 'vertical') {
        if (isDown) {
            resultHeight = y - source.y + 1;
        } else if (isUp) {
            resultY = y;
            resultHeight = sourceBottom - y;
        }
    } else if (allowedDirections === 'orthogonal') {
        // 只允许正交方向（右或下）
        if (isRight && !isUp) {
            resultWidth = x - source.x + 1;
        } else if (isDown && !isLeft) {
            resultHeight = y - source.y + 1;
        }
    } else {
        // 允许任何方向
        if (isRight) {
            resultWidth = x - source.x + 1;
        } else if (isLeft) {
            resultX = x;
            resultWidth = sourceRight - x;
        }
        
        if (isDown) {
            resultHeight = y - source.y + 1;
        } else if (isUp) {
            resultY = y;
            resultHeight = sourceBottom - y;
        }
    }
    
    return {
        x: resultX,
        y: resultY,
        width: resultWidth,
        height: resultHeight,
    };
}

/**
 * 限制数值在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}