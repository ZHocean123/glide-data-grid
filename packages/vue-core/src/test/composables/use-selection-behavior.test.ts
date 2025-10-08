import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useSelectionBehavior } from '../../data-editor/use-selection-behavior.js';
import { CompactSelection } from '../../internal/data-grid/data-grid-types.js';
import type { GridSelection, Item, Rectangle } from '../../internal/data-grid/data-grid-types.js';

describe('useSelectionBehavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本选择行为', () => {
    it('应该正确初始化选择状态', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        initialSelection: {
          current: {
            cell: [0, 0] as Item,
            range: { x: 0, y: 0, width: 1, height: 1 },
            rangeStack: []
          },
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty()
        },
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      expect(selectionBehavior).toBeDefined();
      expect(selectionBehavior.selection).toBeDefined();
      expect(selectionBehavior.hasSelection.value).toBe(true);
      expect(selectionBehavior.selectedCell.value).toEqual([0, 0]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    });

    it('应该检查位置是否有效', () => {
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100)
      });

      // 有效位置
      expect(selectionBehavior.isValidLocation(5, 50)).toBe(true);
      expect(selectionBehavior.isValidLocation(0, 0)).toBe(true);
      expect(selectionBehavior.isValidLocation(9, 99)).toBe(true);
      
      // 无效位置
      expect(selectionBehavior.isValidLocation(-1, 0)).toBe(false);
      expect(selectionBehavior.isValidLocation(10, 0)).toBe(false);
      expect(selectionBehavior.isValidLocation(0, -1)).toBe(false);
      expect(selectionBehavior.isValidLocation(0, 100)).toBe(false);
    });

    it('应该创建矩形选择', () => {
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100)
      });

      // 从左上到右下
      const rect1 = selectionBehavior.createRectSelection([2, 3] as Item, [5, 6] as Item);
      expect(rect1).toEqual({ x: 2, y: 3, width: 4, height: 4 });

      // 从右下到左上
      const rect2 = selectionBehavior.createRectSelection([5, 6] as Item, [2, 3] as Item);
      expect(rect2).toEqual({ x: 2, y: 3, width: 4, height: 4 });

      // 相同位置
      const rect3 = selectionBehavior.createRectSelection([3, 4] as Item, [3, 4] as Item);
      expect(rect3).toEqual({ x: 3, y: 4, width: 1, height: 1 });
    });
  });

  describe('选择操作', () => {
    it('应该设置当前选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 设置选择
      const cell: Item = [5, 5];
      const range: Rectangle = { x: 5, y: 5, width: 1, height: 1 };
      selectionBehavior.setCurrentSelection(cell, range, 'click');
      
      expect(selectionBehavior.selectedCell.value).toEqual([5, 5]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 5, y: 5, width: 1, height: 1 });
      expect(selectionBehavior.hasSelection.value).toBe(true);
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该清除选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        initialSelection: {
          current: {
            cell: [2, 2] as Item,
            range: { x: 2, y: 2, width: 3, height: 3 },
            rangeStack: []
          },
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty()
        },
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      expect(selectionBehavior.hasSelection.value).toBe(true);

      // 清除选择
      selectionBehavior.clearSelection();
      
      expect(selectionBehavior.hasSelection.value).toBe(false);
      expect(selectionBehavior.selectedCell.value).toBeUndefined();
      expect(selectionBehavior.selectedRange.value).toBeUndefined();
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该全选', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(5),
        rows: ref(10),
        onSelectionChanged
      });

      // 全选
      selectionBehavior.selectAll();
      
      expect(selectionBehavior.selectedCell.value).toEqual([0, 0]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 0, y: 0, width: 5, height: 10 });
      expect(selectionBehavior.selectedColumns.value.length).toBe(5);
      expect(selectionBehavior.selectedRows.value.length).toBe(10);
      expect(onSelectionChanged).toHaveBeenCalled();
    });
  });

  describe('列选择', () => {
    it('应该选择单列', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 选择列
      selectionBehavior.selectColumn(3);
      
      expect(selectionBehavior.selectedColumns.value.hasIndex(3)).toBe(true);
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该设置列选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 设置列选择
      selectionBehavior.setColumnSelection(3);
      
      expect(selectionBehavior.selectedColumns.value.hasIndex(3)).toBe(true);
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该支持不同的混合模式', () => {
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        selectionBlending: 'additive'
      });

      // 添加模式
      selectionBehavior.setColumnSelection(3, 'additive');
      expect(selectionBehavior.selectedColumns.value.hasIndex(3)).toBe(true);

      // 排他模式
      selectionBehavior.setColumnSelection(5, 'exclusive');
      expect(selectionBehavior.selectedColumns.value.hasIndex(3)).toBe(false);
      expect(selectionBehavior.selectedColumns.value.hasIndex(5)).toBe(true);

      // 混合模式
      selectionBehavior.setColumnSelection(7, 'mixed');
      expect(selectionBehavior.selectedColumns.value.hasIndex(5)).toBe(false);
      expect(selectionBehavior.selectedColumns.value.hasIndex(7)).toBe(true);
    });
  });

  describe('行选择', () => {
    it('应该选择单行', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 选择行
      selectionBehavior.selectRow(7);
      
      expect(selectionBehavior.selectedRows.value.hasIndex(7)).toBe(true);
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该设置行选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 设置行选择
      selectionBehavior.setRowSelection(7);
      
      expect(selectionBehavior.selectedRows.value.hasIndex(7)).toBe(true);
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该支持不同的混合模式', () => {
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        selectionBlending: 'additive'
      });

      // 添加模式
      selectionBehavior.setRowSelection(4, 'additive');
      expect(selectionBehavior.selectedRows.value.hasIndex(4)).toBe(true);

      // 排他模式
      selectionBehavior.setRowSelection(6, 'exclusive');
      expect(selectionBehavior.selectedRows.value.hasIndex(4)).toBe(false);
      expect(selectionBehavior.selectedRows.value.hasIndex(6)).toBe(true);

      // 混合模式
      selectionBehavior.setRowSelection(8, 'mixed');
      expect(selectionBehavior.selectedRows.value.hasIndex(6)).toBe(false);
      expect(selectionBehavior.selectedRows.value.hasIndex(8)).toBe(true);
    });
  });

  describe('选择过程', () => {
    it('应该开始选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 开始选择
      const location: Item = [3, 4];
      selectionBehavior.beginSelection(location, 'click');
      
      expect(selectionBehavior.isSelecting.value).toBe(true);
      expect(selectionBehavior.selectionState.isSelecting).toBe(true);
      expect(selectionBehavior.selectionState.selectionStart).toEqual([3, 4]);
      expect(selectionBehavior.selectionState.selectionTrigger).toBe('click');
      expect(selectionBehavior.selectedCell.value).toEqual([3, 4]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 3, y: 4, width: 1, height: 1 });
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该更新选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 开始选择
      selectionBehavior.beginSelection([2, 3] as Item, 'drag');
      
      // 更新选择
      selectionBehavior.updateSelection([5, 6] as Item);
      
      expect(selectionBehavior.isSelecting.value).toBe(true);
      expect(selectionBehavior.selectedCell.value).toEqual([5, 6]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 2, y: 3, width: 4, height: 4 });
      expect(onSelectionChanged).toHaveBeenCalledTimes(2);
    });

    it('应该结束选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 开始选择
      selectionBehavior.beginSelection([2, 3] as Item, 'drag');
      expect(selectionBehavior.isSelecting.value).toBe(true);
      
      // 结束选择
      selectionBehavior.endSelection();
      
      expect(selectionBehavior.isSelecting.value).toBe(false);
      expect(selectionBehavior.selectionState.isSelecting).toBe(false);
      expect(selectionBehavior.selectionState.selectionStart).toBeUndefined();
      expect(selectionBehavior.selectionState.selectionTrigger).toBeUndefined();
    });
  });

  describe('矩形选择', () => {
    it('应该选择矩形区域', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 选择矩形区域
      const rect: Rectangle = { x: 2, y: 3, width: 4, height: 5 };
      selectionBehavior.selectRectangle(rect);
      
      expect(selectionBehavior.selectedCell.value).toEqual([2, 3]);
      expect(selectionBehavior.selectedRange.value).toEqual(rect);
      expect(onSelectionChanged).toHaveBeenCalled();
    });
  });

  describe('扩展选择', () => {
    it('应该扩展选择到整行', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 扩展选择到整行
      selectionBehavior.extendSelectionToRow(5);
      
      expect(selectionBehavior.selectedCell.value).toEqual([0, 5]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 0, y: 5, width: 10, height: 1 });
      expect(onSelectionChanged).toHaveBeenCalled();
    });

    it('应该扩展选择到整列', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 扩展选择到整列
      selectionBehavior.extendSelectionToColumn(5);
      
      expect(selectionBehavior.selectedCell.value).toEqual([5, 0]);
      expect(selectionBehavior.selectedRange.value).toEqual({ x: 5, y: 0, width: 1, height: 100 });
      expect(onSelectionChanged).toHaveBeenCalled();
    });
  });

  describe('反转选择', () => {
    it('应该反转选择', () => {
      const onSelectionChanged = vi.fn();
      
      const selectionBehavior = useSelectionBehavior({
        initialSelection: {
          current: {
            cell: [2, 3] as Item,
            range: { x: 2, y: 3, width: 4, height: 5 },
            rangeStack: []
          },
          columns: CompactSelection.empty(),
          rows: CompactSelection.empty()
        },
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100),
        onSelectionChanged
      });

      // 反转选择
      selectionBehavior.invertSelection();
      
      // 验证列选择
      expect(selectionBehavior.selectedColumns.value.hasIndex(2)).toBe(true);
      expect(selectionBehavior.selectedColumns.value.hasIndex(3)).toBe(true);
      expect(selectionBehavior.selectedColumns.value.hasIndex(4)).toBe(true);
      expect(selectionBehavior.selectedColumns.value.hasIndex(5)).toBe(true);
      
      // 验证行选择
      expect(selectionBehavior.selectedRows.value.hasIndex(3)).toBe(true);
      expect(selectionBehavior.selectedRows.value.hasIndex(4)).toBe(true);
      expect(selectionBehavior.selectedRows.value.hasIndex(5)).toBe(true);
      expect(selectionBehavior.selectedRows.value.hasIndex(6)).toBe(true);
      expect(selectionBehavior.selectedRows.value.hasIndex(7)).toBe(true);
      
      expect(onSelectionChanged).toHaveBeenCalled();
    });
  });

  describe('状态管理', () => {
    it('应该正确管理选择状态', () => {
      const selectionBehavior = useSelectionBehavior({
        rowMarkerOffset: ref(0),
        columns: ref(10),
        rows: ref(100)
      });

      // 初始状态
      expect(selectionBehavior.selectionState.selection).toBeDefined();
      expect(selectionBehavior.selectionState.isSelecting).toBe(false);
      expect(selectionBehavior.selectionState.selectionStart).toBeUndefined();
      expect(selectionBehavior.selectionState.selectionTrigger).toBeUndefined();

      // 开始选择
      selectionBehavior.beginSelection([2, 3] as Item, 'drag');
      
      expect(selectionBehavior.selectionState.isSelecting).toBe(true);
      expect(selectionBehavior.selectionState.selectionStart).toEqual([2, 3]);
      expect(selectionBehavior.selectionState.selectionTrigger).toBe('drag');

      // 结束选择
      selectionBehavior.endSelection();
      
      expect(selectionBehavior.selectionState.isSelecting).toBe(false);
      expect(selectionBehavior.selectionState.selectionStart).toBeUndefined();
      expect(selectionBehavior.selectionState.selectionTrigger).toBeUndefined();
    });
  });
});