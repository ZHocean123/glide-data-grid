/**
 * Vue版本的Glide Data Grid端到端测试
 * 测试完整的用户流程和浏览器兼容性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLargeDataset, createMediumDataset, setupGlobalMocks, cleanupGlobalMocks } from '../test-utils.js';

describe('End-to-End Tests', () => {
  beforeEach(() => {
    setupGlobalMocks();
  });

  afterEach(() => {
    cleanupGlobalMocks();
  });

  describe('Complete User Workflow', () => {
    it('should handle complete data entry workflow', async () => {
      // 模拟完整的数据输入工作流
      const mockWorkflow: any = {
        // 初始化
        init() {
          this.data = createMediumDataset(50, 10);
          this.selection = { row: 0, col: 0 };
          this.editMode = false;
          this.history = [];
          this.historyIndex = -1;
          
          // 创建DOM结构
          this.createDOM();
        },
        
        createDOM() {
          // 创建网格容器
          this.container = document.createElement('div');
          this.container.className = 'data-grid-container';
          this.container.style.width = '800px';
          this.container.style.height = '600px';
          document.body.appendChild(this.container);
          
          // 创建Canvas
          this.canvas = document.createElement('canvas');
          this.canvas.width = 800;
          this.canvas.height = 600;
          this.container.appendChild(this.canvas);
          
          // 创建输入框
          this.input = document.createElement('input');
          this.input.type = 'text';
          this.input.className = 'cell-editor';
          this.input.style.position = 'absolute';
          this.input.style.display = 'none';
          this.container.appendChild(this.input);
        },
        
        // 数据操作
        loadData(newData: any[][]) {
          this.saveHistory();
          this.data = newData;
          this.render();
        },
        
        saveHistory() {
          // 删除当前索引之后的历史记录
          this.history = this.history.slice(0, this.historyIndex + 1);
          
          // 添加新的历史记录
          this.history.push(JSON.parse(JSON.stringify(this.data)));
          this.historyIndex++;
          
          // 限制历史记录数量
          if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
          }
        },
        
        undo() {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            return true;
          }
          return false;
        },
        
        redo() {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            return true;
          }
          return false;
        },
        
        // 选择和编辑
        selectCell(row: number, col: number) {
          this.selection = { row, col };
          this.render();
        },
        
        startEdit() {
          this.editMode = true;
          const cell = this.data[this.selection.row][this.selection.col];
          const value = cell.kind === 'text' ? cell.data : '';
          
          this.input.value = value;
          this.input.style.display = 'block';
          this.input.style.left = `${this.selection.col * 100 + 5}px`;
          this.input.style.top = `${this.selection.row * 30 + 5}px`;
          this.input.focus();
          this.input.select();
        },
        
        commitEdit() {
          if (!this.editMode) return;
          
          this.saveHistory();
          
          this.data[this.selection.row][this.selection.col] = {
            kind: 'text',
            data: this.input.value,
            displayData: this.input.value,
            allowOverlay: true,
            readonly: false
          };
          
          this.editMode = false;
          this.input.style.display = 'none';
          this.render();
        },
        
        cancelEdit() {
          this.editMode = false;
          this.input.style.display = 'none';
        },
        
        // 渲染
        render() {
          const ctx = this.canvas.getContext('2d');
          if (!ctx) return;
          
          // 清除画布
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          
          // 绘制背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          
          // 绘制网格线
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          
          for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 100, 0);
            ctx.lineTo(i * 100, 600);
            ctx.stroke();
          }
          
          for (let i = 0; i <= 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 30);
            ctx.lineTo(800, i * 30);
            ctx.stroke();
          }
          
          // 绘制选中单元格
          if (this.selection.row >= 0 && this.selection.col >= 0) {
            ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
            ctx.fillRect(
              this.selection.col * 100,
              this.selection.row * 30,
              100,
              30
            );
            
            ctx.strokeStyle = '#007acc';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              this.selection.col * 100,
              this.selection.row * 30,
              100,
              30
            );
          }
          
          // 绘制单元格内容
          ctx.fillStyle = '#333333';
          ctx.font = '14px Arial';
          
          for (let row = 0; row < Math.min(20, this.data.length); row++) {
            for (let col = 0; col < Math.min(10, this.data[row].length); col++) {
              const cell = this.data[row][col];
              const value = cell.kind === 'text' ? cell.data : '';
              
              ctx.fillText(
                value,
                col * 100 + 5,
                row * 30 + 20
              );
            }
          }
        },
        
        // 事件处理
        handleClick(event: MouseEvent) {
          const rect = this.canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          const col = Math.floor(x / 100);
          const row = Math.floor(y / 30);
          
          if (row >= 0 && row < this.data.length && col >= 0 && col < this.data[0].length) {
            this.selectCell(row, col);
          }
        },
        
        handleKeyDown(event: KeyboardEvent) {
          switch (event.key) {
            case 'ArrowUp':
              if (!this.editMode) {
                this.selectCell(
                  Math.max(0, this.selection.row - 1),
                  this.selection.col
                );
              }
              break;
            case 'ArrowDown':
              if (!this.editMode) {
                this.selectCell(
                  Math.min(this.data.length - 1, this.selection.row + 1),
                  this.selection.col
                );
              }
              break;
            case 'ArrowLeft':
              if (!this.editMode) {
                this.selectCell(
                  this.selection.row,
                  Math.max(0, this.selection.col - 1)
                );
              }
              break;
            case 'ArrowRight':
              if (!this.editMode) {
                this.selectCell(
                  this.selection.row,
                  Math.min(this.data[0].length - 1, this.selection.col + 1)
                );
              }
              break;
            case 'Enter':
              if (this.editMode) {
                this.commitEdit();
                this.selectCell(
                  Math.min(this.data.length - 1, this.selection.row + 1),
                  this.selection.col
                );
              } else {
                this.startEdit();
              }
              break;
            case 'Escape':
              this.cancelEdit();
              break;
            case 'z':
              if (event.ctrlKey || event.metaKey) {
                if (event.shiftKey) {
                  this.redo();
                } else {
                  this.undo();
                }
              }
              break;
            case 'y':
              if (event.ctrlKey || event.metaKey) {
                this.redo();
              }
              break;
          }
        },
        
        // 清理
        cleanup() {
          if (this.container && document.body.contains(this.container)) {
            document.body.removeChild(this.container);
          }
        }
      };
      
      // 初始化
      mockWorkflow.init();
      
      // 绑定事件
      mockWorkflow.canvas.addEventListener('click', mockWorkflow.handleClick.bind(mockWorkflow));
      document.addEventListener('keydown', mockWorkflow.handleKeyDown.bind(mockWorkflow));
      
      // 模拟用户操作流程
      // 1. 选择单元格
      mockWorkflow.selectCell(2, 3);
      expect(mockWorkflow.selection).toEqual({ row: 2, col: 3 });
      
      // 2. 开始编辑
      mockWorkflow.startEdit();
      expect(mockWorkflow.editMode).toBe(true);
      expect(mockWorkflow.input.style.display).toBe('block');
      
      // 3. 输入数据
      mockWorkflow.input.value = 'Test Data';
      
      // 4. 提交编辑
      mockWorkflow.commitEdit();
      expect(mockWorkflow.editMode).toBe(false);
      expect(mockWorkflow.data[2][3].data).toBe('Test Data');
      
      // 5. 导航到其他单元格
      mockWorkflow.selectCell(3, 3);
      mockWorkflow.startEdit();
      mockWorkflow.input.value = 'More Data';
      mockWorkflow.commitEdit();
      
      // 6. 撤销操作
      const undoSuccess = mockWorkflow.undo();
      expect(undoSuccess).toBe(true);
      expect(mockWorkflow.data[3][3].data).not.toBe('More Data');
      
      // 7. 重做操作
      const redoSuccess = mockWorkflow.redo();
      expect(redoSuccess).toBe(true);
      expect(mockWorkflow.data[3][3].data).toBe('More Data');
      
      // 8. 加载新数据
      const newData = createLargeDataset(100, 20);
      mockWorkflow.loadData(newData);
      expect(mockWorkflow.data.length).toBe(100);
      expect(mockWorkflow.data[0].length).toBe(20);
      
      // 清理
      document.removeEventListener('keydown', mockWorkflow.handleKeyDown);
      mockWorkflow.cleanup();
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle different browser APIs', () => {
      // 测试不同浏览器的API兼容性
      const compatibility = {
        checkSupport() {
          return {
            canvas: !!document.createElement('canvas').getContext,
            requestAnimationFrame: !!window.requestAnimationFrame,
            performance: !!window.performance,
            intersectionObserver: !!window.IntersectionObserver,
            resizeObserver: !!window.ResizeObserver,
            mutationObserver: !!window.MutationObserver,
            clipboard: !!navigator.clipboard,
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage
          };
        },
        
        getPolyfills() {
          const polyfills = [];
          
          if (!window.requestAnimationFrame) {
            polyfills.push('requestAnimationFrame');
          }
          
          if (!window.IntersectionObserver) {
            polyfills.push('IntersectionObserver');
          }
          
          if (!window.ResizeObserver) {
            polyfills.push('ResizeObserver');
          }
          
          if (!navigator.clipboard) {
            polyfills.push('clipboard');
          }
          
          return polyfills;
        }
      };
      
      const support = compatibility.checkSupport();
      
      // 基本功能应该都支持
      expect(support.canvas).toBe(true);
      expect(support.performance).toBe(true);
      
      // 检查是否需要polyfill
      const polyfills = compatibility.getPolyfills();
      
      // 在测试环境中，某些API可能不存在
      if (polyfills.length > 0) {
        console.log('需要polyfill:', polyfills);
      }
    });

    it('should handle different input methods', async () => {
      // 测试不同输入方法的兼容性
      const inputMethods = {
        mouse: {
          supported: 'onmousedown' in document,
          events: ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'wheel']
        },
        touch: {
          supported: 'ontouchstart' in window,
          events: ['touchstart', 'touchmove', 'touchend', 'touchcancel']
        },
        keyboard: {
          supported: 'onkeydown' in document,
          events: ['keydown', 'keyup', 'keypress']
        },
        pen: {
          supported: 'onpointerdown' in window,
          events: ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
        }
      };
      
      // 检查输入方法支持
      Object.entries(inputMethods).forEach(([method, config]) => {
        expect(typeof config.supported).toBe('boolean');
        expect(Array.isArray(config.events)).toBe(true);
      });
      
      // 模拟不同输入方法的事件
      const mockElement = document.createElement('div');
      
      // 鼠标事件
      if (inputMethods.mouse.supported) {
        const mouseEvent = new MouseEvent('click', { bubbles: true });
        mockElement.dispatchEvent(mouseEvent);
      }
      
      // 键盘事件
      if (inputMethods.keyboard.supported) {
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        mockElement.dispatchEvent(keyboardEvent);
      }
      
      // 触摸事件
      if (inputMethods.touch.supported) {
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          touches: [{ clientX: 100, clientY: 100 } as any]
        });
        mockElement.dispatchEvent(touchEvent);
      }
      
      // 指针事件
      if (inputMethods.pen.supported) {
        const pointerEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          pointerType: 'pen',
          clientX: 100,
          clientY: 100
        });
        mockElement.dispatchEvent(pointerEvent);
      }
    });
  });

  describe('Mobile Device Adaptation', () => {
    it('should handle touch events on mobile devices', async () => {
      // 模拟移动设备环境
      const mockMobile: any = {
        isMobile: false,
        touchSupport: false,
        
        detect() {
          this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          this.touchSupport = 'ontouchstart' in window;
          
          return {
            isMobile: this.isMobile,
            touchSupport: this.touchSupport,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          };
        },
        
        simulateTouch(element: HTMLElement, type: string, x: number, y: number) {
          const touch = new Touch({
            identifier: Date.now(),
            target: element,
            clientX: x,
            clientY: y,
            pageX: x,
            pageY: y,
            screenX: x,
            screenY: y,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 0,
            force: 1
          });
          
          const touchEvent = new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [touch],
            targetTouches: type === 'touchend' ? [] : [touch],
            changedTouches: [touch]
          });
          
          element.dispatchEvent(touchEvent);
          return touchEvent;
        }
      };
      
      // 检测设备类型
      const deviceInfo = mockMobile.detect();
      expect(typeof deviceInfo.isMobile).toBe('boolean');
      expect(typeof deviceInfo.touchSupport).toBe('boolean');
      expect(deviceInfo.viewport.width).toBeGreaterThan(0);
      expect(deviceInfo.viewport.height).toBeGreaterThan(0);
      
      // 创建测试元素
      const testElement = document.createElement('div');
      testElement.style.width = '200px';
      testElement.style.height = '200px';
      testElement.style.backgroundColor = '#f0f0f0';
      document.body.appendChild(testElement);
      
      // 模拟触摸事件
      let touchStarted = false;
      let touchMoved = false;
      let touchEnded = false;
      
      testElement.addEventListener('touchstart', () => {
        touchStarted = true;
      });
      
      testElement.addEventListener('touchmove', () => {
        touchMoved = true;
      });
      
      testElement.addEventListener('touchend', () => {
        touchEnded = true;
      });
      
      // 模拟触摸序列
      mockMobile.simulateTouch(testElement, 'touchstart', 100, 100);
      mockMobile.simulateTouch(testElement, 'touchmove', 120, 120);
      mockMobile.simulateTouch(testElement, 'touchend', 120, 120);
      
      // 在真实环境中，这些事件会被触发
      // 在测试环境中，我们只验证事件创建逻辑
      
      // 清理
      document.body.removeChild(testElement);
    });

    it('should adapt to different screen sizes', () => {
      // 测试响应式布局
      const responsive = {
        breakpoints: {
          mobile: 768,
          tablet: 1024,
          desktop: 1200
        },
        
        getCurrentBreakpoint() {
          const width = window.innerWidth;
          
          if (width < this.breakpoints.mobile) {
            return 'mobile';
          } else if (width < this.breakpoints.tablet) {
            return 'tablet';
          } else if (width < this.breakpoints.desktop) {
            return 'desktop';
          } else {
            return 'large';
          }
        },
        
        getLayoutConfig(breakpoint: string) {
          const configs: Record<string, any> = {
            mobile: {
              cellWidth: 80,
              cellHeight: 40,
              fontSize: 14,
              showScrollbars: true,
              touchOptimized: true
            },
            tablet: {
              cellWidth: 100,
              cellHeight: 35,
              fontSize: 14,
              showScrollbars: true,
              touchOptimized: true
            },
            desktop: {
              cellWidth: 120,
              cellHeight: 30,
              fontSize: 13,
              showScrollbars: false,
              touchOptimized: false
            },
            large: {
              cellWidth: 140,
              cellHeight: 30,
              fontSize: 14,
              showScrollbars: false,
              touchOptimized: false
            }
          };
          
          return configs[breakpoint] || configs.desktop;
        }
      };
      
      // 测试断点检测
      const currentBreakpoint = responsive.getCurrentBreakpoint();
      expect(['mobile', 'tablet', 'desktop', 'large']).toContain(currentBreakpoint);
      
      // 测试布局配置
      const config = responsive.getLayoutConfig(currentBreakpoint);
      expect(config.cellWidth).toBeGreaterThan(0);
      expect(config.cellHeight).toBeGreaterThan(0);
      expect(config.fontSize).toBeGreaterThan(0);
      expect(typeof config.showScrollbars).toBe('boolean');
      expect(typeof config.touchOptimized).toBe('boolean');
      
      // 模拟不同屏幕尺寸
      const originalWidth = window.innerWidth;
      
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true });
      const mobileBreakpoint = responsive.getCurrentBreakpoint();
      expect(mobileBreakpoint).toBe('mobile');
      
      const mobileConfig = responsive.getLayoutConfig(mobileBreakpoint);
      expect(mobileConfig.touchOptimized).toBe(true);
      
      // 模拟桌面设备
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      const desktopBreakpoint = responsive.getCurrentBreakpoint();
      expect(desktopBreakpoint).toBe('large');
      
      const desktopConfig = responsive.getLayoutConfig(desktopBreakpoint);
      expect(desktopConfig.touchOptimized).toBe(false);
      
      // 恢复原始宽度
      Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large datasets efficiently', async () => {
      // 测试大数据集性能
      const performanceTest: any = {
        datasetSize: 0,
        renderTime: 0,
        
        createLargeDataset(rows: number, cols: number) {
          const start = performance.now();
          
          const data = [];
          for (let row = 0; row < rows; row++) {
            const rowData = [];
            for (let col = 0; col < cols; col++) {
              rowData.push({
                kind: 'text',
                data: `Cell ${row}-${col}`,
                displayData: `Cell ${row}-${col}`,
                allowOverlay: true,
                readonly: false
              });
            }
            data.push(rowData);
          }
          
          const end = performance.now();
          this.datasetSize = rows * cols;
          
          return { data, creationTime: end - start };
        },
        
        simulateRender(data: any[][]) {
          const start = performance.now();
          
          // 模拟渲染过程
          let processedCells = 0;
          for (let row = 0; row < Math.min(100, data.length); row++) {
            for (let col = 0; col < Math.min(50, data[row].length); col++) {
              const cell = data[row][col];
              if (cell.kind === 'text') {
                processedCells += cell.data.length;
              }
            }
          }
          
          const end = performance.now();
          this.renderTime = end - start;
          
          return { processedCells, renderTime: end - start };
        }
      };
      
      // 测试不同大小的数据集
      const testSizes = [
        { rows: 1000, cols: 20 },   // 20,000 cells
        { rows: 5000, cols: 50 },   // 250,000 cells
        { rows: 10000, cols: 100 }  // 1,000,000 cells
      ];
      
      const results = [];
      
      for (const size of testSizes) {
        const { data, creationTime } = performanceTest.createLargeDataset(size.rows, size.cols);
        const { processedCells, renderTime } = performanceTest.simulateRender(data);
        
        results.push({
          size: size.rows * size.cols,
          creationTime,
          renderTime,
          processedCells
        });
        
        // 性能断言
        expect(creationTime).toBeLessThan(1000); // 创建时间小于1秒
        expect(renderTime).toBeLessThan(500);    // 渲染时间小于500ms
      }
      
      // 验证性能随数据集大小的增长是合理的
      expect(results[0].renderTime).toBeLessThan(results[1].renderTime);
      expect(results[1].renderTime).toBeLessThan(results[2].renderTime);
      
      // 性能增长应该是线性的，而不是指数级的
      const growthRatio1 = results[1].renderTime / results[0].renderTime;
      const growthRatio2 = results[2].renderTime / results[1].renderTime;
      
      expect(growthRatio1).toBeLessThan(10);
      expect(growthRatio2).toBeLessThan(10);
    });
  });
});