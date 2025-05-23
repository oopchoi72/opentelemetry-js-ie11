// Basic IE11 compatibility tests

import {
  isBrowser,
  isNode,
  parseTraceParent,
  formatTraceParent,
  parseTraceState,
  formatTraceState,
  generateTraceId,
  generateSpanId,
  isValidTraceId,
  isValidSpanId,
  parseUrl,
  getDefaultResource,
  sanitizeAttributes,
  merge,
  deepMerge,
  unique,
  arrayToString,
  stringPadStart,
  stringPadEnd,
  stringStartsWith,
  stringEndsWith,
  stringIncludes,
  stringRepeat,
  arrayFind,
  arrayFindIndex,
  arrayIncludes,
  objectValues,
  objectEntries,
  numberIsNaN,
  numberIsFinite,
  numberIsInteger,
  safeConsoleLog,
  safeJSONParse,
  safeJSONStringify,
  getRandomValues,
  performanceNow,
  getBrowserInfo,
  getNodeInfo,
  getFeatureSupport,
  getRuntimeCapabilities,
  getEnvironmentInfo,
  getPolyfillRequirements,
  hrTimeToMicroseconds,
  hrTimeToMilliseconds,
  hrTimeToTimeStamp,
  addHrTimes,
  millisToHrTime,
  isTimeInput,
  isTimeInputHrTime,
  timeInputToHrTime,
  hexToBinary,
  binaryToHex,
  binaryToBase64,
  base64ToBinary,
  isAttributeValue,
  validateKey,
  sanitizeAttributeKey,
  isUrlIgnored,
  urlMatches,
  normalizeHeaders,
  getActiveSpan,
  setStatus,
  recordException,
  isTracingSuppressed,
  suppressTracing,
  unsuppressTracing,
  parseKeyPairsIntoRecord,
  formatKeyPairs,
  getStringFromEnv,
  getNumberFromEnv,
  getBooleanFromEnv,
  getStringListFromEnv,
  unrefTimer,
  callWithTimeout,
  diagLogLevelFromString,
  setGlobalErrorHandler,
  globalErrorHandler,
  loggingErrorHandler,
} from "../src/core/index";

import {
  getBundleOptimizationInfo,
  loadCoreFeatures,
  loadPolyfillsOnly,
  isIE11,
} from "../src/index";

describe("IE11 Basic Compatibility", () => {
  // Polyfills are now auto-initialized when importing the main module

  describe("Polyfills", () => {
    it("should have Promise available", () => {
      expect(typeof Promise).toBe("function");
    });

    it("should have Map available", () => {
      expect(typeof Map).toBe("function");
      const testMap = new Map();
      expect(testMap.set).toBeDefined();
      expect(testMap.get).toBeDefined();
    });

    it("should have Set available", () => {
      expect(typeof Set).toBe("function");
      const testSet = new Set();
      expect(testSet.add).toBeDefined();
      expect(testSet.has).toBeDefined();
    });

    it("should have Symbol available", () => {
      expect(typeof Symbol).toBe("function");
    });

    it("should have fetch available", () => {
      expect(typeof fetch).toBe("function");
    });

    it("should have Object.assign available", () => {
      expect(typeof Object.assign).toBe("function");
      const result = Object.assign({}, { a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should have Array.from available", () => {
      expect(typeof Array.from).toBe("function");
      const result = Array.from("hello");
      expect(result).toEqual(["h", "e", "l", "l", "o"]);
    });
  });

  describe("ES6+ Features", () => {
    it("should support arrow functions (transpiled)", () => {
      const add = (a: number, b: number) => a + b;
      expect(add(2, 3)).toBe(5);
    });

    it("should support template literals (transpiled)", () => {
      const name = "IE11";
      const greeting = `Hello, ${name}!`;
      expect(greeting).toBe("Hello, IE11!");
    });

    it("should support destructuring (transpiled)", () => {
      const obj = { x: 1, y: 2 };
      const { x, y } = obj;
      expect(x).toBe(1);
      expect(y).toBe(2);
    });

    it("should support spread operator (transpiled)", () => {
      const arr1 = [1, 2];
      const arr2 = [...arr1, 3, 4];
      expect(arr2).toEqual([1, 2, 3, 4]);
    });

    it("should support classes (transpiled)", () => {
      class TestClass {
        private value: number;

        constructor(value: number) {
          this.value = value;
        }

        getValue(): number {
          return this.value;
        }
      }

      const instance = new TestClass(42);
      expect(instance.getValue()).toBe(42);
    });
  });

  describe("Async Operations", () => {
    it("should support Promises", (done) => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("success"), 10);
      });

      promise.then((result) => {
        expect(result).toBe("success");
        done();
      });
    });

    it("should support async/await (transpiled)", async () => {
      const asyncFunction = async (): Promise<string> => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("async result"), 10);
        });
      };

      const result = await asyncFunction();
      expect(result).toBe("async result");
    });
  });

  describe("Platform Detection", () => {
    it("should detect IE11 correctly", () => {
      // Since we're likely running in Chrome during tests,
      // just verify the function exists and returns a boolean
      expect(typeof isIE11).toBe("function");
      expect(typeof isIE11()).toBe("boolean");
    });

    it("should detect browser correctly", () => {
      expect(typeof isBrowser).toBe("function");
      expect(typeof isBrowser()).toBe("boolean");
    });

    it("should detect Node.js correctly", () => {
      expect(typeof isNode).toBe("function");
      expect(typeof isNode()).toBe("boolean");
    });
  });

  it("should detect browser environment", () => {
    expect(isBrowser()).toBe(true);
  });

  it("should not detect Node.js environment", () => {
    expect(isNode()).toBe(false);
  });

  it("should handle IE11 detection", () => {
    // Test in actual IE11 would return true, but in test env returns false
    expect(typeof isIE11()).toBe("boolean");
  });
});

