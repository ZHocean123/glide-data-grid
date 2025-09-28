/**
 * DataGrid 组件基础测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DataGrid from '../components/DataGrid.vue';
import { createTextCell, createNumberCell, createBooleanCell } from '../cells/index.js';
import type { GridColumn } from '../types/grid-column.js';
import type { Item } from '../types/base.js';

// Mock Canvas API
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    fillText: vi.fn(),
    roundRect: vi.fn(),
    arc: vi.fn(),
  })) as any;

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as any;

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    cb(0);
    return 0;
  });

  global.cancelAnimationFrame = vi.fn();
});

// 测试数据
const testColumns: GridColumn[] = [
  { title: 'Name', width: 150 },
  { title: 'Age', width: 80 },
  { title: 'Active', width: 80 },
  { title: 'Score', width: 100 },
];

const testData = [
  ['Alice', 25, true, 85.5],
  ['Bob', 30, false, 92.0],
  ['Charlie', 35, true, 78.5],
  ['Diana', 28, false, 95.0],
];

const getCellContent = (cell: Item) => {
  const [col, row] = cell;
  const rowData = testData[row];
  if (!rowData) return createTextCell('');

  const value = rowData[col];

  switch (col) {
    case 0: // Name
      return createTextCell(String(value), { allowOverlay: true });
    case 1: // Age
      return createNumberCell(Number(value), { allowOverlay: true });
    case 2: // Active
      return createBooleanCell(Boolean(value));
    case 3: // Score
      return createNumberCell(Number(value), {
        allowOverlay: true,
        formatHint: 'decimal',
        fixedDecimals: 1
      });
    default:
      return createTextCell('');
  }
};

describe('DataGrid Component', () => {
  it('渲染基本组件结构', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        width: 600,
        height: 400,
      },
    });

    expect(wrapper.find('.vue-glide-data-grid').exists()).toBe(true);
    expect(wrapper.find('.vue-glide-data-grid__canvas').exists()).toBe(true);
  });

  it('正确设置Canvas尺寸', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        width: 800,
        height: 600,
      },
    });

    const canvas = wrapper.find('canvas').element as HTMLCanvasElement;
    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
  });

  it('响应props变化', async () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        width: 600,
        height: 400,
      },
    });

    // 修改尺寸
    await wrapper.setProps({ width: 800, height: 600 });

    const canvas = wrapper.find('canvas').element as HTMLCanvasElement;
    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
  });

  it('发出ready事件', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
      },
    });

    expect(wrapper.emitted('ready')).toBeTruthy();
  });

  it('处理鼠标事件', async () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
      },
    });

    const canvas = wrapper.find('canvas');

    // 模拟鼠标点击
    await canvas.trigger('mousedown', { clientX: 100, clientY: 50 });

    // 检查是否发出了相应事件
    expect(wrapper.emitted('cell-click')).toBeTruthy();
  });

  it('支持键盘导航', async () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        enableKeyboardNavigation: true,
      },
    });

    const container = wrapper.find('.vue-glide-data-grid');

    // 模拟键盘事件
    await container.trigger('keydown', { key: 'ArrowDown' });

    expect(wrapper.emitted('key-down')).toBeTruthy();
  });

  it('暴露正确的方法', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
      },
    });

    const vm = wrapper.vm as any;

    // 检查暴露的方法
    expect(typeof vm.requestRedraw).toBe('function');
    expect(typeof vm.forceRedraw).toBe('function');
    expect(typeof vm.scrollTo).toBe('function');
    expect(typeof vm.focus).toBe('function');
    expect(typeof vm.getCellAtPoint).toBe('function');
  });

  it('应用自定义主题', () => {
    const customTheme = {
      accentColor: '#ff0000',
      textDark: '#333333',
    };

    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        theme: customTheme,
      },
    });

    const container = wrapper.find('.vue-glide-data-grid').element as HTMLElement;
    const styles = getComputedStyle(container);

    // 检查CSS变量是否应用
    expect(container.style.getPropertyValue('--gdg-accent-color')).toBe('#ff0000');
  });

  it('显示调试信息（开发模式）', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        showDebugInfo: true,
      },
    });

    // 在开发模式下应该显示调试信息
    if (process.env.NODE_ENV === 'development') {
      expect(wrapper.find('.vue-glide-data-grid__debug').exists()).toBe(true);
    }
  });

  it('处理空数据', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: 0,
        getCellContent,
      },
    });

    expect(wrapper.find('.vue-glide-data-grid').exists()).toBe(true);
    expect(wrapper.emitted('ready')).toBeTruthy();
  });

  it('支持只读模式', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: testColumns,
        rows: testData.length,
        getCellContent,
        readonly: true,
      },
    });

    expect(wrapper.find('.vue-glide-data-grid').exists()).toBe(true);
  });
});
