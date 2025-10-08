/**
 * Vue版本的辅助功能管理组合式函数
 * 提供键盘导航、屏幕阅读器支持、焦点管理等辅助功能
 */

import { computed, reactive, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { type Item, type GridSelection } from '../internal/data-grid/data-grid-types.js';

export interface AccessibilityOptions {
  /** 网格容器引用 */
  containerRef: Ref<HTMLElement | undefined>;
  /** 画布引用 */
  canvasRef: Ref<HTMLCanvasElement | undefined>;
  /** 当前选择 */
  selection: Ref<GridSelection>;
  /** 行数 */
  rows: Ref<number>;
  /** 列数 */
  columns: Ref<number>;
  /** 行标记偏移量 */
  rowMarkerOffset: Ref<number>;
  /** 辅助功能高度 */
  accessibilityHeight: Ref<number>;
  /** 是否禁用辅助功能树 */
  disableAccessibilityTree?: boolean;
  /** 获取单元格内容 */
  getCellContent: (item: Item) => any;
  /** 获取单元格渲染器 */
  getCellRenderer?: (cell: any) => any;
  /** 单元格聚焦回调 */
  onCellFocused?: (item: Item) => void;
  /** 画布聚焦回调 */
  onCanvasFocused?: () => void;
  /** 画布失焦回调 */
  onCanvasBlur?: () => void;
  /** 键盘事件回调 */
  onKeyDown?: (event: any) => void;
  /** 键盘释放事件回调 */
  onKeyUp?: (event: any) => void;
}

export interface AccessibilityState {
  /** 是否聚焦 */
  isFocused: boolean;
  /** 当前聚焦的元素 */
  focusedElement: HTMLElement | null;
  /** 焦点陷阱状态 */
  focusTrapActive: boolean;
  /** 屏幕阅读器模式 */
  screenReaderMode: boolean;
  /** 高对比度模式 */
  highContrastMode: boolean;
  /** 缩放级别 */
  zoomLevel: number;
  /** 键盘导航状态 */
  keyboardNavigation: {
    /** 当前导航位置 */
    currentPosition: Item | undefined;
    /** 是否正在导航 */
    isNavigating: boolean;
    /** 导航方向 */
    direction: 'horizontal' | 'vertical' | 'both';
  };
}

export function useAccessibility(options: AccessibilityOptions) {
  const {
    containerRef,
    canvasRef,
    selection,
    rows,
    columns,
    rowMarkerOffset,
    accessibilityHeight,
    disableAccessibilityTree = false,
    getCellContent,
    getCellRenderer,
    onCellFocused,
    onCanvasFocused,
    onCanvasBlur,
    onKeyDown,
  } = options;

  // 辅助功能状态
  const accessibilityState = reactive<AccessibilityState>({
    isFocused: false,
    focusedElement: null,
    focusTrapActive: false,
    screenReaderMode: false,
    highContrastMode: false,
    zoomLevel: 1,
    keyboardNavigation: {
      currentPosition: undefined,
      isNavigating: false,
      direction: 'both'
    }
  });

  // 辅助功能树可见性
  const showAccessibilityTree = computed(() => {
    return !disableAccessibilityTree && 
           (containerRef.value?.clientWidth ?? 0) > 50;
  });

  // 当前聚焦的单元格
  const focusedCell = computed(() => {
    return selection.value.current?.cell;
  });

  // 当前选择范围
  const currentRange = computed(() => {
    return selection.value.current?.range;
  });

  // 获取单元格的可访问性文本
  const getAccessibilityText = (cell: any): string => {
    if (!cell) return '';
    
    // 如果是自定义单元格，使用复制数据
    if (cell.kind === 'custom') {
      return cell.copyData || '';
    }
    
    // 使用单元格渲染器获取可访问性文本
    const renderer = getCellRenderer?.(cell);
    if (renderer?.getAccessibilityString) {
      return renderer.getAccessibilityString(cell);
    }
    
    // 默认处理
    switch (cell.kind) {
      case 'text':
      case 'number':
        return cell.data?.toString() || '';
      case 'boolean':
        return cell.data ? '已选中' : '未选中';
      case 'uri':
        return cell.data?.toString() || '';
      case 'image':
        return '图片';
      case 'markdown':
        return cell.data?.toString() || '';
      default:
        return '';
    }
  };

  // 创建辅助功能树
  const createAccessibilityTree = () => {
    if (!showAccessibilityTree.value) return null;

    const effectiveColumns = columns.value;
    const colOffset = rowMarkerOffset.value > 0 ? -1 : 0;
    const [fCol, fRow] = focusedCell.value || [];
    const range = currentRange.value;

    // 计算可见行
    const visibleRows = [];
    const startRow = Math.max(0, 0);
    const endRow = Math.min(rows.value, startRow + accessibilityHeight.value);
    
    for (let row = startRow; row < endRow; row++) {
      visibleRows.push(row);
    }

    // 维护焦点在网格内，如果当前焦点在视口外
    if (
      fCol !== undefined &&
      fRow !== undefined &&
      (!visibleRows.includes(fRow) || fCol < rowMarkerOffset.value || fCol >= columns.value + rowMarkerOffset.value)
    ) {
      setFocusElement(null);
    }

    return {
      role: 'grid',
      'aria-rowcount': rows.value + 1,
      'aria-multiselectable': 'true',
      'aria-colcount': effectiveColumns + Math.abs(colOffset),
      children: [
        // 表头
        {
          role: 'rowgroup',
          children: [
            {
              role: 'row',
              'aria-rowindex': 1,
              children: Array.from({ length: effectiveColumns }, (_, index) => {
                const col = index + rowMarkerOffset.value;
                return {
                  role: 'columnheader',
                  'aria-selected': selection.value.columns.hasIndex(col),
                  'aria-colindex': col + 1 + colOffset,
                  tabIndex: -1,
                  onFocus: () => onCellFocused?.([col, -1]),
                  text: `列 ${index + 1}`
                };
              })
            }
          ]
        },
        // 表体
        {
          role: 'rowgroup',
          children: visibleRows.map(row => ({
            role: 'row',
            'aria-selected': selection.value.rows.hasIndex(row),
            'aria-rowindex': row + 2,
            key: row,
            children: Array.from({ length: effectiveColumns }, (_, index) => {
              const col = index + rowMarkerOffset.value;
              const location: Item = [col, row];
              const cellContent = getCellContent(location);
              const focused = fCol === col && fRow === row;
              const selected = range !== undefined &&
                col >= range.x &&
                col < range.x + range.width &&
                row >= range.y &&
                row < range.y + range.height;
              
              return {
                role: 'gridcell',
                'aria-colindex': col + 1 + colOffset,
                'aria-selected': selected,
                'aria-readonly': cellContent.readonly || false,
                id: `glide-cell-${col}-${row}`,
                'data-testid': `glide-cell-${col}-${row}`,
                tabIndex: -1,
                focused,
                text: getAccessibilityText(cellContent),
                onClick: () => {
                  // 模拟Enter键激活单元格
                  onKeyDown?.({
                    key: 'Enter',
                    keyCode: 13,
                    ctrlKey: false,
                    metaKey: false,
                    shiftKey: false,
                    altKey: false,
                    bounds: currentRange.value,
                    location,
                    cancel: () => {},
                    stopPropagation: () => {},
                    preventDefault: () => {},
                    rawEvent: undefined
                  });
                },
                onFocus: () => {
                  onCellFocused?.(location);
                }
              };
            })
          }))
        }
      ]
    };
  };

  // 设置焦点元素
  const setFocusElement = (el: HTMLElement | null) => {
    // 如果我们不拥有焦点，不想窃取焦点
    if (!containerRef.value?.contains(document.activeElement)) return;
    
    if (el === null && focusedCell.value !== undefined) {
      canvasRef.value?.focus({
        preventScroll: true,
      });
    } else if (el !== null) {
      el.focus({
        preventScroll: true,
      });
    }
    
    accessibilityState.focusedElement = el;
  };

  // 聚焦网格
  const focusGrid = (immediate = false) => {
    const focusFn = () => {
      const el = accessibilityState.focusedElement;
      // 如果元素已被移除，回退到画布
      if (el === null || !document.contains(el)) {
        canvasRef.value?.focus({
          preventScroll: true,
        });
      } else {
        el.focus({
          preventScroll: true,
        });
      }
    };

    if (immediate) {
      focusFn();
    } else {
      window.requestAnimationFrame(focusFn);
    }
  };

  // 处理键盘导航
  const handleKeyboardNavigation = (event: KeyboardEvent) => {
    const { key, shiftKey, ctrlKey, altKey } = event;
    
    // 处理Tab键导航
    if (key === 'Tab') {
      event.preventDefault();
      handleTabNavigation(shiftKey);
      return;
    }

    // 处理方向键导航
    if (!ctrlKey && !altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      handleArrowKeyNavigation(key, shiftKey);
      return;
    }

    // 处理PageUp/PageDown导航
    if (!ctrlKey && !altKey && ['PageUp', 'PageDown'].includes(key)) {
      event.preventDefault();
      handlePageNavigation(key, shiftKey);
      return;
    }

    // 处理Home/End导航
    if (!ctrlKey && !altKey && ['Home', 'End'].includes(key)) {
      event.preventDefault();
      handleHomeEndNavigation(key, shiftKey);
      return;
    }
  };

  // 处理Tab键导航
  const handleTabNavigation = (shiftKey: boolean) => {
    if (!focusedCell.value) return;
    
    const [col, row] = focusedCell.value;
    
    if (shiftKey) {
      // 向前导航
      if (col > rowMarkerOffset.value) {
        navigateToCell(col - 1, row);
      } else if (row > 0) {
        navigateToCell(columns.value + rowMarkerOffset.value - 1, row - 1);
      }
    } else {
      // 向后导航
      if (col < columns.value + rowMarkerOffset.value - 1) {
        navigateToCell(col + 1, row);
      } else if (row < rows.value - 1) {
        navigateToCell(rowMarkerOffset.value, row + 1);
      }
    }
  };

  // 处理方向键导航
  const handleArrowKeyNavigation = (key: string, shiftKey: boolean) => {
    if (!focusedCell.value) return;
    
    const [col, row] = focusedCell.value;
    
    switch (key) {
      case 'ArrowUp':
        navigateToCell(col, Math.max(0, row - 1), shiftKey);
        break;
      case 'ArrowDown':
        navigateToCell(col, Math.min(rows.value - 1, row + 1), shiftKey);
        break;
      case 'ArrowLeft':
        navigateToCell(Math.max(rowMarkerOffset.value, col - 1), row, shiftKey);
        break;
      case 'ArrowRight':
        navigateToCell(Math.min(columns.value + rowMarkerOffset.value - 1, col + 1), row, shiftKey);
        break;
    }
  };

  // 处理PageUp/PageDown导航
  const handlePageNavigation = (key: string, shiftKey: boolean) => {
    if (!focusedCell.value) return;
    
    const [col, row] = focusedCell.value;
    const pageHeight = Math.floor(accessibilityHeight.value / 2);
    
    switch (key) {
      case 'PageUp':
        navigateToCell(col, Math.max(0, row - pageHeight), shiftKey);
        break;
      case 'PageDown':
        navigateToCell(col, Math.min(rows.value - 1, row + pageHeight), shiftKey);
        break;
    }
  };

  // 处理Home/End导航
  const handleHomeEndNavigation = (key: string, shiftKey: boolean) => {
    if (!focusedCell.value) return;
    
    const [, row] = focusedCell.value;
    
    switch (key) {
      case 'Home':
        if (shiftKey && currentRange.value) {
          navigateToCell(currentRange.value.x, row, true);
        } else {
          navigateToCell(rowMarkerOffset.value, row, shiftKey);
        }
        break;
      case 'End':
        if (shiftKey && currentRange.value) {
          navigateToCell(currentRange.value.x + currentRange.value.width - 1, row, true);
        } else {
          navigateToCell(columns.value + rowMarkerOffset.value - 1, row, shiftKey);
        }
        break;
    }
  };

  // 导航到指定单元格
  const navigateToCell = (col: number, row: number, _extendSelection = false) => {
    if (col < rowMarkerOffset.value || 
        col >= columns.value + rowMarkerOffset.value || 
        row < 0 || 
        row >= rows.value) {
      return;
    }

    const location: Item = [col, row];
    
    // 更新键盘导航状态
    accessibilityState.keyboardNavigation.currentPosition = location;
    accessibilityState.keyboardNavigation.isNavigating = true;
    
    // 触发单元格聚焦回调
    onCellFocused?.(location);
    
    // 重置导航状态
    setTimeout(() => {
      accessibilityState.keyboardNavigation.isNavigating = false;
    }, 100);
  };

  // 处理焦点进入
  const handleFocusIn = (_event: FocusEvent) => {
    accessibilityState.isFocused = true;
    onCanvasFocused?.();
  };

  // 处理焦点离开
  const handleFocusOut = (event: FocusEvent) => {
    // 检查焦点是否仍在容器内
    if (!containerRef.value?.contains(event.relatedTarget as Node)) {
      accessibilityState.isFocused = false;
      onCanvasBlur?.();
    }
  };

  // 切换屏幕阅读器模式
  const toggleScreenReaderMode = () => {
    accessibilityState.screenReaderMode = !accessibilityState.screenReaderMode;
  };

  // 切换高对比度模式
  const toggleHighContrastMode = () => {
    accessibilityState.highContrastMode = !accessibilityState.highContrastMode;
  };

  // 设置缩放级别
  const setZoomLevel = (level: number) => {
    accessibilityState.zoomLevel = Math.max(0.5, Math.min(3, level));
  };

  // 增加缩放级别
  const increaseZoom = () => {
    setZoomLevel(accessibilityState.zoomLevel + 0.1);
  };

  // 减少缩放级别
  const decreaseZoom = () => {
    setZoomLevel(accessibilityState.zoomLevel - 0.1);
  };

  // 重置缩放级别
  const resetZoom = () => {
    setZoomLevel(1);
  };

  // 激活焦点陷阱
  const activateFocusTrap = () => {
    accessibilityState.focusTrapActive = true;
  };

  // 停用焦点陷阱
  const deactivateFocusTrap = () => {
    accessibilityState.focusTrapActive = false;
  };

  // 监听系统主题变化
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      accessibilityState.highContrastMode = e.matches;
    };
    
    mediaQuery.addEventListener('change', handleChange);
    accessibilityState.highContrastMode = mediaQuery.matches;
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  };

  // 监听系统缩放变化
  const watchSystemZoom = () => {
    const handleZoomChange = () => {
      const zoomLevel = window.devicePixelRatio || 1;
      setZoomLevel(zoomLevel);
    };
    
    window.addEventListener('resize', handleZoomChange);
    handleZoomChange();
    
    return () => {
      window.removeEventListener('resize', handleZoomChange);
    };
  };

  // 生命周期钩子
  onMounted(() => {
    const cleanupTheme = watchSystemTheme();
    const cleanupZoom = watchSystemZoom();
    
    onUnmounted(() => {
      cleanupTheme();
      cleanupZoom();
    });
  });

  // 监听焦点变化
  watch(() => accessibilityState.isFocused, (isFocused) => {
    if (isFocused) {
      document.body.setAttribute('data-grid-focused', 'true');
    } else {
      document.body.removeAttribute('data-grid-focused');
    }
  });

  // 监听高对比度模式变化
  watch(() => accessibilityState.highContrastMode, (isHighContrast) => {
    if (isHighContrast) {
      document.body.setAttribute('data-high-contrast', 'true');
    } else {
      document.body.removeAttribute('data-high-contrast');
    }
  });

  // 监听缩放级别变化
  watch(() => accessibilityState.zoomLevel, (zoomLevel) => {
    document.documentElement.style.setProperty('--grid-zoom-level', zoomLevel.toString());
  });

  return {
    // 状态
    accessibilityState,
    
    // 计算属性
    isFocused: computed(() => accessibilityState.isFocused),
    screenReaderMode: computed(() => accessibilityState.screenReaderMode),
    highContrastMode: computed(() => accessibilityState.highContrastMode),
    zoomLevel: computed(() => accessibilityState.zoomLevel),
    accessibilityTree: computed(() => createAccessibilityTree()),
    
    // 方法
    focusGrid,
    setFocusElement,
    handleKeyboardNavigation,
    navigateToCell,
    toggleScreenReaderMode,
    toggleHighContrastMode,
    setZoomLevel,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    activateFocusTrap,
    deactivateFocusTrap,
    
    // 事件处理器
    handleFocusIn,
    handleFocusOut,
    
    // 工具方法
    getAccessibilityText
  };
}