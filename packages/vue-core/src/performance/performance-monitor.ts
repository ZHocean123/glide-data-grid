/**
 * Vue版本的Glide Data Grid性能监控工具
 * 提供性能指标收集、分析和报告功能
 */

import { ref, reactive, computed, onUnmounted } from 'vue';

// 性能指标接口
export interface PerformanceMetrics {
  // 渲染性能
  fps: number;
  frameTime: number;
  renderTime: number;
  
  // 内存使用
  memoryUsage: number;
  memoryLimit: number;
  
  // 网格性能
  visibleCells: number;
  totalCells: number;
  renderableCells: number;
  
  // 交互性能
  inputLatency: number;
  scrollLatency: number;
  
  // 时间戳
  timestamp: number;
}

// 性能阈值配置
export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxInputLatency: number;
  maxScrollLatency: number;
}

// 性能报告
export interface PerformanceReport {
  summary: {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    averageFrameTime: number;
    maxFrameTime: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    totalSamples: number;
    duration: number;
  };
  samples: PerformanceMetrics[];
  violations: {
    lowFPS: number;
    highFrameTime: number;
    highMemoryUsage: number;
    highInputLatency: number;
    highScrollLatency: number;
  };
  recommendations: string[];
}

// 性能监控选项
export interface PerformanceMonitorOptions {
  // 采样间隔（毫秒）
  sampleInterval?: number;
  // 最大样本数
  maxSamples?: number;
  // 性能阈值
  thresholds?: Partial<PerformanceThresholds>;
  // 是否自动启动
  autoStart?: boolean;
  // 是否启用内存监控
  enableMemoryMonitoring?: boolean;
  // 是否启用性能分析
  enableProfiling?: boolean;
}

// 默认性能阈值
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 30,
  maxFrameTime: 33.33, // 30 FPS
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxInputLatency: 16.67, // 60 FPS
  maxScrollLatency: 16.67 // 60 FPS
};

