// IE11 Polyfills for Testing Environment
// This file provides essential polyfills for IE11 compatibility during testing

(function () {
  "use strict";

  // Console polyfill for IE11
  if (typeof console === "undefined") {
    window.console = {
      log: function () {},
      warn: function () {},
      error: function () {},
      info: function () {},
      debug: function () {},
      trace: function () {},
      group: function () {},
      groupEnd: function () {},
      time: function () {},
      timeEnd: function () {},
      assert: function () {},
      clear: function () {},
      count: function () {},
      dir: function () {},
      dirxml: function () {},
      table: function () {},
    };
  }

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

  // Object.keys polyfill
  if (!Object.keys) {
    Object.keys = function (obj) {
      var keys = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
  }

  // Object.values polyfill
  if (!Object.values) {
    Object.values = function (obj) {
      var values = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          values.push(obj[key]);
        }
      }
      return values;
    };
  }

  // Object.entries polyfill
  if (!Object.entries) {
    Object.entries = function (obj) {
      var entries = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          entries.push([key, obj[key]]);
        }
      }
      return entries;
    };
  }

  // Array.from polyfill
  if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
      var C = this;
      var items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError(
          "Array.from requires an array-like object - not null or undefined"
        );
      }
      var mapFunction = mapFn === undefined ? undefined : mapFn;
      var T;
      if (typeof mapFunction !== "undefined") {
        if (typeof mapFunction !== "function") {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function"
          );
        }
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      var len = parseInt(items.length);
      var A = typeof C === "function" ? Object(new C(len)) : new Array(len);
      var k = 0;
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] =
            typeof T === "undefined"
              ? mapFunction(kValue, k)
              : mapFunction.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  // Array.prototype.find polyfill
  if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
      if (this == null) {
        throw new TypeError("Array.prototype.find called on null or undefined");
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

  // Array.prototype.findIndex polyfill
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (predicate) {
      if (this == null) {
        throw new TypeError(
          "Array.prototype.findIndex called on null or undefined"
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
          return i;
        }
      }
      return -1;
    };
  }

  // Array.prototype.includes polyfill
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(fromIndex) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {
          k = 0;
        }
      }
      function sameValueZero(x, y) {
        return (
          x === y ||
          (typeof x === "number" &&
            typeof y === "number" &&
            isNaN(x) &&
            isNaN(y))
        );
      }
      for (; k < len; k++) {
        if (sameValueZero(O[k], searchElement)) {
          return true;
        }
      }
      return false;
    };
  }

  // String.prototype.startsWith polyfill
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  // String.prototype.endsWith polyfill
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, length) {
      if (length === undefined || length > this.length) {
        length = this.length;
      }
      return (
        this.substring(length - searchString.length, length) === searchString
      );
    };
  }

  // String.prototype.includes polyfill
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // String.prototype.repeat polyfill
  if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
      if (this == null) {
        throw new TypeError("can't convert " + this + " to object");
      }
      var str = "" + this;
      count = +count;
      if (count != count) {
        count = 0;
      }
      if (count < 0) {
        throw new RangeError("repeat count must be non-negative");
      }
      if (count == Infinity) {
        throw new RangeError("repeat count must be less than infinity");
      }
      count = Math.floor(count);
      if (str.length == 0 || count == 0) {
        return "";
      }
      if (str.length * count >= 1 << 28) {
        throw new RangeError(
          "repeat count must not overflow maximum string length"
        );
      }
      var rpt = "";
      for (var i = 0; i < count; i++) {
        rpt += str;
      }
      return rpt;
    };
  }

  // Promise polyfill (basic implementation)
  if (typeof Promise === "undefined") {
    window.Promise = function (executor) {
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

      this.catch = function (onRejected) {
        return this.then(null, onRejected);
      };

      executor(resolve, reject);
    };

    Promise.resolve = function (value) {
      return new Promise(function (resolve) {
        resolve(value);
      });
    };

    Promise.reject = function (reason) {
      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    };

    Promise.all = function (promises) {
      return new Promise(function (resolve, reject) {
        var results = [];
        var remaining = promises.length;
        if (remaining === 0) {
          resolve(results);
          return;
        }
        function resolver(index) {
          return function (value) {
            results[index] = value;
            if (--remaining === 0) {
              resolve(results);
            }
          };
        }
        for (var i = 0; i < promises.length; i++) {
          Promise.resolve(promises[i]).then(resolver(i), reject);
        }
      });
    };
  }

  // Map polyfill
  if (typeof Map === "undefined") {
    window.Map = function () {
      this._keys = [];
      this._values = [];
      this.size = 0;
    };

    Map.prototype.set = function (key, value) {
      var index = this._keys.indexOf(key);
      if (index === -1) {
        this._keys.push(key);
        this._values.push(value);
        this.size++;
      } else {
        this._values[index] = value;
      }
      return this;
    };

    Map.prototype.get = function (key) {
      var index = this._keys.indexOf(key);
      return index !== -1 ? this._values[index] : undefined;
    };

    Map.prototype.has = function (key) {
      return this._keys.indexOf(key) !== -1;
    };

    Map.prototype.delete = function (key) {
      var index = this._keys.indexOf(key);
      if (index !== -1) {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        this.size--;
        return true;
      }
      return false;
    };

    Map.prototype.clear = function () {
      this._keys = [];
      this._values = [];
      this.size = 0;
    };

    Map.prototype.forEach = function (callback, thisArg) {
      for (var i = 0; i < this._keys.length; i++) {
        callback.call(thisArg, this._values[i], this._keys[i], this);
      }
    };
  }

  // Set polyfill
  if (typeof Set === "undefined") {
    window.Set = function () {
      this._values = [];
      this.size = 0;
    };

    Set.prototype.add = function (value) {
      if (this._values.indexOf(value) === -1) {
        this._values.push(value);
        this.size++;
      }
      return this;
    };

    Set.prototype.has = function (value) {
      return this._values.indexOf(value) !== -1;
    };

    Set.prototype.delete = function (value) {
      var index = this._values.indexOf(value);
      if (index !== -1) {
        this._values.splice(index, 1);
        this.size--;
        return true;
      }
      return false;
    };

    Set.prototype.clear = function () {
      this._values = [];
      this.size = 0;
    };

    Set.prototype.forEach = function (callback, thisArg) {
      for (var i = 0; i < this._values.length; i++) {
        callback.call(thisArg, this._values[i], this._values[i], this);
      }
    };
  }

  // Performance.now polyfill
  if (typeof performance === "undefined") {
    window.performance = {};
  }

  if (!performance.now) {
    var navigationStart = Date.now();
    performance.now = function () {
      return Date.now() - navigationStart;
    };
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

  // classList polyfill
  if (!("classList" in document.createElement("_"))) {
    (function (view) {
      if (!("Element" in view)) return;

      var classListProp = "classList",
        protoProp = "prototype",
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim =
          String[protoProp].trim ||
          function () {
            return this.replace(/^\s+|\s+$/g, "");
          },
        arrIndexOf =
          Array[protoProp].indexOf ||
          function (item) {
            var i = 0,
              len = this.length;
            for (; i < len; i++) {
              if (i in this && this[i] === item) {
                return i;
              }
            }
            return -1;
          },
        DOMTokenList = function (el) {
          this.el = el;
          var classes = el.className.replace(/^\s+|\s+$/g, "").split(/\s+/);
          for (var i = 0; i < classes.length; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            el.className = this.toString();
          };
        },
        testEl = document.createElement("_");

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
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
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

  // addEventListener polyfill for IE8
  if (!window.addEventListener) {
    window.addEventListener = function (type, listener, useCapture) {
      window.attachEvent("on" + type, listener);
    };
    window.removeEventListener = function (type, listener, useCapture) {
      window.detachEvent("on" + type, listener);
    };
  }

  // JSON polyfill (basic)
  if (typeof JSON === "undefined") {
    window.JSON = {
      parse: function (text) {
        return eval("(" + text + ")");
      },
      stringify: function (value) {
        if (value === null) return "null";
        if (typeof value === "undefined") return undefined;
        if (typeof value === "string")
          return '"' + value.replace(/"/g, '\\"') + '"';
        if (typeof value === "number" || typeof value === "boolean")
          return String(value);
        if (typeof value === "object") {
          if (value instanceof Array) {
            var arr = [];
            for (var i = 0; i < value.length; i++) {
              arr.push(JSON.stringify(value[i]));
            }
            return "[" + arr.join(",") + "]";
          } else {
            var obj = [];
            for (var key in value) {
              if (value.hasOwnProperty(key)) {
                obj.push('"' + key + '":' + JSON.stringify(value[key]));
              }
            }
            return "{" + obj.join(",") + "}";
          }
        }
        return undefined;
      },
    };
  }
})();
