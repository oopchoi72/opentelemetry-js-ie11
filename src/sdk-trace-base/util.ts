// IE11-compatible utility functions for SDK Trace Base

// Replace Object.assign with IE11-compatible version
export function objectAssign<T>(target: T, ...sources: any[]): T {
  if (target === null || target === undefined) {
    throw new TypeError("Cannot convert undefined or null to object");
  }

  var to = Object(target);

  for (var index = 0; index < sources.length; index++) {
    var nextSource = sources[index];

    if (nextSource !== null && nextSource !== undefined) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return to;
}

// Replace Array.find with IE11-compatible version
export function arrayFind<T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => boolean,
  thisArg?: any
): T | undefined {
  if (!Array.isArray(array)) {
    throw new TypeError("arrayFind called on non-array");
  }

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (predicate.call(thisArg, value, i, array)) {
      return value;
    }
  }

  return undefined;
}

// Replace Array.findIndex with IE11-compatible version
export function arrayFindIndex<T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => boolean,
  thisArg?: any
): number {
  if (!Array.isArray(array)) {
    throw new TypeError("arrayFindIndex called on non-array");
  }

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (predicate.call(thisArg, value, i, array)) {
      return i;
    }
  }

  return -1;
}

// Replace Array.includes with IE11-compatible version
export function arrayIncludes<T>(
  array: T[],
  searchElement: T,
  fromIndex?: number
): boolean {
  if (!Array.isArray(array)) {
    throw new TypeError("arrayIncludes called on non-array");
  }

  var startIndex = fromIndex ? Math.max(0, fromIndex) : 0;

  for (var i = startIndex; i < array.length; i++) {
    // Handle NaN properly
    if (
      array[i] === searchElement ||
      (searchElement !== searchElement && array[i] !== array[i])
    ) {
      return true;
    }
  }

  return false;
}

// Replace Object.entries with IE11-compatible version
export function objectEntries<T>(obj: {
  [key: string]: T;
}): Array<[string, T]> {
  var result: Array<[string, T]> = [];

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push([key, obj[key]]);
    }
  }

  return result;
}

// Replace Object.values with IE11-compatible version
export function objectValues<T>(obj: { [key: string]: T }): T[] {
  var result: T[] = [];

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push(obj[key]);
    }
  }

  return result;
}

// Replace Object.keys (although IE9+ supports it, ensure consistent behavior)
export function objectKeys(obj: any): string[] {
  if (obj === null || obj === undefined) {
    throw new TypeError("Cannot convert undefined or null to object");
  }

  var result: string[] = [];

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result.push(key);
    }
  }

  return result;
}

// Replace String.startsWith with IE11-compatible version
export function stringStartsWith(
  str: string,
  searchString: string,
  position?: number
): boolean {
  var pos = position || 0;
  return str.substr(pos, searchString.length) === searchString;
}

// Replace String.endsWith with IE11-compatible version
export function stringEndsWith(
  str: string,
  searchString: string,
  length?: number
): boolean {
  var len = length === undefined ? str.length : length;
  return (
    str.substr(len - searchString.length, searchString.length) === searchString
  );
}

// Replace String.includes with IE11-compatible version
export function stringIncludes(
  str: string,
  searchString: string,
  position?: number
): boolean {
  var pos = position || 0;
  return str.indexOf(searchString, pos) !== -1;
}

// Replace String.padStart with IE11-compatible version
export function stringPadStart(
  str: string,
  targetLength: number,
  padString?: string
): string {
  var target = targetLength >> 0; // Math.floor(targetLength)
  var pad = String(padString || " ");

  if (str.length > target) {
    return String(str);
  }

  target = target - str.length;
  if (target > pad.length) {
    // Repeat the pad string
    var repeated = "";
    var times = Math.ceil(target / pad.length);
    for (var i = 0; i < times; i++) {
      repeated += pad;
    }
    pad = repeated;
  }

  return pad.slice(0, target) + String(str);
}

// Replace String.padEnd with IE11-compatible version
export function stringPadEnd(
  str: string,
  targetLength: number,
  padString?: string
): string {
  var target = targetLength >> 0; // Math.floor(targetLength)
  var pad = String(padString || " ");

  if (str.length > target) {
    return String(str);
  }

  target = target - str.length;
  if (target > pad.length) {
    // Repeat the pad string
    var repeated = "";
    var times = Math.ceil(target / pad.length);
    for (var i = 0; i < times; i++) {
      repeated += pad;
    }
    pad = repeated;
  }

  return String(str) + pad.slice(0, target);
}

