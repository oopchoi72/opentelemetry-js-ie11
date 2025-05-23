// UMD Wrapper for OpenTelemetry IE11 Compatibility
// Provides support for AMD, CommonJS, and global browser environments

(function (root, factory) {
  "use strict";

  // Feature detection for IE11
  var isIE11 = !!(window.MSInputMethodContext && document.documentMode);
  var hasDefine = typeof define === "function" && define.amd;
  var hasExports =
    typeof exports === "object" && typeof exports.nodeName !== "string";
  var hasModule = typeof module !== "undefined" && module.exports;

  // Global namespace setup
  var globalName = "OpenTelemetryIE11";
  var apiGlobalName = "OpenTelemetryAPI";

  // Ensure global object exists
  if (typeof self !== "undefined") {
    root = self;
  } else if (typeof window !== "undefined") {
    root = window;
  } else if (typeof global !== "undefined") {
    root = global;
  } else {
    root = this;
  }

  // Initialize global namespace
  if (!root[globalName]) {
    root[globalName] = {};
  }

  // Polyfill detection and conditional loading
  function needsPolyfills() {
    return (
      isIE11 ||
      typeof Promise === "undefined" ||
      typeof Map === "undefined" ||
      typeof Set === "undefined" ||
      typeof Object.assign === "undefined" ||
      !Array.prototype.find ||
      !Array.prototype.includes ||
      !String.prototype.startsWith
    );
  }

  // Load polyfills if needed
  function loadPolyfills(callback) {
    if (!needsPolyfills()) {
      callback();
      return;
    }

    // Check if polyfills are already loaded
    if (root[globalName]._polyfillsLoaded) {
      callback();
      return;
    }

    // Load core-js polyfills for IE11
    var polyfillScript = document.createElement("script");
    polyfillScript.src =
      "https://polyfill.io/v3/polyfill.min.js?features=es6,es2015,es2016,es2017&flags=gated";
    polyfillScript.onload = function () {
      root[globalName]._polyfillsLoaded = true;
      callback();
    };
    polyfillScript.onerror = function () {
      // Fallback to basic polyfills
      console.warn("Failed to load external polyfills, using basic fallbacks");
      loadBasicPolyfills();
      callback();
    };

    document.head.appendChild(polyfillScript);
  }

  // Basic polyfills fallback
  function loadBasicPolyfills() {
    // Object.assign polyfill
    if (typeof Object.assign !== "function") {
      Object.assign = function (target) {
        if (target == null) {
          throw new TypeError("Cannot convert undefined or null to object");
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];
          if (nextSource != null) {
            for (var nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      };
    }

    // Array.prototype.find polyfill
    if (!Array.prototype.find) {
      Array.prototype.find = function (predicate) {
        if (this == null) {
          throw new TypeError(
            "Array.prototype.find called on null or undefined"
          );
        }
        if (typeof predicate !== "function") {
          throw new TypeError("predicate must be a function");
        }
        var list = Object(this);
        var length = parseInt(list.length) || 0;
        var thisArg = arguments[1];
        var value;
        for (var i = 0; i < length; i++) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return value;
          }
        }
        return undefined;
      };
    }

    // Promise polyfill (basic)
    if (typeof Promise === "undefined") {
      root.Promise = function (executor) {
        var self = this;
        self.state = "pending";
        self.value = undefined;
        self.handlers = [];

        function resolve(result) {
          if (self.state === "pending") {
            self.state = "fulfilled";
            self.value = result;
            self.handlers.forEach(handle);
            self.handlers = null;
          }
        }

        function reject(error) {
          if (self.state === "pending") {
            self.state = "rejected";
            self.value = error;
            self.handlers.forEach(handle);
            self.handlers = null;
          }
        }

        function handle(handler) {
          if (self.state === "pending") {
            self.handlers.push(handler);
          } else {
            if (
              self.state === "fulfilled" &&
              typeof handler.onFulfilled === "function"
            ) {
              handler.onFulfilled(self.value);
            }
            if (
              self.state === "rejected" &&
              typeof handler.onRejected === "function"
            ) {
              handler.onRejected(self.value);
            }
          }
        }

        this.then = function (onFulfilled, onRejected) {
          return new Promise(function (resolve, reject) {
            handle({
              onFulfilled: function (result) {
                try {
                  resolve(onFulfilled ? onFulfilled(result) : result);
                } catch (ex) {
                  reject(ex);
                }
              },
              onRejected: function (error) {
                try {
                  resolve(onRejected ? onRejected(error) : error);
                } catch (ex) {
                  reject(ex);
                }
              },
            });
          });
        };

        executor(resolve, reject);
      };
    }

    root[globalName]._polyfillsLoaded = true;
  }

  // Module factory wrapper
  function moduleFactory(exports, api) {
    // Ensure API is available
    if (!api && root[apiGlobalName]) {
      api = root[apiGlobalName];
    }

    // Create module exports object
    var moduleExports = exports || {};

    // Feature flags for IE11
    var features = {
      hasPerformanceAPI:
        typeof performance !== "undefined" &&
        typeof performance.now === "function",
      hasFetch: typeof fetch !== "undefined",
      hasXHR: typeof XMLHttpRequest !== "undefined",
      hasLocalStorage: (function () {
        try {
          return typeof localStorage !== "undefined" && localStorage !== null;
        } catch (e) {
          return false;
        }
      })(),
      hasSessionStorage: (function () {
        try {
          return (
            typeof sessionStorage !== "undefined" && sessionStorage !== null
          );
        } catch (e) {
          return false;
        }
      })(),
      hasWebWorkers: typeof Worker !== "undefined",
      hasServiceWorkers:
        typeof navigator !== "undefined" && "serviceWorker" in navigator,
      hasIntersectionObserver: typeof IntersectionObserver !== "undefined",
      hasMutationObserver: typeof MutationObserver !== "undefined",
    };

    // Version information
    var version = "1.0.0";
    var buildDate = new Date().toISOString();

    // Core library initialization
    function initializeLibrary() {
      // Initialize core components
      var core = {
        version: version,
        buildDate: buildDate,
        features: features,
        isIE11: isIE11,
      };

      // Add core functionality
      core.createTracer = function (name, version, options) {
        // Implementation will be injected by webpack
        return factory.createTracer
          ? factory.createTracer(name, version, options)
          : null;
      };

      core.createMeterProvider = function (options) {
        return factory.createMeterProvider
          ? factory.createMeterProvider(options)
          : null;
      };

      core.createTracerProvider = function (options) {
        return factory.createTracerProvider
          ? factory.createTracerProvider(options)
          : null;
      };

      // Utility functions
      core.utils = {
        isIE11: function () {
          return isIE11;
        },

        hasFeature: function (feature) {
          return features[feature] || false;
        },

        loadPolyfills: loadPolyfills,

        getGlobalNamespace: function () {
          return root[globalName];
        },

        setGlobalNamespace: function (namespace) {
          root[globalName] = namespace;
        },
      };

      return core;
    }

    // Initialize and export
    var library = initializeLibrary();

    // Export to module system
    if (typeof moduleExports === "object") {
      for (var key in library) {
        if (library.hasOwnProperty(key)) {
          moduleExports[key] = library[key];
        }
      }
    }

    // Export to global namespace
    root[globalName] = Object.assign(root[globalName] || {}, library);

    return library;
  }

  // Module loading logic
  if (hasDefine) {
    // AMD environment
    define(["exports"], function (exports) {
      return moduleFactory(exports);
    });
  } else if (hasExports) {
    // CommonJS environment
    moduleFactory(exports);
  } else {
    // Browser global environment
    if (needsPolyfills()) {
      loadPolyfills(function () {
        moduleFactory();
      });
    } else {
      moduleFactory();
    }
  }
})(typeof self !== "undefined" ? self : this, function (exports) {
  // This function will be replaced by the actual library code during build
  return {
    createTracer: function (name, version, options) {
      console.log(
        "OpenTelemetry IE11: createTracer called with",
        name,
        version,
        options
      );
      return null;
    },
    createMeterProvider: function (options) {
      console.log(
        "OpenTelemetry IE11: createMeterProvider called with",
        options
      );
      return null;
    },
    createTracerProvider: function (options) {
      console.log(
        "OpenTelemetry IE11: createTracerProvider called with",
        options
      );
      return null;
    },
  };
});
