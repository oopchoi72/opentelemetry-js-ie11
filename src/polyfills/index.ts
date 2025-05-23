// IE11 Polyfills
// This module loads and initializes all necessary polyfills for IE11 compatibility

// Import polyfill initializers
import { initializeCorePolyfills } from "./core-js-polyfills";
import { initializeFetchPolyfill } from "./fetch-polyfill";
import { initializeURLPolyfill } from "./url-polyfill";
import { initializeWebSocketPolyfill } from "./websocket-polyfill";

// Browser environment check
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

// Initialize polyfills only in browser environment
if (isBrowser()) {
  // Load core polyfills first
  initializeCorePolyfills();

  // Load fetch polyfill
  initializeFetchPolyfill();

  // Load URL polyfill
  initializeURLPolyfill();

  // Load WebSocket polyfills
  initializeWebSocketPolyfill();

  // OpenTelemetry specific polyfills
  // IE11-safe timing helper
  if (typeof performance !== "undefined" && !(performance as any).timeOrigin) {
    (performance as any).timeOrigin = performance.timing
      ? performance.timing.navigationStart
      : Date.now();
  }

  // Enhanced performance.now polyfill
  if (typeof performance !== "undefined") {
    var originalNow = performance.now;
    performance.now = function () {
      if (originalNow) {
        return originalNow.call(performance);
      }
      return Date.now() - (performance as any).timeOrigin;
    };
  }

  // Symbol.iterator polyfill
  if (typeof Symbol !== "undefined" && !(Symbol as any).iterator) {
    (Symbol as any).iterator = Symbol("Symbol.iterator");
  }

  // CustomEvent polyfill for IE11
  if (typeof CustomEvent === "undefined") {
    var CustomEventPolyfill = function (event: string, params?: any) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined,
      };
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(
        event,
        params.bubbles,
        params.cancelable,
        params.detail
      );
      return evt;
    };

    CustomEventPolyfill.prototype = Event.prototype;
    (window as any).CustomEvent = CustomEventPolyfill;
  }

  // Fix for IE11 Object.setPrototypeOf
  if (!Object.setPrototypeOf) {
    Object.setPrototypeOf = function (obj: any, proto: any) {
      (obj as any).__proto__ = proto;
      return obj;
    };
  }

  // Console polyfill for IE11
  if (typeof console === "undefined") {
    (window as any).console = {
      log: function () {
        /* noop */
      },
      warn: function () {
        /* noop */
      },
      error: function () {
        /* noop */
      },
      info: function () {
        /* noop */
      },
      debug: function () {
        /* noop */
      },
    };
  }

  // Performance API polyfill
  if (typeof performance === "undefined") {
    (window as any).performance = {
      now: function () {
        return new Date().getTime();
      },
      timing: {
        navigationStart: new Date().getTime(),
      },
    };
  }

  // Enhanced crypto.getRandomValues polyfill for IE11
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    if (typeof crypto === "undefined") {
      (window as any).crypto = {};
    }

    (window as any).crypto.getRandomValues = function (array: any) {
      for (var i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }

  console.log("OpenTelemetry specific polyfills initialized");
  console.log("All IE11 polyfills initialized");
} else {
  // Node.js environment - minimal polyfills
  if (typeof console !== "undefined") {
    console.log("Skipped browser polyfills in Node.js environment");
  }
}
