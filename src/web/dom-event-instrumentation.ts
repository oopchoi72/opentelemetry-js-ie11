// DOM Event Instrumentation for IE11
// Provides IE11 compatible DOM event tracking and measurement

export interface DOMEventConfig {
  trackedEvents?: string[];
  capturePhase?: boolean;
  bubblePhase?: boolean;
  enableTiming?: boolean;
  maxEventHistory?: number;
  throttleInterval?: number;
}

export interface DOMEventData {
  type: string;
  target: string;
  timestamp: number;
  duration?: number;
  phase: "capturing" | "bubbling" | "at-target";
  bubbled: boolean;
  cancelled: boolean;
  synthetic: boolean;
}

export interface DOMEventHandler {
  (eventData: DOMEventData): void;
}

export interface DOMEventInstrumentation {
  instrument(element: Element | Document | Window): void;
  uninstrument(element: Element | Document | Window): void;
  addHandler(handler: DOMEventHandler): void;
  removeHandler(handler: DOMEventHandler): void;
  getEventHistory(): DOMEventData[];
  clearHistory(): void;
  destroy(): void;
}

// Default configuration for IE11 optimization
var DEFAULT_CONFIG: DOMEventConfig = {
  trackedEvents: [
    "click",
    "dblclick",
    "mousedown",
    "mouseup",
    "mouseover",
    "mouseout",
    "keydown",
    "keyup",
    "keypress",
    "focus",
    "blur",
    "change",
    "submit",
    "load",
    "unload",
    "error",
    "resize",
    "scroll",
  ],
  capturePhase: true,
  bubblePhase: true,
  enableTiming: true,
  maxEventHistory: 1000,
  throttleInterval: 16, // ~60fps for high-frequency events
};

// High-frequency events that need throttling in IE11
var HIGH_FREQUENCY_EVENTS = ["mousemove", "scroll", "resize", "touchmove"];

