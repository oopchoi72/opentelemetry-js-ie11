// IE11 Object Pooling for Memory Optimization
// Reduces memory allocation and garbage collection pressure

export interface ObjectPool<T> {
  acquire(): T;
  release(obj: T): void;
  size(): number;
  available(): number;
  clear(): void;
  preAllocate(count: number): void;
}

export interface PoolConfig {
  initialSize?: number;
  maxSize?: number;
  enableGrowth?: boolean;
  resetOnRelease?: boolean;
}

export interface ObjectFactory<T> {
  create(): T;
  reset?(obj: T): void;
  validate?(obj: T): boolean;
}

var DEFAULT_POOL_CONFIG: PoolConfig = {
  initialSize: 10,
  maxSize: 100,
  enableGrowth: true,
  resetOnRelease: true,
};

// Generic object pool implementation
export function createObjectPool<T>(
  factory: ObjectFactory<T>,
  config?: PoolConfig
): ObjectPool<T> {
  var cfg = Object.assign({}, DEFAULT_POOL_CONFIG, config || {});
  var pool: T[] = [];
  var totalCreated = 0;
  var totalAcquired = 0;
  var totalReleased = 0;

  function preAllocate(count: number): void {
    for (var i = 0; i < count; i++) {
      if (pool.length >= (cfg.maxSize || 100)) {
        break;
      }

      var obj = factory.create();
      totalCreated++;

      if (factory.reset) {
        factory.reset(obj);
      }

      pool.push(obj);
    }
  }

  function acquire(): T {
    var obj: T;

    if (pool.length > 0) {
      obj = pool.pop()!;
    } else if (cfg.enableGrowth && totalCreated < (cfg.maxSize || 100)) {
      obj = factory.create();
      totalCreated++;
    } else {
      // Pool exhausted, create temporary object
      obj = factory.create();
    }

    totalAcquired++;
    return obj;
  }

  function release(obj: T): void {
    if (!obj) {
      return;
    }

    // Validate object if validator is provided
    if (factory.validate && !factory.validate(obj)) {
      return; // Don't return invalid objects to pool
    }

    // Reset object if reset function is provided
    if (cfg.resetOnRelease && factory.reset) {
      factory.reset(obj);
    }

    // Only return to pool if we haven't exceeded max size
    if (pool.length < (cfg.maxSize || 100)) {
      pool.push(obj);
      totalReleased++;
    }
  }

  function size(): number {
    return totalCreated;
  }

  function available(): number {
    return pool.length;
  }

  function clear(): void {
    pool = [];
    totalCreated = 0;
    totalAcquired = 0;
    totalReleased = 0;
  }

  // Pre-allocate initial objects
  preAllocate(cfg.initialSize || 10);

  return {
    acquire: acquire,
    release: release,
    size: size,
    available: available,
    clear: clear,
    preAllocate: preAllocate,
  };
}

// Span data object pool for OpenTelemetry
export interface SpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime: number;
  attributes: { [key: string]: any };
  events: any[];
  status: { code: number; message?: string };
}

export function createSpanDataPool(config?: PoolConfig): ObjectPool<SpanData> {
  var factory: ObjectFactory<SpanData> = {
    create: function (): SpanData {
      return {
        traceId: "",
        spanId: "",
        parentSpanId: undefined,
        name: "",
        startTime: 0,
        endTime: 0,
        attributes: {},
        events: [],
        status: { code: 0 },
      };
    },

    reset: function (obj: SpanData): void {
      obj.traceId = "";
      obj.spanId = "";
      obj.parentSpanId = undefined;
      obj.name = "";
      obj.startTime = 0;
      obj.endTime = 0;
      obj.attributes = {};
      obj.events = [];
      obj.status = { code: 0 };
    },

    validate: function (obj: SpanData): boolean {
      return obj && typeof obj === "object";
    },
  };

  return createObjectPool(factory, config);
}

// Event data object pool
export interface EventData {
  type: string;
  target: string;
  timestamp: number;
  data: any;
}

export function createEventDataPool(
  config?: PoolConfig
): ObjectPool<EventData> {
  var factory: ObjectFactory<EventData> = {
    create: function (): EventData {
      return {
        type: "",
        target: "",
        timestamp: 0,
        data: null,
      };
    },

    reset: function (obj: EventData): void {
      obj.type = "";
      obj.target = "";
      obj.timestamp = 0;
      obj.data = null;
    },

    validate: function (obj: EventData): boolean {
      return obj && typeof obj === "object";
    },
  };

  return createObjectPool(factory, config);
}

// DOM element pool for reusable elements
export function createDOMElementPool(
  tagName: string,
  config?: PoolConfig
): ObjectPool<HTMLElement> {
  var factory: ObjectFactory<HTMLElement> = {
    create: function (): HTMLElement {
      return document.createElement(tagName);
    },

    reset: function (element: HTMLElement): void {
      // Clear all attributes except essential ones
      var attributes = element.attributes;
      for (var i = attributes.length - 1; i >= 0; i--) {
        var attr = attributes[i];
        if (attr.name !== "id" && attr.name !== "class") {
          element.removeAttribute(attr.name);
        }
      }

      // Clear content
      element.innerHTML = "";
      element.textContent = "";

      // Reset styles
      element.style.cssText = "";

      // Remove from DOM if attached
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },

    validate: function (element: HTMLElement): boolean {
      return (
        element &&
        element.nodeType === 1 &&
        element.tagName.toLowerCase() === tagName.toLowerCase()
      );
    },
  };

  return createObjectPool(factory, config);
}

