// IE11 Test Utilities for OpenTelemetry Testing
// Provides IE11-specific testing helpers and compatibility utilities

(function (global) {
  "use strict";

  // IE11 Test Utilities namespace
  var IE11TestUtils = {
    // Browser detection
    isIE11: function () {
      return !!(window.MSInputMethodContext && document.documentMode);
    },

    // Feature detection utilities
    hasFeature: function (feature) {
      switch (feature) {
        case "fetch":
          return typeof fetch !== "undefined";
        case "promise":
          return typeof Promise !== "undefined";
        case "map":
          return typeof Map !== "undefined";
        case "set":
          return typeof Set !== "undefined";
        case "performance":
          return (
            typeof performance !== "undefined" &&
            typeof performance.now !== "undefined"
          );
        case "mutationobserver":
          return typeof MutationObserver !== "undefined";
        case "intersectionobserver":
          return typeof IntersectionObserver !== "undefined";
        case "customelements":
          return typeof customElements !== "undefined";
        case "shadowdom":
          return typeof Element.prototype.attachShadow !== "undefined";
        default:
          return false;
      }
    },

    // Mock XMLHttpRequest for testing
    createMockXHR: function () {
      var MockXHR = function () {
        this.readyState = 0;
        this.status = 0;
        this.statusText = "";
        this.responseText = "";
        this.responseXML = null;
        this.onreadystatechange = null;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
        this.ontimeout = null;
        this.timeout = 0;
        this.withCredentials = false;
        this._method = "";
        this._url = "";
        this._async = true;
        this._headers = {};
        this._requestHeaders = {};
      };

      MockXHR.prototype.open = function (method, url, async, user, password) {
        this._method = method;
        this._url = url;
        this._async = async !== false;
        this.readyState = 1;
        this._triggerReadyStateChange();
      };

      MockXHR.prototype.setRequestHeader = function (name, value) {
        this._requestHeaders[name] = value;
      };

      MockXHR.prototype.getResponseHeader = function (name) {
        return this._headers[name] || null;
      };

      MockXHR.prototype.getAllResponseHeaders = function () {
        var headers = [];
        for (var name in this._headers) {
          if (this._headers.hasOwnProperty(name)) {
            headers.push(name + ": " + this._headers[name]);
          }
        }
        return headers.join("\r\n");
      };

      MockXHR.prototype.send = function (data) {
        var self = this;
        setTimeout(function () {
          self.readyState = 2;
          self._triggerReadyStateChange();

          setTimeout(function () {
            self.readyState = 3;
            self._triggerReadyStateChange();

            setTimeout(function () {
              self.readyState = 4;
              self.status = 200;
              self.statusText = "OK";
              self.responseText = '{"success": true}';
              self._headers["Content-Type"] = "application/json";
              self._triggerReadyStateChange();

              if (self.onload) {
                self.onload();
              }
            }, 10);
          }, 10);
        }, 10);
      };

      MockXHR.prototype.abort = function () {
        this.readyState = 0;
        this.status = 0;
        this.statusText = "";
        if (this.onabort) {
          this.onabort();
        }
      };

      MockXHR.prototype._triggerReadyStateChange = function () {
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
      };

      return MockXHR;
    },

    // Mock fetch for testing
    createMockFetch: function () {
      return function (input, init) {
        var url = typeof input === "string" ? input : input.url;
        var method = (init && init.method) || "GET";

        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            var response = {
              ok: true,
              status: 200,
              statusText: "OK",
              url: url,
              headers: {
                get: function (name) {
                  return name === "content-type" ? "application/json" : null;
                },
              },
              json: function () {
                return Promise.resolve({ success: true, method: method });
              },
              text: function () {
                return Promise.resolve(
                  '{"success": true, "method": "' + method + '"}'
                );
              },
              clone: function () {
                return this;
              },
            };
            resolve(response);
          }, 50);
        });
      };
    },

    // Performance timing mock
    createMockPerformance: function () {
      var startTime = Date.now();

      return {
        now: function () {
          return Date.now() - startTime;
        },
        mark: function (name) {
          // Mock implementation
        },
        measure: function (name, startMark, endMark) {
          // Mock implementation
        },
        getEntriesByType: function (type) {
          if (type === "navigation") {
            return [
              {
                name: "navigation",
                entryType: "navigation",
                startTime: 0,
                duration: 1000,
                navigationStart: startTime,
                loadEventEnd: startTime + 1000,
              },
            ];
          }
          return [];
        },
        getEntriesByName: function (name) {
          return [];
        },
        clearMarks: function () {
          // Mock implementation
        },
        clearMeasures: function () {
          // Mock implementation
        },
      };
    },

    // Create test span for validation
    createTestSpan: function (tracer, name, options) {
      options = options || {};
      var span = tracer.startSpan(name, {
        kind: options.kind || 1, // INTERNAL
        attributes: options.attributes || {},
        startTime: options.startTime,
      });

      if (options.events) {
        for (var i = 0; i < options.events.length; i++) {
          var event = options.events[i];
          span.addEvent(event.name, event.attributes, event.time);
        }
      }

      if (options.status) {
        span.setStatus(options.status);
      }

      return span;
    },

    // Validate span attributes
    validateSpanAttributes: function (span, expectedAttributes) {
      var actualAttributes = span.attributes || {};
      var errors = [];

      for (var key in expectedAttributes) {
        if (expectedAttributes.hasOwnProperty(key)) {
          if (!(key in actualAttributes)) {
            errors.push("Missing attribute: " + key);
          } else if (actualAttributes[key] !== expectedAttributes[key]) {
            errors.push(
              "Attribute mismatch for " +
                key +
                ": expected " +
                expectedAttributes[key] +
                ", got " +
                actualAttributes[key]
            );
          }
        }
      }

      return errors;
    },

    // Wait for async operations
    waitFor: function (condition, timeout, callback) {
      timeout = timeout || 5000;
      var startTime = Date.now();
      var interval = 50;

      function check() {
        if (condition()) {
          callback(null, true);
        } else if (Date.now() - startTime > timeout) {
          callback(new Error("Timeout waiting for condition"), false);
        } else {
          setTimeout(check, interval);
        }
      }

      check();
    },

    // Create DOM element for testing
    createElement: function (tagName, attributes, textContent) {
      var element = document.createElement(tagName);

      if (attributes) {
        for (var attr in attributes) {
          if (attributes.hasOwnProperty(attr)) {
            element.setAttribute(attr, attributes[attr]);
          }
        }
      }

      if (textContent) {
        element.textContent = textContent;
      }

      return element;
    },

    // Simulate user interaction
    simulateEvent: function (element, eventType, options) {
      options = options || {};
      var event;

      if (document.createEvent) {
        event = document.createEvent("Event");
        event.initEvent(
          eventType,
          options.bubbles !== false,
          options.cancelable !== false
        );
      } else {
        // IE8 fallback
        event = document.createEventObject();
        event.type = eventType;
      }

      // Add custom properties
      for (var prop in options) {
        if (
          options.hasOwnProperty(prop) &&
          prop !== "bubbles" &&
          prop !== "cancelable"
        ) {
          event[prop] = options[prop];
        }
      }

      if (element.dispatchEvent) {
        element.dispatchEvent(event);
      } else {
        // IE8 fallback
        element.fireEvent("on" + eventType, event);
      }

      return event;
    },

    // Memory usage tracking
    getMemoryUsage: function () {
      if (window.performance && window.performance.memory) {
        return {
          used: window.performance.memory.usedJSHeapSize,
          total: window.performance.memory.totalJSHeapSize,
          limit: window.performance.memory.jsHeapSizeLimit,
        };
      }
      return null;
    },

    // Timing utilities
    measureTime: function (fn) {
      var start = Date.now();
      var result = fn();
      var end = Date.now();

      return {
        result: result,
        duration: end - start,
      };
    },

    // Error handling utilities
    captureErrors: function (fn) {
      var errors = [];
      var originalOnError = window.onerror;

      window.onerror = function (message, source, lineno, colno, error) {
        errors.push({
          message: message,
          source: source,
          lineno: lineno,
          colno: colno,
          error: error,
        });
        return true;
      };

      try {
        fn();
      } finally {
        window.onerror = originalOnError;
      }

      return errors;
    },

    // Network simulation
    simulateNetworkDelay: function (delay) {
      return new Promise(function (resolve) {
        setTimeout(resolve, delay || 100);
      });
    },

    // Local storage mock for IE11
    createMockStorage: function () {
      var storage = {};

      return {
        getItem: function (key) {
          return storage[key] || null;
        },
        setItem: function (key, value) {
          storage[key] = String(value);
        },
        removeItem: function (key) {
          delete storage[key];
        },
        clear: function () {
          storage = {};
        },
        get length() {
          return Object.keys(storage).length;
        },
        key: function (index) {
          var keys = Object.keys(storage);
          return keys[index] || null;
        },
      };
    },

    // Test data generators
    generateTraceId: function () {
      var chars = "0123456789abcdef";
      var result = "";
      for (var i = 0; i < 32; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    },

    generateSpanId: function () {
      var chars = "0123456789abcdef";
      var result = "";
      for (var i = 0; i < 16; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    },

    // Assertion helpers
    assert: {
      isTrue: function (value, message) {
        if (value !== true) {
          throw new Error(message || "Expected true, got " + value);
        }
      },

      isFalse: function (value, message) {
        if (value !== false) {
          throw new Error(message || "Expected false, got " + value);
        }
      },

      equals: function (actual, expected, message) {
        if (actual !== expected) {
          throw new Error(
            message || "Expected " + expected + ", got " + actual
          );
        }
      },

      notEquals: function (actual, expected, message) {
        if (actual === expected) {
          throw new Error(message || "Expected not to equal " + expected);
        }
      },

      isNull: function (value, message) {
        if (value !== null) {
          throw new Error(message || "Expected null, got " + value);
        }
      },

      isNotNull: function (value, message) {
        if (value === null) {
          throw new Error(message || "Expected not null");
        }
      },

      isUndefined: function (value, message) {
        if (value !== undefined) {
          throw new Error(message || "Expected undefined, got " + value);
        }
      },

      isNotUndefined: function (value, message) {
        if (value === undefined) {
          throw new Error(message || "Expected not undefined");
        }
      },

      throws: function (fn, message) {
        var threw = false;
        try {
          fn();
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error(message || "Expected function to throw");
        }
      },
    },

    // Cleanup utilities
    cleanup: function () {
      // Reset global state
      if (window.opentelemetry) {
        delete window.opentelemetry;
      }

      // Clear any test elements
      var testElements = document.querySelectorAll("[data-test]");
      for (var i = 0; i < testElements.length; i++) {
        testElements[i].parentNode.removeChild(testElements[i]);
      }

      // Clear timers
      var highestTimeoutId = setTimeout(function () {}, 0);
      for (var i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
    },
  };

  // Export to global scope
  if (typeof module !== "undefined" && module.exports) {
    module.exports = IE11TestUtils;
  } else {
    global.IE11TestUtils = IE11TestUtils;
  }
})(typeof window !== "undefined" ? window : this);
