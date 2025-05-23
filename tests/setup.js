// Jest Setup File for IE11 DOM Event Instrumentation Tests
// This file runs before all tests to set up the testing environment

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Mock performance API for IE11 simulation
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock IE11 specific globals
global.window = global.window || {};
global.document = global.document || {};

// Mock WeakMap for IE11 compatibility
if (typeof WeakMap === "undefined") {
  global.WeakMap = class MockWeakMap {
    constructor() {
      this._data = [];
    }

    set(key, value) {
      const index = this._data.findIndex((item) => item.key === key);
      if (index !== -1) {
        this._data[index].value = value;
      } else {
        this._data.push({ key, value });
      }
      return this;
    }

    get(key) {
      const item = this._data.find((item) => item.key === key);
      return item ? item.value : undefined;
    }

    has(key) {
      return this._data.some((item) => item.key === key);
    }

    delete(key) {
      const index = this._data.findIndex((item) => item.key === key);
      if (index !== -1) {
        this._data.splice(index, 1);
        return true;
      }
      return false;
    }
  };
}

// Mock Map for IE11 compatibility
if (typeof Map === "undefined") {
  global.Map = class MockMap {
    constructor() {
      this._data = [];
    }

    set(key, value) {
      const index = this._data.findIndex((item) => item.key === key);
      if (index !== -1) {
        this._data[index].value = value;
      } else {
        this._data.push({ key, value });
      }
      return this;
    }

    get(key) {
      const item = this._data.find((item) => item.key === key);
      return item ? item.value : undefined;
    }

    has(key) {
      return this._data.some((item) => item.key === key);
    }

    delete(key) {
      const index = this._data.findIndex((item) => item.key === key);
      if (index !== -1) {
        this._data.splice(index, 1);
        return true;
      }
      return false;
    }

    clear() {
      this._data = [];
    }

    get size() {
      return this._data.length;
    }

    forEach(callback) {
      this._data.forEach((item) => callback(item.value, item.key, this));
    }
  };
}

// Mock Object.assign for IE11 compatibility
if (typeof Object.assign !== "function") {
  Object.assign = function (target, ...sources) {
    if (target == null) {
      throw new TypeError("Cannot convert undefined or null to object");
    }

    const to = Object(target);
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Mock Blob and URL for export functionality
global.Blob =
  global.Blob ||
  class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };

global.URL = global.URL || {
  createObjectURL: jest.fn(() => "mock://blob-url"),
  revokeObjectURL: jest.fn(),
};

// Set up IE11 detection
global.window.MSInputMethodContext = {};
global.document.documentMode = 11;

// Mock setTimeout and clearTimeout to be synchronous for testing
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

global.setTimeout = jest.fn((callback, delay) => {
  // For tests, run callbacks immediately unless we specifically want to test timing
  if (process.env.JEST_TEST_TIMING === "true") {
    return originalSetTimeout(callback, delay);
  }
  callback();
  return "mock-timeout-id";
});

global.clearTimeout = jest.fn();

// Restore original timers when needed
global.restoreTimers = () => {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
};

// Mock Array methods for IE11 compatibility
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    for (let i = 0; i < this.length; i++) {
      if (predicate(this[i], i, this)) {
        return this[i];
      }
    }
    return undefined;
  };
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement) {
    return this.indexOf(searchElement) !== -1;
  };
}

if (!Array.prototype.fill) {
  Array.prototype.fill = function (value, start, end) {
    const len = this.length;
    start = start || 0;
    end = end || len;

    for (let i = start; i < end && i < len; i++) {
      this[i] = value;
    }
    return this;
  };
}

// Mock String methods for IE11 compatibility
if (!String.prototype.includes) {
  String.prototype.includes = function (searchString) {
    return this.indexOf(searchString) !== -1;
  };
}
