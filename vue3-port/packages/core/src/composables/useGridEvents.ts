/**
 * 网格事件管理组合式函数
 * 处理鼠标、键盘、触摸等所有交互事件
 */

import { ref, computed, type Ref } from 'vue';
import type { Item } from '../types/base.js';
import type {
  DataGridEmits,
  GridMouseEventArgs,
  CellClickedEventArgs,
  HeaderClickedEventArgs,
  GridKeyEventArgs,
  GridDragEventArgs
} from '../types/events.js';
import { useEventListener } from '../common/utils.js';

// 事件状态
interface EventState {
  isDragging: boolean;
  isSelecting: boolean;
  dragStart: { x: number; y: number; cell: Item } | null;
  lastMousePosition: { x: number; y: number } | null;
  clickCount: number;
  lastClickTime: number;
  lastClickPosition: { x: number; y: number } | null;
}

// 鼠标按钮枚举
enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
}

// 双击检测参数
const DOUBLE_CLICK_TIME = 500; // ms
const DOUBLE_CLICK_DISTANCE = 5; // pixels

// 网格事件管理组合式函数
export function useGridEvents(
  containerRef: Ref<HTMLElement | null>,
  getCellAtPoint: (x: number, y: number) => Item | null,
  emit: (event: keyof DataGridEmits, ...args: any[]) => void
) {
  // 事件状态
  const eventState = ref<EventState>({
    isDragging: false,
    isSelecting: false,
    dragStart: null,
    lastMousePosition: null,
    clickCount: 0,
    lastClickTime: 0,
    lastClickPosition: null,
  });

  // 是否聚焦
  const isFocused = ref(false);

  // 获取相对于容器的坐标
  const getRelativePosition = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
    const container = containerRef.value;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // 创建基础鼠标事件参数
  const createBaseMouseEventArgs = (
    event: MouseEvent | TouchEvent,
    position: { x: number; y: number },
    cell: Item | null
  ) => {
    const isTouch = 'touches' in event;

    return {
      location: cell || [0, 0] as Item,
      bounds: { x: 0, y: 0, width: 0, height: 0 }, // 简化，实际需要计算
      localEventX: position.x,
      localEventY: position.y,
      isTouch,
      isLongTouch: false, // TODO: 实现长按检测
      isEdge: false, // TODO: 实现边缘检测
      shiftKey: 'shiftKey' in event ? event.shiftKey : false,
      ctrlKey: 'ctrlKey' in event ? event.ctrlKey : false,
      metaKey: 'metaKey' in event ? event.metaKey : false,
      altKey: 'altKey' in event ? event.altKey : false,
      scrollEdge: [0, 0] as const,
      preventDefault: () => event.preventDefault(),
    };
  };

  // 检测双击
  const detectDoubleClick = (position: { x: number; y: number }): boolean => {
    const now = Date.now();
    const timeDiff = now - eventState.value.lastClickTime;
    const lastPos = eventState.value.lastClickPosition;

    let distanceOk = true;
    if (lastPos) {
      const distance = Math.sqrt(
        Math.pow(position.x - lastPos.x, 2) + Math.pow(position.y - lastPos.y, 2)
      );
      distanceOk = distance <= DOUBLE_CLICK_DISTANCE;
    }

    if (timeDiff <= DOUBLE_CLICK_TIME && distanceOk) {
      eventState.value.clickCount++;
      return eventState.value.clickCount >= 2;
    } else {
      eventState.value.clickCount = 1;
      eventState.value.lastClickTime = now;
      eventState.value.lastClickPosition = position;
      return false;
    }
  };

  // 鼠标按下事件
  const onMouseDown = (event: MouseEvent) => {
    const position = getRelativePosition(event);
    const cell = getCellAtPoint(position.x, position.y);

    if (event.button === MouseButton.Left) {
      eventState.value.dragStart = cell ? { ...position, cell } : null;
      eventState.value.lastMousePosition = position;

      if (cell) {
        const isDoubleClick = detectDoubleClick(position);

        const cellClickArgs: CellClickedEventArgs = {
          kind: 'cell',
          button: event.button,
          clickCount: isDoubleClick ? 2 : 1,
          ...createBaseMouseEventArgs(event, position, cell),
          cell: { kind: 'text', data: '', allowOverlay: false } as any, // 简化
        };

        if (isDoubleClick) {
          emit('cell-double-click', cellClickArgs);
        } else {
          emit('cell-click', cellClickArgs);
        }
      }
    } else if (event.button === MouseButton.Right) {
      // 右键菜单
      if (cell) {
        const cellClickArgs: CellClickedEventArgs = {
          kind: 'cell',
          button: event.button,
          ...createBaseMouseEventArgs(event, position, cell),
          cell: { kind: 'text', data: '', allowOverlay: false } as any, // 简化
        };

        emit('cell-context-menu', cellClickArgs);
      }
    }

    // 获取焦点
    if (!isFocused.value) {
      const container = containerRef.value;
      if (container && container.focus) {
        container.focus();
      }
    }
  };

  // 鼠标移动事件
  const onMouseMove = (event: MouseEvent) => {
    const position = getRelativePosition(event);
    eventState.value.lastMousePosition = position;

    // 拖拽检测
    if (eventState.value.dragStart && !eventState.value.isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(position.x - eventState.value.dragStart.x, 2) +
        Math.pow(position.y - eventState.value.dragStart.y, 2)
      );

      if (dragDistance > 5) { // 开始拖拽的阈值
        eventState.value.isDragging = true;

        const dragArgs: GridDragEventArgs = {
          kind: 'drag',
          startLocation: eventState.value.dragStart.cell,
          currentLocation: getCellAtPoint(position.x, position.y) || eventState.value.dragStart.cell,
          lastLocation: eventState.value.dragStart.cell,
          deltaX: position.x - eventState.value.dragStart.x,
          deltaY: position.y - eventState.value.dragStart.y,
          localEventX: position.x,
          localEventY: position.y,
          isTouch: false,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          preventDefault: () => event.preventDefault(),
        };

        emit('drag-start', dragArgs);
      }
    }

    // 拖拽进行中
    if (eventState.value.isDragging && eventState.value.dragStart) {
      const dragArgs: GridDragEventArgs = {
        kind: 'drag',
        startLocation: eventState.value.dragStart.cell,
        currentLocation: getCellAtPoint(position.x, position.y) || eventState.value.dragStart.cell,
        lastLocation: eventState.value.dragStart.cell, // 简化
        deltaX: position.x - eventState.value.dragStart.x,
        deltaY: position.y - eventState.value.dragStart.y,
        localEventX: position.x,
        localEventY: position.y,
        isTouch: false,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        preventDefault: () => event.preventDefault(),
      };

      emit('drag-move', dragArgs);
    }
  };

  // 鼠标释放事件
  const onMouseUp = (event: MouseEvent) => {
    const position = getRelativePosition(event);

    if (eventState.value.isDragging && eventState.value.dragStart) {
      const dragArgs: GridDragEventArgs = {
        kind: 'drag',
        startLocation: eventState.value.dragStart.cell,
        currentLocation: getCellAtPoint(position.x, position.y) || eventState.value.dragStart.cell,
        lastLocation: eventState.value.dragStart.cell,
        deltaX: position.x - eventState.value.dragStart.x,
        deltaY: position.y - eventState.value.dragStart.y,
        localEventX: position.x,
        localEventY: position.y,
        isTouch: false,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        preventDefault: () => event.preventDefault(),
      };

      emit('drag-end', dragArgs);
    }

    // 重置拖拽状态
    eventState.value.isDragging = false;
    eventState.value.dragStart = null;
  };

  // 键盘按下事件
  const onKeyDown = (event: KeyboardEvent) => {
    const cell = eventState.value.lastMousePosition
      ? getCellAtPoint(eventState.value.lastMousePosition.x, eventState.value.lastMousePosition.y)
      : null;

    const keyArgs: GridKeyEventArgs = {
      kind: 'keydown',
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      location: cell,
      bounds: cell ? { x: 0, y: 0, width: 0, height: 0 } : undefined, // 简化
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    };

    emit('key-down', keyArgs);
  };

  // 键盘释放事件
  const onKeyUp = (event: KeyboardEvent) => {
    const cell = eventState.value.lastMousePosition
      ? getCellAtPoint(eventState.value.lastMousePosition.x, eventState.value.lastMousePosition.y)
      : null;

    const keyArgs: GridKeyEventArgs = {
      kind: 'keyup',
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      location: cell,
      bounds: cell ? { x: 0, y: 0, width: 0, height: 0 } : undefined,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    };

    emit('key-up', keyArgs);
  };

  // 滚轮事件
  const onWheel = (event: WheelEvent) => {
    const scrollArgs = {
      scrollX: event.deltaX,
      scrollY: event.deltaY,
    };

    emit('scroll', scrollArgs);
  };

  // 焦点事件
  const onFocus = () => {
    isFocused.value = true;
    emit('focus');
  };

  const onBlur = () => {
    isFocused.value = false;
    emit('blur');
  };

  // 触摸事件支持
  const onTouchStart = (event: TouchEvent) => {
    // 转换为鼠标事件处理
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: event.touches[0]?.clientX,
      clientY: event.touches[0]?.clientY,
      button: 0,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    });

    onMouseDown(mouseEvent);
  };

  const onTouchMove = (event: TouchEvent) => {
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: event.touches[0]?.clientX,
      clientY: event.touches[0]?.clientY,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    });

    onMouseMove(mouseEvent);
  };

  const onTouchEnd = (event: TouchEvent) => {
    const mouseEvent = new MouseEvent('mouseup', {
      button: 0,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
    });

    onMouseUp(mouseEvent);
  };

  // 绑定事件监听器
  useEventListener('mousedown', onMouseDown, containerRef);
  useEventListener('mousemove', onMouseMove, containerRef);
  useEventListener('mouseup', onMouseUp, containerRef);
  useEventListener('keydown', onKeyDown, containerRef);
  useEventListener('keyup', onKeyUp, containerRef);
  useEventListener('wheel', onWheel, containerRef, { passive: false });
  useEventListener('focus', onFocus, containerRef);
  useEventListener('blur', onBlur, containerRef);

  // 触摸事件
  useEventListener('touchstart', onTouchStart, containerRef, { passive: false });
  useEventListener('touchmove', onTouchMove, containerRef, { passive: false });
  useEventListener('touchend', onTouchEnd, containerRef);

  return {
    // 状态
    eventState: computed(() => eventState.value),
    isFocused: computed(() => isFocused.value),

    // 事件处理器 (可以被外部覆盖)
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
    onKeyUp,
    onWheel,
    onFocus,
    onBlur,

    // 工具方法
    getRelativePosition,
    detectDoubleClick,
  };
}
