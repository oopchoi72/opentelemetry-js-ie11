// IE11-compatible Web Resource Timing for OpenTelemetry

import { PerformancePolyfill } from "./performance-polyfill";
import { EventListenerManager } from "./event-listener-manager";
import { DOMUtils } from "./dom-utils";

// Resource timing entry interface
export interface ResourceTimingEntry {
  name: string;
  entryType: "resource";
  startTime: number;
  duration: number;
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  nextHopProtocol?: string;
  workerStart?: number;
}

// Resource observer configuration
export interface ResourceObserverConfig {
  enabled?: boolean;
  maxEntries?: number;
  bufferSize?: number;
  observeTypes?: string[];
  captureHeaders?: boolean;
  captureResponseTime?: boolean;
  captureNetworkInfo?: boolean;
}

// Network information interface
export interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// Resource load event data
export interface ResourceLoadEvent {
  url: string;
  type: string;
  startTime: number;
  endTime?: number;
  size?: number;
  status?: number;
  error?: boolean;
}

// IE11-compatible Web Resource Timing Implementation
export var WebResourceTiming = (function () {
  var config: ResourceObserverConfig = {
    enabled: true,
    maxEntries: 500,
    bufferSize: 150,
    observeTypes: ["fetch", "xmlhttprequest", "script", "css", "img", "iframe"],
    captureHeaders: false,
    captureResponseTime: true,
    captureNetworkInfo: true,
  };

  var resourceEntries: ResourceTimingEntry[] = [];
  var resourceLoadEvents: ResourceLoadEvent[] = [];
  var observers: Array<(entries: ResourceTimingEntry[]) => void> = [];
  var isObserving = false;

  // Get network information if available
  function getNetworkInfo(): NetworkInfo {
    var networkInfo: NetworkInfo = {};

    if (typeof navigator !== "undefined") {
      var connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        networkInfo.effectiveType = connection.effectiveType;
        networkInfo.downlink = connection.downlink;
        networkInfo.rtt = connection.rtt;
        networkInfo.saveData = connection.saveData;
      }
    }

    return networkInfo;
  }

  // Create resource timing entry from performance timing
  function createResourceTimingEntry(
    name: string,
    initiatorType: string,
    performanceEntry?: any
  ): ResourceTimingEntry {
    var startTime = performanceEntry?.startTime || PerformancePolyfill.now();
    var duration = performanceEntry?.duration || 0;

    var entry: ResourceTimingEntry = {
      name: name,
      entryType: "resource",
      startTime: startTime,
      duration: duration,
      initiatorType: initiatorType,
      transferSize: performanceEntry?.transferSize || 0,
      encodedBodySize: performanceEntry?.encodedBodySize || 0,
      decodedBodySize: performanceEntry?.decodedBodySize || 0,
      fetchStart: performanceEntry?.fetchStart || startTime,
      domainLookupStart: performanceEntry?.domainLookupStart || startTime,
      domainLookupEnd: performanceEntry?.domainLookupEnd || startTime,
      connectStart: performanceEntry?.connectStart || startTime,
      connectEnd: performanceEntry?.connectEnd || startTime,
      secureConnectionStart: performanceEntry?.secureConnectionStart || 0,
      requestStart: performanceEntry?.requestStart || startTime,
      responseStart: performanceEntry?.responseStart || startTime,
      responseEnd: performanceEntry?.responseEnd || startTime + duration,
    };

    // Add optional properties if available
    if (performanceEntry?.nextHopProtocol) {
      entry.nextHopProtocol = performanceEntry.nextHopProtocol;
    }

    if (performanceEntry?.workerStart) {
      entry.workerStart = performanceEntry.workerStart;
    }

    return entry;
  }

  // Add resource timing entry
  function addResourceEntry(entry: ResourceTimingEntry): void {
    resourceEntries.push(entry);

    // Limit entries to prevent memory leaks
    if (resourceEntries.length > config.maxEntries!) {
      resourceEntries.shift();
    }

    // Notify observers
    notifyObservers([entry]);
  }

  // Notify all observers
  function notifyObservers(entries: ResourceTimingEntry[]): void {
    for (var i = 0; i < observers.length; i++) {
      try {
        observers[i](entries);
      } catch (error) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Resource timing observer error:", error);
        }
      }
    }
  }

  // Track XHR requests
  function instrumentXHR(): void {
    if (typeof XMLHttpRequest === "undefined") {
      return;
    }

    var OriginalXHR = XMLHttpRequest;
    var xhrRequests: Map<XMLHttpRequest, ResourceLoadEvent> = new Map();

    // Polyfill Map for IE11
    if (typeof Map === "undefined") {
      var mapPolyfill = function () {
        var keys: XMLHttpRequest[] = [];
        var values: ResourceLoadEvent[] = [];

        return {
          set: function (key: XMLHttpRequest, value: ResourceLoadEvent) {
            var index = keys.indexOf(key);
            if (index === -1) {
              keys.push(key);
              values.push(value);
            } else {
              values[index] = value;
            }
          },
          get: function (key: XMLHttpRequest): ResourceLoadEvent | undefined {
            var index = keys.indexOf(key);
            return index !== -1 ? values[index] : undefined;
          },
          delete: function (key: XMLHttpRequest): boolean {
            var index = keys.indexOf(key);
            if (index !== -1) {
              keys.splice(index, 1);
              values.splice(index, 1);
              return true;
            }
            return false;
          },
          has: function (key: XMLHttpRequest): boolean {
            return keys.indexOf(key) !== -1;
          },
        };
      };

      xhrRequests = mapPolyfill() as any;
    }

    function PatchedXHR(this: XMLHttpRequest) {
      var xhr = new OriginalXHR();
      var originalOpen = xhr.open;
      var originalSend = xhr.send;

      xhr.open = function (method: string, url: string, ...args: any[]) {
        var resourceEvent: ResourceLoadEvent = {
          url: url,
          type: "xmlhttprequest",
          startTime: PerformancePolyfill.now(),
        };

        xhrRequests.set(xhr, resourceEvent);
        return originalOpen.apply(xhr, [method, url].concat(args));
      };

      xhr.send = function (data?: any) {
        var resourceEvent = xhrRequests.get(xhr);
        if (resourceEvent) {
          resourceEvent.startTime = PerformancePolyfill.now();
        }

        var originalOnLoad = xhr.onload;
        var originalOnError = xhr.onerror;

        xhr.onload = function (event) {
          var resourceEvent = xhrRequests.get(xhr);
          if (resourceEvent) {
            resourceEvent.endTime = PerformancePolyfill.now();
            resourceEvent.status = xhr.status;
            resourceEvent.error = false;

            var entry = createResourceTimingEntry(
              resourceEvent.url,
              "xmlhttprequest"
            );
            entry.duration = resourceEvent.endTime - resourceEvent.startTime;
            entry.responseEnd = resourceEvent.endTime;

            addResourceEntry(entry);
            xhrRequests.delete(xhr);
          }

          if (originalOnLoad) {
            originalOnLoad.call(xhr, event);
          }
        };

        xhr.onerror = function (event) {
          var resourceEvent = xhrRequests.get(xhr);
          if (resourceEvent) {
            resourceEvent.endTime = PerformancePolyfill.now();
            resourceEvent.error = true;

            var entry = createResourceTimingEntry(
              resourceEvent.url,
              "xmlhttprequest"
            );
            entry.duration = resourceEvent.endTime - resourceEvent.startTime;

            addResourceEntry(entry);
            xhrRequests.delete(xhr);
          }

          if (originalOnError) {
            originalOnError.call(xhr, event);
          }
        };

        return originalSend.call(xhr, data);
      };

      return xhr;
    }

    // Copy static properties and methods
    for (var prop in OriginalXHR) {
      if (Object.prototype.hasOwnProperty.call(OriginalXHR, prop)) {
        (PatchedXHR as any)[prop] = (OriginalXHR as any)[prop];
      }
    }

    PatchedXHR.prototype = OriginalXHR.prototype;
    (window as any).XMLHttpRequest = PatchedXHR;
  }

  // Track Fetch API requests
  function instrumentFetch(): void {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      return;
    }

    var originalFetch = window.fetch;

    window.fetch = function (input: RequestInfo, init?: RequestInit) {
      var url = typeof input === "string" ? input : input.url;
      var startTime = PerformancePolyfill.now();

      return originalFetch.call(window, input, init).then(
        function (response) {
          var endTime = PerformancePolyfill.now();

          var entry = createResourceTimingEntry(url, "fetch");
          entry.duration = endTime - startTime;
          entry.responseEnd = endTime;

          addResourceEntry(entry);
          return response;
        },
        function (error) {
          var endTime = PerformancePolyfill.now();

          var entry = createResourceTimingEntry(url, "fetch");
          entry.duration = endTime - startTime;

          addResourceEntry(entry);
          throw error;
        }
      );
    };
  }

  // Track DOM resource loading
  function observeDOMResources(): void {
    if (typeof document === "undefined") {
      return;
    }

    // Observe script loading
    function observeScripts() {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.src && !(script as any).__resourceObserved) {
          (script as any).__resourceObserved = true;

          EventListenerManager.addEventListener(script, "load", function () {
            var entry = createResourceTimingEntry(script.src, "script");
            addResourceEntry(entry);
          });

          EventListenerManager.addEventListener(script, "error", function () {
            var entry = createResourceTimingEntry(script.src, "script");
            addResourceEntry(entry);
          });
        }
      }
    }

    // Observe CSS loading
    function observeCSS() {
      var links = document.getElementsByTagName("link");
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (
          link.rel === "stylesheet" &&
          link.href &&
          !(link as any).__resourceObserved
        ) {
          (link as any).__resourceObserved = true;

          EventListenerManager.addEventListener(link, "load", function () {
            var entry = createResourceTimingEntry(link.href, "css");
            addResourceEntry(entry);
          });

          EventListenerManager.addEventListener(link, "error", function () {
            var entry = createResourceTimingEntry(link.href, "css");
            addResourceEntry(entry);
          });
        }
      }
    }

    // Observe image loading
    function observeImages() {
      var images = document.getElementsByTagName("img");
      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        if (img.src && !(img as any).__resourceObserved) {
          (img as any).__resourceObserved = true;

          EventListenerManager.addEventListener(img, "load", function () {
            var entry = createResourceTimingEntry(img.src, "img");
            addResourceEntry(entry);
          });

          EventListenerManager.addEventListener(img, "error", function () {
            var entry = createResourceTimingEntry(img.src, "img");
            addResourceEntry(entry);
          });
        }
      }
    }

    // Initial observation
    observeScripts();
    observeCSS();
    observeImages();

    // Observe new resources added to DOM
    var observeNewResources = function () {
      observeScripts();
      observeCSS();
      observeImages();
    };

    // Use MutationObserver if available, otherwise polling
    if (typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(function (mutations) {
        var shouldObserve = false;
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            shouldObserve = true;
            break;
          }
        }
        if (shouldObserve) {
          observeNewResources();
        }
      });

      observer.observe(document, {
        childList: true,
        subtree: true,
      });
    } else {
      // IE11 fallback: periodic observation
      setInterval(observeNewResources, 1000);
    }
  }

  // Get all resource timing entries
  function getEntries(): ResourceTimingEntry[] {
    // Try native Resource Timing API first
    var nativeEntries = PerformancePolyfill.getEntriesByType("resource");
    if (nativeEntries && nativeEntries.length > 0) {
      return nativeEntries as ResourceTimingEntry[];
    }

    return resourceEntries.slice();
  }

  // Get entries by name
  function getEntriesByName(name: string): ResourceTimingEntry[] {
    return resourceEntries.filter(function (entry) {
      return entry.name === name;
    });
  }

  // Clear resource timing buffer
  function clearResourceTimings(): void {
    resourceEntries = [];
    resourceLoadEvents = [];

    // Clear native buffer if available
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.clearResourceTimings
    ) {
      window.performance.clearResourceTimings();
    }
  }

  // Add observer
  function observe(callback: (entries: ResourceTimingEntry[]) => void): void {
    observers.push(callback);

    if (!isObserving) {
      startObserving();
    }
  }

  // Remove observer
  function unobserve(callback: (entries: ResourceTimingEntry[]) => void): void {
    var index = observers.indexOf(callback);
    if (index !== -1) {
      observers.splice(index, 1);
    }

    if (observers.length === 0) {
      stopObserving();
    }
  }

  // Start observing resources
  function startObserving(): void {
    if (isObserving) {
      return;
    }

    if (config.observeTypes?.indexOf("xmlhttprequest") !== -1) {
      instrumentXHR();
    }

    if (config.observeTypes?.indexOf("fetch") !== -1) {
      instrumentFetch();
    }

    if (
      config.observeTypes?.some(function (type) {
        return ["script", "css", "img", "iframe"].indexOf(type) !== -1;
      })
    ) {
      observeDOMResources();
    }

    isObserving = true;
  }

  // Stop observing resources
  function stopObserving(): void {
    isObserving = false;
    // Note: Cannot easily undo instrumentation in IE11
  }

  // Configure resource timing
  function configure(newConfig: Partial<ResourceObserverConfig>): void {
    for (var key in newConfig) {
      if (Object.prototype.hasOwnProperty.call(newConfig, key)) {
        (config as any)[key] = (newConfig as any)[key];
      }
    }
  }

  // Get performance statistics
  function getStatistics(): {
    entryCount: number;
    averageLoadTime: number;
    totalTransferSize: number;
    networkInfo: NetworkInfo;
  } {
    var entries = getEntries();
    var totalDuration = 0;
    var totalTransferSize = 0;

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      totalDuration += entry.duration;
      totalTransferSize += entry.transferSize;
    }

    return {
      entryCount: entries.length,
      averageLoadTime: entries.length > 0 ? totalDuration / entries.length : 0,
      totalTransferSize: totalTransferSize,
      networkInfo: config.captureNetworkInfo ? getNetworkInfo() : {},
    };
  }

  // Public API
  return {
    getEntries: getEntries,
    getEntriesByName: getEntriesByName,
    clearResourceTimings: clearResourceTimings,
    observe: observe,
    unobserve: unobserve,
    configure: configure,
    getStatistics: getStatistics,
    getNetworkInfo: getNetworkInfo,
    startObserving: startObserving,
    stopObserving: stopObserving,
  };
})();

// Auto-start if enabled
if (typeof window !== "undefined") {
  EventListenerManager.whenReady(function () {
    WebResourceTiming.startObserving();
  });
}

export { WebResourceTiming };
