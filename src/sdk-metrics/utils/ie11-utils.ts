// IE11 Utility Functions for Metrics SDK
// All functions use ES5 syntax for maximum compatibility

import { IE11Features } from "../types";

// Feature detection for IE11 environment
export function detectIE11Features(): IE11Features {
  return {
    hasXHR: typeof XMLHttpRequest !== "undefined",
    hasLocalStorage: (function () {
      try {
        return typeof localStorage !== "undefined" && localStorage !== null;
      } catch (e) {
        return false;
      }
    })(),
    hasJSON:
      typeof JSON !== "undefined" && typeof JSON.stringify === "function",
    hasPerformanceAPI:
      typeof performance !== "undefined" &&
      typeof performance.now === "function",
    maxArrayLength: 0x7fffffff, // IE11 max array length
    maxObjectKeys: 1000, // Conservative limit for IE11 object properties
  };
}

// High-resolution timestamp for IE11
export function getHighResolutionTime(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

// Object.assign polyfill for IE11
export function objectAssign(target: any, ...sources: any[]): any {
  if (typeof Object.assign === "function") {
    return Object.assign(target, ...sources);
  }

  if (target == null) {
    throw new TypeError("Cannot convert undefined or null to object");
  }

  var to = Object(target);
  for (var index = 0; index < sources.length; index++) {
    var nextSource = sources[index];
    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

// Array.find polyfill for IE11
export function arrayFind(
  array: any[],
  predicate: (value: any, index: number, array: any[]) => boolean
): any {
  if (typeof Array.prototype.find === "function") {
    return array.find(predicate);
  }

  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      return array[i];
    }
  }
  return undefined;
}

// Array.includes polyfill for IE11
export function arrayIncludes(array: any[], searchElement: any): boolean {
  if (typeof Array.prototype.includes === "function") {
    return array.includes(searchElement);
  }

  for (var i = 0; i < array.length; i++) {
    if (array[i] === searchElement) {
      return true;
    }
  }
  return false;
}

// String.includes polyfill for IE11
export function stringIncludes(str: string, searchString: string): boolean {
  if (typeof String.prototype.includes === "function") {
    return str.includes(searchString);
  }

  return str.indexOf(searchString) !== -1;
}

// Array.fill polyfill for IE11
export function arrayFill(
  array: any[],
  value: any,
  start?: number,
  end?: number
): any[] {
  if (typeof Array.prototype.fill === "function") {
    return array.fill(value, start, end);
  }

  var len = array.length;
  start = start || 0;
  end = end || len;

  for (var i = start; i < end && i < len; i++) {
    array[i] = value;
  }
  return array;
}

// Safe JSON stringify for IE11
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return '{"error":"circular_reference_or_unsupported_type"}';
  }
}

// Safe JSON parse for IE11
export function safeParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Generate unique ID for IE11 (no crypto.randomUUID available)
export function generateId(): string {
  var chars = "0123456789abcdef";
  var result = "";
  for (var i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Deep clone for IE11 (no structuredClone available)
export function deepClone(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    var arrCopy = [];
    for (var i = 0; i < obj.length; i++) {
      arrCopy[i] = deepClone(obj[i]);
    }
    return arrCopy;
  }

  var objCopy: any = {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      objCopy[key] = deepClone(obj[key]);
    }
  }
  return objCopy;
}

// Memory-efficient array sorting for IE11
export function sortArray(array: number[]): number[] {
  // Use simple bubble sort for small arrays to avoid IE11 issues
  if (array.length <= 10) {
    for (var i = 0; i < array.length - 1; i++) {
      for (var j = 0; j < array.length - 1 - i; j++) {
        if (array[j] > array[j + 1]) {
          var temp = array[j];
          array[j] = array[j + 1];
          array[j + 1] = temp;
        }
      }
    }
    return array;
  }

  // Use native sort for larger arrays
  return array.sort(function (a, b) {
    return a - b;
  });
}

// Batch processing for IE11 to avoid blocking UI
export function batchProcess(
  items: any[],
  processor: (item: any) => void,
  batchSize?: number,
  callback?: () => void
): void {
  var size = batchSize || 10;
  var index = 0;

  function processBatch() {
    var batchEnd = Math.min(index + size, items.length);

    for (var i = index; i < batchEnd; i++) {
      processor(items[i]);
    }

    index = batchEnd;

    if (index < items.length) {
      setTimeout(processBatch, 0);
    } else if (callback) {
      callback();
    }
  }

  processBatch();
}

// Error handling utility for IE11
export function createError(
  code: string,
  message: string,
  context?: any
): Error {
  var error = new Error(message);
  (error as any).code = code;
  (error as any).timestamp = getHighResolutionTime();
  if (context) {
    (error as any).context = context;
  }
  return error;
}
