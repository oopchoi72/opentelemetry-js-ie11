// Performance Optimization Tests for IE11
import {
  createBottleneckAnalyzer,
  createDataBatcher,
  createDOMBatcher,
  createObjectPool,
  createSpanDataPool,
  createEventDataPool,
  createArrayPool,
  createGenericObjectPool,
  createPoolManager,
  measurePerformance,
  throttle,
  debounce,
  autoOptimizeForIE11,
} from "../src/performance";

describe("Performance Optimization", () => {
  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks();
  });

  describe("Bottleneck Analyzer", () => {
    it("should create analyzer with default config", () => {
      const analyzer = createBottleneckAnalyzer();
      expect(analyzer).toBeDefined();
      expect(analyzer.isIE11).toBeDefined();
      expect(analyzer.generateReport).toBeDefined();
      expect(analyzer.startMonitoring).toBeDefined();
      expect(analyzer.stopMonitoring).toBeDefined();
    });

    it("should detect IE11 environment", () => {
      const analyzer = createBottleneckAnalyzer();
      const isIE11 = analyzer.isIE11();
      expect(typeof isIE11).toBe("boolean");
    });

    it("should collect performance metrics", () => {
      const analyzer = createBottleneckAnalyzer();
      const metrics = analyzer.collectMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.renderTime).toBe("number");
      expect(typeof metrics.scriptExecutionTime).toBe("number");
      expect(typeof metrics.domManipulationTime).toBe("number");
      expect(typeof metrics.memoryUsage).toBe("number");
      expect(typeof metrics.eventProcessingTime).toBe("number");
    });

    it("should generate bottleneck report", () => {
      const analyzer = createBottleneckAnalyzer();
      const report = analyzer.generateReport();

      expect(report).toBeDefined();
      expect(typeof report.timestamp).toBe("number");
      expect(typeof report.userAgent).toBe("string");
      expect(typeof report.isIE11).toBe("boolean");
      expect(report.metrics).toBeDefined();
      expect(Array.isArray(report.bottlenecks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it("should start and stop monitoring", () => {
      const analyzer = createBottleneckAnalyzer();

      expect(() => analyzer.startMonitoring()).not.toThrow();
      expect(() => analyzer.stopMonitoring()).not.toThrow();
    });

    it("should track performance history", () => {
      const analyzer = createBottleneckAnalyzer({
        enableProfiling: false, // Disable auto-monitoring for test
      });

      const history = analyzer.getPerformanceHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Data Batcher", () => {
    it("should create generic data batcher", () => {
      const processor = jest.fn();
      const batcher = createDataBatcher(processor);

      expect(batcher).toBeDefined();
      expect(batcher.add).toBeDefined();
      expect(batcher.flush).toBeDefined();
      expect(batcher.clear).toBeDefined();
      expect(batcher.size).toBeDefined();
      expect(batcher.isEmpty).toBeDefined();
    });

    it("should add items to batch", () => {
      const processor = jest.fn();
      const batcher = createDataBatcher(processor, {
        enableAutoFlush: false,
      });

      const id = batcher.add({ test: "data" });
      expect(typeof id).toBe("string");
      expect(batcher.size()).toBe(1);
      expect(batcher.isEmpty()).toBe(false);
    });

    it("should flush batch manually", async () => {
      const processor = jest.fn();
      const batcher = createDataBatcher(processor, {
        enableAutoFlush: false,
      });

      batcher.add({ test: "data1" });
      batcher.add({ test: "data2" });

      await batcher.flush();

      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: { test: "data1" } }),
          expect.objectContaining({ data: { test: "data2" } }),
        ])
      );
      expect(batcher.size()).toBe(0);
    });

    it("should auto-flush when batch is full", () => {
      const processor = jest.fn();
      const batcher = createDataBatcher(processor, {
        maxBatchSize: 2,
        enableAutoFlush: true,
      });

      batcher.add({ test: "data1" });
      batcher.add({ test: "data2" }); // Should trigger auto-flush

      // Give time for async flush
      setTimeout(() => {
        expect(processor).toHaveBeenCalled();
      }, 0);
    });

    it("should clear batch", () => {
      const processor = jest.fn();
      const batcher = createDataBatcher(processor, {
        enableAutoFlush: false,
      });

      batcher.add({ test: "data" });
      expect(batcher.size()).toBe(1);

      batcher.clear();
      expect(batcher.size()).toBe(0);
      expect(batcher.isEmpty()).toBe(true);
    });
  });

  describe("DOM Batcher", () => {
    it("should create DOM batcher", () => {
      const batcher = createDOMBatcher();

      expect(batcher).toBeDefined();
      expect(batcher.addInsertion).toBeDefined();
      expect(batcher.addUpdate).toBeDefined();
      expect(batcher.addRemoval).toBeDefined();
      expect(batcher.addStyleUpdate).toBeDefined();
      expect(batcher.addAttributeUpdate).toBeDefined();
    });

    it("should add DOM operations", () => {
      const batcher = createDOMBatcher({
        enableAutoFlush: false,
      });

      const element = document.createElement("div");
      const parent = document.body;

      const id1 = batcher.addInsertion(element, parent);
      const id2 = batcher.addStyleUpdate(element, { color: "red" });
      const id3 = batcher.addAttributeUpdate(element, { "data-test": "value" });

      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
      expect(typeof id3).toBe("string");
      expect(batcher.size()).toBe(3);
    });

    it("should handle element selectors", () => {
      const batcher = createDOMBatcher({
        enableAutoFlush: false,
      });

      // Create a test element with ID
      const testElement = document.createElement("div");
      testElement.id = "test-element";
      document.body.appendChild(testElement);

      const id = batcher.addStyleUpdate("#test-element", { color: "blue" });
      expect(typeof id).toBe("string");

      // Cleanup
      document.body.removeChild(testElement);
    });
  });

  describe("Object Pool", () => {
    it("should create object pool", () => {
      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: any) => {
          obj.value = 0;
        },
      };

      const pool = createObjectPool(factory);

      expect(pool).toBeDefined();
      expect(pool.acquire).toBeDefined();
      expect(pool.release).toBeDefined();
      expect(pool.size).toBeDefined();
      expect(pool.available).toBeDefined();
      expect(pool.clear).toBeDefined();
    });

    it("should acquire and release objects", () => {
      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: any) => {
          obj.value = 0;
        },
      };

      const pool = createObjectPool(factory, {
        initialSize: 2,
      });

      expect(pool.available()).toBe(2);

      const obj1 = pool.acquire();
      expect(obj1).toBeDefined();
      expect(pool.available()).toBe(1);

      const obj2 = pool.acquire();
      expect(obj2).toBeDefined();
      expect(pool.available()).toBe(0);

      pool.release(obj1);
      expect(pool.available()).toBe(1);

      pool.release(obj2);
      expect(pool.available()).toBe(2);
    });

    it("should create new objects when pool is empty", () => {
      const factory = {
        create: jest.fn(() => ({ value: 0 })),
        reset: (obj: any) => {
          obj.value = 0;
        },
      };

      const pool = createObjectPool(factory, {
        initialSize: 1,
        maxSize: 2,
      });

      // Initial creation
      expect(factory.create).toHaveBeenCalledTimes(1);

      const obj1 = pool.acquire(); // From pool
      const obj2 = pool.acquire(); // New creation

      expect(factory.create).toHaveBeenCalledTimes(2);
      expect(obj1).toBeDefined();
      expect(obj2).toBeDefined();
    });

    it("should reset objects on release", () => {
      const resetFn = jest.fn();
      const factory = {
        create: () => ({ value: 42 }),
        reset: resetFn,
      };

      const pool = createObjectPool(factory, {
        resetOnRelease: true,
      });

      const obj = pool.acquire();
      pool.release(obj);

      expect(resetFn).toHaveBeenCalledWith(obj);
    });
  });

  describe("Specialized Pools", () => {
    it("should create span data pool", () => {
      const pool = createSpanDataPool();

      const spanData = pool.acquire();
      expect(spanData).toBeDefined();
      expect(typeof spanData.traceId).toBe("string");
      expect(typeof spanData.spanId).toBe("string");
      expect(typeof spanData.name).toBe("string");
      expect(typeof spanData.startTime).toBe("number");
      expect(typeof spanData.endTime).toBe("number");
      expect(typeof spanData.attributes).toBe("object");
      expect(Array.isArray(spanData.events)).toBe(true);
      expect(typeof spanData.status).toBe("object");

      pool.release(spanData);
    });

    it("should create event data pool", () => {
      const pool = createEventDataPool();

      const eventData = pool.acquire();
      expect(eventData).toBeDefined();
      expect(typeof eventData.type).toBe("string");
      expect(typeof eventData.target).toBe("string");
      expect(typeof eventData.timestamp).toBe("number");

      pool.release(eventData);
    });

    it("should create array pool", () => {
      const pool = createArrayPool<number>();

      const arr = pool.acquire();
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBe(0);

      arr.push(1, 2, 3);
      pool.release(arr);

      const arr2 = pool.acquire();
      expect(arr2.length).toBe(0); // Should be reset
    });

    it("should create generic object pool", () => {
      const pool = createGenericObjectPool();

      const obj = pool.acquire();
      expect(typeof obj).toBe("object");
      expect(Array.isArray(obj)).toBe(false);

      obj.test = "value";
      pool.release(obj);

      const obj2 = pool.acquire();
      expect(obj2.test).toBeUndefined(); // Should be reset
    });
  });

  describe("Pool Manager", () => {
    it("should create pool manager", () => {
      const manager = createPoolManager();

      expect(manager).toBeDefined();
      expect(manager.getPool).toBeDefined();
      expect(manager.createPool).toBeDefined();
      expect(manager.removePool).toBeDefined();
      expect(manager.clearAll).toBeDefined();
      expect(manager.getStats).toBeDefined();
    });

    it("should manage multiple pools", () => {
      const manager = createPoolManager();

      const factory = {
        create: () => ({ value: 0 }),
        reset: (obj: any) => {
          obj.value = 0;
        },
      };

      const pool = manager.createPool("test", factory);
      expect(pool).toBeDefined();

      const retrievedPool = manager.getPool("test");
      expect(retrievedPool).toBe(pool);

      const stats = manager.getStats();
      expect(stats.test).toBeDefined();
      expect(typeof stats.test.size).toBe("number");
      expect(typeof stats.test.available).toBe("number");

      const removed = manager.removePool("test");
      expect(removed).toBe(true);

      const nullPool = manager.getPool("test");
      expect(nullPool).toBeNull();
    });
  });

  describe("Performance Utilities", () => {
    it("should measure performance", () => {
      const result = measurePerformance("test", () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBeDefined();
      expect(typeof result.result).toBe("number");
      expect(typeof result.duration).toBe("number");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should throttle function calls", (done) => {
      // Use real timers for this test
      (global as any).restoreTimers();

      const fn = jest.fn();
      const throttled = throttle(fn, 50);

      // First call should execute immediately
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      // Rapid subsequent calls should be ignored initially
      throttled();
      throttled();

      // Allow for the potential execution of throttled calls
      setTimeout(() => {
        // Should have executed at most 2 times (initial + one throttled)
        expect(fn).toHaveBeenCalledTimes(2);
        done();
      }, 100);
    });

    it("should debounce function calls", (done) => {
      // Use real timers for this test
      (global as any).restoreTimers();

      const fn = jest.fn();
      const debounced = debounce(fn, 50);

      // Multiple rapid calls should not execute immediately
      debounced();
      debounced();
      debounced();

      // Check immediately - should not have executed yet
      setTimeout(() => {
        expect(fn).not.toHaveBeenCalled();

        // After full delay, function should execute once
        setTimeout(() => {
          expect(fn).toHaveBeenCalledTimes(1);
          done();
        }, 60);
      }, 25);
    });
  });

  describe("Auto Optimization", () => {
    it("should not throw when auto-optimizing", () => {
      expect(() => autoOptimizeForIE11()).not.toThrow();
    });
  });
});