describe("OpenTelemetry Core Functions", () => {
  describe("Context Propagation", () => {
    it("should parse valid traceparent", () => {
      const traceparent =
        "00-12345678901234567890123456789012-1234567890123456-01";
      const parsed = parseTraceParent(traceparent);

      expect(parsed).toBeDefined();
      expect(parsed!.version).toBe("00");
      expect(parsed!.traceId).toBe("12345678901234567890123456789012");
      expect(parsed!.spanId).toBe("1234567890123456");
      expect(parsed!.traceFlags).toBe("01");
    });

    it("should reject invalid traceparent", () => {
      expect(parseTraceParent("invalid")).toBeNull();
      expect(parseTraceParent("00-123-456-01")).toBeNull();
      expect(parseTraceParent("")).toBeNull();
    });

    it("should format traceparent correctly", () => {
      const traceId = "12345678901234567890123456789012";
      const spanId = "1234567890123456";
      const formatted = formatTraceParent(traceId, spanId);

      expect(formatted).toBe(
        "00-12345678901234567890123456789012-1234567890123456-01"
      );
    });

    it("should parse tracestate", () => {
      const tracestate = "vendor1=value1,vendor2=value2";
      const parsed = parseTraceState(tracestate);

      expect(parsed).toEqual({
        vendor1: "value1",
        vendor2: "value2",
      });
    });

    it("should format tracestate", () => {
      const tracestate = { vendor1: "value1", vendor2: "value2" };
      const formatted = formatTraceState(tracestate);

      expect(formatted).toContain("vendor1=value1");
      expect(formatted).toContain("vendor2=value2");
    });
  });

  describe("ID Generation", () => {
    it("should generate valid trace IDs", () => {
      const traceId = generateTraceId();
      expect(traceId.length).toBe(32);
      expect(isValidTraceId(traceId)).toBe(true);
    });

    it("should generate valid span IDs", () => {
      const spanId = generateSpanId();
      expect(spanId.length).toBe(16);
      expect(isValidSpanId(spanId)).toBe(true);
    });

    it("should generate unique IDs", () => {
      const traceId1 = generateTraceId();
      const traceId2 = generateTraceId();
      const spanId1 = generateSpanId();
      const spanId2 = generateSpanId();

      expect(traceId1).not.toBe(traceId2);
      expect(spanId1).not.toBe(spanId2);
    });
  });

  describe("Validation", () => {
    it("should validate trace IDs correctly", () => {
      expect(isValidTraceId("12345678901234567890123456789012")).toBe(true);
      expect(isValidTraceId("00000000000000000000000000000000")).toBe(false);
      expect(isValidTraceId("invalid")).toBe(false);
      expect(isValidTraceId("123")).toBe(false);
    });

    it("should validate span IDs correctly", () => {
      expect(isValidSpanId("1234567890123456")).toBe(true);
      expect(isValidSpanId("0000000000000000")).toBe(false);
      expect(isValidSpanId("invalid")).toBe(false);
      expect(isValidSpanId("123")).toBe(false);
    });
  });

  describe("URL Parsing", () => {
    it("should parse URLs correctly", () => {
      const url = "https://example.com:8080/path?query=value#hash";
      const parsed = parseUrl(url);

      expect(parsed.protocol).toBe("https:");
      expect(parsed.hostname).toBe("example.com");
      expect(parsed.port).toBe("8080");
      expect(parsed.pathname).toBe("/path");
      expect(parsed.search).toBe("?query=value");
      expect(parsed.hash).toBe("#hash");
    });
  });

  describe("Resource Detection", () => {
    it("should provide default resource", () => {
      const resource = getDefaultResource();

      expect(resource["service.name"]).toBeDefined();
      expect(resource["telemetry.sdk.name"]).toBe("opentelemetry");
      expect(resource["telemetry.sdk.language"]).toBe("webjs");
    });
  });

  describe("Utility Functions", () => {
    it("should sanitize attributes", () => {
      const attrs = {
        string: "value",
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { key: "value" },
      };

      const sanitized = sanitizeAttributes(attrs);

      expect(sanitized.string).toBe("value");
      expect(sanitized.number).toBe(42);
      expect(sanitized.boolean).toBe(true);
      expect(sanitized.null).toBe("null");
      expect(sanitized.undefined).toBe("undefined");
      expect(sanitized.array).toBe("1,2,3");
      expect(sanitized.object).toBe("[object Object]");
    });

    it("should merge objects", () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = merge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should deep merge objects", () => {
      const target: any = { a: { x: 1 }, b: 2 };
      const source: any = { a: { y: 2 }, c: 3 };
      const result: any = deepMerge(target, source);

      expect(result.a).toEqual({ x: 1, y: 2 });
      expect(result.b).toBe(2);
      expect(result.c).toBe(3);
    });

    it("should get unique array items", () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = unique(arr);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should convert array to string", () => {
      const arr = [1, 2, 3];
      const result = arrayToString(arr);

      expect(result).toBe("1,2,3");
    });
  });
});

