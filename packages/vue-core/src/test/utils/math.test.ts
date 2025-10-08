import { describe, it, expect } from 'vitest';
import { 
    combineRects, 
    pointInRect, 
    getClosestRect,
    clamp, 
    lerp,
    distance
} from '../../common/math.js';
import type { Rectangle } from '../../internal/data-grid/data-grid-types.js';

describe('矩形工具函数', () => {
    describe('combineRects', () => {
        it('应该合并两个矩形', () => {
            const rect1: Rectangle = { x: 0, y: 0, width: 10, height: 10 };
            const rect2: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
            
            const result = combineRects(rect1, rect2);
            
            expect(result).toEqual({ x: 0, y: 0, width: 15, height: 15 });
        });

        it('应该处理不相交的矩形', () => {
            const rect1: Rectangle = { x: 0, y: 0, width: 5, height: 5 };
            const rect2: Rectangle = { x: 10, y: 10, width: 5, height: 5 };
            
            const result = combineRects(rect1, rect2);
            
            expect(result).toEqual({ x: 0, y: 0, width: 15, height: 15 });
        });

        it('应该处理一个矩形在另一个内部', () => {
            const rect1: Rectangle = { x: 0, y: 0, width: 10, height: 10 };
            const rect2: Rectangle = { x: 2, y: 2, width: 5, height: 5 };
            
            const result = combineRects(rect1, rect2);
            
            expect(result).toEqual({ x: 0, y: 0, width: 10, height: 10 });
        });

        it('应该处理相同的矩形', () => {
            const rect1: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
            const rect2: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
            
            const result = combineRects(rect1, rect2);
            
            expect(result).toEqual({ x: 5, y: 5, width: 10, height: 10 });
        });
    });

    describe('pointInRect', () => {
        const rect: Rectangle = { x: 10, y: 20, width: 100, height: 50 };

        it('应该检查点是否在矩形内（坐标参数）', () => {
            // 矩形内的点
            expect(pointInRect(rect, 50, 40)).toBe(true);
            expect(pointInRect(rect, 10, 20)).toBe(true); // 左上角
            expect(pointInRect(rect, 109, 69)).toBe(true); // 右下角前一个像素
            
            // 矩形外的点
            expect(pointInRect(rect, 9, 20)).toBe(false); // 左边外
            expect(pointInRect(rect, 110, 40)).toBe(false); // 右边外
            expect(pointInRect(rect, 50, 19)).toBe(false); // 上边外
            expect(pointInRect(rect, 50, 70)).toBe(false); // 下边外
        });

        it('应该检查点是否在矩形内（点数组参数）', () => {
            // 矩形内的点
            expect(pointInRect(rect, [50, 40])).toBe(true);
            expect(pointInRect(rect, [10, 20])).toBe(true); // 左上角
            expect(pointInRect(rect, [109, 69])).toBe(true); // 右下角前一个像素
            
            // 矩形外的点
            expect(pointInRect(rect, [9, 20])).toBe(false); // 左边外
            expect(pointInRect(rect, [110, 40])).toBe(false); // 右边外
            expect(pointInRect(rect, [50, 19])).toBe(false); // 上边外
            expect(pointInRect(rect, [50, 70])).toBe(false); // 下边外
        });

        it('应该处理边界情况', () => {
            const emptyRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
            
            // 空矩形
            expect(pointInRect(emptyRect, 0, 0)).toBe(false);
            expect(pointInRect(emptyRect, [0, 0])).toBe(false);
        });
    });

    describe('getClosestRect', () => {
        const source: Rectangle = { x: 10, y: 10, width: 50, height: 30 };

        it('应该处理水平方向', () => {
            // 右侧
            const rightResult = getClosestRect(source, 70, 25, 'horizontal');
            expect(rightResult).toEqual({ x: 10, y: 10, width: 61, height: 30 });
            
            // 左侧
            const leftResult = getClosestRect(source, 5, 25, 'horizontal');
            expect(leftResult).toEqual({ x: 5, y: 10, width: 55, height: 30 });
        });

        it('应该处理垂直方向', () => {
            // 下方
            const downResult = getClosestRect(source, 35, 50, 'vertical');
            expect(downResult).toEqual({ x: 10, y: 10, width: 50, height: 41 });
            
            // 上方
            const upResult = getClosestRect(source, 35, 5, 'vertical');
            expect(upResult).toEqual({ x: 10, y: 5, width: 50, height: 35 });
        });

        it('应该处理正交方向', () => {
            // 右下
            const rightDownResult = getClosestRect(source, 70, 50, 'orthogonal');
            expect(rightDownResult).toEqual({ x: 10, y: 10, width: 61, height: 30 });
            
            // 左上（不被允许）
            const leftUpResult = getClosestRect(source, 5, 5, 'orthogonal');
            expect(leftUpResult).toEqual({ x: 10, y: 10, width: 50, height: 30 });
        });

        it('应该处理任意方向', () => {
            // 右下
            const rightDownResult = getClosestRect(source, 70, 50, 'any');
            expect(rightDownResult).toEqual({ x: 10, y: 10, width: 61, height: 41 });
            
            // 左上
            const leftUpResult = getClosestRect(source, 5, 5, 'any');
            expect(leftUpResult).toEqual({ x: 5, y: 5, width: 55, height: 35 });
        });
    });
});

