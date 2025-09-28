/**
 * 鼠标事件处理系统
 * 从 React 版本迁移并适配 Vue3
 */

import type { Ref } from 'vue';
import { ref, reactive, computed } from 'vue';
import type { Point, Rectangle, Item } from '../types/base.js';
import type { GridColumn } from '../types/grid-column.js';

// 鼠标事件类型
export enum MouseEventKind {
  Click = 'click',
  DoubleClick = 'double-click',
  MouseDown = 'mouse-down',
  MouseUp = 'mouse-up',
  MouseMove = 'mouse-move',
  MouseEnter = 'mouse-enter',
  MouseLeave = 'mouse-leave',
  ContextMenu = 'context-menu',
  Wheel = 'wheel',
  DragStart = 'drag-start',
  Drag = 'drag',
  DragEnd = 'drag-end'
}

// 鼠标按钮
export enum MouseButton {
  Primary = 0,
  Auxiliary = 1,
  Secondary = 2
}

// 鼠标状态
export interface MouseState {
  position: Point;
  isDown: boolean;
  button: MouseButton;
  dragStart?: Point;
  isDragging: boolean;
  lastClickTime: number;
  clickCount: number;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
}

// 鼠标事件参数
export interface MouseEventArgs {
  kind: MouseEventKind;
  location: Point;
  button: MouseButton;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  preventDefault: () => void;
  stopPropagation: () => void;
  localEventX: number;
  localEventY: number;
  scrollEdge: [number, number];
  deltaX?: number;
  deltaY?: number;
  isTouch: boolean;
  isLongTouch?: boolean;
  isMajor: boolean;
}

// 网格位置信息
export interface GridMouseEventArgs extends MouseEventArgs {
  cell?: Item;
  column?: GridColumn;
  row?: number;
  bounds?: Rectangle;
  isHeader: boolean;
  isGroupHeader: boolean;
  headerKind?: 'header' | 'group-header' | 'group-options';
}

// 拖拽相关
export interface DragStartEventArgs extends GridMouseEventArgs {
  dragMimeType: string;
  dragData: string;
  dragImage?: HTMLElement;
  setDragImage: (image: HTMLElement, offsetX: number, offsetY: number) => void;
}

// 事件监听器接口
export interface MouseEventListener {
  onMouseDown?: (args: GridMouseEventArgs) => void;
  onMouseUp?: (args: GridMouseEventArgs) => void;
  onMouseMove?: (args: GridMouseEventArgs) => void;
  onClick?: (args: GridMouseEventArgs) => void;
  onDoubleClick?: (args: GridMouseEventArgs) => void;
  onContextMenu?: (args: GridMouseEventArgs) => void;
  onWheel?: (args: GridMouseEventArgs) => void;
  onDragStart?: (args: DragStartEventArgs) => void;
  onDrag?: (args: GridMouseEventArgs) => void;
  onDragEnd?: (args: GridMouseEventArgs) => void;
  onMouseEnter?: (args: GridMouseEventArgs) => void;
  onMouseLeave?: (args: GridMouseEventArgs) => void;
}

// 鼠标事件管理器
export class MouseEventManager {
  private canvas: Ref<HTMLCanvasElement | undefined>;
  private state: MouseState;
  private listeners: MouseEventListener[] = [];
  private isEnabled = true;
  private doubleClickThreshold = 300; // 毫秒
  private dragThreshold = 3; // 像素

  // 网格信息获取函数
  private getCellAtLocation?: (x: number, y: number) => { cell?: Item; bounds?: Rectangle; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean };
  private getScrollPosition?: () => Point;