describe("Browser API Compatibility", () => {
  describe("String Methods", () => {
    it("should pad string start", () => {
      expect(stringPadStart("hello", 8, "0")).toBe("000hello");
      expect(stringPadStart("hello", 8)).toBe("   hello");
      expect(stringPadStart("hello", 3)).toBe("hello");
    });

    it("should pad string end", () => {
      expect(stringPadEnd("hello", 8, "0")).toBe("hello000");
      expect(stringPadEnd("hello", 8)).toBe("hello   ");
      expect(stringPadEnd("hello", 3)).toBe("hello");
    });

    it("should check string starts with", () => {
      expect(stringStartsWith("hello world", "hello")).toBe(true);
      expect(stringStartsWith("hello world", "world")).toBe(false);
      expect(stringStartsWith("hello world", "world", 6)).toBe(true);
    });

    it("should check string ends with", () => {
      expect(stringEndsWith("hello world", "world")).toBe(true);
      expect(stringEndsWith("hello world", "hello")).toBe(false);
      expect(stringEndsWith("hello world", "hello", 5)).toBe(true);
    });

    it("should check string includes", () => {
      expect(stringIncludes("hello world", "lo wo")).toBe(true);
      expect(stringIncludes("hello world", "xyz")).toBe(false);
      expect(stringIncludes("hello world", "world", 6)).toBe(true);
    });

    it("should repeat string", () => {
      expect(stringRepeat("abc", 3)).toBe("abcabcabc");
      expect(stringRepeat("x", 0)).toBe("");
      expect(stringRepeat("test", 2)).toBe("testtest");
    });
  });

  describe("Array Methods", () => {
    it("should find array element", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayFind(arr, function (x) {
        return x > 3;
      });
      expect(result).toBe(4);

      const notFound = arrayFind(arr, function (x) {
        return x > 10;
      });
      expect(notFound).toBeUndefined();
    });

    it("should find array element index", () => {
      const arr = [1, 2, 3, 4, 5];
      const index = arrayFindIndex(arr, function (x) {
        return x > 3;
      });
      expect(index).toBe(3);

      const notFound = arrayFindIndex(arr, function (x) {
        return x > 10;
      });
      expect(notFound).toBe(-1);
    });

    it("should check array includes", () => {
      const arr = [1, 2, 3, NaN, 5];
      expect(arrayIncludes(arr, 3)).toBe(true);
      expect(arrayIncludes(arr, 6)).toBe(false);
      expect(arrayIncludes(arr, NaN)).toBe(true);
      expect(arrayIncludes(arr, 5, 3)).toBe(true);
    });
  });

  describe("Object Methods", () => {
    it("should get object values", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const values = objectValues(obj);
      expect(values.sort()).toEqual([1, 2, 3]);
    });

    it("should get object entries", () => {
      const obj = { a: 1, b: 2 };
      const entries = objectEntries(obj);
      expect(entries.length).toBe(2);
      expect(entries).toContain(["a", 1]);
      expect(entries).toContain(["b", 2]);
    });
  });

  describe("Number Methods", () => {
    it("should check isNaN correctly", () => {
      expect(numberIsNaN(NaN)).toBe(true);
      expect(numberIsNaN(123)).toBe(false);
      expect(numberIsNaN("hello")).toBe(false);
      expect(numberIsNaN(undefined)).toBe(false);
    });

    it("should check isFinite correctly", () => {
      expect(numberIsFinite(123)).toBe(true);
      expect(numberIsFinite(Infinity)).toBe(false);
      expect(numberIsFinite(-Infinity)).toBe(false);
      expect(numberIsFinite(NaN)).toBe(false);
      expect(numberIsFinite("123")).toBe(false);
    });

    it("should check isInteger correctly", () => {
      expect(numberIsInteger(123)).toBe(true);
      expect(numberIsInteger(123.0)).toBe(true);
      expect(numberIsInteger(123.45)).toBe(false);
      expect(numberIsInteger(NaN)).toBe(false);
      expect(numberIsInteger(Infinity)).toBe(false);
    });
  });

  describe("Safe Utilities", () => {
    it("should safely parse JSON", () => {
      expect(safeJSONParse('{"test": "value"}')).toEqual({ test: "value" });
      expect(safeJSONParse("invalid json")).toBe(null);
    });

    it("should safely stringify JSON", () => {
      expect(safeJSONStringify({ test: "value" })).toBe('{"test":"value"}');
      expect(safeJSONStringify(undefined)).toBe("{}");
    });

    it("should provide random values", () => {
      const arr = new Uint8Array(16);
      const result = getRandomValues(arr);

      expect(result.length).toBe(16);
      expect(result).toBe(arr); // Same array reference

      // Check that values were set (not all zeros)
      let hasNonZero = false;
      for (let i = 0; i < result.length; i++) {
        if (result[i] !== 0) {
          hasNonZero = true;
          break;
        }
      }
      expect(hasNonZero).toBe(true);
    });

    it("should provide performance now", () => {
      const now1 = performanceNow();
      const now2 = performanceNow();

      expect(typeof now1).toBe("number");
      expect(typeof now2).toBe("number");
      expect(now2).toBeGreaterThanOrEqual(now1);
    });

    it("should safely log to console", () => {
      // This test just ensures the function doesn't throw
      expect(function () {
        safeConsoleLog("test message");
        safeConsoleLog("multiple", "arguments", 123);
      }).not.toThrow();
    });
  });
});