/**
 * 性能监控器
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    sampleInterval = 1000,
    maxSamples = 100,
    thresholds = {},
    autoStart = true,
    enableMemoryMonitoring = true,
    enableProfiling = false
  } = options;

  // 合并阈值配置
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // 性能指标历史
  const metricsHistory = ref<PerformanceMetrics[]>([]);
  
  // 当前性能指标
  const currentMetrics = reactive<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    visibleCells: 0,
    totalCells: 0,
    renderableCells: 0,
    inputLatency: 0,
    scrollLatency: 0,
    timestamp: 0
  });

  // 监控状态
  const isMonitoring = ref(false);
  const lastFrameTime = ref(0);
  const frameCount = ref(0);
  let monitoringInterval: number | null = null;
  let performanceObserver: PerformanceObserver | null = null;

  // 计算属性
  const averageFPS = computed(() => {
    if (metricsHistory.value.length === 0) return 0;
    const sum = metricsHistory.value.reduce((acc, m) => acc + m.fps, 0);
    return sum / metricsHistory.value.length;
  });

  const averageFrameTime = computed(() => {
    if (metricsHistory.value.length === 0) return 0;
    const sum = metricsHistory.value.reduce((acc, m) => acc + m.frameTime, 0);
    return sum / metricsHistory.value.length;
  });

  const averageMemoryUsage = computed(() => {
    if (metricsHistory.value.length === 0) return 0;
    const sum = metricsHistory.value.reduce((acc, m) => acc + m.memoryUsage, 0);
    return sum / metricsHistory.value.length;
  });

  const isPerformanceGood = computed(() => {
    return currentMetrics.fps >= finalThresholds.minFPS &&
           currentMetrics.frameTime <= finalThresholds.maxFrameTime &&
           currentMetrics.memoryUsage <= finalThresholds.maxMemoryUsage;
  });

  // 获取内存使用情况
  const getMemoryUsage = (): number => {
    if (!enableMemoryMonitoring || !(performance as any).memory) {
      return 0;
    }
    
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize || 0;
  };

  // 获取内存限制
  const getMemoryLimit = (): number => {
    if (!enableMemoryMonitoring || !(performance as any).memory) {
      return 0;
    }
    
    const memory = (performance as any).memory;
    return memory.jsHeapSizeLimit || 0;
  };

  // 计算FPS
  const calculateFPS = (): number => {
    const now = performance.now();
    const delta = now - lastFrameTime.value;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      lastFrameTime.value = now;
      return fps;
    }
    
    return 0;
  };

  // 采集性能指标
  const collectMetrics = (): PerformanceMetrics => {
    const now = performance.now();
    const fps = calculateFPS();
    
    return {
      fps,
      frameTime: fps > 0 ? 1000 / fps : 0,
      renderTime: currentMetrics.renderTime,
      memoryUsage: getMemoryUsage(),
      memoryLimit: getMemoryLimit(),
      visibleCells: currentMetrics.visibleCells,
      totalCells: currentMetrics.totalCells,
      renderableCells: currentMetrics.renderableCells,
      inputLatency: currentMetrics.inputLatency,
      scrollLatency: currentMetrics.scrollLatency,
      timestamp: now
    };
  };

  // 检查性能违规
  const checkViolations = (metrics: PerformanceMetrics) => {
    const violations: string[] = [];
    
    if (metrics.fps < finalThresholds.minFPS) {
      violations.push(`FPS过低: ${metrics.fps.toFixed(2)} < ${finalThresholds.minFPS}`);
    }
    
    if (metrics.frameTime > finalThresholds.maxFrameTime) {
      violations.push(`帧时间过长: ${metrics.frameTime.toFixed(2)}ms > ${finalThresholds.maxFrameTime}ms`);
    }
    
    if (metrics.memoryUsage > finalThresholds.maxMemoryUsage) {
      violations.push(`内存使用过高: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB > ${(finalThresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    if (metrics.inputLatency > finalThresholds.maxInputLatency) {
      violations.push(`输入延迟过高: ${metrics.inputLatency.toFixed(2)}ms > ${finalThresholds.maxInputLatency}ms`);
    }
    
    if (metrics.scrollLatency > finalThresholds.maxScrollLatency) {
      violations.push(`滚动延迟过高: ${metrics.scrollLatency.toFixed(2)}ms > ${finalThresholds.maxScrollLatency}ms`);
    }
    
    return violations;
  };

  // 生成性能建议
  const generateRecommendations = (report: PerformanceReport): string[] => {
    const recommendations: string[] = [];
    
    if (report.summary.averageFPS < finalThresholds.minFPS) {
      recommendations.push('考虑减少可见单元格数量或启用虚拟滚动优化');
      recommendations.push('检查是否有不必要的重渲染或计算');
    }
    
    if (report.summary.peakMemoryUsage > finalThresholds.maxMemoryUsage * 0.8) {
      recommendations.push('考虑启用对象池或缓存策略以减少内存分配');
      recommendations.push('检查是否有内存泄漏');
    }
    
    if (report.violations.highInputLatency > 0) {
      recommendations.push('优化事件处理逻辑，考虑使用防抖或节流');
    }
    
    if (report.violations.highScrollLatency > 0) {
      recommendations.push('优化滚动性能，考虑减少滚动事件处理器的复杂度');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持');
    }
    
    return recommendations;
  };

  // 更新网格性能指标
  const updateGridMetrics = (metrics: {
    visibleCells?: number;
    totalCells?: number;
    renderableCells?: number;
    renderTime?: number;
  }) => {
    if (metrics.visibleCells !== undefined) {
      currentMetrics.visibleCells = metrics.visibleCells;
    }
    if (metrics.totalCells !== undefined) {
      currentMetrics.totalCells = metrics.totalCells;
    }
    if (metrics.renderableCells !== undefined) {
      currentMetrics.renderableCells = metrics.renderableCells;
    }
    if (metrics.renderTime !== undefined) {
      currentMetrics.renderTime = metrics.renderTime;
    }
  };

  // 记录输入延迟
  const recordInputLatency = (latency: number) => {
    currentMetrics.inputLatency = latency;
  };

  // 记录滚动延迟
  const recordScrollLatency = (latency: number) => {
    currentMetrics.scrollLatency = latency;
  };

  // 开始监控
  const startMonitoring = () => {
    if (isMonitoring.value) return;
    
    isMonitoring.value = true;
    lastFrameTime.value = performance.now();
    frameCount.value = 0;
    
    // 设置定时采集
    monitoringInterval = window.setInterval(() => {
      const metrics = collectMetrics();
      
      // 更新当前指标
      Object.assign(currentMetrics, metrics);
      
      // 添加到历史记录
      metricsHistory.value.push(metrics);
      
      // 限制历史记录长度
      if (metricsHistory.value.length > maxSamples) {
        metricsHistory.value.shift();
      }
      
      // 检查性能违规
      const violations = checkViolations(metrics);
      if (violations.length > 0) {
        console.warn('性能警告:', violations);
      }
    }, sampleInterval);
    
    // 设置性能观察器
    if (enableProfiling && 'PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            // 处理性能测量
            console.debug('性能测量:', entry.name, entry.duration);
          }
        });
      });
      
      performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  };

  // 停止监控
  const stopMonitoring = () => {
    if (!isMonitoring.value) return;
    
    isMonitoring.value = false;
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    if (performanceObserver) {
      performanceObserver.disconnect();
      performanceObserver = null;
    }
  };

  // 生成性能报告
  const generateReport = (): PerformanceReport => {
    if (metricsHistory.value.length === 0) {
      return {
        summary: {
          averageFPS: 0,
          minFPS: 0,
          maxFPS: 0,
          averageFrameTime: 0,
          maxFrameTime: 0,
          averageMemoryUsage: 0,
          peakMemoryUsage: 0,
          totalSamples: 0,
          duration: 0
        },
        samples: [],
        violations: {
          lowFPS: 0,
          highFrameTime: 0,
          highMemoryUsage: 0,
          highInputLatency: 0,
          highScrollLatency: 0
        },
        recommendations: ['没有可用的性能数据']
      };
    }
    
    const samples = [...metricsHistory.value];
    const firstSample = samples[0];
    const lastSample = samples[samples.length - 1];
    
    // 计算统计数据
    const fpsValues = samples.map(s => s.fps);
    const frameTimeValues = samples.map(s => s.frameTime);
    const memoryValues = samples.map(s => s.memoryUsage);
    
    const summary = {
      averageFPS: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
      minFPS: Math.min(...fpsValues),
      maxFPS: Math.max(...fpsValues),
      averageFrameTime: frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length,
      maxFrameTime: Math.max(...frameTimeValues),
      averageMemoryUsage: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
      peakMemoryUsage: Math.max(...memoryValues),
      totalSamples: samples.length,
      duration: lastSample.timestamp - firstSample.timestamp
    };
    
    // 计算违规次数
    const violations = {
      lowFPS: samples.filter(s => s.fps < finalThresholds.minFPS).length,
      highFrameTime: samples.filter(s => s.frameTime > finalThresholds.maxFrameTime).length,
      highMemoryUsage: samples.filter(s => s.memoryUsage > finalThresholds.maxMemoryUsage).length,
      highInputLatency: samples.filter(s => s.inputLatency > finalThresholds.maxInputLatency).length,
      highScrollLatency: samples.filter(s => s.scrollLatency > finalThresholds.maxScrollLatency).length
    };
    
    const report: PerformanceReport = {
      summary,
      samples,
      violations,
      recommendations: []
    };
    
    // 生成建议
    report.recommendations = generateRecommendations(report);
    
    return report;
  };

  // 清除历史数据
  const clearHistory = () => {
    metricsHistory.value = [];
  };

  // 自动启动
  if (autoStart) {
    startMonitoring();
  }

  // 清理
  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    // 状态
    isMonitoring,
    currentMetrics,
    metricsHistory,
    
    // 计算属性
    averageFPS,
    averageFrameTime,
    averageMemoryUsage,
    isPerformanceGood,
    
    // 方法
    startMonitoring,
    stopMonitoring,
    updateGridMetrics,
    recordInputLatency,
    recordScrollLatency,
    generateReport,
    clearHistory
  };
}

/**
 * 性能分析工具
 */
export function usePerformanceProfiler() {
  const marks = reactive<Record<string, number>>({});
  const measures = reactive<Record<string, number>>({});

  // 开始标记
  const mark = (name: string) => {
    marks[name] = performance.now();
    performance.mark(name);
  };

  // 结束标记并测量
  const measure = (name: string, startMark?: string) => {
    const endTime = performance.now();
    const startTime = startMark ? marks[startMark] : marks[name];
    
    if (startTime !== undefined) {
      const duration = endTime - startTime;
      measures[name] = duration;
      
      if (startMark) {
        performance.measure(name, startMark);
      } else {
        performance.measure(name);
      }
      
      return duration;
    }
    
    return 0;
  };

  // 获取测量结果
  const getMeasure = (name: string) => {
    return measures[name] || 0;
  };

  // 清除所有标记和测量
  const clear = () => {
    Object.keys(marks).forEach(key => delete marks[key]);
    Object.keys(measures).forEach(key => delete measures[key]);
    
    if ('performance' in window && 'clearMarks' in performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  };

  return {
    marks,
    measures,
    mark,
    measure,
    getMeasure,
    clear
  };
}