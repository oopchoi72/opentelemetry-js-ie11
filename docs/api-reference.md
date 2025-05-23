# API Reference

Complete API reference for OpenTelemetry JavaScript IE11 SDK. This document covers all public APIs for the currently implemented modules.

## 📦 Module Overview

### Available Modules

- **[Performance](#-performance-module)**: Performance monitoring and optimization
- **[Browser](#-browser-module)**: Browser detection and conditional loading
- **[Web](#-web-module)**: DOM event instrumentation and web-specific features

## 🔧 Performance Module

### Import

```javascript
var performance = require("opentelemetry-js-ie11/performance");
// or
var {
  createBottleneckAnalyzer,
  createDataBatcher,
} = require("opentelemetry-js-ie11/performance");
```

### Bottleneck Analyzer

#### `createBottleneckAnalyzer(options)`

Creates a performance bottleneck analyzer for IE11.

**Parameters:**

- `options` (Object, optional): Configuration options
  - `enableProfiling` (boolean): Enable detailed profiling. Default: `false`
  - `reportInterval` (number): Report generation interval in ms. Default: `5000`
  - `thresholds` (Object): Performance thresholds
    - `renderTime` (number): Render time threshold in ms. Default: `16`
    - `scriptExecution` (number): Script execution threshold in ms. Default: `50`
    - `domManipulation` (number): DOM manipulation threshold in ms. Default: `10`
    - `memoryUsage` (number): Memory usage threshold in MB. Default: `50`

**Returns:** `BottleneckAnalyzer` instance

**Example:**

```javascript
var analyzer = performance.createBottleneckAnalyzer({
  enableProfiling: true,
  reportInterval: 10000,
  thresholds: {
    renderTime: 12,
    scriptExecution: 30,
  },
});
```

#### BottleneckAnalyzer Methods

##### `startMonitoring()`

Starts performance monitoring.

**Returns:** `void`

##### `stopMonitoring()`

Stops performance monitoring.

**Returns:** `void`

##### `generateReport()`

Generates a performance report.

**Returns:** `PerformanceReport` object

- `bottlenecks` (Array): List of detected bottlenecks
- `recommendations` (Array): Performance improvement recommendations
- `metrics` (Object): Current performance metrics
- `timestamp` (number): Report generation timestamp

**Example:**

```javascript
var report = analyzer.generateReport();
console.log("Found", report.bottlenecks.length, "bottlenecks");
report.recommendations.forEach(function (rec) {
  console.log("Recommendation:", rec.message);
});
```

##### `isMonitoring()`

Checks if monitoring is active.

**Returns:** `boolean`

### Data Batcher

#### `createDataBatcher(processor, options)`

Creates a data batcher for efficient batch processing.

**Parameters:**

- `processor` (Function): Batch processing function `(batch) => void`
- `options` (Object, optional): Configuration options
  - `maxBatchSize` (number): Maximum batch size. Default: `100`
  - `flushInterval` (number): Auto-flush interval in ms. Default: `5000`
  - `enableAutoFlush` (boolean): Enable automatic flushing. Default: `true`
  - `priority` (string): Processing priority. Values: `'high'`, `'medium'`, `'low'`. Default: `'medium'`

**Returns:** `DataBatcher` instance

**Example:**

```javascript
var batcher = performance.createDataBatcher(
  function (batch) {
    console.log("Processing", batch.length, "items");
    batch.forEach(function (item) {
      // Process item
    });
  },
  {
    maxBatchSize: 50,
    flushInterval: 2000,
  }
);
```

#### DataBatcher Methods

##### `add(data)`

Adds data to the batch.

**Parameters:**

- `data` (any): Data to add to batch

**Returns:** `void`

##### `flush()`

Manually flushes the current batch.

**Returns:** `Promise<void>`

##### `size()`

Gets current batch size.

**Returns:** `number`

##### `destroy()`

Destroys the batcher and cleans up resources.

**Returns:** `void`

### Object Pool

#### `createSpanDataPool(options)`, `createEventDataPool(options)`, etc.

Creates specialized object pools for memory optimization.

**Parameters:**

- `options` (Object, optional): Pool configuration
  - `initialSize` (number): Initial pool size. Default: `10`
  - `maxSize` (number): Maximum pool size. Default: `100`
  - `enablePreallocation` (boolean): Pre-allocate objects. Default: `true`

**Returns:** `ObjectPool` instance

#### ObjectPool Methods

##### `acquire()`

Acquires an object from the pool.

**Returns:** `Object` - Pooled object

##### `release(object)`

Returns an object to the pool.

**Parameters:**

- `object` (Object): Object to return to pool

**Returns:** `void`

##### `size()`

Gets current pool size.

**Returns:** `{ available: number, total: number }`

##### `clear()`

Clears the pool.

**Returns:** `void`

### Utility Functions

#### `measurePerformance(name, fn)`

Measures execution time of a function.

**Parameters:**

- `name` (string): Measurement name
- `fn` (Function): Function to measure

**Returns:** `{ result: any, duration: number }`

#### `throttle(fn, delay)`

Creates a throttled version of a function.

**Parameters:**

- `fn` (Function): Function to throttle
- `delay` (number): Throttle delay in ms

**Returns:** `Function` - Throttled function

#### `debounce(fn, delay)`

Creates a debounced version of a function.

**Parameters:**

- `fn` (Function): Function to debounce
- `delay` (number): Debounce delay in ms

**Returns:** `Function` - Debounced function

## 🌐 Browser Module

### Import

```javascript
var browser = require("opentelemetry-js-ie11/browser");
// or
var {
  detectIE11,
  createConditionalLoader,
} = require("opentelemetry-js-ie11/browser");
```

### Browser Detection

#### `detectIE11()`

Detects if the current browser is Internet Explorer 11.

**Returns:** `boolean`

#### `detectBrowserInfo()`

Detects comprehensive browser information.

**Returns:** `BrowserInfo` object

- `name` (string): Browser name
- `version` (string): Browser version
- `isIE11` (boolean): Whether browser is IE11
- `isModern` (boolean): Whether browser supports modern features
- `engine` (string): Browser engine name
- `supports` (BrowserFeatures): Feature support information

**Example:**

```javascript
var info = browser.detectBrowserInfo();
if (info.isIE11) {
  console.log("Running on IE11, version:", info.version);
  console.log("Supports Promise:", info.supports.promisesNative);
}
```

#### `detectBrowserFeatures()`

Detects browser feature support.

**Returns:** `BrowserFeatures` object with boolean flags for:

- `es6`, `promisesNative`, `fetch`, `webWorkers`
- `intersectionObserver`, `mutationObserver`
- `customElements`, `shadowDOM`
- `objectAssign`, `arrayIncludes`, `stringIncludes`
- `mapAndSet`, `weakMapAndSet`, `symbols`
- And many more...

#### `isModernBrowser()`

Checks if browser supports modern features.

**Returns:** `boolean`

#### `needsPolyfills()`

Determines if browser needs polyfills.

**Returns:** `boolean`

### Conditional Loader

#### `createConditionalLoader(config)`

Creates a conditional loader for appropriate OpenTelemetry version.

**Parameters:**

- `config` (LoaderConfig): Loader configuration
  - `baseCDN` (string): Base CDN URL
  - `polyfillsPath` (string): Path to polyfills bundle
  - `ie11Path` (string): Path to IE11 bundle
  - `modernPath` (string): Path to modern bundle
  - `enableLogging` (boolean): Enable debug logging
  - `timeout` (number): Load timeout in ms. Default: `30000`
  - `retryAttempts` (number): Retry attempts. Default: `3`

**Returns:** `LoaderInstance`

#### LoaderInstance Methods

##### `load()`

Loads the appropriate OpenTelemetry version.

**Returns:** `Promise<LoadResult>`

- `success` (boolean): Whether load was successful
- `version` (string): Loaded version (`'ie11'`, `'modern'`, `'fallback'`)
- `loadTime` (number): Load time in ms
- `error` (Error, optional): Error if load failed
- `polyfillsLoaded` (boolean): Whether polyfills were loaded

##### `loadPolyfills()`

Manually loads polyfills.

**Returns:** `Promise<boolean>`

#### `autoLoad(config)`

Automatically loads appropriate version based on browser detection.

**Parameters:**

- `config` (LoaderConfig): Loader configuration

**Returns:** `Promise<LoadResult>`

**Example:**

```javascript
browser
  .autoLoad({
    baseCDN: "https://cdn.jsdelivr.net/npm/opentelemetry-js-ie11@1.0.0",
    enableLogging: true,
  })
  .then(function (result) {
    if (result.success) {
      console.log("Loaded", result.version, "in", result.loadTime, "ms");
    }
  });
```

## 📊 Web Module

### Import

```javascript
var web = require("opentelemetry-js-ie11/web");
// or
var { createDOMEventInstrumentation } = require("opentelemetry-js-ie11/web");
```

### DOM Event Instrumentation

#### `createDOMEventInstrumentation(config)`

Creates DOM event instrumentation for IE11.

**Parameters:**

- `config` (Object, optional): Instrumentation configuration
  - `enableEventHistory` (boolean): Track event history. Default: `true`
  - `maxEventHistory` (number): Maximum events to store. Default: `1000`
  - `throttleHighFrequency` (boolean): Throttle frequent events. Default: `true`
  - `throttleInterval` (number): Throttle interval in ms. Default: `100`
  - `captureEventDetails` (boolean): Capture detailed event info. Default: `true`
  - `enableMemoryOptimization` (boolean): Enable memory optimizations. Default: `true`

**Returns:** `DOMEventInstrumentation` instance

**Example:**

```javascript
var instrumentation = web.createDOMEventInstrumentation({
  enableEventHistory: true,
  maxEventHistory: 500,
  throttleHighFrequency: true,
  throttleInterval: 150,
});
```

#### DOMEventInstrumentation Methods

##### `instrumentDocument()`

Instruments the document for event tracking.

**Returns:** `void`

##### `instrumentWindow()`

Instruments the window for event tracking.

**Returns:** `void`

##### `instrumentElement(element)`

Instruments a specific element for event tracking.

**Parameters:**

- `element` (HTMLElement): Element to instrument

**Returns:** `void`

##### `uninstrumentElement(element)`

Removes instrumentation from an element.

**Parameters:**

- `element` (HTMLElement): Element to uninstrument

**Returns:** `void`

##### `getEventStatistics()`

Gets event tracking statistics.

**Returns:** `EventStatistics` object

- `totalEvents` (number): Total events captured
- `eventTypeDistribution` (Object): Events by type
- `mostFrequentEvent` (string): Most frequent event type
- `averageEventsPerSecond` (number): Average event rate
- `memoryUsage` (number): Current memory usage in bytes

##### `getEventHistory(options)`

Gets captured event history.

**Parameters:**

- `options` (Object, optional): Filter options
  - `eventType` (string): Filter by event type
  - `timeRange` (Object): Time range filter
    - `start` (number): Start timestamp
    - `end` (number): End timestamp
  - `limit` (number): Maximum events to return

**Returns:** `Array<EventRecord>` - Array of event records

##### `clearEventHistory()`

Clears the event history.

**Returns:** `void`

##### `startTracking()`

Starts event tracking.

**Returns:** `void`

##### `stopTracking()`

Stops event tracking.

**Returns:** `void`

##### `isTracking()`

Checks if tracking is active.

**Returns:** `boolean`

##### `destroy()`

Destroys the instrumentation and cleans up.

**Returns:** `void`

## 🔧 Utility APIs

### Global Configuration

#### `setGlobalConfig(config)`

Sets global configuration for all modules.

**Parameters:**

- `config` (Object): Global configuration
  - `logLevel` (string): Logging level. Values: `'debug'`, `'info'`, `'warn'`, `'error'`
  - `enablePerformanceOptimizations` (boolean): Enable IE11 optimizations
  - `memoryLimitMB` (number): Memory usage limit in MB
  - `maxActiveSpans` (number): Maximum active spans

**Returns:** `void`

#### `getGlobalConfig()`

Gets current global configuration.

**Returns:** `Object` - Current configuration

### Feature Detection

#### `supportsFeature(featureName)`

Checks if a specific feature is supported.

**Parameters:**

- `featureName` (string): Feature name to check

**Returns:** `boolean`

### Version Information

#### `version`

Current library version string.

**Type:** `string`

#### `buildInfo`

Build information object.

**Type:** `Object`

- `version` (string): Version string
- `buildTime` (string): Build timestamp
- `target` (string): Build target (`'ie11'`, `'modern'`)

## 🚨 Error Handling

### Error Types

All modules can throw the following error types:

#### `OpenTelemetryIE11Error`

Base error class for all library errors.

**Properties:**

- `name` (string): Error name
- `message` (string): Error message
- `code` (string): Error code
- `module` (string): Module that threw the error

#### `BrowserCompatibilityError`

Thrown when browser compatibility issues are detected.

#### `PolyfillError`

Thrown when polyfill loading fails.

#### `PerformanceError`

Thrown when performance monitoring encounters issues.

### Error Codes

| Code       | Description                    | Module      |
| ---------- | ------------------------------ | ----------- |
| `IE11_001` | Browser not supported          | Browser     |
| `IE11_002` | Polyfill load failed           | Browser     |
| `IE11_003` | Performance threshold exceeded | Performance |
| `IE11_004` | Memory limit exceeded          | Performance |
| `IE11_005` | Event tracking failed          | Web         |

### Error Handling Example

```javascript
try {
  var instrumentation = web.createDOMEventInstrumentation();
  instrumentation.instrumentDocument();
} catch (error) {
  if (error.code === "IE11_005") {
    console.error("Event tracking failed:", error.message);
    // Fallback handling
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## 📊 Type Definitions

### TypeScript Support

While the library is written in ES5 for IE11 compatibility, TypeScript definitions are provided:

```typescript
declare module "opentelemetry-js-ie11" {
  export interface BrowserInfo {
    name: string;
    version: string;
    isIE11: boolean;
    isModern: boolean;
    engine: string;
    supports: BrowserFeatures;
  }

  export interface PerformanceReport {
    bottlenecks: Bottleneck[];
    recommendations: Recommendation[];
    metrics: PerformanceMetrics;
    timestamp: number;
  }

  // ... more type definitions
}
```

## 🔍 Debugging

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Enable debug logging globally
var config = require("opentelemetry-js-ie11");
config.setGlobalConfig({
  logLevel: "debug",
  enablePerformanceOptimizations: true,
});

// Or per module
var analyzer = performance.createBottleneckAnalyzer({
  enableLogging: true,
  logLevel: "debug",
});
```

### Performance Monitoring

Monitor the library's own performance:

```javascript
var libPerf = performance.createBottleneckAnalyzer({
  enableProfiling: true,
  reportInterval: 1000,
});

libPerf.startMonitoring();

// Check performance every minute
setInterval(function () {
  var report = libPerf.generateReport();
  if (report.bottlenecks.length > 0) {
    console.warn("Library performance issues detected:", report.bottlenecks);
  }
}, 60000);
```

---

For more detailed examples and usage patterns, see the [Examples](../examples/) directory and [Usage Guide](usage-guide.md).