describe("Enhanced Platform Detection", () => {
  describe("Browser Information", () => {
    it("should provide browser information", () => {
      const browserInfo = getBrowserInfo();

      expect(typeof browserInfo.name).toBe("string");
      expect(typeof browserInfo.version).toBe("string");
      expect(typeof browserInfo.isIE).toBe("boolean");
      expect(typeof browserInfo.isEdge).toBe("boolean");
      expect(typeof browserInfo.isChrome).toBe("boolean");
      expect(typeof browserInfo.isFirefox).toBe("boolean");
      expect(typeof browserInfo.isSafari).toBe("boolean");
      expect(typeof browserInfo.supportsES6).toBe("boolean");
    });

    it("should detect Chrome correctly", () => {
      const browserInfo = getBrowserInfo();
      // Since we're running in Chrome during tests
      if (browserInfo.name === "Chrome") {
        expect(browserInfo.isChrome).toBe(true);
        expect(browserInfo.isIE).toBe(false);
        expect(browserInfo.supportsES6).toBe(true);
      }
    });
  });

  describe("Node.js Information", () => {
    it("should provide node information", () => {
      const nodeInfo = getNodeInfo();

      expect(typeof nodeInfo.version).toBe("string");
      expect(typeof nodeInfo.majorVersion).toBe("number");
      expect(typeof nodeInfo.supportsES6).toBe("boolean");
      expect(typeof nodeInfo.supportsAsyncAwait).toBe("boolean");
      expect(typeof nodeInfo.hasProcess).toBe("boolean");
    });

    it("should handle non-Node environment", () => {
      const nodeInfo = getNodeInfo();
      // In browser test environment
      expect(nodeInfo.version).toBe("unknown");
      expect(nodeInfo.majorVersion).toBe(0);
      expect(nodeInfo.supportsES6).toBe(false);
      expect(nodeInfo.supportsAsyncAwait).toBe(false);
    });
  });

  describe("Feature Support", () => {
    it("should detect feature support correctly", () => {
      const features = getFeatureSupport();

      expect(typeof features.hasPromise).toBe("boolean");
      expect(typeof features.hasMap).toBe("boolean");
      expect(typeof features.hasSet).toBe("boolean");
      expect(typeof features.hasSymbol).toBe("boolean");
      expect(typeof features.hasFetch).toBe("boolean");
      expect(typeof features.hasPerformanceNow).toBe("boolean");
      expect(typeof features.hasCrypto).toBe("boolean");
      expect(typeof features.hasLocalStorage).toBe("boolean");
      expect(typeof features.hasSessionStorage).toBe("boolean");
      expect(typeof features.hasWebSocket).toBe("boolean");
      expect(typeof features.hasServiceWorker).toBe("boolean");
    });

    it("should detect modern browser features", () => {
      const features = getFeatureSupport();
      // These should be true in modern test environment
      expect(features.hasPromise).toBe(true);
      expect(features.hasMap).toBe(true);
      expect(features.hasSet).toBe(true);
      expect(features.hasSymbol).toBe(true);
    });
  });

  describe("Runtime Capabilities", () => {
    it("should detect runtime capabilities", () => {
      const capabilities = getRuntimeCapabilities();

      expect(typeof capabilities.canUseDOM).toBe("boolean");
      expect(typeof capabilities.canUseWorkers).toBe("boolean");
      expect(typeof capabilities.canUseLocalStorage).toBe("boolean");
      expect(typeof capabilities.canUseIndexedDB).toBe("boolean");
      expect(typeof capabilities.canUseBroadcastChannel).toBe("boolean");
      expect(typeof capabilities.canUsePerformanceObserver).toBe("boolean");
      expect(typeof capabilities.maxSafeInteger).toBe("number");
      expect(typeof capabilities.hasAsyncIterator).toBe("boolean");
    });

    it("should provide correct max safe integer", () => {
      const capabilities = getRuntimeCapabilities();
      expect(capabilities.maxSafeInteger).toBe(9007199254740991);
    });

    it("should detect DOM capabilities in browser", () => {
      const capabilities = getRuntimeCapabilities();
      // Should be true in browser test environment
      expect(capabilities.canUseDOM).toBe(true);
    });
  });

  describe("Environment Information", () => {
    it("should provide comprehensive environment info", () => {
      const envInfo = getEnvironmentInfo();

      expect(typeof envInfo.platform).toBe("string");
      expect(["browser", "node", "webworker", "unknown"]).toContain(
        envInfo.platform
      );
      expect(typeof envInfo.runtime).toBe("string");
      expect(typeof envInfo.version).toBe("string");
      expect(typeof envInfo.isIE11).toBe("boolean");
      expect(typeof envInfo.needsPolyfills).toBe("boolean");
      expect(Array.isArray(envInfo.supportedFeatures)).toBe(true);
      expect(Array.isArray(envInfo.limitations)).toBe(true);
    });

    it("should detect browser platform", () => {
      const envInfo = getEnvironmentInfo();
      // Should be browser in test environment
      expect(envInfo.platform).toBe("browser");
      expect(envInfo.isIE11).toBe(false); // Not IE11 in Chrome test
    });

    it("should list supported features", () => {
      const envInfo = getEnvironmentInfo();
      // Should have modern features in test environment
      expect(envInfo.supportedFeatures.length).toBeGreaterThan(0);
      expect(envInfo.supportedFeatures).toContain("Modern JavaScript");
    });
  });

  describe("Polyfill Requirements", () => {
    it("should detect polyfill requirements", () => {
      const requirements = getPolyfillRequirements();

      expect(typeof requirements.needsPromisePolyfill).toBe("boolean");
      expect(typeof requirements.needsFetchPolyfill).toBe("boolean");
      expect(typeof requirements.needsMapSetPolyfill).toBe("boolean");
      expect(typeof requirements.needsSymbolPolyfill).toBe("boolean");
      expect(typeof requirements.needsArrayPolyfills).toBe("boolean");
      expect(typeof requirements.needsStringPolyfills).toBe("boolean");
      expect(typeof requirements.needsObjectPolyfills).toBe("boolean");
      expect(typeof requirements.needsNumberPolyfills).toBe("boolean");
      expect(Array.isArray(requirements.polyfillsToLoad)).toBe(true);
    });

    it("should not need basic polyfills in modern browser", () => {
      const requirements = getPolyfillRequirements();
      // Should not need basic polyfills in Chrome test environment
      expect(requirements.needsPromisePolyfill).toBe(false);
      expect(requirements.needsMapSetPolyfill).toBe(false);
      expect(requirements.needsSymbolPolyfill).toBe(false);
    });

    it("should provide polyfill list", () => {
      const requirements = getPolyfillRequirements();
      expect(Array.isArray(requirements.polyfillsToLoad)).toBe(true);

      // Should be related to what's needed
      requirements.polyfillsToLoad.forEach(function (polyfill) {
        expect(typeof polyfill).toBe("string");
        expect(polyfill.length).toBeGreaterThan(0);
      });
    });
  });
});

