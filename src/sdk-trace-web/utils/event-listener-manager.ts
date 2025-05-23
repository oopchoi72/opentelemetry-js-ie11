// IE11-compatible Event Listener Manager for OpenTelemetry

// Event listener configuration
export interface EventListenerConfig {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

// Normalized event interface
export interface NormalizedEvent {
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  stopImmediatePropagation: () => void;
  originalEvent: Event;
}

// Event listener record for IE11 management
interface EventListenerRecord {
  element: EventTarget;
  type: string;
  listener: EventListener;
  wrappedListener: EventListener;
  options?: EventListenerConfig;
  useCapture: boolean;
}

// IE11-compatible Event Listener Manager
export var EventListenerManager = {
  // Private storage for event listeners
  _listeners: [] as EventListenerRecord[],

  // Normalize event object for IE11 compatibility
  normalizeEvent: function (event: any): NormalizedEvent {
    var normalizedEvent = {
      target: event.target || event.srcElement,
      currentTarget: event.currentTarget || event.srcElement,
      type: event.type,
      bubbles: event.bubbles !== false,
      cancelable: event.cancelable !== false,
      originalEvent: event,

      preventDefault: function () {
        if (event.preventDefault) {
          event.preventDefault();
        } else {
          event.returnValue = false;
        }
      },

      stopPropagation: function () {
        if (event.stopPropagation) {
          event.stopPropagation();
        } else {
          event.cancelBubble = true;
        }
      },

      stopImmediatePropagation: function () {
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
          event.cancelBubble = true;
          // IE11 doesn't have immediate propagation, use flag
          event._immediatelyStopped = true;
        }
      },
    };

    return normalizedEvent;
  },

  // Add event listener with IE11 compatibility
  addEventListener: function (
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: EventListenerConfig | boolean
  ): void {
    // Normalize options
    var config: EventListenerConfig = {};
    var useCapture = false;

    if (typeof options === "boolean") {
      useCapture = options;
      config.capture = options;
    } else if (options && typeof options === "object") {
      config = options;
      useCapture = options.capture || false;
    }

    // Create wrapped listener for event normalization
    var wrappedListener = function (event: Event) {
      // Check if event was immediately stopped (IE11 simulation)
      if ((event as any)._immediatelyStopped) {
        return;
      }

      var normalizedEvent = EventListenerManager.normalizeEvent(event);

      // Handle 'once' option
      if (config.once) {
        EventListenerManager.removeEventListener(
          element,
          type,
          listener,
          config
        );
      }

      // Call original listener with normalized event
      if (typeof listener === "function") {
        listener.call(element, normalizedEvent as any);
      } else if (listener && typeof listener.handleEvent === "function") {
        listener.handleEvent(normalizedEvent as any);
      }
    };

    // Store listener record
    var record: EventListenerRecord = {
      element: element,
      type: type,
      listener: listener,
      wrappedListener: wrappedListener,
      options: config,
      useCapture: useCapture,
    };

    EventListenerManager._listeners.push(record);

    // Add listener using appropriate method
    if ((element as any).addEventListener) {
      // Modern browsers
      (element as any).addEventListener(type, wrappedListener, useCapture);
    } else if ((element as any).attachEvent) {
      // IE8-11 fallback
      (element as any).attachEvent("on" + type, wrappedListener);
    } else {
      // Last resort - direct assignment
      var eventProp = "on" + type;
      var existing = (element as any)[eventProp];
      (element as any)[eventProp] = function (event: Event) {
        if (existing) {
          existing.call(element, event);
        }
        wrappedListener.call(element, event);
      };
    }
  },

