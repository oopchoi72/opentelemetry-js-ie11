// IE11 Performance Optimization Module
// Comprehensive performance optimization for IE11 compatibility

// Export all performance optimization modules
export * from "./bottleneck-analyzer";
export * from "./data-batcher";
export * from "./object-pool";

// Import types and functions for internal use
import {
  createBottleneckAnalyzer,
  initializeGlobalAnalyzer,
  quickPerformanceCheck,
  PerformanceMetrics,
  BottleneckReport,
  BottleneckIssue,
} from "./bottleneck-analyzer";

import {
  createDataBatcher,
  createDOMBatcher,
  createEventBatcher,
  initializeGlobalDOMBatcher,
  batchDOMOperations,
  BatchConfig,
  DOMBatchOperation,
} from "./data-batcher";

import {
  createObjectPool,
  createSpanDataPool,
  createEventDataPool,
  createDOMElementPool,
  createArrayPool,
  createGenericObjectPool,
  createPoolManager,
  initializeGlobalPoolManager,
  withPooledObject,
  withPooledArray,
  ObjectPool,
  PoolConfig,
  ObjectFactory,
} from "./object-pool";

// Performance optimization utilities
export interface PerformanceOptimizer {
  initialize(): void;
  startMonitoring(): void;
  stopMonitoring(): void;
  generateReport(): BottleneckReport;
  getRecommendations(): string[];
  cleanup(): void;
}

// Create a comprehensive performance optimizer
export function createPerformanceOptimizer(config?: {
  enableBottleneckAnalysis?: boolean;
  enableDataBatching?: boolean;
  enableObjectPooling?: boolean;
  analysisConfig?: any;
  batchConfig?: BatchConfig;
  poolConfig?: PoolConfig;
}): PerformanceOptimizer {
  var cfg = Object.assign(
    {
      enableBottleneckAnalysis: true,
      enableDataBatching: true,
      enableObjectPooling: true,
    },
    config || {}
  );

  var analyzer: ReturnType<typeof createBottleneckAnalyzer> | null = null;
  var domBatcher: ReturnType<typeof createDOMBatcher> | null = null;
  var poolManager: ReturnType<typeof createPoolManager> | null = null;

  function initialize(): void {
    if (cfg.enableBottleneckAnalysis) {
      analyzer = createBottleneckAnalyzer(cfg.analysisConfig);
    }

    if (cfg.enableDataBatching) {
      domBatcher = createDOMBatcher(cfg.batchConfig);
      initializeGlobalDOMBatcher(cfg.batchConfig);
    }

    if (cfg.enableObjectPooling) {
      poolManager = initializeGlobalPoolManager();
    }
  }

  function startMonitoring(): void {
    if (analyzer) {
      analyzer.startMonitoring();
    }
  }

  function stopMonitoring(): void {
    if (analyzer) {
      analyzer.stopMonitoring();
    }
  }

  function generateReport(): BottleneckReport {
    if (analyzer) {
      return analyzer.generateReport();
    }

    // Fallback report
    return quickPerformanceCheck();
  }

  function getRecommendations(): string[] {
    var report = generateReport();
    return report.recommendations;
  }

  function cleanup(): void {
    if (analyzer) {
      analyzer.stopMonitoring();
    }

    if (domBatcher) {
      domBatcher.clear();
    }

    if (poolManager) {
      poolManager.clearAll();
    }
  }

  return {
    initialize: initialize,
    startMonitoring: startMonitoring,
    stopMonitoring: stopMonitoring,
    generateReport: generateReport,
    getRecommendations: getRecommendations,
    cleanup: cleanup,
  };
}

// Global performance optimizer instance
var globalOptimizer: PerformanceOptimizer | null = null;

// Initialize global performance optimizer
export function initializeGlobalOptimizer(config?: any): PerformanceOptimizer {
  if (globalOptimizer) {
    globalOptimizer.cleanup();
  }

  globalOptimizer = createPerformanceOptimizer(config);
  globalOptimizer.initialize();

  return globalOptimizer;
}

// Get global performance optimizer
export function getGlobalOptimizer(): PerformanceOptimizer | null {
  return globalOptimizer;
}

// Auto-initialize performance optimization for IE11
export function autoOptimizeForIE11(): void {
  // Check if we're running in IE11
  var isIE11 = !!(
    typeof window !== "undefined" &&
    (window as any).MSInputMethodContext &&
    (document as any).documentMode
  );

  if (isIE11) {
    var optimizer = initializeGlobalOptimizer({
      enableBottleneckAnalysis: true,
      enableDataBatching: true,
      enableObjectPooling: true,
      analysisConfig: {
        enableProfiling: true,
        sampleInterval: 2000, // 2 seconds for IE11
        maxSamples: 50,
        thresholds: {
          renderTime: 200, // More lenient for IE11
          scriptTime: 100,
          domTime: 50,
          memoryUsage: 100 * 1024 * 1024, // 100MB
          eventTime: 32, // ~30fps for IE11
        },
      },
      batchConfig: {
        maxBatchSize: 25, // Smaller batches for IE11
        flushInterval: 200, // Longer intervals for IE11
        enableAutoFlush: true,
      },
      poolConfig: {
        initialSize: 5, // Smaller initial pools for IE11
        maxSize: 50,
        enableGrowth: true,
      },
    });

    optimizer.startMonitoring();

    // Log performance recommendations after a delay
    setTimeout(function () {
      var recommendations = optimizer.getRecommendations();
      if (
        recommendations.length > 0 &&
        typeof console !== "undefined" &&
        console.info
      ) {
        console.info("IE11 Performance Recommendations:", recommendations);
      }
    }, 5000);
  }
}

// Performance monitoring utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  logResults?: boolean
): { result: T; duration: number } {
  var start =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  var result = fn();

  var end =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  var duration = end - start;

  if (logResults && typeof console !== "undefined" && console.log) {
    console.log("Performance [" + name + "]:", duration + "ms");
  }

  return { result: result, duration: duration };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  var lastCall = 0;
  var timeoutId: any = null;

  return function (this: any, ...args: any[]) {
    var now = Date.now();
    var timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  } as T;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  var timeoutId: any = null;

  return function (this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as T;
}
