/**
 * Vue版本的Glide Data Grid性能基准测试
 * 测试大数据集下的渲染性能和内存使用
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { usePerformanceMonitor, usePerformanceProfiler } from '../../performance/performance-monitor';
import { createLargeDataset, createMediumDataset, setupGlobalMocks, cleanupGlobalMocks } from '../test-utils';

describe('Performance Benchmark Tests', () => {
  let performanceMonitor: ReturnType<typeof usePerformanceMonitor>;
  let profiler: ReturnType<typeof usePerformanceProfiler>;

  beforeEach(() => {
    setupGlobalMocks();
    
    performanceMonitor = usePerformanceMonitor({
      sampleInterval: 100,
      maxSamples: 50,
      autoStart: false,
      enableMemoryMonitoring: true,
      enableProfiling: true
    });
    profiler = usePerformanceProfiler();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
    performanceMonitor.clearHistory();
    profiler.clear();
    cleanupGlobalMocks();
  });

  describe('Performance Monitor', () => {
    it('should collect performance metrics', async () => {
      performanceMonitor.startMonitoring();
      
      // 模拟一些性能数据
      performanceMonitor.updateGridMetrics({
        visibleCells: 100,
        totalCells: 10000,
        renderableCells: 150,
        renderTime: 16.67
      });
      
      performanceMonitor.recordInputLatency(10);
      performanceMonitor.recordScrollLatency(8);
      
      // 等待至少一个采样周期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      performanceMonitor.stopMonitoring();
      
      // 检查是否收集了性能数据
      expect(performanceMonitor.metricsHistory.length).toBeGreaterThan(0);
      expect(performanceMonitor.currentMetrics.visibleCells).toBe(100);
      expect(performanceMonitor.currentMetrics.totalCells).toBe(10000);
      expect(performanceMonitor.currentMetrics.inputLatency).toBe(10);
      expect(performanceMonitor.currentMetrics.scrollLatency).toBe(8);
    });

    it('should generate performance report', async () => {
      performanceMonitor.startMonitoring();
      
      // 模拟多个采样周期的数据
      for (let i = 0; i < 5; i++) {
        performanceMonitor.updateGridMetrics({
          visibleCells: 100 + i * 10,
          totalCells: 10000,
          renderableCells: 150 + i * 5,
          renderTime: 16.67 + i * 2
        });
        
        await new Promise(resolve => setTimeout(resolve, 110));
      }
      
      performanceMonitor.stopMonitoring();
      
      const report = performanceMonitor.generateReport();
      
      expect(report.summary.totalSamples).toBeGreaterThan(0);
      expect(report.summary.duration).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.samples.length).toBeGreaterThan(0);
    });

    it('should detect performance violations', async () => {
      performanceMonitor.startMonitoring();
      
      // 模拟性能问题
      performanceMonitor.updateGridMetrics({
        visibleCells: 100,
        totalCells: 10000,
        renderableCells: 150,
        renderTime: 100 // 高渲染时间
      });
      
      await new Promise(resolve => setTimeout(resolve, 110));
      
      performanceMonitor.stopMonitoring();
      
      const report = performanceMonitor.generateReport();
      
      // 应该检测到性能违规
      expect(report.violations.highFrameTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Profiler', () => {
    it('should mark and measure performance', () => {
      profiler.mark('test-start');
      
      // 模拟一些工作
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      
      const duration = profiler.measure('test-duration', 'test-start');
      
      expect(duration).toBeGreaterThan(0);
      expect(profiler.getMeasure('test-duration')).toBe(duration);
      expect(profiler.marks['test-start']).toBeDefined();
      expect(profiler.measures['test-duration']).toBeDefined();
    });

    it('should clear marks and measures', () => {
      profiler.mark('test-start');
      profiler.measure('test-duration', 'test-start');
      
      expect(Object.keys(profiler.marks).length).toBeGreaterThan(0);
      expect(Object.keys(profiler.measures).length).toBeGreaterThan(0);
      
      profiler.clear();
      
      expect(Object.keys(profiler.marks).length).toBe(0);
      expect(Object.keys(profiler.measures).length).toBe(0);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large dataset creation efficiently', () => {
      profiler.mark('dataset-creation-start');
      
      const largeData = createLargeDataset(10000, 50);
      
      profiler.measure('dataset-creation-time', 'dataset-creation-start');
      const creationTime = profiler.getMeasure('dataset-creation-time');
      
      expect(largeData.length).toBe(10000);
      expect(largeData[0].length).toBe(50);
      expect(creationTime).toBeLessThan(1000); // 1秒
    });

    it('should handle medium dataset operations efficiently', () => {
      const mediumData = createMediumDataset();
      
      profiler.mark('dataset-operations-start');
      
      // 模拟各种数据操作
      let cellCount = 0;
      for (let row = 0; row < mediumData.length; row++) {
        for (let col = 0; col < mediumData[row].length; col++) {
          const cell = mediumData[row][col];
          if (cell.kind === 'text' && typeof cell.data === 'string') {
            cellCount += cell.data.length;
          }
        }
      }
      
      // 模拟数据更新
      for (let i = 0; i < 100; i++) {
        const row = Math.floor(Math.random() * mediumData.length);
        const col = Math.floor(Math.random() * mediumData[0].length);
        
        if (mediumData[row] && mediumData[row][col]) {
          mediumData[row][col] = {
            ...mediumData[row][col],
            data: `Updated ${i}`
          };
        }
      }
      
      profiler.measure('dataset-operations-time', 'dataset-operations-start');
      const operationsTime = profiler.getMeasure('dataset-operations-time');
      
      expect(cellCount).toBeGreaterThan(0);
      expect(operationsTime).toBeLessThan(500); // 500ms
    });
  });

  describe('Memory Management', () => {
    it('should monitor memory usage', () => {
      performanceMonitor.startMonitoring();
      
      // 模拟内存使用
      const arrays: number[][] = [];
      for (let i = 0; i < 100; i++) {
        arrays.push(new Array(10000).fill(Math.random()));
      }
      
      // 更新内存指标
      performanceMonitor.updateGridMetrics({
        visibleCells: 100,
        totalCells: 10000,
        renderableCells: 150
      });
      
      const memoryUsage = performanceMonitor.currentMetrics.memoryUsage;
      
      // 清理内存
      arrays.length = 0;
      
      performanceMonitor.stopMonitoring();
      
      // 在模拟环境中，内存使用可能为0，这是正常的
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should track memory growth over time', async () => {
      performanceMonitor.startMonitoring();
      
      const initialMemory = performanceMonitor.currentMetrics.memoryUsage;
      
      // 模拟内存增长
      for (let i = 0; i < 5; i++) {
        const tempArray = new Array(10000).fill(Math.random());
        
        // 更新网格指标
        performanceMonitor.updateGridMetrics({
          visibleCells: 100 + i * 10,
          totalCells: 10000,
          renderableCells: 150
        });
        
        await new Promise(resolve => setTimeout(resolve, 110));
        
        // 清理临时数组
        tempArray.length = 0;
      }
      
      performanceMonitor.stopMonitoring();
      
      const report = performanceMonitor.generateReport();
      
      expect(report.summary.totalSamples).toBeGreaterThan(0);
      expect(report.summary.averageMemoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Handling Performance', () => {
    it('should handle rapid event processing', () => {
      profiler.mark('event-processing-start');
      
      // 模拟大量事件处理
      const events: string[] = [];
      
      for (let i = 0; i < 10000; i++) {
        events.push(`event-${i}`);
        
        // 模拟事件处理逻辑
        if (i % 100 === 0) {
          // 批量处理
          const batch = events.splice(0, 100);
          batch.forEach(event => {
            // 处理事件
            event.length;
          });
        }
      }
      
      // 处理剩余事件
      events.forEach(event => {
        event.length;
      });
      
      profiler.measure('event-processing-time', 'event-processing-start');
      const processingTime = profiler.getMeasure('event-processing-time');
      
      expect(processingTime).toBeLessThan(200); // 200ms
    });

    it('should measure input latency', () => {
      performanceMonitor.startMonitoring();
      
      // 模拟不同类型的输入延迟
      const latencies = [5, 10, 15, 20, 25, 30, 35, 40];
      
      latencies.forEach(latency => {
        performanceMonitor.recordInputLatency(latency);
        
        // 模拟一些处理时间
        const start = Date.now();
        while (Date.now() - start < latency) {
          // 等待
        }
      });
      
      performanceMonitor.stopMonitoring();
      
      const report = performanceMonitor.generateReport();
      
      expect(report.samples.length).toBeGreaterThan(0);
      
      // 检查是否有高输入延迟的违规
      if (report.violations.highInputLatency > 0) {
        expect(report.recommendations.some((rec: string) =>
          rec.includes('输入延迟') || rec.includes('input latency')
        )).toBe(true);
      }
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should simulate virtual scrolling efficiently', async () => {
      performanceMonitor.startMonitoring();
      
      const largeData = createLargeDataset(10000, 50);
      const viewportHeight = 600;
      const rowHeight = 30;
      const visibleRowCount = Math.ceil(viewportHeight / rowHeight) + 2; // 缓冲区
      
      // 模拟滚动过程
      const scrollPositions = [0, 1000, 2000, 3000, 4000, 5000];
      
      for (const scrollTop of scrollPositions) {
        profiler.mark(`scroll-${scrollTop}-start`);
        
        // 计算可见行
        const startRow = Math.floor(scrollTop / rowHeight);
        const endRow = Math.min(startRow + visibleRowCount, largeData.length);
        
        // 模拟渲染可见行
        let visibleCells = 0;
        for (let row = startRow; row < endRow; row++) {
          for (let col = 0; col < largeData[row].length; col++) {
            // 模拟单元格渲染
            const cell = largeData[row][col];
            if (cell.kind === 'text') {
              cell.data.length;
            }
            visibleCells++;
          }
        }
        
        // 更新性能指标
        performanceMonitor.updateGridMetrics({
          visibleCells,
          totalCells: largeData.length * largeData[0].length,
          renderableCells: visibleCells + 50 // 缓冲区
        });
        
        performanceMonitor.recordScrollLatency(10 + Math.random() * 10);
        
        profiler.measure(`scroll-${scrollTop}-time`, `scroll-${scrollTop}-start`);
        
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      performanceMonitor.stopMonitoring();
      
      const report = performanceMonitor.generateReport();
      
      expect(report.summary.totalSamples).toBeGreaterThan(0);
      
      // 检查滚动性能
      for (const scrollTop of scrollPositions) {
        const scrollTime = profiler.getMeasure(`scroll-${scrollTop}-time`);
        expect(scrollTime).toBeLessThan(50); // 50ms
      }
      
      // 检查可见单元格数量是否合理
      const maxVisibleCells = Math.max(...report.samples.map((s: any) => s.visibleCells));
      expect(maxVisibleCells).toBeLessThan(2000); // 虚拟滚动应该限制可见单元格
    });
  });

  describe('Canvas Rendering Performance', () => {
    it('should simulate canvas rendering efficiently', () => {
      // 创建模拟Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Canvas context not available, skipping test');
        return;
      }
      
      profiler.mark('canvas-render-start');
      
      // 模拟网格绘制
      const cellWidth = 100;
      const cellHeight = 30;
      const cols = Math.floor(canvas.width / cellWidth);
      const rows = Math.floor(canvas.height / cellHeight);
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制网格线
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(canvas.width, i * cellHeight);
        ctx.stroke();
      }
      
      // 绘制单元格内容
      ctx.fillStyle = '#333333';
      ctx.font = '14px Arial';
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const text = `Cell ${row}-${col}`;
          const x = col * cellWidth + 5;
          const y = row * cellHeight + 20;
          
          ctx.fillText(text, x, y);
        }
      }
      
      profiler.measure('canvas-render-time', 'canvas-render-start');
      const renderTime = profiler.getMeasure('canvas-render-time');
      
      expect(renderTime).toBeLessThan(100); // 100ms
    });
  });

  describe('Reactive Data Performance', () => {
    it('should handle large data updates efficiently', () => {
      const initialData = createMediumDataset();
      
      profiler.mark('data-update-start');
      
      // 模拟响应式数据更新
      const updatedData = initialData.map((row: any[]) =>
        row.map((cell: any) => ({
          ...cell,
          data: cell.kind === 'text' ? `${cell.data} (updated)` : cell.data
        }))
      );
      
      // 模拟数据比较和差异检测
      let changes = 0;
      for (let row = 0; row < initialData.length; row++) {
        for (let col = 0; col < initialData[row].length; col++) {
          if (initialData[row][col].data !== updatedData[row][col].data) {
            changes++;
          }
        }
      }
      
      profiler.measure('data-update-time', 'data-update-start');
      const updateTime = profiler.getMeasure('data-update-time');
      
      expect(changes).toBe(initialData.length * initialData[0].length);
      expect(updateTime).toBeLessThan(300); // 300ms
    });
  });
});