describe('数学工具函数', () => {
    describe('clamp', () => {
        it('应该将值限制在指定范围内', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });

        it('应该处理边界情况', () => {
            expect(clamp(5, 10, 0)).toBe(5); // min > max
            expect(clamp(NaN, 0, 10)).toBeNaN();
            expect(clamp(5, NaN, 10)).toBeNaN();
            expect(clamp(5, 0, NaN)).toBeNaN();
        });
    });

    describe('lerp', () => {
        it('应该执行线性插值', () => {
            expect(lerp(0, 10, 0.5)).toBe(5);
            expect(lerp(0, 10, 0)).toBe(0);
            expect(lerp(0, 10, 1)).toBe(10);
            expect(lerp(10, 0, 0.5)).toBe(5);
            expect(lerp(-10, 10, 0.5)).toBe(0);
        });

        it('应该处理边界情况', () => {
            expect(lerp(0, 10, -0.5)).toBe(-5);
            expect(lerp(0, 10, 1.5)).toBe(15);
            expect(lerp(NaN, 10, 0.5)).toBeNaN();
            expect(lerp(0, NaN, 0.5)).toBeNaN();
            expect(lerp(0, 10, NaN)).toBeNaN();
        });
    });

    describe('distance', () => {
        it('应该计算两点之间的距离', () => {
            expect(distance(0, 0, 0, 0)).toBe(0);
            expect(distance(0, 0, 3, 4)).toBe(5);
            expect(distance(0, 0, 5, 12)).toBe(13);
            expect(distance(1, 1, 4, 5)).toBe(5);
        });

        it('应该处理负坐标', () => {
            expect(distance(-3, -4, 0, 0)).toBe(5);
            expect(distance(-1, -1, -4, -5)).toBe(5);
        });

        it('应该处理相同点', () => {
            expect(distance(10, 20, 10, 20)).toBe(0);
            expect(distance(-5, -10, -5, -10)).toBe(0);
        });

        it('应该处理边界情况', () => {
            expect(distance(NaN, 0, 0, 0)).toBeNaN();
            expect(distance(0, NaN, 0, 0)).toBeNaN();
            expect(distance(0, 0, NaN, 0)).toBeNaN();
            expect(distance(0, 0, 0, NaN)).toBeNaN();
        });
    });
});

describe('复杂场景测试', () => {
    describe('矩形组合与点检测', () => {
        it('应该正确处理多个矩形的组合和点检测', () => {
            const rect1: Rectangle = { x: 0, y: 0, width: 10, height: 10 };
            const rect2: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
            const rect3: Rectangle = { x: 15, y: 0, width: 5, height: 20 };
            
            // 合并前两个矩形
            const combined12 = combineRects(rect1, rect2);
            expect(combined12).toEqual({ x: 0, y: 0, width: 15, height: 15 });
            
            // 再合并第三个矩形
            const combined123 = combineRects(combined12, rect3);
            expect(combined123).toEqual({ x: 0, y: 0, width: 20, height: 20 });
            
            // 测试点是否在最终合并的矩形内
            expect(pointInRect(combined123, [10, 10])).toBe(true);
            expect(pointInRect(combined123, [17, 5])).toBe(true);
            expect(pointInRect(combined123, [20, 20])).toBe(false); // 边界外
        });
    });

    describe('矩形与最近点计算', () => {
        it('应该正确计算点相对于矩形的位置', () => {
            const rect: Rectangle = { x: 10, y: 10, width: 50, height: 30 };
            
            // 测试各个方向的点
            expect(pointInRect(rect, [35, 25])).toBe(true); // 中心点
            expect(pointInRect(rect, [10, 25])).toBe(true); // 左边中点
            expect(pointInRect(rect, [60, 25])).toBe(true); // 右边中点
            expect(pointInRect(rect, [35, 10])).toBe(true); // 上边中点
            expect(pointInRect(rect, [35, 40])).toBe(true); // 下边中点
            
            // 计算最近矩形
            const closestRight = getClosestRect(rect, 80, 25, 'horizontal');
            expect(closestRight.width).toBe(71);
            
            const closestLeft = getClosestRect(rect, 0, 25, 'horizontal');
            expect(closestLeft.x).toBe(0);
            
            const closestDown = getClosestRect(rect, 35, 60, 'vertical');
            expect(closestDown.height).toBe(51);
            
            const closestUp = getClosestRect(rect, 35, 0, 'vertical');
            expect(closestUp.y).toBe(0);
        });
    });

    describe('数学函数组合使用', () => {
        it('应该正确组合使用数学函数', () => {
            // 使用clamp限制lerp的结果
            const start = 0;
            const end = 100;
            const t = 1.5; // 超出范围
            
            const lerpResult = lerp(start, end, t);
            expect(lerpResult).toBe(150);
            
            const clampedResult = clamp(lerpResult, 0, 100);
            expect(clampedResult).toBe(100);
            
            // 计算距离并限制范围
            const dist = distance(0, 0, 30, 40);
            expect(dist).toBe(50);
            
            const clampedDist = clamp(dist, 0, 25);
            expect(clampedDist).toBe(25);
        });
    });
});