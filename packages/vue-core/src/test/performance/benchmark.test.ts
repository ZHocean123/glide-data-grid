import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useSelectionBehavior } from '../../data-editor/use-selection-behavior.js';
import { useCanvasRenderer } from '../../performance/canvas-renderer.js';
import { useMemoryManager } from '../../performance/memory-manager.js';
import { useEventOptimizer } from '../../performance/event-optimizer.js';
import { useVirtualScrollOptimizer } from '../../performance/virtual-scroll-optimizer.js';
import { GridCellKind } from '../../internal/data-grid/data-grid-types.js';

describe('性能基准测试', () => {
  describe('选择行为性能', () => {
    it('应该快速处理大量选择操作', () => {
      const options = {
        initialSelection: undefined,
        selectionBlending: 'mixed' as const,
        enableMultiSelection: true,
        rowMarkerOffset: ref(0),
        columns: ref(1000),
        rows: ref(10000),
        onSelectionChanged: () => {}
      };

      const { setCurrentSelection } = useSelectionBehavior(options);
      
      const startTime = performance.now();
      
      // 执行1000次选择操作
      for (let i = 0; i < 1000; i++) {
        const col = Math.floor(Math.random() * 1000);
        const row = Math.floor(Math.random() * 10000);
        setCurrentSelection([col, row], {
          x: col,
          y: row,
          width: 1,
          height: 1
        }, 'click');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 应该在合理时间内完成
      expect(duration).toBeLessThan(100); // 100ms
      console.log(`1000次选择操作耗时: ${duration.toFixed(2)}ms`);
    });

    it('应该高效处理大范围选择', () => {
      const options = {
        initialSelection: undefined,
        selectionBlending: 'mixed' as const,
        enableMultiSelection: true,
        rowMarkerOffset: ref(0),
        columns: ref(1000),
        rows: ref(10000),
        onSelectionChanged: () => {}
      };

      const { setCurrentSelection } = useSelectionBehavior(options);
      
      const startTime = performance.now();
      
      // 选择大范围
      setCurrentSelection([0, 0], {
        x: 0,
        y: 0,
        width: 1000,
        height: 10000
      }, 'drag');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 大范围选择应该很快
      expect(duration).toBeLessThan(10); // 10ms
      console.log(`大范围选择耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Canvas渲染性能', () => {
    it('应该快速渲染大量单元格', () => {
      const canvasRef = ref(document.createElement('canvas'));
      const width = ref(800);
      const height = ref(600);
      const columns = ref(100);
      const rows = ref(1000);
      const rowHeight = ref(32);
      const selection = ref({ current: undefined });
      const theme = ref({});

      const getCellContent = (item: readonly [number, number]) => {
        const [col, row] = item;
        return {
          kind: GridCellKind.Text,
          data: `Cell ${col}-${row}`,
          allowOverlay: true
        };
      };

      const renderer = useCanvasRenderer({
        canvasRef,
        width,
        height,
        columns,
        rows,
        rowHeight,
        getCellContent,
        selection,
        theme
      });

      const startTime = performance.now();
      
      // 标记整个画布为脏并渲染
      renderer.markAllDirty();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 渲染应该在合理时间内完成
      expect(duration).toBeLessThan(50); // 50ms
      console.log(`渲染100x1000单元格耗时: ${duration.toFixed(2)}ms`);
    });

    it('应该高效处理增量更新', () => {
      const canvasRef = ref(document.createElement('canvas'));
      const width = ref(800);
      const height = ref(600);
      const columns = ref(100);
      const rows = ref(1000);
      const rowHeight = ref(32);
      const selection = ref({ current: undefined });
      const theme = ref({});

      const getCellContent = (item: readonly [number, number]) => {
        const [col, row] = item;
        return {
          kind: GridCellKind.Text,
          data: `Cell ${col}-${row}`,
          allowOverlay: true
        };
      };

      const renderer = useCanvasRenderer({
        canvasRef,
        width,
        height,
        columns,
        rows,
        rowHeight,
        getCellContent,
        selection,
        theme
      });

      // 初始渲染
      renderer.markAllDirty();
      
      const startTime = performance.now();
      
      // 标记小区域为脏并渲染
      for (let i = 0; i < 10; i++) {
        renderer.markDirty({
          x: i * 50,
          y: i * 20,
          width: 50,
          height: 20
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 增量更新应该更快
      expect(duration).toBeLessThan(20); // 20ms
      console.log(`10次增量更新耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('内存管理性能', () => {
    it('应该高效管理对象池', () => {
      const memoryManager = useMemoryManager({
        maxCacheSize: 1000,
        maxPoolSize: 100
      });

      const startTime = performance.now();
      
      // 创建和释放大量对象
      for (let i = 0; i < 10000; i++) {
        const pool = memoryManager.getPool('rectangle', () => ({
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }), (obj) => {
          obj.x = 0;
          obj.y = 0;
          obj.width = 0;
          obj.height = 0;
        });
        
        const rect = pool.acquire();
        pool.release(rect);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 对象池操作应该很快
      expect(duration).toBeLessThan(50); // 50ms
      console.log(`10000次对象池操作耗时: ${duration.toFixed(2)}ms`);
    });

    it('应该高效处理缓存操作', () => {
      const memoryManager = useMemoryManager({
        maxCacheSize: 1000
      });

      const startTime = performance.now();
      
      // 大量缓存操作
      for (let i = 0; i < 10000; i++) {
        memoryManager.cache.set(`key-${i}`, `value-${i}`);
        memoryManager.cache.get(`key-${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 缓存操作应该很快
      expect(duration).toBeLessThan(100); // 100ms
      console.log(`10000次缓存操作耗时: ${duration.toFixed(2)}ms`);
      
      const report = memoryManager.getMemoryReport();
      console.log('缓存命中率:', report.cacheHitRate);
    });
  });

  describe('事件处理性能', () => {
    it('应该高效处理防抖和节流', () => {
      const eventOptimizer = useEventOptimizer({
        defaultDebounceDelay: 10,
        defaultThrottleInterval: 10
      });

      let callCount = 0;
      const testFn = () => callCount++;

      const startTime = performance.now();
      
      // 测试防抖
      const debouncedFn = eventOptimizer.debounce(testFn, 10);
      for (let i = 0; i < 1000; i++) {
        debouncedFn();
      }
      
      // 测试节流
      const throttledFn = eventOptimizer.throttle(testFn, 10);
      for (let i = 0; i < 1000; i++) {
        throttledFn();
      }
      
      // 等待防抖和节流完成
      setTimeout(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 事件优化应该很快
        expect(duration).toBeLessThan(200); // 200ms
        console.log(`2000次事件优化操作耗时: ${duration.toFixed(2)}ms`);
        console.log('实际调用次数:', callCount);
      }, 50);
    });

    it('应该高效处理事件队列', () => {
      const eventOptimizer = useEventOptimizer({
        maxEventQueueSize: 1000
      });

      const startTime = performance.now();
      
      // 添加大量事件到队列
      for (let i = 0; i < 1000; i++) {
        eventOptimizer.queueEvent('test', () => {}, 1);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 事件队列操作应该很快
      expect(duration).toBeLessThan(50); // 50ms
      console.log(`1000次事件队列操作耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('虚拟滚动性能', () => {
    it('应该高效计算可见区域', () => {
      const width = ref(800);
      const height = ref(600);
      const rowHeight = ref(32);
      const columnWidth = ref(100);
      const totalRows = ref(10000);
      const totalColumns = ref(100);

      const virtualScroll = useVirtualScrollOptimizer({
        width,
        height,
        rowHeight,
        columnWidth,
        totalRows,
        totalColumns,
        bufferSize: 10
      });

      const startTime = performance.now();
      
      // 模拟多次滚动
      for (let i = 0; i < 100; i++) {
        const scrollTop = i * 100;
        const scrollLeft = i * 50;
        
        virtualScroll.updateVisibleRegion(scrollLeft, scrollTop, 800, 600);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 可见区域计算应该很快
      expect(duration).toBeLessThan(50); // 50ms
      console.log(`100次可见区域计算耗时: ${duration.toFixed(2)}ms`);
    });

    it('应该高效生成虚拟项', () => {
      const width = ref(800);
      const height = ref(600);
      const rowHeight = ref(32);
      const columnWidth = ref(100);
      const totalRows = ref(10000);
      const totalColumns = ref(100);

      const virtualScroll = useVirtualScrollOptimizer({
        width,
        height,
        rowHeight,
        columnWidth,
        totalRows,
        totalColumns,
        bufferSize: 10
      });

      // 更新可见区域
      virtualScroll.updateVisibleRegion(0, 0, 800, 600);
      
      const startTime = performance.now();
      
      // 获取虚拟项
      const virtualItems = virtualScroll.virtualItems;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 虚拟项生成应该很快
      expect(duration).toBeLessThan(10); // 10ms
      console.log(`生成${virtualItems.value.length}个虚拟项耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('综合性能测试', () => {
    it('应该高效处理复杂交互场景', () => {
      // 创建多个优化器实例
      const memoryManager = useMemoryManager();
      const eventOptimizer = useEventOptimizer();
      
      const canvasRef = ref(document.createElement('canvas'));
      const width = ref(800);
      const height = ref(600);
      const columns = ref(100);
      const rows = ref(1000);
      const rowHeight = ref(32);
      const selection = ref({ current: undefined });
      const theme = ref({});

      const getCellContent = (item: readonly [number, number]) => {
        const [col, row] = item;
        return {
          kind: GridCellKind.Text,
          data: `Cell ${col}-${row}`,
          allowOverlay: true
        };
      };

      const canvasRenderer = useCanvasRenderer({
        canvasRef,
        width,
        height,
        columns,
        rows,
        rowHeight,
        getCellContent,
        selection,
        theme
      });

      const selectionBehavior = useSelectionBehavior({
        initialSelection: undefined,
        selectionBlending: 'mixed' as const,
        enableMultiSelection: true,
        rowMarkerOffset: ref(0),
        columns: ref(100),
        rows: ref(1000),
        onSelectionChanged: () => {}
      });

      const startTime = performance.now();
      
      // 模拟复杂交互场景
      for (let i = 0; i < 100; i++) {
        // 选择单元格
        const col = Math.floor(Math.random() * 100);
        const row = Math.floor(Math.random() * 1000);
        selectionBehavior.setCurrentSelection([col, row], {
          x: col,
          y: row,
          width: 1,
          height: 1
        }, 'click');
        
        // 触发渲染
        canvasRenderer.markDirty({
          x: col * 100,
          y: row * 32,
          width: 100,
          height: 32
        });
        
        // 处理事件
        eventOptimizer.queueEvent('cell-select', () => {}, 1);
        
        // 内存操作
        const pool = memoryManager.getPool('rectangle', () => ({
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }), (obj) => {
          obj.x = 0;
          obj.y = 0;
          obj.width = 0;
          obj.height = 0;
        });
        
        const rect = pool.acquire();
        pool.release(rect);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 复杂交互场景应该在合理时间内完成
      expect(duration).toBeLessThan(200); // 200ms
      console.log(`100次复杂交互操作耗时: ${duration.toFixed(2)}ms`);
    });
  });
});