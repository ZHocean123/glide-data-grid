import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useSelectionBehavior } from '../../data-editor/use-selection-behavior.js';
import { CompactSelection, emptyGridSelection } from '../../internal/data-grid/data-grid-types.js';

describe('useSelectionBehavior', () => {
  let mockOptions: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOptions = {
      initialSelection: emptyGridSelection,
      selectionBlending: 'mixed',
      enableMultiSelection: true,
      rowMarkerOffset: ref(0),
      columns: ref(10),
      rows: ref(100),
      onSelectionChanged: vi.fn()
    };
  });

  describe('初始化', () => {
    it('应该正确初始化选择状态', () => {
      const { selection, hasSelection, selectedCell } = useSelectionBehavior(mockOptions);
      
      expect(selection.value).toEqual(emptyGridSelection);
      expect(hasSelection.value).toBe(false);
      expect(selectedCell.value).toBeUndefined();
    });

    it('应该使用自定义初始选择', () => {
      const customSelection = {
        current: {
          cell: [1, 1] as const,
          range: { x: 1, y: 1, width: 1, height: 1 },
          rangeStack: []
        },
        columns: CompactSelection.fromSingleSelection(1),
        rows: CompactSelection.fromSingleSelection(1)
      };
      
      mockOptions.initialSelection = customSelection;
      
      const { selection, hasSelection, selectedCell } = useSelectionBehavior(mockOptions);
      
      expect(selection.value).toEqual(customSelection);
      expect(hasSelection.value).toBe(true);
      expect(selectedCell.value).toEqual([1, 1]);
    });
  });

  describe('单元格选择', () => {
    it('应该正确选择单个单元格', () => {
      const { setCurrentSelection, selectedCell, selectedRange } = useSelectionBehavior(mockOptions);
      
      const cell = [2, 3] as const;
      const range = { x: 2, y: 3, width: 1, height: 1 };
      
      setCurrentSelection(cell, range, 'click');
      
      expect(selectedCell.value).toEqual(cell);
      expect(selectedRange.value).toEqual(range);
    });

    it('应该正确选择矩形区域', () => {
      const { setCurrentSelection, selectedRange } = useSelectionBehavior(mockOptions);
      
      const cell = [1, 1] as const;
      const range = { x: 1, y: 1, width: 3, height: 4 };
      
      setCurrentSelection(cell, range, 'drag');
      
      expect(selectedRange.value).toEqual(range);
    });

    it('应该验证单元格位置是否有效', () => {
      const { isValidLocation } = useSelectionBehavior(mockOptions);
      
      expect(isValidLocation(0, 0)).toBe(true);
      expect(isValidLocation(9, 99)).toBe(true);
      expect(isValidLocation(10, 0)).toBe(false); // 列超出范围
      expect(isValidLocation(0, 100)).toBe(false); // 行超出范围
      expect(isValidLocation(-1, 0)).toBe(false); // 负数列
      expect(isValidLocation(0, -1)).toBe(false); // 负数行
    });
  });

  describe('列选择', () => {
    it('应该正确选择单列', () => {
      const { setColumnSelection, selectedColumns } = useSelectionBehavior(mockOptions);
      
      setColumnSelection(2);
      
      expect(selectedColumns.value.hasIndex(2)).toBe(true);
    });

    it('应该支持多列选择', () => {
      const { setColumnSelection, selectedColumns } = useSelectionBehavior(mockOptions);
      
      setColumnSelection(2, 'additive');
      setColumnSelection(4, 'additive');
      
      expect(selectedColumns.value.hasIndex(2)).toBe(true);
      expect(selectedColumns.value.hasIndex(4)).toBe(true);
    });

    it('应该支持排他性列选择', () => {
      const { setColumnSelection, selectedColumns } = useSelectionBehavior(mockOptions);
      
      setColumnSelection(2);
      setColumnSelection(4, 'exclusive');
      
      expect(selectedColumns.value.hasIndex(2)).toBe(false);
      expect(selectedColumns.value.hasIndex(4)).toBe(true);
    });
  });

  describe('行选择', () => {
    it('应该正确选择单行', () => {
      const { setRowSelection, selectedRows } = useSelectionBehavior(mockOptions);
      
      setRowSelection(5);
      
      expect(selectedRows.value.hasIndex(5)).toBe(true);
    });

    it('应该支持多行选择', () => {
      const { setRowSelection, selectedRows } = useSelectionBehavior(mockOptions);
      
      setRowSelection(5, 'additive');
      setRowSelection(10, 'additive');
      
      expect(selectedRows.value.hasIndex(5)).toBe(true);
      expect(selectedRows.value.hasIndex(10)).toBe(true);
    });
  });

  describe('选择操作', () => {
    it('应该正确开始选择', () => {
      const { beginSelection, isSelecting, selectionState } = useSelectionBehavior(mockOptions);
      
      const location = [2, 3] as const;
      beginSelection(location, 'click');
      
      expect(isSelecting.value).toBe(true);
      expect(selectionState.selectionStart).toEqual(location);
    });

    it('应该正确更新选择', () => {
      const { beginSelection, updateSelection, selectedRange } = useSelectionBehavior(mockOptions);
      
      const startLocation = [2, 3] as const;
      const endLocation = [4, 6] as const;
      
      beginSelection(startLocation, 'drag');
      updateSelection(endLocation);
      
      expect(selectedRange.value).toEqual({
        x: 2,
        y: 3,
        width: 3,
        height: 4
      });
    });

    it('应该正确结束选择', () => {
      const { beginSelection, endSelection, isSelecting } = useSelectionBehavior(mockOptions);
      
      beginSelection([2, 3] as const, 'click');
      endSelection();
      
      expect(isSelecting.value).toBe(false);
    });

    it('应该正确清除选择', () => {
      const { setCurrentSelection, clearSelection, hasSelection } = useSelectionBehavior(mockOptions);
      
      setCurrentSelection([1, 1] as const, { x: 1, y: 1, width: 1, height: 1 }, 'click');
      clearSelection();
      
      expect(hasSelection.value).toBe(false);
    });
  });

  describe('全选功能', () => {
    it('应该正确全选', () => {
      const { selectAll, selectedRange, selectedColumns, selectedRows } = useSelectionBehavior(mockOptions);
      
      selectAll();
      
      expect(selectedRange.value).toEqual({
        x: 0,
        y: 0,
        width: 10,
        height: 100
      });
      expect(selectedColumns.value.hasIndex(0)).toBe(true);
      expect(selectedColumns.value.hasIndex(9)).toBe(true);
      expect(selectedRows.value.hasIndex(0)).toBe(true);
      expect(selectedRows.value.hasIndex(99)).toBe(true);
    });
  });

  describe('选择扩展', () => {
    it('应该正确扩展选择到整行', () => {
      const { extendSelectionToRow, selectedRange } = useSelectionBehavior(mockOptions);
      
      extendSelectionToRow(5);
      
      expect(selectedRange.value).toEqual({
        x: 0,
        y: 5,
        width: 10,
        height: 1
      });
    });

    it('应该正确扩展选择到整列', () => {
      const { extendSelectionToColumn, selectedRange } = useSelectionBehavior(mockOptions);
      
      extendSelectionToColumn(3);
      
      expect(selectedRange.value).toEqual({
        x: 3,
        y: 0,
        width: 1,
        height: 100
      });
    });
  });

  describe('选择混合模式', () => {
    it('应该在混合模式下正确处理选择', () => {
      const { setCurrentSelection, selection } = useSelectionBehavior({
        ...mockOptions,
        selectionBlending: 'mixed'
      });
      
      setCurrentSelection([1, 1] as const, { x: 1, y: 1, width: 1, height: 1 }, 'click');
      setCurrentSelection([2, 2] as const, { x: 2, y: 2, width: 1, height: 1 }, 'drag');
      
      expect(selection.value.current?.cell).toEqual([2, 2]);
    });

    it('应该在添加模式下正确处理选择', () => {
      const { setCurrentSelection, selection } = useSelectionBehavior({
        ...mockOptions,
        selectionBlending: 'additive'
      });
      
      setCurrentSelection([1, 1] as const, { x: 1, y: 1, width: 1, height: 1 }, 'click');
      setCurrentSelection([2, 2] as const, { x: 2, y: 2, width: 1, height: 1 }, 'keyboard-select');
      
      expect(selection.value.current?.rangeStack).toHaveLength(1);
    });
  });

  describe('回调函数', () => {
    it('应该在选择变化时调用回调', () => {
      const { setCurrentSelection } = useSelectionBehavior(mockOptions);
      
      setCurrentSelection([1, 1] as const, { x: 1, y: 1, width: 1, height: 1 }, 'click');
      
      expect(mockOptions.onSelectionChanged).toHaveBeenCalled();
    });

    it('应该在清除选择时调用回调', () => {
      const { clearSelection } = useSelectionBehavior(mockOptions);
      
      clearSelection();
      
      expect(mockOptions.onSelectionChanged).toHaveBeenCalled();
    });
  });

  describe('工具函数', () => {
    it('应该正确创建矩形选择', () => {
      const { createRectSelection } = useSelectionBehavior(mockOptions);
      
      const start = [1, 1] as const;
      const end = [3, 4] as const;
      
      const rect = createRectSelection(start, end);
      
      expect(rect).toEqual({
        x: 1,
        y: 1,
        width: 3,
        height: 4
      });
    });

    it('应该正确处理反向选择', () => {
      const { createRectSelection } = useSelectionBehavior(mockOptions);
      
      const start = [3, 4] as const;
      const end = [1, 1] as const;
      
      const rect = createRectSelection(start, end);
      
      expect(rect).toEqual({
        x: 1,
        y: 1,
        width: 3,
        height: 4
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理无效的选择位置', () => {
      const { setCurrentSelection, selectedCell } = useSelectionBehavior(mockOptions);
      
      setCurrentSelection(undefined, undefined, 'click');
      
      expect(selectedCell.value).toBeUndefined();
    });

    it('应该处理空的选择范围', () => {
      const { setCurrentSelection, selectedRange } = useSelectionBehavior(mockOptions);
      
      setCurrentSelection(undefined, undefined, 'click');
      
      expect(selectedRange.value).toBeUndefined();
    });
  });
});