// IE11-compatible Performance API Polyfill for OpenTelemetry

// Performance entry interfaces for IE11 compatibility
export interface PerformanceEntryPolyfill {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

export interface PerformanceMarkPolyfill extends PerformanceEntryPolyfill {
  entryType: "mark";
}

export interface PerformanceMeasurePolyfill extends PerformanceEntryPolyfill {
  entryType: "measure";
  startMark?: string;
  endMark?: string;
}

export interface PerformanceNavigationTimingPolyfill
  extends PerformanceEntryPolyfill {
  entryType: "navigation";
  navigationStart: number;
  domLoading: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;
  responseStart: number;
  responseEnd: number;
}

export interface PerformanceResourceTimingPolyfill
  extends PerformanceEntryPolyfill {
  entryType: "resource";
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

// Performance polyfill configuration
export interface PerformancePolyfillConfig {
  enableHighResolutionTiming?: boolean;
  enableResourceTiming?: boolean;
  maxEntries?: number;
  enableMarks?: boolean;
  enableMeasures?: boolean;
}

// IE11-compatible Performance API Polyfill
export var PerformancePolyfill = (function () {
  var config: PerformancePolyfillConfig = {
    enableHighResolutionTiming: true,
    enableResourceTiming: true,
    maxEntries: 1000,
    enableMarks: true,
    enableMeasures: true,
  };

  // Storage for performance entries
  var entries: PerformanceEntryPolyfill[] = [];
  var marks: { [name: string]: PerformanceMarkPolyfill } = {};
  var measures: { [name: string]: PerformanceMeasurePolyfill } = {};

  // High-resolution timing fallback
  var performanceNowFallback = (function () {
    var startTime = Date.now();
    var lastNow = 0;
    var nowOffset = 0;

    return function (): number {
      var now = Date.now() - startTime;

      // Simulate high-resolution timing with microsecond precision
      if (now === lastNow) {
        nowOffset += 0.001; // Add 1 microsecond
      } else {
        nowOffset = 0;
        lastNow = now;
      }

      return now + nowOffset;
    };
  })();

  // Get high-resolution timestamp
  function now(): number {
    // Try native performance.now() first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.now
    ) {
      return window.performance.now();
    }

    // Use high-resolution fallback
    if (config.enableHighResolutionTiming) {
      return performanceNowFallback();
    }

    // Final fallback to Date.now()
    return Date.now() - (window.performance?.timing?.navigationStart || 0);
  }

  // Add entry to storage
  function addEntry(entry: PerformanceEntryPolyfill): void {
    entries.push(entry);

    // Limit entries to prevent memory leaks
    if (entries.length > config.maxEntries!) {
      entries.shift();
    }
  }

  // Get navigation timing from IE11
  function getNavigationTiming(): PerformanceNavigationTimingPolyfill | null {
    if (
      typeof window === "undefined" ||
      !window.performance ||
      !window.performance.timing
    ) {
      return null;
    }

    var timing = window.performance.timing;
    var navigationStart = timing.navigationStart || 0;

    return {
      name: "document",
      entryType: "navigation",
      startTime: 0,
      duration: timing.loadEventEnd
        ? timing.loadEventEnd - navigationStart
        : now(),
      navigationStart: navigationStart,
      domLoading: timing.domLoading ? timing.domLoading - navigationStart : 0,
      domInteractive: timing.domInteractive
        ? timing.domInteractive - navigationStart
        : 0,
      domContentLoadedEventStart: timing.domContentLoadedEventStart
        ? timing.domContentLoadedEventStart - navigationStart
        : 0,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd
        ? timing.domContentLoadedEventEnd - navigationStart
        : 0,
      domComplete: timing.domComplete
        ? timing.domComplete - navigationStart
        : 0,
      loadEventStart: timing.loadEventStart
        ? timing.loadEventStart - navigationStart
        : 0,
      loadEventEnd: timing.loadEventEnd
        ? timing.loadEventEnd - navigationStart
        : 0,
      responseStart: timing.responseStart
        ? timing.responseStart - navigationStart
        : 0,
      responseEnd: timing.responseEnd
        ? timing.responseEnd - navigationStart
        : 0,
    };
  }

  // Collect resource timing from various sources
  function getResourceTiming(): PerformanceResourceTimingPolyfill[] {
    var resources: PerformanceResourceTimingPolyfill[] = [];

    if (!config.enableResourceTiming) {
      return resources;
    }

    // Try native Resource Timing API first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.getEntriesByType
    ) {
      try {
        var nativeResources = window.performance.getEntriesByType("resource");
        for (var i = 0; i < nativeResources.length; i++) {
          var resource = nativeResources[i] as any;
          resources.push({
            name: resource.name,
            entryType: "resource",
            startTime: resource.startTime || 0,
            duration: resource.duration || 0,
            initiatorType: resource.initiatorType || "other",
            transferSize: resource.transferSize || 0,
            encodedBodySize: resource.encodedBodySize || 0,
            decodedBodySize: resource.decodedBodySize || 0,
          });
        }
      } catch (error) {
        // Fallback for IE11
      }
    }

    // IE11 fallback: collect from DOM elements
    if (resources.length === 0 && typeof document !== "undefined") {
      // Collect scripts
      var scripts = document.getElementsByTagName("script");
      for (var j = 0; j < scripts.length; j++) {
        var script = scripts[j];
        if (script.src) {
          resources.push({
            name: script.src,
            entryType: "resource",
            startTime: 0,
            duration: 0,
            initiatorType: "script",
            transferSize: 0,
            encodedBodySize: 0,
            decodedBodySize: 0,
          });
        }
      }

      // Collect stylesheets
      var links = document.getElementsByTagName("link");
      for (var k = 0; k < links.length; k++) {
        var link = links[k];
        if (link.rel === "stylesheet" && link.href) {
          resources.push({
            name: link.href,
            entryType: "resource",
            startTime: 0,
            duration: 0,
            initiatorType: "link",
            transferSize: 0,
            encodedBodySize: 0,
            decodedBodySize: 0,
          });
        }
      }

      // Collect images
      var images = document.getElementsByTagName("img");
      for (var l = 0; l < images.length; l++) {
        var img = images[l];
        if (img.src) {
          resources.push({
            name: img.src,
            entryType: "resource",
            startTime: 0,
            duration: 0,
            initiatorType: "img",
            transferSize: 0,
            encodedBodySize: 0,
            decodedBodySize: 0,
          });
        }
      }
    }

    return resources;
  }

  // Performance mark implementation
  function mark(name: string): PerformanceMarkPolyfill {
    // Try native mark first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.mark &&
      config.enableMarks
    ) {
      try {
        return window.performance.mark(name) as any;
      } catch (error) {
        // Fallback to polyfill
      }
    }

    var markEntry: PerformanceMarkPolyfill = {
      name: name,
      entryType: "mark",
      startTime: now(),
      duration: 0,
    };

    if (config.enableMarks) {
      marks[name] = markEntry;
      addEntry(markEntry);
    }

    return markEntry;
  }