  // Remove event listener with IE11 compatibility
  removeEventListener: function (
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: EventListenerConfig | boolean
  ): void {
    // Normalize options
    var useCapture = false;
    if (typeof options === "boolean") {
      useCapture = options;
    } else if (options && typeof options === "object") {
      useCapture = options.capture || false;
    }

    // Find and remove listener record
    for (var i = 0; i < EventListenerManager._listeners.length; i++) {
      var record = EventListenerManager._listeners[i];
      if (
        record.element === element &&
        record.type === type &&
        record.listener === listener &&
        record.useCapture === useCapture
      ) {
        // Remove listener using appropriate method
        if ((element as any).removeEventListener) {
          // Modern browsers
          (element as any).removeEventListener(
            type,
            record.wrappedListener,
            useCapture
          );
        } else if ((element as any).detachEvent) {
          // IE8-11 fallback
          (element as any).detachEvent("on" + type, record.wrappedListener);
        }

        // Remove from storage
        EventListenerManager._listeners.splice(i, 1);
        break;
      }
    }
  },

  // Add event listener with automatic cleanup
  addEventListenerWithCleanup: function (
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: EventListenerConfig | boolean
  ): () => void {
    EventListenerManager.addEventListener(element, type, listener, options);

    // Return cleanup function
    return function () {
      EventListenerManager.removeEventListener(
        element,
        type,
        listener,
        options
      );
    };
  },

  // Dispatch custom event with IE11 compatibility
  dispatchEvent: function (
    element: EventTarget,
    eventType: string,
    detail?: any
  ): boolean {
    var event;

    try {
      // Modern browsers
      if (typeof CustomEvent !== "undefined") {
        event = new CustomEvent(eventType, {
          detail: detail,
          bubbles: true,
          cancelable: true,
        });
      } else if (typeof Event !== "undefined") {
        event = new Event(eventType, {
          bubbles: true,
          cancelable: true,
        });
        (event as any).detail = detail;
      } else {
        throw new Error("CustomEvent not supported");
      }
    } catch (error) {
      // IE8-11 fallback
      if (document.createEvent) {
        event = document.createEvent("CustomEvent");
        if ((event as any).initCustomEvent) {
          (event as any).initCustomEvent(eventType, true, true, detail);
        } else {
          (event as any).initEvent(eventType, true, true);
          (event as any).detail = detail;
        }
      } else if ((document as any).createEventObject) {
        // IE8 fallback
        event = (document as any).createEventObject();
        event.type = eventType;
        event.detail = detail;
        event.bubbles = true;
        event.cancelable = true;
      }
    }

    // Dispatch event
    if (event) {
      if ((element as any).dispatchEvent) {
        return (element as any).dispatchEvent(event);
      } else if ((element as any).fireEvent) {
        // IE8-11 fallback
        return (element as any).fireEvent("on" + eventType, event);
      }
    }

    return false;
  },

  // Wait for DOM ready with IE11 compatibility
  whenReady: function (callback: () => void): void {
    if (typeof document === "undefined") {
      // Non-browser environment
      callback();
      return;
    }

    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      // Already ready
      setTimeout(callback, 0);
    } else if (document.addEventListener) {
      // Modern browsers
      document.addEventListener("DOMContentLoaded", callback);
    } else if ((document as any).attachEvent) {
      // IE8-11 fallback
      (document as any).attachEvent("onreadystatechange", function () {
        if (document.readyState === "complete") {
          callback();
        }
      });
    } else {
      // Last resort
      var checkReady = function () {
        if (document.readyState === "complete") {
          callback();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    }
  },

  // Clean up all event listeners
  cleanup: function (): void {
    var listeners = EventListenerManager._listeners.slice();
    for (var i = 0; i < listeners.length; i++) {
      var record = listeners[i];
      EventListenerManager.removeEventListener(
        record.element,
        record.type,
        record.listener,
        record.options
      );
    }
  },

  // Get all registered listeners (for debugging)
  getListeners: function (): EventListenerRecord[] {
    return EventListenerManager._listeners.slice();
  },

  // Check if an element has specific event listener
  hasEventListener: function (
    element: EventTarget,
    type: string,
    listener: EventListener
  ): boolean {
    for (var i = 0; i < EventListenerManager._listeners.length; i++) {
      var record = EventListenerManager._listeners[i];
      if (
        record.element === element &&
        record.type === type &&
        record.listener === listener
      ) {
        return true;
      }
    }
    return false;
  },
};

export { EventListenerManager };
