import { describe, it, expect } from 'vitest';
import { degreesToRadians, getSquareBB, pointIsWithinBB, direction } from '../src/common/utils';
import { getScrollBarWidth } from '../src/common/utils';

describe('Common Utilities', () => {
    describe('degreesToRadians', () => {
        it('should convert degrees to radians', () => {
            expect(degreesToRadians(0)).toBe(0);
            expect(degreesToRadians(180)).toBe(Math.PI);
            expect(degreesToRadians(360)).toBe(2 * Math.PI);
            expect(degreesToRadians(90)).toBe(Math.PI / 2);
        });
    });

    describe('getSquareBB', () => {
        it('should calculate square bounding box correctly', () => {
            const bb = getSquareBB(100, 100, 20);
            expect(bb.x1).toBe(90);
            expect(bb.y1).toBe(90);
            expect(bb.x2).toBe(110);
            expect(bb.y2).toBe(110);
        });
    });

    describe('pointIsWithinBB', () => {
        it('should detect point inside bounding box', () => {
            const bb = { x1: 0, y1: 0, x2: 100, y2: 100 };
            expect(pointIsWithinBB(50, 50, bb)).toBe(true);
            expect(pointIsWithinBB(0, 0, bb)).toBe(true);
            expect(pointIsWithinBB(100, 100, bb)).toBe(true);
        });

        it('should detect point outside bounding box', () => {
            const bb = { x1: 0, y1: 0, x2: 100, y2: 100 };
            expect(pointIsWithinBB(150, 50, bb)).toBe(false);
            expect(pointIsWithinBB(50, 150, bb)).toBe(false);
            expect(pointIsWithinBB(-10, 50, bb)).toBe(false);
        });
    });

    describe('direction', () => {
        it('should detect RTL text', () => {
            expect(direction('سلام')).toBe('rtl');
            expect(direction('שלום')).toBe('rtl');
        });

        it('should detect non-RTL text', () => {
            expect(direction('hello')).toBe('not-rtl');
            expect(direction('123')).toBe('not-rtl');
            expect(direction('')).toBe('not-rtl');
        });
    });

    describe('getScrollBarWidth', () => {
        it('should return a non-negative number', () => {
            const width = getScrollBarWidth();
            expect(width).toBeGreaterThanOrEqual(0);
        });
    });
});