export function createDOMEventInstrumentation(
  config?: DOMEventConfig
): DOMEventInstrumentation {
  var cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
  var handlers: DOMEventHandler[] = [];
  var eventHistory: DOMEventData[] = [];
  var instrumentedElements = new WeakMap<Element | Document | Window, any>();
  var throttleTimers: { [key: string]: any } = {};
  var isDestroyed = false;

  // IE11 compatible performance timing
  function getHighResolutionTime(): number {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  // Get element selector for IE11
  function getElementSelector(element: Element): string {
    if (!element || element.nodeType !== 1) {
      return "unknown";
    }

    var tagName = element.tagName.toLowerCase();
    var id = element.id;
    var className = element.className;

    if (id) {
      return tagName + "#" + id;
    }

    if (className && typeof className === "string") {
      var classes = className.split(/\s+/).slice(0, 2).join(".");
      if (classes) {
        return tagName + "." + classes;
      }
    }

    return tagName;
  }

  // Check if event should be throttled
  function shouldThrottle(eventType: string): boolean {
    return HIGH_FREQUENCY_EVENTS.indexOf(eventType) !== -1;
  }

  // Throttle high-frequency events for IE11 performance
  function throttleEvent(eventType: string, callback: () => void): void {
    var key = eventType;

    if (throttleTimers[key]) {
      return; // Already throttled
    }

    throttleTimers[key] = setTimeout(function () {
      delete throttleTimers[key];
      callback();
    }, cfg.throttleInterval || 16);
  }

  // Create event data from DOM event
  function createEventData(
    event: Event,
    phase: "capturing" | "bubbling" | "at-target"
  ): DOMEventData {
    var target = event.target as Element;
    var timestamp = getHighResolutionTime();

    return {
      type: event.type,
      target: getElementSelector(target),
      timestamp: timestamp,
      phase: phase,
      bubbled: event.bubbles,
      cancelled: event.defaultPrevented,
      synthetic: !event.isTrusted,
    };
  }

  // Add event to history with size limit for IE11 memory management
  function addToHistory(eventData: DOMEventData): void {
    eventHistory.push(eventData);

    // Limit history size for IE11 memory management
    if (eventHistory.length > (cfg.maxEventHistory || 1000)) {
      eventHistory.splice(
        0,
        eventHistory.length - (cfg.maxEventHistory || 1000)
      );
    }
  }

  // Notify all handlers
  function notifyHandlers(eventData: DOMEventData): void {
    for (var i = 0; i < handlers.length; i++) {
      try {
        handlers[i](eventData);
      } catch (error) {
        // Handle errors gracefully in IE11
        if (typeof console !== "undefined" && console.error) {
          console.error("DOM Event handler error:", error);
        }
      }
    }
  }

  // Process DOM event
  function processEvent(
    event: Event,
    phase: "capturing" | "bubbling" | "at-target"
  ): void {
    if (isDestroyed) {
      return;
    }

    var eventType = event.type;

    // Check if this event type is tracked
    if (cfg.trackedEvents && cfg.trackedEvents.indexOf(eventType) === -1) {
      return;
    }

    function doProcess(): void {
      var eventData = createEventData(event, phase);

      if (cfg.enableTiming) {
        // Add timing information if needed
        eventData.duration = getHighResolutionTime() - eventData.timestamp;
      }

      addToHistory(eventData);
      notifyHandlers(eventData);
    }

    // Throttle high-frequency events
    if (shouldThrottle(eventType)) {
      throttleEvent(eventType, doProcess);
    } else {
      doProcess();
    }
  }

  // Create wrapped event listener for IE11
  function createWrappedListener(
    originalListener: EventListener,
    phase: "capturing" | "bubbling" | "at-target"
  ): EventListener {
    return function (this: any, event: Event) {
      processEvent(event, phase);

      // Call original listener
      if (typeof originalListener === "function") {
        return originalListener.call(this, event);
      }
    };
  }

  // Instrument a DOM element
  function instrumentElement(element: Element | Document | Window): void {
    if (isDestroyed || instrumentedElements.has(element)) {
      return;
    }

    var originalAddEventListener = element.addEventListener;
    var originalRemoveEventListener = element.removeEventListener;
    var listenerMap = new Map<EventListener, EventListener>();

    // Patch addEventListener
    element.addEventListener = function (
      type: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions
    ) {
      var useCapture = false;
      var phase: "capturing" | "bubbling" = "bubbling";

      // Handle options parameter for IE11 compatibility
      if (typeof options === "boolean") {
        useCapture = options;
        phase = useCapture ? "capturing" : "bubbling";
      } else if (options && typeof options === "object") {
        useCapture = options.capture || false;
        phase = useCapture ? "capturing" : "bubbling";
      }

      // Only wrap if we should track this phase
      var shouldWrap =
        (phase === "capturing" && cfg.capturePhase) ||
        (phase === "bubbling" && cfg.bubblePhase);

      if (shouldWrap && listener) {
        var wrappedListener = createWrappedListener(listener, phase);
        listenerMap.set(listener, wrappedListener);

        return originalAddEventListener.call(
          this,
          type,
          wrappedListener,
          useCapture
        );
      }

      return originalAddEventListener.call(this, type, listener, useCapture);
    };

    // Patch removeEventListener
    element.removeEventListener = function (
      type: string,
      listener: EventListener,
      options?: boolean | EventListenerOptions
    ) {
      var useCapture = false;

      if (typeof options === "boolean") {
        useCapture = options;
      } else if (options && typeof options === "object") {
        useCapture = options.capture || false;
      }

      var wrappedListener = listenerMap.get(listener);
      if (wrappedListener) {
        listenerMap.delete(listener);
        return originalRemoveEventListener.call(
          this,
          type,
          wrappedListener,
          useCapture
        );
      }

      return originalRemoveEventListener.call(this, type, listener, useCapture);
    };

    // Store original methods for cleanup
    instrumentedElements.set(element, {
      originalAddEventListener: originalAddEventListener,
      originalRemoveEventListener: originalRemoveEventListener,
      listenerMap: listenerMap,
    });
  }

  // Uninstrument a DOM element
  function uninstrumentElement(element: Element | Document | Window): void {
    var stored = instrumentedElements.get(element);
    if (!stored) {
      return;
    }

    // Restore original methods
    element.addEventListener = stored.originalAddEventListener;
    element.removeEventListener = stored.originalRemoveEventListener;

    // Clear listener map
    stored.listenerMap.clear();

    instrumentedElements.delete(element);
  }

  // Add event handler
  function addHandler(handler: DOMEventHandler): void {
    if (isDestroyed || handlers.indexOf(handler) !== -1) {
      return;
    }
    handlers.push(handler);
  }

  // Remove event handler
  function removeHandler(handler: DOMEventHandler): void {
    var index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Get event history
  function getEventHistory(): DOMEventData[] {
    return eventHistory.slice(); // Return copy
  }

  // Clear event history
  function clearHistory(): void {
    eventHistory = [];
  }

  // Destroy instrumentation
  function destroy(): void {
    if (isDestroyed) {
      return;
    }

    isDestroyed = true;

    // Clear all throttle timers
    for (var key in throttleTimers) {
      if (throttleTimers.hasOwnProperty(key)) {
        clearTimeout(throttleTimers[key]);
      }
    }
    throttleTimers = {};

    // Uninstrument all elements
    // Note: WeakMap doesn't have forEach in IE11, so we can't iterate
    // Elements will be cleaned up when garbage collected

    // Clear handlers and history
    handlers = [];
    eventHistory = [];
  }

  return {
    instrument: instrumentElement,
    uninstrument: uninstrumentElement,
    addHandler: addHandler,
    removeHandler: removeHandler,
    getEventHistory: getEventHistory,
    clearHistory: clearHistory,
    destroy: destroy,
  };
}

// Helper function to instrument the entire document
export function instrumentDocument(
  config?: DOMEventConfig
): DOMEventInstrumentation {
  var instrumentation = createDOMEventInstrumentation(config);

  if (typeof document !== "undefined") {
    instrumentation.instrument(document);
  }

  return instrumentation;
}

// Helper function to instrument window
export function instrumentWindow(
  config?: DOMEventConfig
): DOMEventInstrumentation {
  var instrumentation = createDOMEventInstrumentation(config);

  if (typeof window !== "undefined") {
    instrumentation.instrument(window);
  }

  return instrumentation;
}

// Auto-instrumentation for common use cases
export function autoInstrument(config?: DOMEventConfig): {
  document: DOMEventInstrumentation;
  window: DOMEventInstrumentation;
  destroy: () => void;
} {
  var documentInstrumentation = instrumentDocument(config);
  var windowInstrumentation = instrumentWindow(config);

  function destroy(): void {
    documentInstrumentation.destroy();
    windowInstrumentation.destroy();
  }

  return {
    document: documentInstrumentation,
    window: windowInstrumentation,
    destroy: destroy,
  };
}
