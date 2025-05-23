// IE11-compatible Auto-Instrumentation for OpenTelemetry

import { DocumentLoadInstrumentation } from "./instrumentation/document-load-instrumentation";
import { XMLHttpRequestInstrumentation } from "./utils/xmlhttprequest-transport";
import { UserInteractionInstrumentation } from "./instrumentation/user-interaction-instrumentation";
import { EventListenerManager } from "./utils/event-listener-manager";
import { PerformancePolyfill } from "./utils/performance-polyfill";
import { WebResourceTiming } from "./utils/web-resource-timing";

// Auto-instrumentation configuration
export interface AutoInstrumentationConfig {
  enabled?: boolean;
  documentLoad?: boolean;
  userInteraction?: boolean;
  xmlHttpRequest?: boolean;
  fetch?: boolean;
  performance?: boolean;
  resourceTiming?: boolean;
  errorTracking?: boolean;
  consoleLogging?: boolean;
  autoDetect?: boolean;
}

// Instrumentation status interface
export interface InstrumentationStatus {
  documentLoad: boolean;
  userInteraction: boolean;
  xmlHttpRequest: boolean;
  fetch: boolean;
  performance: boolean;
  resourceTiming: boolean;
  errorTracking: boolean;
  consoleLogging: boolean;
}

// Error tracking configuration
export interface ErrorTrackingConfig {
  captureUnhandledRejections?: boolean;
  captureGlobalErrors?: boolean;
  captureConsoleErrors?: boolean;
  ignoreErrors?: (string | RegExp)[];
}

// Console logging configuration
export interface ConsoleLoggingConfig {
  levels?: string[];
  captureArguments?: boolean;
  maxArgumentLength?: number;
  ignorePatterns?: (string | RegExp)[];
}

// Default configuration
var DEFAULT_CONFIG: AutoInstrumentationConfig = {
  enabled: true,
  documentLoad: true,
  userInteraction: true,
  xmlHttpRequest: true,
  fetch: true,
  performance: true,
  resourceTiming: true,
  errorTracking: true,
  consoleLogging: false,
  autoDetect: true,
};

