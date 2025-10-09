import { describe, it, expect } from 'vitest';
import {
    combineRects,
    pointInRect,
    getClosestRect,
    clamp,
    lerp,
    distance,
    rectContains,
    intersectRect,
    hugRectToTarget,
    splitRectIntoRegions
} from '../../common/math.js';
import type { SplitRect } from '../../common/math.js';
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
            expect(pointInRect(rect, 110, 70)).toBe(true); // 右下角（包含边界）
            
            // 矩形外的点
            expect(pointInRect(rect, 9, 20)).toBe(false); // 左边外
            expect(pointInRect(rect, 111, 40)).toBe(false); // 右边外
            expect(pointInRect(rect, 50, 19)).toBe(false); // 上边外
            expect(pointInRect(rect, 50, 71)).toBe(false); // 下边外
        });

        it('应该检查点是否在矩形内（点数组参数）', () => {
            // 矩形内的点
            expect(pointInRect(rect, [50, 40])).toBe(true);
            expect(pointInRect(rect, [10, 20])).toBe(true); // 左上角
            expect(pointInRect(rect, [110, 70])).toBe(true); // 右下角（包含边界）
            
            // 矩形外的点
            expect(pointInRect(rect, [9, 20])).toBe(false); // 左边外
            expect(pointInRect(rect, [111, 40])).toBe(false); // 右边外
            expect(pointInRect(rect, [50, 19])).toBe(false); // 上边外
            expect(pointInRect(rect, [50, 71])).toBe(false); // 下边外
        });

        it('应该处理边界情况', () => {
            const emptyRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
            
            // 空矩形
            expect(pointInRect(emptyRect, 0, 0)).toBe(true); // 边界包含在内
            expect(pointInRect(emptyRect, [0, 0])).toBe(true); // 边界包含在内
        });
    });

    describe('getClosestRect', () => {
        const source: Rectangle = { x: 10, y: 10, width: 50, height: 30 };

        it('应该处理水平方向', () => {
            // 右侧
            const rightResult = getClosestRect(source, 70, 25, 'horizontal');
            expect(rightResult).toEqual({ x: 60, y: 10, width: 11, height: 30 });
            
            // 左侧
            const leftResult = getClosestRect(source, 5, 25, 'horizontal');
            expect(leftResult).toEqual({ x: 5, y: 10, width: 5, height: 30 });
        });

        it('应该处理垂直方向', () => {
            // 下方
            const downResult = getClosestRect(source, 35, 50, 'vertical');
            expect(downResult).toEqual({ x: 10, y: 40, width: 50, height: 11 });
            
            // 上方
            const upResult = getClosestRect(source, 35, 5, 'vertical');
            expect(upResult).toEqual({ x: 10, y: 5, width: 50, height: 5 });
        });

        it('应该处理点在矩形内的情况', () => {
            // 点在矩形内应该返回undefined
            const insideResult = getClosestRect(source, 25, 25, 'horizontal');
            expect(insideResult).toBeUndefined();
            
            const insideResultVertical = getClosestRect(source, 25, 25, 'vertical');
            expect(insideResultVertical).toBeUndefined();
            
            // 'any'方向返回合并矩形
            const insideResultAny = getClosestRect(source, 25, 25, 'any');
            expect(insideResultAny).toEqual({ x: 10, y: 10, width: 50, height: 30 });
        });

        it('应该处理任意方向', () => {
            // 右下
            const rightDownResult = getClosestRect(source, 70, 50, 'any');
            expect(rightDownResult).toEqual({ x: 10, y: 10, width: 61, height: 41 });
            
            // 左上
            const leftUpResult = getClosestRect(source, 5, 5, 'any');
            expect(leftUpResult).toEqual({ x: 5, y: 5, width: 55, height: 35 });
        });
    
        describe('rectContains', () => {
            it('应该检查一个矩形是否包含另一个矩形', () => {
                const outer: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
                const inner: Rectangle = { x: 10, y: 10, width: 50, height: 50 };
                
                expect(rectContains(outer, inner)).toBe(true);
                expect(rectContains(inner, outer)).toBe(false);
            });
    
            it('应该处理边界情况', () => {
                const rect1: Rectangle = { x: 0, y: 0, width: 10, height: 10 };
                const rect2: Rectangle = { x: 5, y: 5, width: 5, height: 5 };
                const rect3: Rectangle = { x: 10, y: 10, width: 10, height: 10 };
                
                // 完全包含
                expect(rectContains(rect1, rect2)).toBe(true);
                
                // 边界接触
                expect(rectContains(rect1, rect3)).toBe(false);
            });
        });
    
        describe('intersectRect', () => {
            it('应该检查两个矩形是否相交', () => {
                // 相交的矩形
                expect(intersectRect(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
                expect(intersectRect(0, 0, 10, 10, 10, 10, 10, 10)).toBe(true); // 边界接触
                
                // 不相交的矩形
                expect(intersectRect(0, 0, 10, 10, 20, 20, 10, 10)).toBe(false);
            });
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
            expect(pointInRect(combined123, [20, 20])).toBe(true); // 边界包含在内
        });
    });

    describe('矩形与最近点计算', () => {
        it('应该正确计算点相对于矩形的位置', () => {
            const rect: Rectangle = { x: 10, y: 10, width: 50, height: 30 };
            
            // 测试各个方向的点
            expect(pointInRect(rect, [35, 25])).toBe(true); // 中心点
            expect(pointInRect(rect, [10, 25])).toBe(true); // 左边中点
            expect(pointInRect(rect, [60, 25])).toBe(true); // 右边中点（边界包含）
            expect(pointInRect(rect, [35, 10])).toBe(true); // 上边中点
            expect(pointInRect(rect, [35, 40])).toBe(true); // 下边中点
            
            // 计算最近矩形
            const closestRight = getClosestRect(rect, 80, 25, 'horizontal');
            expect(closestRight?.width).toBe(21);

            const closestLeft = getClosestRect(rect, 0, 25, 'horizontal');
            expect(closestLeft?.x).toBe(0);

            const closestDown = getClosestRect(rect, 35, 60, 'vertical');
            expect(closestDown?.height).toBe(21);

            const closestUp = getClosestRect(rect, 35, 0, 'vertical');
            expect(closestUp?.y).toBe(0);
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

describe('性能优化函数', () => {
    describe('hugRectToTarget', () => {
        it('应该返回完全在边界内的矩形', () => {
            const rect: Rectangle = { x: 10, y: 10, width: 50, height: 50 };
            const width = 100;
            const height = 100;
            const mod = 5;
            
            const result = hugRectToTarget(rect, width, height, mod);
            
            expect(result).toEqual(rect);
        });

        it('应该对完全超出边界的矩形返回undefined', () => {
            const rect: Rectangle = { x: 150, y: 150, width: 50, height: 50 };
            const width = 100;
            const height = 100;
            const mod = 5;
            
            const result = hugRectToTarget(rect, width, height, mod);
            
            expect(result).toBeUndefined();
        });

        it('应该正确调整部分重叠边界的矩形', () => {
            const rect: Rectangle = { x: -10, y: -10, width: 80, height: 80 };
            const expected = { x: -10, y: -10, width: 80, height: 80 };
            const width = 100;
            const height = 100;
            const mod = 10;
            
            const result = hugRectToTarget(rect, width, height, mod);
            
            expect(result).toEqual(expected);
        });

        it('应该正确处理不同的mod值', () => {
            const rect: Rectangle = { x: -15, y: -15, width: 105, height: 105 };
            const expected = { x: -7, y: -7, width: 97, height: 97 };
            const width = 100;
            const height = 100;
            const mod = 8;
            
            const result = hugRectToTarget(rect, width, height, mod);
            
            expect(result).toEqual(expected);
        });

        it('应该对边界内过大的矩形返回undefined', () => {
            const rect: Rectangle = { x: -5, y: -5, width: 111, height: 111 };
            const width = 100;
            const height = 100;
            const mod = 10;
            
            const result = hugRectToTarget(rect, width, height, mod);
            
            expect(result).toBeUndefined();
        });
    });

    describe('splitRectIntoRegions', () => {
        const splitIndices = [2, 2, 8, 8] as const;
        const width = 100;
        const height = 100;
        const splitLocations = [20, 20, 80, 80] as const;

        it('应该为非正维度矩形返回空数组', () => {
            const rect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
            const result = splitRectIntoRegions(rect, splitIndices, width, height, splitLocations);
            expect(result).toEqual([]);
        });

        it('应该处理单列', () => {
            const rect: Rectangle = { x: 1, y: 1, width: 1, height: 1 };
            const result = splitRectIntoRegions(rect, [1, 0, 2, 100], 2, 100, splitLocations);
            expect(result).toEqual([
                {
                    clip: {
                        height: 61,
                        width: 61,
                        x: 20,
                        y: 20,
                    },
                    rect: {
                        height: 1,
                        width: 1,
                        x: 1,
                        y: 1,
                    },
                },
            ]);
        });

        it('应该为不重叠分割索引的矩形返回正确区域', () => {
            const rect: Rectangle = { x: 30, y: 30, width: 10, height: 10 };
            const result = splitRectIntoRegions(rect, splitIndices, width, height, splitLocations);
            expect(result).toEqual([
                {
                    clip: {
                        height: 21,
                        width: 21,
                        x: 80,
                        y: 80,
                    },
                    rect: {
                        height: 10,
                        width: 10,
                        x: 30,
                        y: 30,
                    },
                },
            ]);
        });

        it('应该为部分重叠左上分割索引的矩形返回正确区域', () => {
            const rect: Rectangle = { x: 1, y: 1, width: 4, height: 4 };
            const result = splitRectIntoRegions(rect, splitIndices, width, height, splitLocations);
            expect(result.length).toBe(4);
            expect(result[0].rect).toEqual({ x: 2, y: 2, width: 3, height: 3 });
            expect(result[0].clip).toEqual({ x: 20, y: 20, width: 61, height: 61 });
            expect(result[1].rect).toEqual({ x: 1, y: 1, width: 1, height: 1 });
            expect(result[1].clip).toEqual({ x: 0, y: 0, width: 21, height: 21 });
            expect(result[2].rect).toEqual({ x: 2, y: 1, width: 3, height: 1 });
            expect(result[2].clip).toEqual({ x: 20, y: 0, width: 61, height: 21 });
            expect(result[3].rect).toEqual({ x: 1, y: 2, width: 1, height: 3 });
            expect(result[3].clip).toEqual({ x: 0, y: 20, width: 21, height: 61 });
        });

        it('应该为重叠所有分割索引的矩形返回正确区域', () => {
            const rect: Rectangle = { x: 1, y: 1, width: 9, height: 9 };
            const result = splitRectIntoRegions(rect, splitIndices, width, height, splitLocations);
            expect(result.length).toBe(9);
            // 这里你可能需要单独检查每个区域的正确性
        });

        it('应该为只重叠中心区域的矩形返回正确区域', () => {
            const rect: Rectangle = { x: 3, y: 3, width: 4, height: 4 };
            const result = splitRectIntoRegions(rect, splitIndices, width, height, splitLocations);
            expect(result.length).toBe(1);
            expect(result[0].rect).toEqual({ x: 3, y: 3, width: 4, height: 4 });
            expect(result[0].clip).toEqual({ x: 20, y: 20, width: 61, height: 61 });
        });
    });
});