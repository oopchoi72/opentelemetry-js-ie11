// Conditional Core-JS Polyfill Loader for IE11
// Only loads polyfills that are actually needed based on browser capabilities

(function () {
  "use strict";

  // Feature detection
  var isIE11 = !!(window.MSInputMethodContext && document.documentMode);
  var needsPolyfills = false;
  var polyfillsToLoad = [];

  // Check for missing features
  var features = {
    "Object.assign": typeof Object.assign !== "function",
    "Object.keys": typeof Object.keys !== "function",
    "Object.values": typeof Object.values !== "function",
    "Object.entries": typeof Object.entries !== "function",
    "Array.from": typeof Array.from !== "function",
    "Array.prototype.find": !Array.prototype.find,
    "Array.prototype.findIndex": !Array.prototype.findIndex,
    "Array.prototype.includes": !Array.prototype.includes,
    "String.prototype.startsWith": !String.prototype.startsWith,
    "String.prototype.endsWith": !String.prototype.endsWith,
    "String.prototype.includes": !String.prototype.includes,
    "String.prototype.repeat": !String.prototype.repeat,
    Promise: typeof Promise === "undefined",
    Map: typeof Map === "undefined",
    Set: typeof Set === "undefined",
    Symbol: typeof Symbol === "undefined",
    WeakMap: typeof WeakMap === "undefined",
    WeakSet: typeof WeakSet === "undefined",
  };

  // Determine which polyfills to load
  for (var feature in features) {
    if (features.hasOwnProperty(feature) && features[feature]) {
      needsPolyfills = true;
      polyfillsToLoad.push(feature);
    }
  }

  // IE11 specific polyfills
  if (isIE11) {
    var ie11Features = {
      "Element.prototype.closest": !Element.prototype.closest,
      "Element.prototype.matches": !Element.prototype.matches,
      CustomEvent: typeof CustomEvent === "undefined",
      "performance.now": !(
        typeof performance !== "undefined" && performance.now
      ),
      requestAnimationFrame: !window.requestAnimationFrame,
      classList: !("classList" in document.createElement("_")),
    };

    for (var ie11Feature in ie11Features) {
      if (
        ie11Features.hasOwnProperty(ie11Feature) &&
        ie11Features[ie11Feature]
      ) {
        needsPolyfills = true;
        polyfillsToLoad.push(ie11Feature);
      }
    }
  }

  // Conditional polyfill loading
  if (needsPolyfills) {
    // Load only necessary core-js modules
    if (features["Object.assign"]) {
      require("core-js/features/object/assign");
    }
    if (features["Object.keys"]) {
      require("core-js/features/object/keys");
    }
    if (features["Object.values"]) {
      require("core-js/features/object/values");
    }
    if (features["Object.entries"]) {
      require("core-js/features/object/entries");
    }
    if (features["Array.from"]) {
      require("core-js/features/array/from");
    }
    if (features["Array.prototype.find"]) {
      require("core-js/features/array/find");
    }
    if (features["Array.prototype.findIndex"]) {
      require("core-js/features/array/find-index");
    }
    if (features["Array.prototype.includes"]) {
      require("core-js/features/array/includes");
    }
    if (features["String.prototype.startsWith"]) {
      require("core-js/features/string/starts-with");
    }
    if (features["String.prototype.endsWith"]) {
      require("core-js/features/string/ends-with");
    }
    if (features["String.prototype.includes"]) {
      require("core-js/features/string/includes");
    }
    if (features["String.prototype.repeat"]) {
      require("core-js/features/string/repeat");
    }
    if (features["Promise"]) {
      require("core-js/features/promise");
    }
    if (features["Map"]) {
      require("core-js/features/map");
    }
    if (features["Set"]) {
      require("core-js/features/set");
    }
    if (features["Symbol"]) {
      require("core-js/features/symbol");
    }
    if (features["WeakMap"]) {
      require("core-js/features/weak-map");
    }
    if (features["WeakSet"]) {
      require("core-js/features/weak-set");
    }

    // IE11 specific DOM polyfills
    if (isIE11) {
      // Element.closest polyfill
      if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
          var el = this;
          do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
          } while (el !== null && el.nodeType === 1);
          return null;
        };
      }

      // Element.matches polyfill
      if (!Element.prototype.matches) {
        Element.prototype.matches =
          Element.prototype.msMatchesSelector ||
          Element.prototype.webkitMatchesSelector;
      }

      // CustomEvent polyfill
      if (typeof CustomEvent === "undefined") {
        function CustomEvent(event, params) {
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
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
      }

      // performance.now polyfill
      if (typeof performance === "undefined") {
        window.performance = {};
      }
      if (!performance.now) {
        var navigationStart = Date.now();
        performance.now = function () {
          return Date.now() - navigationStart;
        };
      }

      // requestAnimationFrame polyfill
      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
          return setTimeout(callback, 16);
        };
      }
      if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
          clearTimeout(id);
        };
      }

      // classList polyfill
      if (!("classList" in document.createElement("_"))) {
        (function (view) {
          if (!("Element" in view)) return;

          var classListProp = "classList",
            protoProp = "prototype",
            elemCtrProto = view.Element[protoProp],
            objCtr = Object,
            DOMTokenList = function (el) {
              this.el = el;
              var classes = el.className.replace(/^\s+|\s+$/g, "").split(/\s+/);
              for (var i = 0; i < classes.length; i++) {
                this.push(classes[i]);
              }
              this._updateClassName = function () {
                el.className = this.toString();
              };
            };

          DOMTokenList[protoProp] = [];

          if (objCtr.defineProperty) {
            var classListPropDesc = {
              get: function () {
                return new DOMTokenList(this);
              },
              enumerable: true,
              configurable: false,
            };
            try {
              objCtr.defineProperty(
                elemCtrProto,
                classListProp,
                classListPropDesc
              );
            } catch (ex) {
              if (ex.number === -0x7ff5ec54) {
                classListPropDesc.enumerable = false;
                objCtr.defineProperty(
                  elemCtrProto,
                  classListProp,
                  classListPropDesc
                );
              }
            }
          }
        })(window);
      }
    }

    // Log loaded polyfills in development
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("OpenTelemetry IE11: Loaded polyfills for:", polyfillsToLoad);
    }
  }

  // Export polyfill status for debugging
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      needsPolyfills: needsPolyfills,
      polyfillsLoaded: polyfillsToLoad,
      isIE11: isIE11,
      features: features,
    };
  } else if (typeof window !== "undefined") {
    window.OpenTelemetryIE11 = window.OpenTelemetryIE11 || {};
    window.OpenTelemetryIE11.polyfills = {
      needsPolyfills: needsPolyfills,
      polyfillsLoaded: polyfillsToLoad,
      isIE11: isIE11,
      features: features,
    };
  }
})();