// IE11-compatible Auto-Instrumentation
export var AutoInstrumentation = function (
  config?: AutoInstrumentationConfig
): any {
  var autoInstrumentation = this;
  var _config = objectAssign({}, DEFAULT_CONFIG, config || {});
  var _isInitialized = false;
  var _instrumentations: { [key: string]: any } = {};
  var _status: InstrumentationStatus = {
    documentLoad: false,
    userInteraction: false,
    xmlHttpRequest: false,
    fetch: false,
    performance: false,
    resourceTiming: false,
    errorTracking: false,
    consoleLogging: false,
  };

  // Object.assign polyfill for IE11
  function objectAssign(target: any, ...sources: any[]): any {
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

  // Check if browser supports a feature
  function isFeatureSupported(feature: string): boolean {
    switch (feature) {
      case "xmlhttprequest":
        return typeof XMLHttpRequest !== "undefined";
      case "fetch":
        return (
          typeof window !== "undefined" && typeof window.fetch !== "undefined"
        );
      case "performance":
        return (
          typeof window !== "undefined" &&
          typeof window.performance !== "undefined"
        );
      case "mutationobserver":
        return typeof MutationObserver !== "undefined";
      case "intersectionobserver":
        return typeof IntersectionObserver !== "undefined";
      case "promises":
        return typeof Promise !== "undefined";
      default:
        return false;
    }
  }

  // Initialize document load instrumentation
  function initializeDocumentLoad(): void {
    if (!_config.documentLoad || _status.documentLoad) {
      return;
    }

    try {
      var documentLoadInst = new DocumentLoadInstrumentation();
      documentLoadInst.enable();
      _instrumentations.documentLoad = documentLoadInst;
      _status.documentLoad = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "Failed to initialize document load instrumentation:",
          error
        );
      }
    }
  }

  // Initialize user interaction instrumentation
  function initializeUserInteraction(): void {
    if (!_config.userInteraction || _status.userInteraction) {
      return;
    }

    try {
      var userInteractionInst = new UserInteractionInstrumentation({
        enabled: true,
        eventTypes: ["click", "dblclick", "submit", "keydown", "focus", "blur"],
        shouldCaptureFormData: true,
      });
      userInteractionInst.enable();
      _instrumentations.userInteraction = userInteractionInst;
      _status.userInteraction = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "Failed to initialize user interaction instrumentation:",
          error
        );
      }
    }
  }

  // Initialize XMLHttpRequest instrumentation
  function initializeXMLHttpRequest(): void {
    if (
      !_config.xmlHttpRequest ||
      _status.xmlHttpRequest ||
      !isFeatureSupported("xmlhttprequest")
    ) {
      return;
    }

    try {
      var xhrInst = new XMLHttpRequestInstrumentation({
        enabled: true,
        propagateTraceHeaderCorsUrls: [],
        captureHeaders: false,
      });
      xhrInst.enable();
      _instrumentations.xmlHttpRequest = xhrInst;
      _status.xmlHttpRequest = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "Failed to initialize XMLHttpRequest instrumentation:",
          error
        );
      }
    }
  }

  // Initialize fetch instrumentation
  function initializeFetch(): void {
    if (!_config.fetch || _status.fetch || !isFeatureSupported("fetch")) {
      return;
    }

    try {
      // Fetch instrumentation is handled by WebResourceTiming
      _status.fetch = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to initialize fetch instrumentation:", error);
      }
    }
  }

  // Initialize performance API
  function initializePerformance(): void {
    if (!_config.performance || _status.performance) {
      return;
    }

    try {
      // Ensure performance polyfill is installed
      if (!PerformancePolyfill.isNativeSupported()) {
        PerformancePolyfill.install();
      }
      _status.performance = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "Failed to initialize performance instrumentation:",
          error
        );
      }
    }
  }

  // Initialize resource timing
  function initializeResourceTiming(): void {
    if (!_config.resourceTiming || _status.resourceTiming) {
      return;
    }

    try {
      WebResourceTiming.startObserving();
      _status.resourceTiming = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to initialize resource timing:", error);
      }
    }
  }

  // Initialize error tracking
  function initializeErrorTracking(): void {
    if (!_config.errorTracking || _status.errorTracking) {
      return;
    }

    try {
      var errorConfig: ErrorTrackingConfig = {
        captureUnhandledRejections: true,
        captureGlobalErrors: true,
        captureConsoleErrors: false,
        ignoreErrors: [],
      };

      // Global error handler
      if (errorConfig.captureGlobalErrors) {
        EventListenerManager.addEventListener(
          window,
          "error",
          function (event: ErrorEvent) {
            try {
              var tracer = getActiveTracer();
              if (tracer) {
                var span = tracer.startSpan("error", {
                  attributes: {
                    "error.type": "javascript",
                    "error.message": event.message,
                    "error.filename": event.filename,
                    "error.lineno": event.lineno,
                    "error.colno": event.colno,
                  },
                });

                if (event.error && event.error.stack) {
                  span.setAttribute("error.stack", event.error.stack);
                }

                span.setStatus({ code: 2 }); // ERROR
                span.end();
              }
            } catch (error) {
              // Ignore errors in error handler
            }
          }
        );
      }

      // Unhandled promise rejection handler
      if (
        errorConfig.captureUnhandledRejections &&
        isFeatureSupported("promises")
      ) {
        EventListenerManager.addEventListener(
          window,
          "unhandledrejection",
          function (event: any) {
            try {
              var tracer = getActiveTracer();
              if (tracer) {
                var span = tracer.startSpan("unhandled_promise_rejection", {
                  attributes: {
                    "error.type": "unhandled_promise_rejection",
                    "error.reason": String(event.reason),
                  },
                });

                if (event.reason && event.reason.stack) {
                  span.setAttribute("error.stack", event.reason.stack);
                }

                span.setStatus({ code: 2 }); // ERROR
                span.end();
              }
            } catch (error) {
              // Ignore errors in error handler
            }
          }
        );
      }

      _status.errorTracking = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to initialize error tracking:", error);
      }
    }
  }

  // Initialize console logging instrumentation
  function initializeConsoleLogging(): void {
    if (!_config.consoleLogging || _status.consoleLogging) {
      return;
    }

    try {
      var consoleConfig: ConsoleLoggingConfig = {
        levels: ["error", "warn", "log", "info"],
        captureArguments: true,
        maxArgumentLength: 1000,
        ignorePatterns: [],
      };

      // Patch console methods
      var originalConsole = window.console;
      if (originalConsole) {
        var levels = consoleConfig.levels || [];
        for (var i = 0; i < levels.length; i++) {
          var level = levels[i];
          if (originalConsole[level]) {
            (function (originalMethod: Function, logLevel: string) {
              (originalConsole as any)[logLevel] = function () {
                // Call original method first
                originalMethod.apply(originalConsole, arguments);

                // Create span for console log
                try {
                  var tracer = getActiveTracer();
                  if (tracer) {
                    var args = Array.prototype.slice.call(arguments);
                    var message = args
                      .map(function (arg) {
                        return String(arg);
                      })
                      .join(" ");

                    if (
                      consoleConfig.maxArgumentLength &&
                      message.length > consoleConfig.maxArgumentLength
                    ) {
                      message =
                        message.substring(0, consoleConfig.maxArgumentLength) +
                        "...";
                    }

                    var span = tracer.startSpan("console." + logLevel, {
                      attributes: {
                        "log.level": logLevel,
                        "log.message": message,
                        "log.arguments_count": args.length,
                      },
                    });

                    span.end();
                  }
                } catch (error) {
                  // Ignore errors in console instrumentation
                }
              };
            })((originalConsole as any)[level], level);
          }
        }
      }

      _status.consoleLogging = true;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to initialize console logging:", error);
      }
    }
  }

  // Get active tracer
  function getActiveTracer(): any {
    if (typeof window !== "undefined" && (window as any).opentelemetry) {
      return (window as any).opentelemetry.trace.getActiveTracer();
    }
    return null;
  }

  // Auto-detect browser capabilities and adjust configuration
  function autoDetectCapabilities(): void {
    if (!_config.autoDetect) {
      return;
    }

    // Disable fetch instrumentation if not supported
    if (!isFeatureSupported("fetch")) {
      _config.fetch = false;
    }

    // Adjust performance configuration based on support
    if (!isFeatureSupported("performance")) {
      // Performance polyfill will handle this
    }

    // Disable promise-based features for older browsers
    if (!isFeatureSupported("promises")) {
      // Keep basic functionality, but some features may be limited
    }
  }

  // Initialize all instrumentations
  autoInstrumentation.initialize = function (): void {
    if (_isInitialized) {
      return;
    }

    if (!_config.enabled) {
      return;
    }

    // Auto-detect capabilities
    autoDetectCapabilities();

    // Initialize instrumentations in order
    initializePerformance();
    initializeResourceTiming();
    initializeDocumentLoad();
    initializeXMLHttpRequest();
    initializeFetch();
    initializeUserInteraction();
    initializeErrorTracking();
    initializeConsoleLogging();

    _isInitialized = true;
  };

  // Disable all instrumentations
  autoInstrumentation.disable = function (): void {
    for (var key in _instrumentations) {
      if (Object.prototype.hasOwnProperty.call(_instrumentations, key)) {
        var instrumentation = _instrumentations[key];
        if (instrumentation && instrumentation.disable) {
          try {
            instrumentation.disable();
          } catch (error) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn(
                "Failed to disable " + key + " instrumentation:",
                error
              );
            }
          }
        }
      }
    }

    // Reset status
    for (var statusKey in _status) {
      if (Object.prototype.hasOwnProperty.call(_status, statusKey)) {
        (_status as any)[statusKey] = false;
      }
    }

    _isInitialized = false;
  };

  // Get instrumentation status
  autoInstrumentation.getStatus = function (): InstrumentationStatus {
    return objectAssign({}, _status);
  };

  // Get specific instrumentation
  autoInstrumentation.getInstrumentation = function (name: string): any {
    return _instrumentations[name] || null;
  };

  // Check if initialized
  autoInstrumentation.isInitialized = function (): boolean {
    return _isInitialized;
  };

  // Update configuration
  autoInstrumentation.configure = function (
    newConfig: Partial<AutoInstrumentationConfig>
  ): void {
    _config = objectAssign({}, _config, newConfig);
  };

  // Auto-initialize if DOM is ready
  if (typeof document !== "undefined") {
    EventListenerManager.whenReady(function () {
      autoInstrumentation.initialize();
    });
  }

  return autoInstrumentation;
};

AutoInstrumentation.prototype = {
  constructor: AutoInstrumentation,
};

// Global instance for easy access
var globalAutoInstrumentation: any = null;

// Get or create global auto-instrumentation instance
export function getGlobalAutoInstrumentation(
  config?: AutoInstrumentationConfig
): any {
  if (!globalAutoInstrumentation) {
    globalAutoInstrumentation = new AutoInstrumentation(config);
  }
  return globalAutoInstrumentation;
}

// Auto-initialize with default configuration
export function autoInstrument(config?: AutoInstrumentationConfig): any {
  return getGlobalAutoInstrumentation(config);
}

// Export for manual initialization
export { AutoInstrumentation };