  // Performance measure implementation
  function measure(
    name: string,
    startMark?: string,
    endMark?: string
  ): PerformanceMeasurePolyfill {
    // Try native measure first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.measure &&
      config.enableMeasures
    ) {
      try {
        return window.performance.measure(name, startMark, endMark) as any;
      } catch (error) {
        // Fallback to polyfill
      }
    }

    var startTime = 0;
    var endTime = now();

    // Calculate start time
    if (startMark) {
      var startMarkEntry = marks[startMark];
      if (startMarkEntry) {
        startTime = startMarkEntry.startTime;
      } else {
        // Check navigation timing for well-known marks
        var navigationTiming = getNavigationTiming();
        if (navigationTiming) {
          switch (startMark) {
            case "navigationStart":
              startTime = navigationTiming.navigationStart;
              break;
            case "domLoading":
              startTime = navigationTiming.domLoading;
              break;
            case "domInteractive":
              startTime = navigationTiming.domInteractive;
              break;
            case "domContentLoadedEventStart":
              startTime = navigationTiming.domContentLoadedEventStart;
              break;
            case "domContentLoadedEventEnd":
              startTime = navigationTiming.domContentLoadedEventEnd;
              break;
            case "domComplete":
              startTime = navigationTiming.domComplete;
              break;
            case "loadEventStart":
              startTime = navigationTiming.loadEventStart;
              break;
            case "loadEventEnd":
              startTime = navigationTiming.loadEventEnd;
              break;
          }
        }
      }
    }

    // Calculate end time
    if (endMark) {
      var endMarkEntry = marks[endMark];
      if (endMarkEntry) {
        endTime = endMarkEntry.startTime;
      }
    }

    var measureEntry: PerformanceMeasurePolyfill = {
      name: name,
      entryType: "measure",
      startTime: startTime,
      duration: endTime - startTime,
      startMark: startMark,
      endMark: endMark,
    };

    if (config.enableMeasures) {
      measures[name] = measureEntry;
      addEntry(measureEntry);
    }

