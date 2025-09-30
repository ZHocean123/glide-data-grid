import type { Meta, StoryObj } from '@storybook/vue3';
import DataGrid from '../internal/data-grid/data-grid.vue';
import { getDataEditorTheme, mergeAndRealizeTheme } from '../common/styles.js';
import {
  CompactSelection,
  GridCellKind,
  type InnerGridCell,
  type InnerGridColumn,
  type GridSelection,
  type Item,
} from '../internal/data-grid/data-grid-types.js';
import type { ImageWindowLoader } from '../internal/data-grid/image-window-loader-interface.js';

/**
 * DataGrid 组件故事
 * 提供一个最小可运行示例，验证网格渲染、选择与事件绑定。
 */
const meta: Meta<typeof DataGrid> = {
  title: 'Internal/DataGrid',
  component: DataGrid,
};

export default meta;
type Story = StoryObj<typeof DataGrid>;

// 最小列定义（只包含标题与宽度即可）
const columns: InnerGridColumn[] = [
  { title: 'A', width: 120 },
  { title: 'B', width: 120 },
  { title: 'C', width: 120 },
];

// 最小单元格内容提供函数（文本单元格）
const getCellContent = (cell: Item): InnerGridCell => {
  const [col, row] = cell;
  return {
    kind: GridCellKind.Text,
    data: `R${row}C${col}`,
    displayData: undefined,
    allowOverlay: true,
  } as const;
};

// 主题
const theme = mergeAndRealizeTheme(getDataEditorTheme());

// 选择（空选择）
const selection: GridSelection = {
  current: undefined,
  rows: CompactSelection.empty(),
  columns: CompactSelection.empty(),
};

// 简易图片加载器（故事中不实际加载图片）
const imageWindowLoader: ImageWindowLoader = {
  setWindow: () => {},
  loadOrGetImage: () => undefined,
  setCallback: () => {},
};

export const Basic: Story = {
  args: {
    width: 800,
    height: 600,
    cellXOffset: 0,
    cellYOffset: 0,
    translateX: 0,
    translateY: 0,
    accessibilityHeight: 600,
    freezeColumns: 0,
    freezeTrailingRows: 0,
    hasAppendRow: false,
    firstColAccessible: true,
    allowResize: true,
    isResizing: false,
    resizeColumn: undefined,
    isDragging: false,
    isFilling: false,
    isFocused: false,
    columns,
    rows: 100,
    headerHeight: 36,
    groupHeaderHeight: 0,
    enableGroups: false,
    rowHeight: 32,
    getCellContent,
    getGroupDetails: undefined,
    getRowThemeOverride: undefined,
    onHeaderMenuClick: undefined,
    onHeaderIndicatorClick: undefined,
    selection,
    prelightCells: undefined,
    highlightRegions: undefined,
    fillHandle: false,
    disabledRows: CompactSelection.empty(),
    imageWindowLoader,
    onItemHovered: () => {},
    onMouseMove: () => {},
    onMouseDown: () => {},
    onMouseUp: () => {},
    onContextMenu: () => {},
    onCanvasFocused: () => {},
    onCanvasBlur: () => {},
    onCellFocused: () => {},
    onMouseMoveRaw: () => {},
    onKeyDown: () => {},
    onKeyUp: undefined,
    verticalBorder: () => false,
    isDraggable: false,
    onDragStart: () => {},
    onDragEnd: () => {},
    onDragOverCell: undefined,
    onDragLeave: undefined,
    onDrop: undefined,
    drawHeader: undefined,
    drawCell: undefined,
    drawFocusRing: true,
    dragAndDropState: undefined,
    experimental: undefined,
    headerIcons: undefined,
    smoothScrollX: false,
    smoothScrollY: false,
    theme,
    getCellRenderer: () => undefined,
    resizeIndicator: 'full',
  },
  render: (args) => ({
    components: { DataGrid },
    setup() {
      return { args };
    },
    template: '<div style="position:relative;width:800px;height:600px"><DataGrid v-bind="args" /></div>',
  }),
};