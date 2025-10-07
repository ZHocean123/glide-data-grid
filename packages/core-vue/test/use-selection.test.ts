import { describe, it, expect } from 'vitest'
import { useSelection } from '../src/composables/use-selection.js'
import { CompactSelection } from '../src/types/data-grid-types.js'

describe('useSelection', () => {
  it('should initialize with empty selection', () => {
    const { selection, hasSelection, selectedCells } = useSelection()
    
    expect(selection.value).toEqual({
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty()
    })
    expect(hasSelection.value).toBe(false)
    expect(selectedCells.value).toEqual([])
  })

  it('should set selection correctly', () => {
    const { setSelection, hasSelection, selectedCells } = useSelection()
    
    const newSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell: [1, 2] as [number, number],
        range: { x: 1, y: 2, width: 1, height: 1 },
        rangeStack: []
      }
    }
    
    setSelection(newSelection)
    
    expect(hasSelection.value).toBe(true)
    expect(selectedCells.value).toEqual([[1, 2]])
  })

  it('should clear selection', () => {
    const { setSelection, clearSelection, hasSelection } = useSelection()
    
    const newSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell: [1, 2] as [number, number],
        range: { x: 1, y: 2, width: 1, height: 1 },
        rangeStack: []
      }
    }
    
    setSelection(newSelection)
    expect(hasSelection.value).toBe(true)
    
    clearSelection()
    expect(hasSelection.value).toBe(false)
  })

  it('should handle range selection correctly', () => {
    const { setSelection, selectedCells } = useSelection()
    
    const rangeSelection = {
      columns: CompactSelection.empty(),
      rows: CompactSelection.empty(),
      current: {
        cell: [0, 0] as [number, number],
        range: { x: 0, y: 0, width: 2, height: 2 },
        rangeStack: []
      }
    }
    
    setSelection(rangeSelection)
    
    const expectedCells = [
      [0, 0], [0, 1],
      [1, 0], [1, 1]
    ]
    
    expect(selectedCells.value).toEqual(expectedCells)
  })
})