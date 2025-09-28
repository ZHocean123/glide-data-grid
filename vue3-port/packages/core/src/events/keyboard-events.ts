/**
 * 键盘事件处理系统
 * 从 React 版本迁移并适配 Vue3
 */

import type { Ref } from 'vue';
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import type { Item } from '../types/base.js';
import type { GridColumn } from '../types/grid-column.js';

// 键盘事件类型
export enum KeyboardEventKind {
  KeyDown = 'keydown',
  KeyUp = 'keyup',
  KeyPress = 'keypress'
}

// 特殊键码
export enum SpecialKey {
  Enter = 'Enter',
  Escape = 'Escape',
  Tab = 'Tab',
  Space = ' ',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Home = 'Home',
  End = 'End',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
  Delete = 'Delete',
  Backspace = 'Backspace',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12'
}

// 修饰键状态
export interface ModifierKeys {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

// 键盘状态
export interface KeyboardState {
  pressedKeys: Set<string>;
  modifiers: ModifierKeys;
  lastKeyTime: number;
  repeatCount: number;
  isComposing: boolean;
}

// 键盘事件参数
export interface KeyboardEventArgs {
  kind: KeyboardEventKind;
  key: string;
  code: string;
  keyCode: number;
  modifiers: ModifierKeys;
  isRepeat: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  target?: EventTarget | null;
  currentTarget?: EventTarget | null;
}

// 网格键盘事件参数
export interface GridKeyboardEventArgs extends KeyboardEventArgs {
  cell?: Item;
  column?: GridColumn;
  row?: number;
  bounds?: { x: number; y: number; width: number; height: number };
  isHeader: boolean;
  isGroupHeader: boolean;
}

// 键盘快捷键
export interface KeyboardShortcut {
  key: string;
  modifiers?: Partial<ModifierKeys>;
  description?: string;
  handler: (args: GridKeyboardEventArgs) => boolean | void; // 返回true表示阻止默认行为
}

// 键盘事件监听器
export interface KeyboardEventListener {
  onKeyDown?: (args: GridKeyboardEventArgs) => void;
  onKeyUp?: (args: GridKeyboardEventArgs) => void;
  onKeyPress?: (args: GridKeyboardEventArgs) => void;
}

// 导航动作
export enum NavigationAction {
  None = 'none',
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Home = 'home',
  End = 'end',
  PageUp = 'page-up',
  PageDown = 'page-down',
  FirstCell = 'first-cell',
  LastCell = 'last-cell',
  FirstRow = 'first-row',
  LastRow = 'last-row',
  NextColumn = 'next-column',
  PreviousColumn = 'previous-column'
}

// 编辑动作
export enum EditAction {
  None = 'none',
  StartEdit = 'start-edit',
  ConfirmEdit = 'confirm-edit',
  CancelEdit = 'cancel-edit',
  Delete = 'delete',
  Copy = 'copy',
  Cut = 'cut',
  Paste = 'paste',
  Undo = 'undo',
  Redo = 'redo',
  SelectAll = 'select-all'
}

// 键盘事件管理器
export class KeyboardEventManager {
  private element: Ref<HTMLElement | undefined>;
  private state: KeyboardState;
  private listeners: KeyboardEventListener[] = [];
  private shortcuts: KeyboardShortcut[] = [];
  private isEnabled = true;
  private preventDefaultKeys = new Set<string>();

  // 网格信息获取函数
  private getCurrentCell?: () => { cell?: Item; bounds?: { x: number; y: number; width: number; height: number }; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean } | undefined;

  constructor(
    element: Ref<HTMLElement | undefined>,
    options: {
      getCurrentCell?: () => { cell?: Item; bounds?: { x: number; y: number; width: number; height: number }; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean } | undefined;
    } = {}
  ) {
    this.element = element;
    this.getCurrentCell = options.getCurrentCell;

    this.state = reactive({
      pressedKeys: new Set<string>(),
      modifiers: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false
      },
      lastKeyTime: 0,
      repeatCount: 0,
      isComposing: false
    });

    this.setupEventListeners();
    this.setupDefaultShortcuts();
  }

