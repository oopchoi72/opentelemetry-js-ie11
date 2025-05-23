// Core utility functions for IE11 compatibility

// High-resolution time for IE11
export function hrTime(): [number, number] {
  if (typeof performance !== "undefined" && performance.now) {
    var nowMs = performance.now();
    var seconds = Math.floor(nowMs / 1000);
    var nanoseconds = Math.floor((nowMs % 1000) * 1000000);
    return [seconds, nanoseconds];
  }

  // Fallback for IE11
  var now = Date.now();
  var seconds = Math.floor(now / 1000);
  var nanoseconds = (now % 1000) * 1000000;
  return [seconds, nanoseconds];
}

// Convert hrTime to nanoseconds
export function hrTimeToNanoseconds(time: [number, number]): number {
  return time[0] * 1000000000 + time[1];
}

// Generate random span ID for IE11
export function generateSpanId(): string {
  var randomValues = new Array(8);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Modern browsers
    var buffer = new Uint8Array(8);
    crypto.getRandomValues(buffer);
    for (var i = 0; i < 8; i++) {
      randomValues[i] = buffer[i];
    }
  } else {
    // IE11 fallback
    for (var j = 0; j < 8; j++) {
      randomValues[j] = Math.floor(Math.random() * 256);
    }
  }

  return randomValues
    .map(function (byte) {
      return ("0" + byte.toString(16)).slice(-2);
    })
    .join("");
}

// Generate random trace ID for IE11
export function generateTraceId(): string {
  var randomValues = new Array(16);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Modern browsers
    var buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    for (var i = 0; i < 16; i++) {
      randomValues[i] = buffer[i];
    }
  } else {
    // IE11 fallback
    for (var j = 0; j < 16; j++) {
      randomValues[j] = Math.floor(Math.random() * 256);
    }
  }

  return randomValues
    .map(function (byte) {
      return ("0" + byte.toString(16)).slice(-2);
    })
    .join("");
}

// Sanitize attributes for IE11 compatibility
export function sanitizeAttributes(attributes: any): { [key: string]: any } {
  var sanitized: { [key: string]: any } = {};

  if (!attributes || typeof attributes !== "object") {
    return sanitized;
  }

  for (var key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      var value = attributes[key];

      // Only allow primitive types
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = String(value);
      } else {
        // Convert complex types to string
        sanitized[key] = String(value);
      }
    }
  }

  return sanitized;
}

// Utility to check if value is valid attribute value
export function isValidAttributeValue(value: any): boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  );
}

// Object.assign polyfill wrapper
export function objectAssign(target: any, ...sources: any[]): any {
  if (typeof Object.assign === "function") {
    return Object.assign(target, ...sources);
  }

  // IE11 polyfill
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

// Array.find polyfill wrapper
export function arrayFind<T>(
  array: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): T | undefined {
  if (Array.prototype.find) {
    return array.find(predicate);
  }

  // IE11 polyfill
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      return array[i];
    }
  }
  return undefined;
}

// Array.includes polyfill wrapper
export function arrayIncludes<T>(array: T[], searchElement: T): boolean {
  if (Array.prototype.includes) {
    return array.includes(searchElement);
  }

  // IE11 polyfill
  for (var i = 0; i < array.length; i++) {
    if (array[i] === searchElement) {
      return true;
    }
  }
  return false;
}

// Performance timing utilities
export function getTimeOrigin(): number {
  if (typeof performance !== "undefined" && performance.timeOrigin) {
    return performance.timeOrigin;
  }

  if (
    typeof performance !== "undefined" &&
    performance.timing &&
    performance.timing.navigationStart
  ) {
    return performance.timing.navigationStart;
  }

  // Fallback
  return Date.now();
}

// Convert timestamp to hrTime
export function timestampToHrTime(timestamp: number): [number, number] {
  var seconds = Math.floor(timestamp / 1000);
  var nanoseconds = (timestamp % 1000) * 1000000;
  return [seconds, nanoseconds];
}
