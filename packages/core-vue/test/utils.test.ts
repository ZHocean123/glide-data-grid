import { describe, it, expect } from 'vitest'
import { clamp, range, maybe, emptyGridSelection } from '../src/common/utils.js'
import { CompactSelection } from '../src/types/data-grid-types.js'

describe('utils', () => {
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-1, 0, 10)).toBe(0)
      expect(clamp(11, 0, 10)).toBe(10)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
      expect(clamp(5, 5, 5)).toBe(5)
    })
  })

  describe('range', () => {
    it('should generate range with positive step', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4])
      expect(range(1, 4)).toEqual([1, 2, 3])
      expect(range(0, 5, 2)).toEqual([0, 2, 4])
    })

    it('should generate range with negative step', () => {
      expect(range(5, 0, -1)).toEqual([5, 4, 3, 2, 1])
      expect(range(4, 1, -1)).toEqual([4, 3, 2])
      expect(range(5, 0, -2)).toEqual([5, 3, 1])
    })

    it('should handle single element range', () => {
      expect(range(5, 6)).toEqual([5])
      expect(range(5, 5)).toEqual([])
    })
  })

  describe('maybe', () => {
    it('should return function result when no error', () => {
      const result = maybe(() => 'success', 'default')
      expect(result).toBe('success')
    })

    it('should return default value when function throws', () => {
      const result = maybe(() => {
        throw new Error('test error')
      }, 'default')
      expect(result).toBe('default')
    })

    it('should handle complex functions', () => {
      const obj = { value: 42 }
      const result = maybe(() => obj.value, 0)
      expect(result).toBe(42)
    })
  })

  describe('emptyGridSelection', () => {
    it('should return empty grid selection', () => {
      const selection = emptyGridSelection()
      
      expect(selection).toEqual({
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
        current: undefined
      })
      
      expect(selection.columns).toBeInstanceOf(CompactSelection)
      expect(selection.rows).toBeInstanceOf(CompactSelection)
    })
  })

  describe('CompactSelection', () => {
    it('should create empty selection', () => {
      const selection = CompactSelection.empty()
      expect(selection.length).toBe(0)
      expect(selection.items).toEqual([])
    })

    it('should create from single selection', () => {
      const selection = CompactSelection.fromSingleSelection(5)
      expect(selection.hasIndex(5)).toBe(true)
      expect(selection.hasIndex(4)).toBe(false)
      expect(selection.hasIndex(6)).toBe(false)
    })

    it('should create from array', () => {
      const selection = CompactSelection.fromArray([1, 2, 3, 5, 6])
      expect(selection.hasIndex(1)).toBe(true)
      expect(selection.hasIndex(2)).toBe(true)
      expect(selection.hasIndex(4)).toBe(false)
      expect(selection.hasIndex(5)).toBe(true)
    })

    it('should add and remove selections', () => {
      let selection = CompactSelection.empty()
      
      selection = selection.add(5)
      expect(selection.hasIndex(5)).toBe(true)
      
      selection = selection.add([1, 3])
      expect(selection.hasIndex(1)).toBe(true)
      expect(selection.hasIndex(2)).toBe(true)
      
      selection = selection.remove(2)
      expect(selection.hasIndex(2)).toBe(false)
    })

    it('should iterate over selections', () => {
      const selection = CompactSelection.fromArray([1, 2, 3])
      const items = Array.from(selection)
      expect(items).toEqual([1, 2, 3])
    })

    it('should convert to array', () => {
      const selection = CompactSelection.fromArray([1, 2, 3])
      expect(selection.toArray()).toEqual([1, 2, 3])
    })
  })
})