  private setupEventListeners(): void {
    if (!this.element.value) return;

    const element = this.element.value;

    element.addEventListener('keydown', this.handleKeyDown);
    element.addEventListener('keyup', this.handleKeyUp);
    element.addEventListener('keypress', this.handleKeyPress);

    // IME 事件处理
    element.addEventListener('compositionstart', this.handleCompositionStart);
    element.addEventListener('compositionend', this.handleCompositionEnd);

    // 焦点事件
    element.addEventListener('focus', this.handleFocus);
    element.addEventListener('blur', this.handleBlur);
  }

  private removeEventListeners(): void {
    if (!this.element.value) return;

    const element = this.element.value;

    element.removeEventListener('keydown', this.handleKeyDown);
    element.removeEventListener('keyup', this.handleKeyUp);
    element.removeEventListener('keypress', this.handleKeyPress);
    element.removeEventListener('compositionstart', this.handleCompositionStart);
    element.removeEventListener('compositionend', this.handleCompositionEnd);
    element.removeEventListener('focus', this.handleFocus);
    element.removeEventListener('blur', this.handleBlur);
  }

  // 事件处理器
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled || this.state.isComposing) return;

    const args = this.createKeyboardEventArgs(KeyboardEventKind.KeyDown, event);
    this.updateStateFromEvent(event);

    // 处理按键重复
    const now = Date.now();
    if (this.state.pressedKeys.has(event.key)) {
      this.state.repeatCount++;
    } else {
      this.state.repeatCount = 0;
      this.state.pressedKeys.add(event.key);
    }
    this.state.lastKeyTime = now;

    // 检查快捷键
    const shortcutHandled = this.handleShortcuts(args);

    // 检查是否需要阻止默认行为
    if (this.preventDefaultKeys.has(event.key) || shortcutHandled) {
      event.preventDefault();
    }

    this.notifyListeners('onKeyDown', args);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    const args = this.createKeyboardEventArgs(KeyboardEventKind.KeyUp, event);
    this.updateStateFromEvent(event);
    this.state.pressedKeys.delete(event.key);
    this.state.repeatCount = 0;

    this.notifyListeners('onKeyUp', args);
  };

  private handleKeyPress = (event: KeyboardEvent): void => {
    if (!this.isEnabled || this.state.isComposing) return;

    const args = this.createKeyboardEventArgs(KeyboardEventKind.KeyPress, event);
    this.notifyListeners('onKeyPress', args);
  };

  private handleCompositionStart = (): void => {
    this.state.isComposing = true;
  };

  private handleCompositionEnd = (): void => {
    this.state.isComposing = false;
  };

  private handleFocus = (): void => {
    // 重置状态
    this.state.pressedKeys.clear();
    this.state.modifiers = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false
    };
  };

  private handleBlur = (): void => {
    // 清理状态
    this.state.pressedKeys.clear();
    this.state.modifiers = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false
    };
  };

  // 工具函数
  private createKeyboardEventArgs(kind: KeyboardEventKind, event: KeyboardEvent): GridKeyboardEventArgs {
    const gridInfo = this.getCurrentCell?.() || {
      isHeader: false,
      isGroupHeader: false
    };

    return {
      kind,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      isRepeat: event.repeat,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      target: event.target,
      currentTarget: event.currentTarget,
      ...gridInfo
    };
  }

  private updateStateFromEvent(event: KeyboardEvent): void {
    this.state.modifiers = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  private handleShortcuts(args: GridKeyboardEventArgs): boolean {
    for (const shortcut of this.shortcuts) {
      if (this.matchesShortcut(args, shortcut)) {
        try {
          const result = shortcut.handler(args);
          if (result === true) {
            return true; // 阻止默认行为
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      }
    }
    return false;
  }

  private matchesShortcut(args: GridKeyboardEventArgs, shortcut: KeyboardShortcut): boolean {
    // 检查主键
    if (args.key !== shortcut.key) {
      return false;
    }

    // 检查修饰键
    if (shortcut.modifiers) {
      const required = shortcut.modifiers;
      const actual = args.modifiers;

      if (required.ctrl !== undefined && required.ctrl !== actual.ctrl) return false;
      if (required.shift !== undefined && required.shift !== actual.shift) return false;
      if (required.alt !== undefined && required.alt !== actual.alt) return false;
      if (required.meta !== undefined && required.meta !== actual.meta) return false;
    }

    return true;
  }

  private notifyListeners(method: keyof KeyboardEventListener, args: GridKeyboardEventArgs): void {
    for (const listener of this.listeners) {
      const handler = listener[method];
      if (handler) {
        try {
          handler(args);
        } catch (error) {
          console.error(`Error in keyboard event handler ${method}:`, error);
        }
      }
    }
  }

  // 默认快捷键设置
  private setupDefaultShortcuts(): void {
    // 导航快捷键
    this.addShortcut(SpecialKey.ArrowUp, {}, () => this.handleNavigation(NavigationAction.Up));
    this.addShortcut(SpecialKey.ArrowDown, {}, () => this.handleNavigation(NavigationAction.Down));
    this.addShortcut(SpecialKey.ArrowLeft, {}, () => this.handleNavigation(NavigationAction.Left));
    this.addShortcut(SpecialKey.ArrowRight, {}, () => this.handleNavigation(NavigationAction.Right));
    this.addShortcut(SpecialKey.Home, {}, () => this.handleNavigation(NavigationAction.Home));
    this.addShortcut(SpecialKey.End, {}, () => this.handleNavigation(NavigationAction.End));
    this.addShortcut(SpecialKey.PageUp, {}, () => this.handleNavigation(NavigationAction.PageUp));
    this.addShortcut(SpecialKey.PageDown, {}, () => this.handleNavigation(NavigationAction.PageDown));

    // Ctrl + 导航
    this.addShortcut(SpecialKey.Home, { ctrl: true }, () => this.handleNavigation(NavigationAction.FirstCell));
    this.addShortcut(SpecialKey.End, { ctrl: true }, () => this.handleNavigation(NavigationAction.LastCell));

    // 编辑快捷键
    this.addShortcut(SpecialKey.Enter, {}, () => this.handleEdit(EditAction.StartEdit));
    this.addShortcut(SpecialKey.F2, {}, () => this.handleEdit(EditAction.StartEdit));
    this.addShortcut(SpecialKey.Escape, {}, () => this.handleEdit(EditAction.CancelEdit));
    this.addShortcut(SpecialKey.Delete, {}, () => this.handleEdit(EditAction.Delete));

    // Ctrl + 编辑
    this.addShortcut('c', { ctrl: true }, () => this.handleEdit(EditAction.Copy));
    this.addShortcut('x', { ctrl: true }, () => this.handleEdit(EditAction.Cut));
    this.addShortcut('v', { ctrl: true }, () => this.handleEdit(EditAction.Paste));
    this.addShortcut('z', { ctrl: true }, () => this.handleEdit(EditAction.Undo));
    this.addShortcut('y', { ctrl: true }, () => this.handleEdit(EditAction.Redo));
    this.addShortcut('a', { ctrl: true }, () => this.handleEdit(EditAction.SelectAll));

    // 阻止默认行为的按键
    this.preventDefaultKeys.add(SpecialKey.ArrowUp);
    this.preventDefaultKeys.add(SpecialKey.ArrowDown);
    this.preventDefaultKeys.add(SpecialKey.ArrowLeft);
    this.preventDefaultKeys.add(SpecialKey.ArrowRight);
    this.preventDefaultKeys.add(SpecialKey.Home);
    this.preventDefaultKeys.add(SpecialKey.End);
    this.preventDefaultKeys.add(SpecialKey.PageUp);
    this.preventDefaultKeys.add(SpecialKey.PageDown);
    this.preventDefaultKeys.add(SpecialKey.Tab);
  }

  private handleNavigation(action: NavigationAction): boolean {
    // 这里会触发导航事件，由外部处理具体逻辑
    console.log('Navigation action:', action);
    return true; // 阻止默认行为
  }

  private handleEdit(action: EditAction): boolean {
    // 这里会触发编辑事件，由外部处理具体逻辑
    console.log('Edit action:', action);
    return true; // 阻止默认行为
  }

  // 公共方法
  addListener(listener: KeyboardEventListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: KeyboardEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  addShortcut(key: string, modifiers: Partial<ModifierKeys>, handler: (args: GridKeyboardEventArgs) => boolean | void, description?: string): void {
    this.shortcuts.push({
      key,
      modifiers,
      handler,
      description
    });
  }

  removeShortcut(key: string, modifiers?: Partial<ModifierKeys>): void {
    this.shortcuts = this.shortcuts.filter(shortcut => {
      if (shortcut.key !== key) return true;

      if (modifiers) {
        return !this.modifiersEqual(shortcut.modifiers || {}, modifiers);
      }

      return false;
    });
  }

  clearShortcuts(): void {
    this.shortcuts.length = 0;
  }

  getShortcuts(): readonly KeyboardShortcut[] {
    return this.shortcuts;
  }

  private modifiersEqual(a: Partial<ModifierKeys>, b: Partial<ModifierKeys>): boolean {
    return (a.ctrl === b.ctrl) &&
           (a.shift === b.shift) &&
           (a.alt === b.alt) &&
           (a.meta === b.meta);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getState(): Readonly<KeyboardState> {
    return this.state;
  }

  // 检查按键状态
  isKeyPressed(key: string): boolean {
    return this.state.pressedKeys.has(key);
  }

  isModifierPressed(modifier: keyof ModifierKeys): boolean {
    return this.state.modifiers[modifier];
  }

  areKeysPressed(keys: string[]): boolean {
    return keys.every(key => this.state.pressedKeys.has(key));
  }

  // 焦点管理
  focus(): void {
    if (this.element.value) {
      this.element.value.focus();
    }
  }

  blur(): void {
    if (this.element.value) {
      this.element.value.blur();
    }
  }

  // 手动触发事件（用于测试）
  simulate(kind: KeyboardEventKind, key: string, modifiers: Partial<ModifierKeys> = {}): void {
    const args: GridKeyboardEventArgs = {
      kind,
      key,
      code: key,
      keyCode: key.charCodeAt(0),
      modifiers: {
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        ...modifiers
      },
      isRepeat: false,
      preventDefault: () => {},
      stopPropagation: () => {},
      isHeader: false,
      isGroupHeader: false
    };

    const methodMap: Record<KeyboardEventKind, keyof KeyboardEventListener> = {
      [KeyboardEventKind.KeyDown]: 'onKeyDown',
      [KeyboardEventKind.KeyUp]: 'onKeyUp',
      [KeyboardEventKind.KeyPress]: 'onKeyPress'
    };

    const method = methodMap[kind];
    if (method) {
      this.notifyListeners(method, args);
    }
  }

  destroy(): void {
    this.removeEventListeners();
    this.listeners.length = 0;
    this.shortcuts.length = 0;
    this.preventDefaultKeys.clear();
  }
}

// Vue3 组合式函数
export function useKeyboardEvents(
  element: Ref<HTMLElement | undefined>,
  options: {
    getCurrentCell?: () => { cell?: Item; bounds?: { x: number; y: number; width: number; height: number }; column?: GridColumn; row?: number; isHeader: boolean; isGroupHeader: boolean } | undefined;
    listeners?: KeyboardEventListener;
    shortcuts?: Array<{ key: string; modifiers?: Partial<ModifierKeys>; handler: (args: GridKeyboardEventArgs) => boolean | void; description?: string }>;
  } = {}
) {
  const manager = new KeyboardEventManager(element, options);

  if (options.listeners) {
    manager.addListener(options.listeners);
  }

  if (options.shortcuts) {
    for (const shortcut of options.shortcuts) {
      manager.addShortcut(shortcut.key, shortcut.modifiers || {}, shortcut.handler, shortcut.description);
    }
  }

  const state = computed(() => manager.getState());

  onMounted(() => {
    // 事件监听器已在构造函数中设置
  });

  onUnmounted(() => {
    manager.destroy();
  });

  return {
    manager,
    state,
    addListener: manager.addListener.bind(manager),
    removeListener: manager.removeListener.bind(manager),
    addShortcut: manager.addShortcut.bind(manager),
    removeShortcut: manager.removeShortcut.bind(manager),
    enable: manager.enable.bind(manager),
    disable: manager.disable.bind(manager),
    focus: manager.focus.bind(manager),
    blur: manager.blur.bind(manager),
    simulate: manager.simulate.bind(manager),
    isKeyPressed: manager.isKeyPressed.bind(manager),
    isModifierPressed: manager.isModifierPressed.bind(manager)
  };
}
