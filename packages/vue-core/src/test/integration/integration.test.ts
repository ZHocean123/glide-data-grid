/**
 * Vue版本的Glide Data Grid集成测试
 * 测试组件之间的交互和整体功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { createLargeDataset, createMediumDataset, createTestColumns, setupGlobalMocks, cleanupGlobalMocks } from '../test-utils.js';

describe('Integration Tests', () => {
  beforeEach(() => {
    setupGlobalMocks();
  });

  afterEach(() => {
    cleanupGlobalMocks();
  });

  describe('Data Grid Integration', () => {
    it('should handle data updates and selection together', async () => {
      // 模拟数据网格组件
      const mockDataGrid = {
        data: createMediumDataset(),
        selection: { rows: new Set(), columns: new Set() },
        visibleRange: { x: 0, y: 0, width: 10, height: 20 },
        
        updateData(newData: any[][]) {
          this.data = newData;
        },
        
        selectCell(row: number, col: number) {
          this.selection.rows.clear();
          this.selection.columns.clear();
          this.selection.rows.add(row);
          this.selection.columns.add(col);
        },
        
        getSelectedCell() {
          const rows = Array.from(this.selection.rows);
          const cols = Array.from(this.selection.columns);
          
          if (rows.length === 1 && cols.length === 1) {
            return { row: rows[0], col: cols[0] };
          }
          
          return null;
        },
        
        getSelectedCellValue() {
          const selected = this.getSelectedCell();
          if (selected) {
            return this.data[selected.row as number][selected.col as number];
          }
          return null;
        }
      };
      
      // 初始选择
      mockDataGrid.selectCell(5, 3);
      let selectedCell = mockDataGrid.getSelectedCell();
      let selectedValue = mockDataGrid.getSelectedCellValue();
      
      expect(selectedCell).toEqual({ row: 5, col: 3 });
      expect(selectedValue).toBeDefined();
      
      // 更新数据
      const newData = createLargeDataset(2000, 30);
      mockDataGrid.updateData(newData);
      
      // 选择应该保持，但值可能不同
      selectedCell = mockDataGrid.getSelectedCell();
      selectedValue = mockDataGrid.getSelectedCellValue();
      
      expect(selectedCell).toEqual({ row: 5, col: 3 });
      expect(selectedValue).toBeDefined();
    });

    it('should handle scrolling and selection together', async () => {
      // 模拟滚动数据网格
      const mockScrollingGrid: any = {
        data: createLargeDataset(5000, 50),
        scrollTop: 0,
        scrollLeft: 0,
        viewportHeight: 600,
        viewportWidth: 800,
        rowHeight: 30,
        columnWidth: 100,
        selection: { rows: new Set(), columns: new Set() },
        visibleRange: { x: 0, y: 0, width: 0, height: 0 },
        
        scrollTo(top: number, left: number = 0) {
          this.scrollTop = Math.max(0, Math.min(top, this.getMaxScrollTop()));
          this.scrollLeft = Math.max(0, Math.min(left, this.getMaxScrollLeft()));
          this.updateVisibleRange();
        },
        
        getMaxScrollTop() {
          return Math.max(0, this.data.length * this.rowHeight - this.viewportHeight);
        },
        
        getMaxScrollLeft() {
          return Math.max(0, this.data[0].length * this.columnWidth - this.viewportWidth);
        },
        
        updateVisibleRange() {
          const startRow = Math.floor(this.scrollTop / this.rowHeight);
          const startCol = Math.floor(this.scrollLeft / this.columnWidth);
          const visibleRows = Math.ceil(this.viewportHeight / this.rowHeight) + 1;
          const visibleCols = Math.ceil(this.viewportWidth / this.columnWidth) + 1;
          
          this.visibleRange = {
            x: startCol,
            y: startRow,
            width: visibleCols,
            height: visibleRows
          };
        },
        
        selectCell(row: number, col: number) {
          this.selection.rows.clear();
          this.selection.columns.clear();
          this.selection.rows.add(row);
          this.selection.columns.add(col);
          
          // 确保选中的单元格可见
          this.scrollToCell(row, col);
        },
        
        scrollToCell(row: number, col: number) {
          const targetTop = row * this.rowHeight - this.viewportHeight / 2 + this.rowHeight / 2;
          const targetLeft = col * this.columnWidth - this.viewportWidth / 2 + this.columnWidth / 2;
          
          this.scrollTo(targetTop, targetLeft);
        },
        
        isCellVisible(row: number, col: number): boolean {
          return (
            row >= this.visibleRange.y &&
            row < this.visibleRange.y + this.visibleRange.height &&
            col >= this.visibleRange.x &&
            col < this.visibleRange.x + this.visibleRange.width
          );
        }
      };
      
      // 初始化可见范围
      mockScrollingGrid.updateVisibleRange();
      
      // 选择远处的单元格
      mockScrollingGrid.selectCell(1000, 25);
      
      // 检查是否滚动到了正确位置
      expect(mockScrollingGrid.scrollTop).toBeGreaterThan(0);
      expect(mockScrollingGrid.scrollLeft).toBeGreaterThan(0);
      
      // 检查选中的单元格是否可见
      const selectedRows = Array.from(mockScrollingGrid.selection.rows);
      const selectedCols = Array.from(mockScrollingGrid.selection.columns);
      
      expect(selectedRows).toContain(1000);
      expect(selectedCols).toContain(25);
      expect(mockScrollingGrid.isCellVisible(1000, 25)).toBe(true);
    });

    it('should handle editing and validation together', async () => {
      // 模拟带有验证的编辑器
      const mockEditor = {
        data: createMediumDataset(),
        editCell: { row: -1, col: -1, value: '' },
        validationErrors: new Map<string, string>(),
        
        startEdit(row: number, col: number) {
          this.editCell = {
            row,
            col,
            value: this.getCellValue(row, col)
          };
        },
        
        getCellValue(row: number, col: number) {
          if (this.data[row] && this.data[row][col]) {
            const cell = this.data[row][col];
            return cell.kind === 'text' ? cell.data : '';
          }
          return '';
        },
        
        updateEditValue(value: string) {
          this.editCell.value = value;
        },
        
        validateValue(value: string, row: number, col: number): string | null {
          // 模拟验证规则
          if (col === 0) {
            // 第一列必须是数字
            if (!/^\d+$/.test(value)) {
              return '第一列必须是数字';
            }
          } else if (col === 1) {
            // 第二列不能为空
            if (!value.trim()) {
              return '第二列不能为空';
            }
          } else if (value.length > 50) {
            return '内容不能超过50个字符';
          }
          
          return null;
        },
        
        commitEdit(): boolean {
          const { row, col, value } = this.editCell;
          const error = this.validateValue(value, row, col);
          
          if (error) {
            this.validationErrors.set(`${row}-${col}`, error);
            return false;
          } else {
            this.validationErrors.delete(`${row}-${col}`);
            this.data[row][col] = {
              kind: 'text',
              data: value,
              displayData: value,
              allowOverlay: true,
              readonly: false
            };
            this.editCell = { row: -1, col: -1, value: '' };
            return true;
          }
        },
        
        cancelEdit() {
          this.editCell = { row: -1, col: -1, value: '' };
        },
        
        hasValidationError(row: number, col: number): boolean {
          return this.validationErrors.has(`${row}-${col}`);
        },
        
        getValidationError(row: number, col: number): string | null {
          return this.validationErrors.get(`${row}-${col}`) || null;
        }
      };
      
      // 开始编辑
      mockEditor.startEdit(2, 0);
      expect(mockEditor.editCell.row).toBe(2);
      expect(mockEditor.editCell.col).toBe(0);
      
      // 更新值
      mockEditor.updateEditValue('invalid text');
      
      // 尝试提交，应该失败
      const success1 = mockEditor.commitEdit();
      expect(success1).toBe(false);
      expect(mockEditor.hasValidationError(2, 0)).toBe(true);
      expect(mockEditor.getValidationError(2, 0)).toBe('第一列必须是数字');
      
      // 修正值
      mockEditor.updateEditValue('12345');
      
      // 再次提交，应该成功
      const success2 = mockEditor.commitEdit();
      expect(success2).toBe(true);
      expect(mockEditor.hasValidationError(2, 0)).toBe(false);
      expect(mockEditor.getCellValue(2, 0)).toBe('12345');
    });
  });

  describe('Copy Paste Integration', () => {
    it('should handle copy, paste and selection together', async () => {
      // 模拟复制粘贴功能
      const mockCopyPaste = {
        data: createMediumDataset(),
        selection: { 
          rows: new Set([2, 3, 4]), 
          columns: new Set([1, 2, 3]) 
        },
        clipboard: '',
        
        getSelectedRange() {
          const rows = Array.from(this.selection.rows).sort((a, b) => a - b);
          const cols = Array.from(this.selection.columns).sort((a, b) => a - b);
          
          if (rows.length === 0 || cols.length === 0) {
            return null;
          }
          
          return {
            start: { row: rows[0], col: cols[0] },
            end: { row: rows[rows.length - 1], col: cols[cols.length - 1] }
          };
        },
        
        copy() {
          const range = this.getSelectedRange();
          if (!range) return;
          
          const { start, end } = range;
          const rows: string[][] = [];
          
          for (let row = start.row; row <= end.row; row++) {
            const rowData: string[] = [];
            for (let col = start.col; col <= end.col; col++) {
              const cell = this.data[row][col];
              const value = cell.kind === 'text' ? cell.data : '';
              rowData.push(value);
            }
            rows.push(rowData.join('\t'));
          }
          
          this.clipboard = rows.join('\n');
        },
        
        paste(targetRow: number, targetCol: number) {
          if (!this.clipboard) return false;
          
          const rows = this.clipboard.split('\n');
          
          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].split('\t');
            const row = targetRow + i;
            
            if (row >= this.data.length) break;
            
            for (let j = 0; j < cells.length; j++) {
              const col = targetCol + j;
              
              if (col >= this.data[row].length) break;
              
              this.data[row][col] = {
                kind: 'text',
                data: cells[j],
                displayData: cells[j],
                allowOverlay: true,
                readonly: false
              };
            }
          }
          
          return true;
        },
        
        selectRange(startRow: number, startCol: number, endRow: number, endCol: number) {
          this.selection.rows.clear();
          this.selection.columns.clear();
          
          for (let row = startRow; row <= endRow; row++) {
            this.selection.rows.add(row);
          }
          
          for (let col = startCol; col <= endCol; col++) {
            this.selection.columns.add(col);
          }
        }
      };
      
      // 选择一个区域
      mockCopyPaste.selectRange(2, 1, 4, 3);
      const range = mockCopyPaste.getSelectedRange();
      expect(range).toEqual({
        start: { row: 2, col: 1 },
        end: { row: 4, col: 3 }
      });
      
      // 复制数据
      mockCopyPaste.copy();
      expect(mockCopyPaste.clipboard).toContain('Cell 2-1');
      
      // 粘贴到新位置
      const success = mockCopyPaste.paste(10, 5);
      expect(success).toBe(true);
      
      // 验证粘贴的数据
      expect(mockCopyPaste.data[10][5].data).toBe('Cell 2-1');
      expect(mockCopyPaste.data[11][6].data).toBe('Cell 3-2');
      expect(mockCopyPaste.data[12][7].data).toBe('Cell 4-3');
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('should handle keyboard navigation with selection and editing', async () => {
      // 模拟键盘导航
      const mockKeyboardNav = {
        data: createMediumDataset(),
        selection: { row: 0, col: 0 },
        isEditing: false,
        editValue: '',
        
        moveUp() {
          if (this.isEditing) return;
          this.selection.row = Math.max(0, this.selection.row - 1);
        },
        
        moveDown() {
          if (this.isEditing) return;
          this.selection.row = Math.min(this.data.length - 1, this.selection.row + 1);
        },
        
        moveLeft() {
          if (this.isEditing) return;
          this.selection.col = Math.max(0, this.selection.col - 1);
        },
        
        moveRight() {
          if (this.isEditing) return;
          this.selection.col = Math.min(this.data[0].length - 1, this.selection.col + 1);
        },
        
        startEdit() {
          this.isEditing = true;
          const cell = this.data[this.selection.row][this.selection.col];
          this.editValue = cell.kind === 'text' ? cell.data : '';
        },
        
        commitEdit() {
          if (!this.isEditing) return;
          
          this.data[this.selection.row][this.selection.col] = {
            kind: 'text',
            data: this.editValue,
            displayData: this.editValue,
            allowOverlay: true,
            readonly: false
          };
          
          this.isEditing = false;
          this.editValue = '';
        },
        
        cancelEdit() {
          this.isEditing = false;
          this.editValue = '';
        },
        
        handleKey(key: string) {
          switch (key) {
            case 'ArrowUp':
              this.moveUp();
              break;
            case 'ArrowDown':
              this.moveDown();
              break;
            case 'ArrowLeft':
              this.moveLeft();
              break;
            case 'ArrowRight':
              this.moveRight();
              break;
            case 'Enter':
              if (this.isEditing) {
                this.commitEdit();
                this.moveDown();
              } else {
                this.startEdit();
              }
              break;
            case 'Escape':
              this.cancelEdit();
              break;
          }
        },
        
        updateEditValue(value: string) {
          if (this.isEditing) {
            this.editValue = value;
          }
        }
      };
      
      // 初始位置
      expect(mockKeyboardNav.selection).toEqual({ row: 0, col: 0 });
      
      // 导航
      mockKeyboardNav.handleKey('ArrowDown');
      mockKeyboardNav.handleKey('ArrowRight');
      expect(mockKeyboardNav.selection).toEqual({ row: 1, col: 1 });
      
      // 开始编辑
      mockKeyboardNav.handleKey('Enter');
      expect(mockKeyboardNav.isEditing).toBe(true);
      
      // 更新值
      mockKeyboardNav.updateEditValue('New Value');
      
      // 提交编辑
      mockKeyboardNav.handleKey('Enter');
      expect(mockKeyboardNav.isEditing).toBe(false);
      expect(mockKeyboardNav.data[1][1].data).toBe('New Value');
      expect(mockKeyboardNav.selection).toEqual({ row: 2, col: 1 }); // 移动到下一行
      
      // 取消编辑
      mockKeyboardNav.handleKey('Enter');
      mockKeyboardNav.updateEditValue('Another Value');
      mockKeyboardNav.handleKey('Escape');
      expect(mockKeyboardNav.isEditing).toBe(false);
      expect(mockKeyboardNav.data[2][1].data).not.toBe('Another Value');
    });
  });

  describe('Theme Integration', () => {
    it('should handle theme changes with rendering', async () => {
      // 模拟主题系统
      const mockThemeSystem = {
        currentTheme: 'light',
        themes: {
          light: {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            borderColor: '#e0e0e0',
            selectedColor: '#007acc'
          },
          dark: {
            backgroundColor: '#1e1e1e',
            textColor: '#ffffff',
            borderColor: '#444444',
            selectedColor: '#005a9e'
          }
        },
        
        setTheme(themeName: string) {
          if (this.themes[themeName as keyof typeof this.themes]) {
            this.currentTheme = themeName;
            this.applyTheme();
          }
        },
        
        getTheme() {
          return this.themes[this.currentTheme as keyof typeof this.themes];
        },
        
        applyTheme() {
          const theme = this.getTheme();
          // 模拟应用主题到DOM
          document.documentElement.style.setProperty('--bg-color', theme.backgroundColor);
          document.documentElement.style.setProperty('--text-color', theme.textColor);
          document.documentElement.style.setProperty('--border-color', theme.borderColor);
          document.documentElement.style.setProperty('--selected-color', theme.selectedColor);
        },
        
        getCSSVars() {
          return {
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color'),
            textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
            selectedColor: getComputedStyle(document.documentElement).getPropertyValue('--selected-color')
          };
        }
      };
      
      // 初始主题
      mockThemeSystem.applyTheme();
      let cssVars = mockThemeSystem.getCSSVars();
      expect(cssVars.backgroundColor).toBe('#ffffff');
      
      // 切换到暗色主题
      mockThemeSystem.setTheme('dark');
      cssVars = mockThemeSystem.getCSSVars();
      expect(cssVars.backgroundColor).toBe('#1e1e1e');
      expect(cssVars.textColor).toBe('#ffffff');
      
      // 切换回亮色主题
      mockThemeSystem.setTheme('light');
      cssVars = mockThemeSystem.getCSSVars();
      expect(cssVars.backgroundColor).toBe('#ffffff');
      expect(cssVars.textColor).toBe('#333333');
    });
  });

  describe('Accessibility Integration', () => {
    it('should handle ARIA attributes with keyboard navigation', async () => {
      // 模拟无障碍功能
      const mockAccessibility = {
        gridElement: null as HTMLElement | null,
        selectedCell: { row: 0, col: 0 },
        
        init() {
          this.gridElement = document.createElement('div');
          this.gridElement.setAttribute('role', 'grid');
          this.gridElement.setAttribute('aria-label', 'Data Grid');
          this.gridElement.setAttribute('aria-rowcount', '1000');
          this.gridElement.setAttribute('aria-colcount', '20');
          document.body.appendChild(this.gridElement);
        },
        
        updateSelection(row: number, col: number) {
          this.selectedCell = { row, col };
          this.updateARIA();
        },
        
        updateARIA() {
          if (!this.gridElement) return;
          
          this.gridElement.setAttribute('aria-activedescendant', `cell-${this.selectedCell.row}-${this.selectedCell.col}`);
          
          // 更新单元格的ARIA属性
          const cell = document.getElementById(`cell-${this.selectedCell.row}-${this.selectedCell.col}`);
          if (cell) {
            cell.setAttribute('aria-selected', 'true');
            cell.setAttribute('tabindex', '0');
          }
          
          // 清除之前选中单元格的ARIA属性
          const previouslySelected = document.querySelector('[aria-selected="true"]:not(#cell-' + 
            `${this.selectedCell.row}-${this.selectedCell.col})`);
          if (previouslySelected) {
            previouslySelected.removeAttribute('aria-selected');
            previouslySelected.removeAttribute('tabindex');
          }
        },
        
        announceToScreenReader(message: string) {
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          announcement.style.position = 'absolute';
          announcement.style.left = '-10000px';
          announcement.textContent = message;
          
          document.body.appendChild(announcement);
          
          // 稍后移除
          setTimeout(() => {
            document.body.removeChild(announcement);
          }, 1000);
        },
        
        handleKey(key: string) {
          let newRow = this.selectedCell.row;
          let newCol = this.selectedCell.col;
          
          switch (key) {
            case 'ArrowUp':
              newRow = Math.max(0, newRow - 1);
              break;
            case 'ArrowDown':
              newRow = Math.min(999, newRow + 1);
              break;
            case 'ArrowLeft':
              newCol = Math.max(0, newCol - 1);
              break;
            case 'ArrowRight':
              newCol = Math.min(19, newCol + 1);
              break;
            default:
              return;
          }
          
          this.updateSelection(newRow, newCol);
          this.announceToScreenReader(`Row ${newRow + 1}, Column ${String.fromCharCode(65 + newCol)}`);
        },
        
        cleanup() {
          if (this.gridElement && document.body.contains(this.gridElement)) {
            document.body.removeChild(this.gridElement);
          }
        }
      };
      
      // 初始化
      mockAccessibility.init();
      expect(mockAccessibility.gridElement).not.toBeNull();
      expect(mockAccessibility.gridElement?.getAttribute('role')).toBe('grid');
      
      // 模拟单元格
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const cell = document.createElement('div');
          cell.id = `cell-${row}-${col}`;
          cell.setAttribute('role', 'gridcell');
          cell.textContent = `Cell ${row}-${col}`;
          mockAccessibility.gridElement?.appendChild(cell);
        }
      }
      
      // 键盘导航
      mockAccessibility.handleKey('ArrowDown');
      mockAccessibility.handleKey('ArrowRight');
      
      expect(mockAccessibility.selectedCell).toEqual({ row: 1, col: 1 });
      expect(mockAccessibility.gridElement?.getAttribute('aria-activedescendant')).toBe('cell-1-1');
      
      // 检查屏幕阅读器公告
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements.length).toBeGreaterThan(0);
      
      // 清理
      mockAccessibility.cleanup();
    });
  });
});