    return measureEntry;
  }

  // Get entries by type
  function getEntriesByType(type: string): PerformanceEntryPolyfill[] {
    // Try native implementation first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.getEntriesByType
    ) {
      try {
        var nativeEntries = window.performance.getEntriesByType(type);
        if (nativeEntries && nativeEntries.length > 0) {
          return nativeEntries as PerformanceEntryPolyfill[];
        }
      } catch (error) {
        // Fallback to polyfill
      }
    }

    // Polyfill implementation
    var result: PerformanceEntryPolyfill[] = [];

    switch (type) {
      case "navigation":
        var navTiming = getNavigationTiming();
        if (navTiming) {
          result.push(navTiming);
        }
        break;

      case "resource":
        result = getResourceTiming();
        break;

      case "mark":
        result = entries.filter(function (entry) {
          return entry.entryType === "mark";
        });
        break;

      case "measure":
        result = entries.filter(function (entry) {
          return entry.entryType === "measure";
        });
        break;

      default:
        result = entries.filter(function (entry) {
          return entry.entryType === type;
        });
        break;
    }

    return result;
  }

  // Get entries by name
  function getEntriesByName(
    name: string,
    type?: string
  ): PerformanceEntryPolyfill[] {
    // Try native implementation first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.getEntriesByName
    ) {
      try {
        var nativeEntries = window.performance.getEntriesByName(name, type);
        if (nativeEntries && nativeEntries.length > 0) {
          return nativeEntries as PerformanceEntryPolyfill[];
        }
      } catch (error) {
        // Fallback to polyfill
      }
    }

    // Polyfill implementation
    return entries.filter(function (entry) {
      var nameMatches = entry.name === name;
      var typeMatches = !type || entry.entryType === type;
      return nameMatches && typeMatches;
    });
  }

  // Get all entries
  function getEntries(): PerformanceEntryPolyfill[] {
    // Try native implementation first
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.getEntries
    ) {
      try {
        var nativeEntries = window.performance.getEntries();
        if (nativeEntries && nativeEntries.length > 0) {
          return nativeEntries as PerformanceEntryPolyfill[];
        }
      } catch (error) {
        // Fallback to polyfill
      }
    }

    // Include navigation and resource timing
    var allEntries = entries.slice();

    var navTiming = getNavigationTiming();
    if (navTiming) {
      allEntries.unshift(navTiming);
    }

    var resourceEntries = getResourceTiming();
    allEntries = allEntries.concat(resourceEntries);

    return allEntries;
  }

  // Clear entries
  function clearMarks(name?: string): void {
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.clearMarks
    ) {
      try {
        window.performance.clearMarks(name);
      } catch (error) {
        // Fallback to polyfill
      }
    }

    if (name) {
      delete marks[name];
      entries = entries.filter(function (entry) {
        return entry.entryType !== "mark" || entry.name !== name;
      });
    } else {
      marks = {};
      entries = entries.filter(function (entry) {
        return entry.entryType !== "mark";
      });
    }
  }

  function clearMeasures(name?: string): void {
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.clearMeasures
    ) {
      try {
        window.performance.clearMeasures(name);
      } catch (error) {
        // Fallback to polyfill
      }
    }

    if (name) {
      delete measures[name];
      entries = entries.filter(function (entry) {
        return entry.entryType !== "measure" || entry.name !== name;
      });
    } else {
      measures = {};
      entries = entries.filter(function (entry) {
        return entry.entryType !== "measure";
      });
    }
  }

  // Configure polyfill
  function configure(newConfig: Partial<PerformancePolyfillConfig>): void {
    for (var key in newConfig) {
      if (Object.prototype.hasOwnProperty.call(newConfig, key)) {
        (config as any)[key] = (newConfig as any)[key];
      }
    }
  }

  // Check if native performance API is available
  function isNativeSupported(): boolean {
    return !!(
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.now
    );
  }

  // Get timing information summary
  function getTimingSummary(): {
    navigationTiming: PerformanceNavigationTimingPolyfill | null;
    resourceCount: number;
    markCount: number;
    measureCount: number;
    isNativeSupported: boolean;
  } {
    var navTiming = getNavigationTiming();
    var resourceEntries = getResourceTiming();

    return {
      navigationTiming: navTiming,
      resourceCount: resourceEntries.length,
      markCount: Object.keys(marks).length,
      measureCount: Object.keys(measures).length,
      isNativeSupported: isNativeSupported(),
    };
  }

  // Install polyfill on window.performance if needed
  function install(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Create performance object if it doesn't exist
    if (!window.performance) {
      (window as any).performance = {};
    }

    // Polyfill now() if not available
    if (!window.performance.now) {
      window.performance.now = now;
    }

    // Polyfill mark() if not available
    if (!window.performance.mark) {
      (window.performance as any).mark = mark;
    }

    // Polyfill measure() if not available
    if (!window.performance.measure) {
      (window.performance as any).measure = measure;
    }

    // Polyfill getEntriesByType() if not available
    if (!window.performance.getEntriesByType) {
      window.performance.getEntriesByType = getEntriesByType as any;
    }

    // Polyfill getEntriesByName() if not available
    if (!window.performance.getEntriesByName) {
      window.performance.getEntriesByName = getEntriesByName as any;
    }

    // Polyfill getEntries() if not available
    if (!window.performance.getEntries) {
      window.performance.getEntries = getEntries as any;
    }

    // Polyfill clearMarks() if not available
    if (!window.performance.clearMarks) {
      window.performance.clearMarks = clearMarks;
    }

    // Polyfill clearMeasures() if not available
    if (!window.performance.clearMeasures) {
      window.performance.clearMeasures = clearMeasures;
    }
  }

  // Public API
  return {
    now: now,
    mark: mark,
    measure: measure,
    getEntriesByType: getEntriesByType,
    getEntriesByName: getEntriesByName,
    getEntries: getEntries,
    clearMarks: clearMarks,
    clearMeasures: clearMeasures,
    configure: configure,
    isNativeSupported: isNativeSupported,
    getTimingSummary: getTimingSummary,
    install: install,
  };
})();

// Auto-install polyfill if needed
if (typeof window !== "undefined" && !PerformancePolyfill.isNativeSupported()) {
  PerformancePolyfill.install();
}