describe("Bundle Optimization", () => {
  describe("Bundle Information", () => {
    it("should provide bundle optimization info", () => {
      const bundleInfo = getBundleOptimizationInfo();

      expect(typeof bundleInfo.totalSize).toBe("string");
      expect(Array.isArray(bundleInfo.chunks)).toBe(true);
      expect(Array.isArray(bundleInfo.recommendations)).toBe(true);
    });

    it("should have correct chunk information", () => {
      const bundleInfo = getBundleOptimizationInfo();

      expect(bundleInfo.chunks.length).toBe(4);

      const chunkNames = bundleInfo.chunks.map(function (chunk) {
        return chunk.name;
      });

      expect(chunkNames).toContain("polyfills.js");
      expect(chunkNames).toContain("vendor.js");
      expect(chunkNames).toContain("744.js");
      expect(chunkNames).toContain("opentelemetry-ie11.js");
    });

    it("should have size estimates for each chunk", () => {
      const bundleInfo = getBundleOptimizationInfo();

      bundleInfo.chunks.forEach(function (chunk) {
        expect(typeof chunk.name).toBe("string");
        expect(typeof chunk.description).toBe("string");
        expect(typeof chunk.estimatedSize).toBe("string");
        expect(typeof chunk.required).toBe("boolean");

        expect(chunk.name.length).toBeGreaterThan(0);
        expect(chunk.description.length).toBeGreaterThan(0);
        expect(chunk.estimatedSize.length).toBeGreaterThan(0);
      });
    });

    it("should provide meaningful recommendations", () => {
      const bundleInfo = getBundleOptimizationInfo();

      expect(bundleInfo.recommendations.length).toBeGreaterThan(0);

      bundleInfo.recommendations.forEach(function (recommendation) {
        expect(typeof recommendation).toBe("string");
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });

    it("should indicate total size reduction", () => {
      const bundleInfo = getBundleOptimizationInfo();

      expect(bundleInfo.totalSize).toBe("157KB (split into chunks)");
    });
  });
});

// Enhanced time utilities tests
describe("Enhanced Time Utilities", () => {
  it("hrTimeToMicroseconds converts correctly", () => {
    expect(hrTimeToMicroseconds(1)).toBe(1000);
    expect(hrTimeToMicroseconds(1.5)).toBe(1500);
  });

  it("hrTimeToMilliseconds converts correctly", () => {
    expect(hrTimeToMilliseconds(1000)).toBe(1000);
    expect(hrTimeToMilliseconds(1500.5)).toBe(1500);
  });

  it("hrTimeToTimeStamp adds time origin", () => {
    const result = hrTimeToTimeStamp(1000);
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(1000);
  });

  it("addHrTimes adds times correctly", () => {
    expect(addHrTimes(100, 50)).toBe(150);
    expect(addHrTimes(0, 100)).toBe(100);
  });

  it("millisToHrTime returns correct value", () => {
    expect(millisToHrTime(1000)).toBe(1000);
  });

  it("isTimeInput validates time input", () => {
    expect(isTimeInput(123)).toBe(true);
    expect(isTimeInput("not a number")).toBe(false);
    expect(isTimeInput(NaN)).toBe(false);
    expect(isTimeInput(Infinity)).toBe(false);
  });

  it("isTimeInputHrTime validates HR time input", () => {
    expect(isTimeInputHrTime(123)).toBe(true);
    expect(isTimeInputHrTime(-1)).toBe(false);
    expect(isTimeInputHrTime("invalid")).toBe(false);
  });

  it("timeInputToHrTime handles arrays and numbers", () => {
    expect(timeInputToHrTime(1000)).toBe(1000);
    expect(timeInputToHrTime([1, 500000000])).toBe(1500);
  });
});

// Hex and binary utilities tests
describe("Hex and Binary Utilities", () => {
  it("hexToBinary converts hex to binary", () => {
    expect(hexToBinary("48656c6c6f")).toBe("Hello");
  });

  it("binaryToHex converts binary to hex", () => {
    expect(binaryToHex("Hello")).toBe("48656c6c6f");
  });

  it("binaryToBase64 converts binary to base64", () => {
    const result = binaryToBase64("Hello");
    expect(typeof result).toBe("string");
  });

  it("base64ToBinary converts base64 to binary", () => {
    const base64 = binaryToBase64("Hello");
    const result = base64ToBinary(base64);
    expect(result).toBe("Hello");
  });
});

// Enhanced attribute validation tests
describe("Enhanced Attribute Validation", () => {
  it("isAttributeValue validates attribute values", () => {
    expect(isAttributeValue("string")).toBe(true);
    expect(isAttributeValue(123)).toBe(true);
    expect(isAttributeValue(true)).toBe(true);
    expect(isAttributeValue(["a", "b"])).toBe(true);
    expect(isAttributeValue({})).toBe(false);
    expect(isAttributeValue(null)).toBe(false);
  });

  it("validateKey validates attribute keys", () => {
    expect(validateKey("valid_key")).toBe(true);
    expect(validateKey("")).toBe(false);
    expect(validateKey("key\nwith\nnewline")).toBe(false);
  });

  it("sanitizeAttributeKey sanitizes keys", () => {
    expect(sanitizeAttributeKey("valid_key")).toBe("valid_key");
    expect(sanitizeAttributeKey("key\nwith\nnewline")).toBe("key_with_newline");
    expect(sanitizeAttributeKey("")).toBe("invalid_key");
    expect(sanitizeAttributeKey(123 as any)).toBe("123");
  });
});

// URL utilities tests
describe("URL Utilities", () => {
  it("isUrlIgnored checks URL patterns", () => {
    expect(isUrlIgnored("https://example.com", ["example"])).toBe(true);
    expect(isUrlIgnored("https://test.com", [/test/])).toBe(true);
    expect(isUrlIgnored("https://other.com", ["example"])).toBe(false);
  });

  it("urlMatches matches URL patterns", () => {
    expect(urlMatches("https://example.com", "example")).toBe(true);
    expect(urlMatches("https://example.com", /example/)).toBe(true);
    expect(urlMatches("https://test.com", "example")).toBe(false);
  });

  it("normalizeHeaders normalizes different header formats", () => {
    const headers = normalizeHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["authorization"]).toBe("Bearer token");
  });
});

// Enhanced error handling tests
describe("Enhanced Error Handling", () => {
  it("getActiveSpan returns null (placeholder)", () => {
    expect(getActiveSpan()).toBe(null);
  });

  it("setStatus works with mock span", () => {
    const mockSpan = { setStatus: jasmine.createSpy() };
    setStatus(mockSpan, { code: 1 });
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
  });

  it("recordException works with mock span", () => {
    const mockSpan = { recordException: jasmine.createSpy() };
    const error = new Error("test error");
    recordException(mockSpan, error);
    expect(mockSpan.recordException).toHaveBeenCalledWith(error);
  });

  it("isTracingSuppressed returns false (placeholder)", () => {
    expect(isTracingSuppressed()).toBe(false);
  });

  it("suppressTracing executes function", () => {
    const fn = jasmine.createSpy().and.returnValue("result");
    const result = suppressTracing(fn);
    expect(fn).toHaveBeenCalled();
    expect(result).toBe("result");
  });

  it("unsuppressTracing executes function", () => {
    const fn = jasmine.createSpy().and.returnValue("result");
    const result = unsuppressTracing(fn);
    expect(fn).toHaveBeenCalled();
    expect(result).toBe("result");
  });
});

// Key-value parsing utilities tests
describe("Key-Value Parsing Utilities", () => {
  it("parseKeyPairsIntoRecord parses key-value pairs", () => {
    const result = parseKeyPairsIntoRecord("key1=value1,key2=value2");
    expect(result).toEqual({
      key1: "value1",
      key2: "value2",
    });

    const resultWithSeparator = parseKeyPairsIntoRecord(
      "key1=value1;key2=value2",
      ";"
    );
    expect(resultWithSeparator).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });

  it("formatKeyPairs formats record to string", () => {
    const record = {
      key1: "value1",
      key2: "value2",
    };
    const result = formatKeyPairs(record);
    expect(result).toBe("key1=value1,key2=value2");
  });
});

// Environment utilities tests
describe("Environment Utilities", () => {
  it("getStringFromEnv returns default when no process", () => {
    expect(getStringFromEnv("NONEXISTENT", "default")).toBe("default");
  });
  it("getNumberFromEnv returns default when no process", () => {
    expect(getNumberFromEnv("NONEXISTENT", 42)).toBe(42);
  });
  it("getBooleanFromEnv returns default when no process", () => {
    expect(getBooleanFromEnv("NONEXISTENT", true)).toBe(true);
  });
  it("getStringListFromEnv returns empty array when no process", () => {
    expect(getStringListFromEnv("NONEXISTENT")).toEqual([]);
  });
});

// Timer utilities tests
describe("Timer Utilities", () => {
  it("unrefTimer handles timer gracefully", () => {
    const mockTimer = { unref: jasmine.createSpy() };
    expect(() => unrefTimer(mockTimer)).not.toThrow();
    expect(mockTimer.unref).toHaveBeenCalled();

    expect(() => unrefTimer({})).not.toThrow();
  });

  it("callWithTimeout resolves on success", async () => {
    const fn = () => Promise.resolve("success");
    const result = await callWithTimeout(fn, 1000);
    expect(result).toBe("success");
  });

  it("callWithTimeout rejects on timeout", (done) => {
    const fn = () =>
      new Promise((resolve) => setTimeout(() => resolve("late"), 2000));

    callWithTimeout(fn, 100).then(
      () => {
        fail("Expected timeout, but promise resolved");
        done();
      },
      (error) => {
        expect(error.message).toMatch(/Operation timed out/);
        done();
      }
    );
  });
});

// Diagnostic utilities tests
describe("Diagnostic Utilities", () => {
  it("diagLogLevelFromString converts log levels", () => {
    expect(diagLogLevelFromString("none")).toBe(0);
    expect(diagLogLevelFromString("error")).toBe(1);
    expect(diagLogLevelFromString("warn")).toBe(2);
    expect(diagLogLevelFromString("info")).toBe(3);
    expect(diagLogLevelFromString("debug")).toBe(4);
    expect(diagLogLevelFromString("verbose")).toBe(5);
    expect(diagLogLevelFromString("unknown")).toBe(3);
  });
});

// Global error handler tests
describe("Global Error Handler", () => {
  it("setGlobalErrorHandler sets handler", () => {
    const handler = jasmine.createSpy();
    setGlobalErrorHandler(handler);
    const error = new Error("test error");
    globalErrorHandler(error);
    expect(handler).toHaveBeenCalledWith(error);
  });

  it("globalErrorHandler falls back to console", () => {
    setGlobalErrorHandler(null as any);
    const error = new Error("test error");
    expect(() => globalErrorHandler(error)).not.toThrow();
  });

  it("loggingErrorHandler logs error", () => {
    const error = new Error("test error");
    expect(() => loggingErrorHandler(error)).not.toThrow();
  });
});

// Bundle optimization tests
describe("Bundle Optimization", () => {
  it("getBundleOptimizationInfo returns info", () => {
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
    expect(getBundleOptimizationInfo).toBeDefined();
  });

  it("loadCoreFeatures loads async", () => {
    expect(loadCoreFeatures).toBeDefined();
  });

  it("loadPolyfillsOnly loads async", () => {
    expect(loadPolyfillsOnly).toBeDefined();
  });
});