  constructor(
    canvas: Ref<HTMLCanvasElement | undefined>,
    options: {
      getCellAtLocation?: (x: number, y: number) => { cell?: Item; bounds?: Rectangle; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean };
      getScrollPosition?: () => Point;
    } = {}
  ) {
    this.canvas = canvas;
    this.getCellAtLocation = options.getCellAtLocation;
    this.getScrollPosition = options.getScrollPosition;

    this.state = reactive({
      position: { x: 0, y: 0 },
      isDown: false,
      button: MouseButton.Primary,
      isDragging: false,
      lastClickTime: 0,
      clickCount: 0,
      modifiers: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas.value) return;

    const canvas = this.canvas.value;

    // 鼠标事件
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('dblclick', this.handleDoubleClick);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    canvas.addEventListener('wheel', this.handleWheel);
    canvas.addEventListener('mouseenter', this.handleMouseEnter);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);

    // 全局事件（用于拖拽）
    document.addEventListener('mouseup', this.handleGlobalMouseUp);
    document.addEventListener('mousemove', this.handleGlobalMouseMove);

    // 触摸事件支持
    canvas.addEventListener('touchstart', this.handleTouchStart);
    canvas.addEventListener('touchmove', this.handleTouchMove);
    canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  private removeEventListeners(): void {
    if (!this.canvas.value) return;

    const canvas = this.canvas.value;

    canvas.removeEventListener('mousedown', this.handleMouseDown);
    canvas.removeEventListener('mouseup', this.handleMouseUp);
    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('click', this.handleClick);
    canvas.removeEventListener('dblclick', this.handleDoubleClick);
    canvas.removeEventListener('contextmenu', this.handleContextMenu);
    canvas.removeEventListener('wheel', this.handleWheel);
    canvas.removeEventListener('mouseenter', this.handleMouseEnter);
    canvas.removeEventListener('mouseleave', this.handleMouseLeave);

    document.removeEventListener('mouseup', this.handleGlobalMouseUp);
    document.removeEventListener('mousemove', this.handleGlobalMouseMove);

    canvas.removeEventListener('touchstart', this.handleTouchStart);
    canvas.removeEventListener('touchmove', this.handleTouchMove);
    canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  // 事件处理器
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.MouseDown, event);
    this.updateStateFromEvent(event);
    this.state.isDown = true;
    this.state.button = event.button as MouseButton;
    this.state.dragStart = { x: event.clientX, y: event.clientY };

    this.notifyListeners('onMouseDown', args);
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.MouseUp, event);
    this.updateStateFromEvent(event);

    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.notifyListeners('onDragEnd', args);
    }

    this.state.isDown = false;
    this.state.dragStart = undefined;

    this.notifyListeners('onMouseUp', args);
  };

  private handleGlobalMouseUp = (event: MouseEvent): void => {
    if (this.state.isDown) {
      this.handleMouseUp(event);
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.MouseMove, event);
    this.updateStateFromEvent(event);

    // 检查是否开始拖拽
    if (this.state.isDown && !this.state.isDragging && this.state.dragStart) {
      const deltaX = event.clientX - this.state.dragStart.x;
      const deltaY = event.clientY - this.state.dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.dragThreshold) {
        this.state.isDragging = true;
        const dragArgs = this.createDragStartEventArgs(event);
        this.notifyListeners('onDragStart', dragArgs);
      }
    }

    if (this.state.isDragging) {
      this.notifyListeners('onDrag', args);
    }

    this.notifyListeners('onMouseMove', args);
  };

  private handleGlobalMouseMove = (event: MouseEvent): void => {
    if (this.state.isDragging) {
      this.handleMouseMove(event);
    }
  };

  private handleClick = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.Click, event);
    this.updateClickCount(event);
    this.notifyListeners('onClick', args);
  };

  private handleDoubleClick = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.DoubleClick, event);
    this.notifyListeners('onDoubleClick', args);
  };

  private handleContextMenu = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.ContextMenu, event);
    this.notifyListeners('onContextMenu', args);
  };

  private handleWheel = (event: WheelEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.Wheel, event);
    args.deltaX = event.deltaX;
    args.deltaY = event.deltaY;
    this.notifyListeners('onWheel', args);
  };

  private handleMouseEnter = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.MouseEnter, event);
    this.notifyListeners('onMouseEnter', args);
  };

  private handleMouseLeave = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createMouseEventArgs(MouseEventKind.MouseLeave, event);
    this.state.isDown = false;
    this.state.isDragging = false;
    this.notifyListeners('onMouseLeave', args);
  };

  // 触摸事件处理
  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.isEnabled || event.touches.length === 0) return;

    // 模拟鼠标事件
    const touch = event.touches[0];
    const mouseEvent = this.createMouseEventFromTouch(touch, 'mousedown');
    this.handleMouseDown(mouseEvent);
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.isEnabled || event.touches.length === 0) return;

    const touch = event.touches[0];
    const mouseEvent = this.createMouseEventFromTouch(touch, 'mousemove');
    this.handleMouseMove(mouseEvent);
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.isEnabled) return;

    // 使用最后一个触摸点位置
    const touch = event.changedTouches[0];
    const mouseEvent = this.createMouseEventFromTouch(touch, 'mouseup');
    this.handleMouseUp(mouseEvent);
  };

  // 工具函数
  private createMouseEventFromTouch(touch: Touch, type: string): MouseEvent {
    return new MouseEvent(type, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false
    });
  }

  private createMouseEventArgs(kind: MouseEventKind, event: MouseEvent | WheelEvent): GridMouseEventArgs {
    const canvas = this.canvas.value;
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const scrollPos = this.getScrollPosition?.() || { x: 0, y: 0 };

    // 获取网格位置信息
    const gridInfo = this.getCellAtLocation?.(localX, localY) || {
      isHeader: false,
      isGroupHeader: false
    };

    return {
      kind,
      location: { x: localX, y: localY },
      button: (event as MouseEvent).button || MouseButton.Primary,
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      localEventX: localX,
      localEventY: localY,
      scrollEdge: [scrollPos.x, scrollPos.y],
      deltaX: (event as WheelEvent).deltaX,
      deltaY: (event as WheelEvent).deltaY,
      isTouch: event.type.startsWith('touch'),
      isMajor: (event as MouseEvent).button === MouseButton.Primary,
      ...gridInfo
    };
  }

  private createDragStartEventArgs(event: MouseEvent): DragStartEventArgs {
    const baseArgs = this.createMouseEventArgs(MouseEventKind.DragStart, event);

    return {
      ...baseArgs,
      dragMimeType: 'text/plain',
      dragData: '',
      setDragImage: (image: HTMLElement, offsetX: number, offsetY: number) => {
        // 在实际实现中，这里会设置拖拽图像
      }
    };
  }

  private updateStateFromEvent(event: MouseEvent): void {
    const canvas = this.canvas.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    this.state.position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    this.state.modifiers = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  private updateClickCount(event: MouseEvent): void {
    const now = Date.now();
    const timeDiff = now - this.state.lastClickTime;

    if (timeDiff < this.doubleClickThreshold) {
      this.state.clickCount++;
    } else {
      this.state.clickCount = 1;
    }

    this.state.lastClickTime = now;
  }

  private notifyListeners(method: keyof MouseEventListener, args: GridMouseEventArgs | DragStartEventArgs): void {
    for (const listener of this.listeners) {
      const handler = listener[method] as any;
      if (handler) {
        try {
          handler(args);
        } catch (error) {
          console.error(`Error in mouse event handler ${method}:`, error);
        }
      }
    }
  }

  // 公共方法
  addListener(listener: MouseEventListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: MouseEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getState(): Readonly<MouseState> {
    return this.state;
  }

  destroy(): void {
    this.removeEventListeners();
    this.listeners.length = 0;
  }

  // 配置
  setDoubleClickThreshold(ms: number): void {
    this.doubleClickThreshold = ms;
  }

  setDragThreshold(pixels: number): void {
    this.dragThreshold = pixels;
  }

  // 手动触发事件（用于测试）
  simulate(kind: MouseEventKind, x: number, y: number, options: Partial<MouseEventArgs> = {}): void {
    const args: GridMouseEventArgs = {
      kind,
      location: { x, y },
      button: MouseButton.Primary,
      modifiers: { ctrl: false, shift: false, alt: false, meta: false },
      preventDefault: () => {},
      stopPropagation: () => {},
      localEventX: x,
      localEventY: y,
      scrollEdge: [0, 0],
      isTouch: false,
      isMajor: true,
      isHeader: false,
      isGroupHeader: false,
      ...options
    };

    const methodMap: Record<MouseEventKind, keyof MouseEventListener> = {
      [MouseEventKind.Click]: 'onClick',
      [MouseEventKind.DoubleClick]: 'onDoubleClick',
      [MouseEventKind.MouseDown]: 'onMouseDown',
      [MouseEventKind.MouseUp]: 'onMouseUp',
      [MouseEventKind.MouseMove]: 'onMouseMove',
      [MouseEventKind.MouseEnter]: 'onMouseEnter',
      [MouseEventKind.MouseLeave]: 'onMouseLeave',
      [MouseEventKind.ContextMenu]: 'onContextMenu',
      [MouseEventKind.Wheel]: 'onWheel',
      [MouseEventKind.DragStart]: 'onDragStart',
      [MouseEventKind.Drag]: 'onDrag',
      [MouseEventKind.DragEnd]: 'onDragEnd'
    };

    const method = methodMap[kind];
    if (method) {
      this.notifyListeners(method, args);
    }
  }
}

// Vue3 组合式函数
export function useMouseEvents(
  canvas: Ref<HTMLCanvasElement | undefined>,
  options: {
    getCellAtLocation?: (x: number, y: number) => { cell?: Item; bounds?: Rectangle; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean };
    getScrollPosition?: () => Point;
    listeners?: MouseEventListener;
  } = {}
) {
  const manager = new MouseEventManager(canvas, options);

  if (options.listeners) {
    manager.addListener(options.listeners);
  }

  const state = computed(() => manager.getState());

  // 清理函数
  const cleanup = () => {
    manager.destroy();
  };

  return {
    manager,
    state,
    addListener: manager.addListener.bind(manager),
    removeListener: manager.removeListener.bind(manager),
    enable: manager.enable.bind(manager),
    disable: manager.disable.bind(manager),
    simulate: manager.simulate.bind(manager),
    cleanup
  };
}