// Replace Array.from with IE11-compatible version
export function arrayFrom<T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
  var result: T[] = [];

  if (arrayLike && typeof (arrayLike as any).length === "number") {
    // Array-like object
    var arrayLikeObj = arrayLike as ArrayLike<T>;
    for (var i = 0; i < arrayLikeObj.length; i++) {
      result.push(arrayLikeObj[i]);
    }
  } else if (
    arrayLike &&
    typeof (arrayLike as any)[Symbol.iterator] === "function"
  ) {
    // Iterable object (for modern browsers with Symbol support)
    var iterator = (arrayLike as any)[Symbol.iterator]();
    var step = iterator.next();
    while (!step.done) {
      result.push(step.value);
      step = iterator.next();
    }
  }

  return result;
}

// Deep clone utility for IE11
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    var arr: any[] = [];
    for (var i = 0; i < obj.length; i++) {
      arr[i] = deepClone(obj[i]);
    }
    return arr as any;
  }

  if (typeof obj === "object") {
    var copy: any = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone((obj as any)[key]);
      }
    }
    return copy;
  }

  return obj;
}

// IE11-compatible forEach implementation for objects
export function objectForEach<T>(
  obj: { [key: string]: T },
  callback: (value: T, key: string, object: { [key: string]: T }) => void,
  thisArg?: any
): void {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      callback.call(thisArg, obj[key], key, obj);
    }
  }
}

// IE11-compatible map implementation for objects
export function objectMap<T, U>(
  obj: { [key: string]: T },
  callback: (value: T, key: string, object: { [key: string]: T }) => U,
  thisArg?: any
): { [key: string]: U } {
  var result: { [key: string]: U } = {};

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = callback.call(thisArg, obj[key], key, obj);
    }
  }

  return result;
}

// Replace Set with IE11-compatible alternative
export function createSimpleSet<T>(): {
  add: (value: T) => void;
  has: (value: T) => boolean;
  delete: (value: T) => boolean;
  clear: () => void;
  values: () => T[];
  size: number;
} {
  var items: T[] = [];

  return {
    add: function (value: T): void {
      if (!this.has(value)) {
        items.push(value);
      }
    },

    has: function (value: T): boolean {
      return arrayIncludes(items, value);
    },

    delete: function (value: T): boolean {
      var index = items.indexOf(value);
      if (index > -1) {
        items.splice(index, 1);
        return true;
      }
      return false;
    },

    clear: function (): void {
      items.length = 0;
    },

    values: function (): T[] {
      return items.slice(); // Return a copy
    },

    get size(): number {
      return items.length;
    },
  };
}

// Replace Map with IE11-compatible alternative
export function createSimpleMap<K, V>(): {
  set: (key: K, value: V) => void;
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  delete: (key: K) => boolean;
  clear: () => void;
  keys: () => K[];
  values: () => V[];
  entries: () => Array<[K, V]>;
  size: number;
} {
  var keys: K[] = [];
  var values: V[] = [];

  return {
    set: function (key: K, value: V): void {
      var index = keys.indexOf(key);
      if (index > -1) {
        values[index] = value;
      } else {
        keys.push(key);
        values.push(value);
      }
    },

    get: function (key: K): V | undefined {
      var index = keys.indexOf(key);
      return index > -1 ? values[index] : undefined;
    },

    has: function (key: K): boolean {
      return keys.indexOf(key) > -1;
    },

    delete: function (key: K): boolean {
      var index = keys.indexOf(key);
      if (index > -1) {
        keys.splice(index, 1);
        values.splice(index, 1);
        return true;
      }
      return false;
    },

    clear: function (): void {
      keys.length = 0;
      values.length = 0;
    },

    keys: function (): K[] {
      return keys.slice(); // Return a copy
    },

    values: function (): V[] {
      return values.slice(); // Return a copy
    },

    entries: function (): Array<[K, V]> {
      var result: Array<[K, V]> = [];
      for (var i = 0; i < keys.length; i++) {
        result.push([keys[i], values[i]]);
      }
      return result;
    },

    get size(): number {
      return keys.length;
    },
  };
}
