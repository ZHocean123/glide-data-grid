/**
 * 数学工具函数
 * 从 React 版本迁移，保持算法逻辑不变
 */

import type { Rectangle, Item } from '../types/base.js';

// 填充手柄方向类型
export type FillHandleDirection = 'horizontal' | 'vertical' | 'any';

// 判断点是否在矩形内
export function pointInRect(rect: Rectangle, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

// 判断项目是否在矩形内 (网格坐标)
export function itemIsInRect(item: Item, rect: Rectangle): boolean {
  const [col, row] = item;
  return col >= rect.x && col < rect.x + rect.width && row >= rect.y && row < rect.y + rect.height;
}

// 两个矩形是否相交
export function intersectRect(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 <= x2 + w2 && x2 <= x1 + w1 && y1 <= y2 + h2 && y2 <= y1 + h1;
}

// 合并两个矩形
export function combineRects(a: Rectangle, b: Rectangle): Rectangle {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.max(a.x + a.width, b.x + b.width) - x;
  const height = Math.max(a.y + a.height, b.y + b.height) - y;
  return { x, y, width, height };
}

// 判断矩形a是否包含矩形b
export function rectContains(a: Rectangle, b: Rectangle): boolean {
  return a.x <= b.x && a.y <= b.y && a.x + a.width >= b.x + b.width && a.y + a.height >= b.y + b.height;
}

// 获取最接近的矩形
export function getClosestRect(
  rect: Rectangle,
  px: number,
  py: number,
  allowedDirections: FillHandleDirection
): Rectangle | undefined {
  if (allowedDirections === 'any') {
    return combineRects(rect, { x: px, y: py, width: 1, height: 1 });
  }

  if (allowedDirections === 'vertical') px = rect.x;
  if (allowedDirections === 'horizontal') py = rect.y;

  // 检查点是否在矩形内
  if (itemIsInRect([px, py], rect)) {
    return undefined;
  }

  // 计算到最近边缘的距离
  const distanceToLeft = px - rect.x;
  const distanceToRight = rect.x + rect.width - px;
  const distanceToTop = py - rect.y + 1;
  const distanceToBottom = rect.y + rect.height - py;

  // 找到最小距离
  const minDistance = Math.min(
    allowedDirections === 'vertical' ? Number.MAX_SAFE_INTEGER : distanceToLeft,
    allowedDirections === 'vertical' ? Number.MAX_SAFE_INTEGER : distanceToRight,
    allowedDirections === 'horizontal' ? Number.MAX_SAFE_INTEGER : distanceToTop,
    allowedDirections === 'horizontal' ? Number.MAX_SAFE_INTEGER : distanceToBottom
  );

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

/**
 * 将矩形调整到目标尺寸内，关键用于填充手柄和高亮区域的性能优化
 * 如果不紧贴矩形，在处理虚线和大矩形时会导致GPU停顿
 */
export function hugRectToTarget(rect: Rectangle, width: number, height: number, mod: number): Rectangle | undefined {
  // 早期返回检查
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

  // 计算边界常量，给4px的缓冲区以避免缩放时的问题
  const leftMax = -4;
  const topMax = -4;
  const rightMax = width + 4;
  const bottomMax = height + 4;

  // 计算边界溢出
  const leftOverflow = leftMax - rect.x;
  const rightOverflow = rect.x + rect.width - rightMax;
  const topOverflow = topMax - rect.y;
  const bottomOverflow = rect.y + rect.height - bottomMax;

  // 必要时调整
  const left = leftOverflow > 0 ? rect.x + Math.floor(leftOverflow / mod) * mod : rect.x;
  const right = rightOverflow > 0 ? rect.x + rect.width - Math.floor(rightOverflow / mod) * mod : rect.x + rect.width;
  const top = topOverflow > 0 ? rect.y + Math.floor(topOverflow / mod) * mod : rect.y;
  const bottom =
    bottomOverflow > 0 ? rect.y + rect.height - Math.floor(bottomOverflow / mod) * mod : rect.y + rect.height;

  return { x: left, y: top, width: right - left, height: bottom - top };
}

// 分割矩形结果接口
interface SplitRect {
  rect: Rectangle;
  clip: Rectangle;
}

/**
 * 将矩形分割成多个区域
 * 用于处理冻结列/行的复杂渲染场景
 */
export function splitRectIntoRegions(
  rect: Rectangle,
  splitIndices: readonly [number, number, number, number],
  width: number,
  height: number,
  splitLocations: readonly [number, number, number, number]
): SplitRect[] {
  const [lSplit, tSplit, rSplit, bSplit] = splitIndices;
  const [lClip, tClip, rClip, bClip] = splitLocations;
  const { x: inX, y: inY, width: inW, height: inH } = rect;

  const result: SplitRect[] = [];

  if (inW <= 0 || inH <= 0) return result;

  const inRight = inX + inW;
  const inBottom = inY + inH;

  // 计算有用的值
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

  // 中心区域
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
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: 0, y: 0, width: lClip + 1, height: tClip + 1 },
    });
  }

  // 上中
  if (isOverTop && isOverCenterVert) {
    const x = Math.max(inX, lSplit);
    const y = inY;
    const right = Math.min(inRight, rSplit);
    const bottom = Math.min(inBottom, tSplit);
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: lClip, y: 0, width: rClip - lClip + 1, height: tClip + 1 },
    });
  }

  // 右上
  if (isOverTop && isOverRight) {
    const x = Math.max(inX, rSplit);
    const y = inY;
    const right = inRight;
    const bottom = Math.min(inBottom, tSplit);
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: rClip, y: 0, width: width - rClip + 1, height: tClip + 1 },
    });
  }

  // 左中
  if (isOverLeft && isOverCenterHoriz) {
    const x = inX;
    const y = Math.max(inY, tSplit);
    const right = Math.min(inRight, lSplit);
    const bottom = Math.min(inBottom, bSplit);
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: 0, y: tClip, width: lClip + 1, height: bClip - tClip + 1 },
    });
  }

  // 右中
  if (isOverRight && isOverCenterHoriz) {
    const x = Math.max(inX, rSplit);
    const y = Math.max(inY, tSplit);
    const right = inRight;
    const bottom = Math.min(inBottom, bSplit);
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: rClip, y: tClip, width: width - rClip + 1, height: bClip - tClip + 1 },
    });
  }

  // 左下
  if (isOverLeft && isOverBottom) {
    const x = inX;
    const y = Math.max(inY, bSplit);
    const right = Math.min(inRight, lSplit);
    const bottom = inBottom;
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: 0, y: bClip, width: lClip + 1, height: height - bClip + 1 },
    });
  }

  // 下中
  if (isOverBottom && isOverCenterVert) {
    const x = Math.max(inX, lSplit);
    const y = Math.max(inY, bSplit);
    const right = Math.min(inRight, rSplit);
    const bottom = inBottom;
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: lClip, y: bClip, width: rClip - lClip + 1, height: height - bClip + 1 },
    });
  }

  // 右下
  if (isOverRight && isOverBottom) {
    const x = Math.max(inX, rSplit);
    const y = Math.max(inY, bSplit);
    const right = inRight;
    const bottom = inBottom;
    result.push({
      rect: { x, y, width: right - x, height: bottom - y },
      clip: { x: rClip, y: bClip, width: width - rClip + 1, height: height - bClip + 1 },
    });
  }

  return result;
}

// 计算两点之间的距离
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// 将数值限制在指定范围内
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 线性插值
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// 将角度转换为弧度
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// 将弧度转换为角度
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
