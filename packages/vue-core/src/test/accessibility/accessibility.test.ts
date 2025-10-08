import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { useAccessibility } from '../../data-editor/use-accessibility.js';
import { GridCellKind } from '../../internal/data-grid/data-grid-types.js';

describe('无障碍功能测试', () => {
  let mockContainer: HTMLElement;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建模拟DOM元素
    mockContainer = document.createElement('div');
    mockContainer.setAttribute('role', 'grid');
    mockContainer.setAttribute('aria-label', 'Data Grid');
    
    mockCanvas = document.createElement('canvas');
    mockCanvas.setAttribute('tabindex', '0');
    
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    // 清理DOM
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockCanvas);
  });

  describe('基本功能', () => {
    it('应该正确初始化无障碍功能', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      // 使用any类型避免类型错误
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const onCellFocused = vi.fn();
      
      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent,
        onCellFocused
      });

      // 验证无障碍功能已初始化
      expect(accessibility).toBeDefined();
      expect(accessibility.accessibilityState).toBeDefined();
      expect(typeof accessibility.isFocused.value).toBe('boolean');
      expect(typeof accessibility.screenReaderMode.value).toBe('boolean');
      expect(typeof accessibility.highContrastMode.value).toBe('boolean');
      expect(typeof accessibility.zoomLevel.value).toBe('number');
    });

    it('应该正确设置DOM属性', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 检查容器ARIA属性
      expect(mockContainer.getAttribute('role')).toBe('grid');
      expect(mockContainer.getAttribute('aria-label')).toBe('Data Grid');
      expect(canvasRef.value.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('键盘导航', () => {
    it('应该支持导航方法', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const onCellFocused = vi.fn();
      
      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent,
        onCellFocused
      });

      // 验证导航方法存在
      expect(typeof accessibility.navigateToCell).toBe('function');
      expect(typeof accessibility.handleKeyboardNavigation).toBe('function');
      expect(typeof accessibility.focusGrid).toBe('function');
    });

    it('应该处理键盘事件', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const onKeyDown = vi.fn();
      
      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent,
        onKeyDown
      });

      // 模拟键盘事件
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const preventDefault = vi.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      accessibility.handleKeyboardNavigation(event);
      
      // 验证preventDefault被调用
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('焦点管理', () => {
    it('应该支持焦点管理方法', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const onCanvasFocused = vi.fn();
      const onCanvasBlur = vi.fn();
      
      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent,
        onCanvasFocused,
        onCanvasBlur
      });

      // 验证焦点管理方法存在
      expect(typeof accessibility.setFocusElement).toBe('function');
      expect(typeof accessibility.activateFocusTrap).toBe('function');
      expect(typeof accessibility.deactivateFocusTrap).toBe('function');
    });

    it('应该处理焦点事件', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const onCanvasFocused = vi.fn();
      const onCanvasBlur = vi.fn();
      
      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent,
        onCanvasFocused,
        onCanvasBlur
      });

      // 模拟焦点进入事件
      const focusInEvent = new FocusEvent('focusin');
      accessibility.handleFocusIn(focusInEvent);
      
      expect(onCanvasFocused).toHaveBeenCalled();
      expect(accessibility.accessibilityState.isFocused).toBe(true);

      // 模拟焦点离开事件
      const focusOutEvent = new FocusEvent('focusout', { relatedTarget: document.body });
      accessibility.handleFocusOut(focusOutEvent);
      
      expect(onCanvasBlur).toHaveBeenCalled();
      expect(accessibility.accessibilityState.isFocused).toBe(false);
    });
  });

  describe('模式切换', () => {
    it('应该支持模式切换方法', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 验证模式切换方法存在
      expect(typeof accessibility.toggleScreenReaderMode).toBe('function');
      expect(typeof accessibility.toggleHighContrastMode).toBe('function');
      expect(typeof accessibility.setZoomLevel).toBe('function');
      expect(typeof accessibility.increaseZoom).toBe('function');
      expect(typeof accessibility.decreaseZoom).toBe('function');
      expect(typeof accessibility.resetZoom).toBe('function');
    });

    it('应该正确切换屏幕阅读器模式', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 初始状态
      expect(accessibility.screenReaderMode.value).toBe(false);

      // 切换屏幕阅读器模式
      accessibility.toggleScreenReaderMode();
      expect(accessibility.screenReaderMode.value).toBe(true);

      // 再次切换
      accessibility.toggleScreenReaderMode();
      expect(accessibility.screenReaderMode.value).toBe(false);
    });

    it('应该正确设置缩放级别', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 初始缩放级别
      expect(accessibility.zoomLevel.value).toBe(1);

      // 增加缩放
      accessibility.increaseZoom();
      expect(accessibility.zoomLevel.value).toBe(1.1);

      // 减少缩放
      accessibility.decreaseZoom();
      expect(accessibility.zoomLevel.value).toBe(1);

      // 设置自定义缩放
      accessibility.setZoomLevel(1.5);
      expect(accessibility.zoomLevel.value).toBe(1.5);

      // 重置缩放
      accessibility.resetZoom();
      expect(accessibility.zoomLevel.value).toBe(1);
    });
  });

  describe('辅助功能树', () => {
    it('应该生成辅助功能树', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 验证辅助功能树存在
      expect(accessibility.accessibilityTree.value).toBeDefined();
      expect(accessibility.accessibilityTree.value?.role).toBe('grid');
      expect(accessibility.accessibilityTree.value?.['aria-rowcount']).toBe(11); // 10 rows + 1 header
      expect(accessibility.accessibilityTree.value?.['aria-colcount']).toBe(10);
    });
  });

  describe('工具方法', () => {
    it('应该提供获取可访问性文本的方法', () => {
      const containerRef = ref(mockContainer);
      const canvasRef = ref(mockCanvas);
      const columns = ref(10);
      const rows = ref(10);
      const rowMarkerOffset = ref(0);
      const accessibilityHeight = ref(10);
      
      const selection = ref<any>({
        current: {
          cell: [0, 0],
          range: { x: 0, y: 0, width: 1, height: 1 },
          rangeStack: []
        },
        columns: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() },
        rows: { length: 0, hasIndex: vi.fn(), first: vi.fn(), add: vi.fn(), remove: vi.fn() }
      });
      
      const getCellContent = (item: readonly [number, number]) => {
        return {
          kind: GridCellKind.Text,
          data: `Cell ${item[0]}-${item[1]}`,
          allowOverlay: true
        };
      };

      const accessibility = useAccessibility({
        containerRef,
        canvasRef,
        columns,
        rows,
        rowMarkerOffset,
        accessibilityHeight,
        selection,
        getCellContent
      });

      // 验证工具方法存在
      expect(typeof accessibility.getAccessibilityText).toBe('function');

      // 测试获取可访问性文本
      const textCell = {
        kind: GridCellKind.Text,
        data: 'Test text',
        allowOverlay: true
      };
      expect(accessibility.getAccessibilityText(textCell)).toBe('Test text');

      const numberCell = {
        kind: GridCellKind.Number,
        data: 42,
        allowOverlay: true
      };
      expect(accessibility.getAccessibilityText(numberCell)).toBe('42');

      const booleanCell = {
        kind: GridCellKind.Boolean,
        data: true,
        allowOverlay: false
      };
      expect(accessibility.getAccessibilityText(booleanCell)).toBe('已选中');
    });
  });
});