// Array pool for reusable arrays
export function createArrayPool<T>(config?: PoolConfig): ObjectPool<T[]> {
  var factory: ObjectFactory<T[]> = {
    create: function (): T[] {
      return [];
    },

    reset: function (arr: T[]): void {
      arr.length = 0; // Clear array efficiently
    },

    validate: function (arr: T[]): boolean {
      return Array.isArray(arr);
    },
  };

  return createObjectPool(factory, config);
}

// Object pool for generic objects
export function createGenericObjectPool(
  config?: PoolConfig
): ObjectPool<{ [key: string]: any }> {
  var factory: ObjectFactory<{ [key: string]: any }> = {
    create: function (): { [key: string]: any } {
      return {};
    },

    reset: function (obj: { [key: string]: any }): void {
      // Clear all properties
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          delete obj[key];
        }
      }
    },

    validate: function (obj: { [key: string]: any }): boolean {
      return obj && typeof obj === "object" && !Array.isArray(obj);
    },
  };

  return createObjectPool(factory, config);
}

// Pool manager for managing multiple pools
export interface PoolManager {
  getPool<T>(name: string): ObjectPool<T> | null;
  createPool<T>(
    name: string,
    factory: ObjectFactory<T>,
    config?: PoolConfig
  ): ObjectPool<T>;
  removePool(name: string): boolean;
  clearAll(): void;
  getStats(): { [poolName: string]: { size: number; available: number } };
}

export function createPoolManager(): PoolManager {
  var pools: { [name: string]: ObjectPool<any> } = {};

  function getPool<T>(name: string): ObjectPool<T> | null {
    return pools[name] || null;
  }

  function createPool<T>(
    name: string,
    factory: ObjectFactory<T>,
    config?: PoolConfig
  ): ObjectPool<T> {
    var pool = createObjectPool(factory, config);
    pools[name] = pool;
    return pool;
  }

  function removePool(name: string): boolean {
    if (pools[name]) {
      pools[name].clear();
      delete pools[name];
      return true;
    }
    return false;
  }

  function clearAll(): void {
    for (var name in pools) {
      if (pools.hasOwnProperty(name)) {
        pools[name].clear();
      }
    }
    pools = {};
  }

  function getStats(): {
    [poolName: string]: { size: number; available: number };
  } {
    var stats: { [poolName: string]: { size: number; available: number } } = {};

    for (var name in pools) {
      if (pools.hasOwnProperty(name)) {
        var pool = pools[name];
        stats[name] = {
          size: pool.size(),
          available: pool.available(),
        };
      }
    }

    return stats;
  }

  return {
    getPool: getPool,
    createPool: createPool,
    removePool: removePool,
    clearAll: clearAll,
    getStats: getStats,
  };
}

// Global pool manager instance
var globalPoolManager: PoolManager | null = null;

// Initialize global pool manager
export function initializeGlobalPoolManager(): PoolManager {
  if (!globalPoolManager) {
    globalPoolManager = createPoolManager();

    // Create common pools
    globalPoolManager.createPool("spanData", {
      create: function () {
        return {
          traceId: "",
          spanId: "",
          name: "",
          startTime: 0,
          endTime: 0,
          attributes: {},
          events: [],
          status: { code: 0 },
        };
      },
      reset: function (obj) {
        obj.traceId = "";
        obj.spanId = "";
        obj.name = "";
        obj.startTime = 0;
        obj.endTime = 0;
        obj.attributes = {};
        obj.events = [];
        obj.status = { code: 0 };
      },
    });

    globalPoolManager.createPool("eventData", {
      create: function () {
        return {
          type: "",
          target: "",
          timestamp: 0,
          data: null,
        };
      },
      reset: function (obj) {
        obj.type = "";
        obj.target = "";
        obj.timestamp = 0;
        obj.data = null;
      },
    });

    globalPoolManager.createPool("arrays", {
      create: function () {
        return [];
      },
      reset: function (arr) {
        arr.length = 0;
      },
    });

    globalPoolManager.createPool("objects", {
      create: function () {
        return {};
      },
      reset: function (obj: { [key: string]: any }) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            delete obj[key];
          }
        }
      },
    });
  }

  return globalPoolManager;
}

// Get global pool manager
export function getGlobalPoolManager(): PoolManager | null {
  return globalPoolManager;
}

// Utility functions for common pooling operations
export function withPooledObject<T, R>(
  pool: ObjectPool<T>,
  fn: (obj: T) => R
): R {
  var obj = pool.acquire();
  try {
    return fn(obj);
  } finally {
    pool.release(obj);
  }
}

export function withPooledArray<T, R>(
  pool: ObjectPool<T[]>,
  fn: (arr: T[]) => R
): R {
  var arr = pool.acquire();
  try {
    return fn(arr);
  } finally {
    pool.release(arr);
  }
}
