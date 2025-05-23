// IE11-compatible User Interaction Instrumentation for OpenTelemetry

import { Span } from "../../sdk-trace-base";
import { SpanKind } from "../../sdk-trace-base/types";
import { EventListenerManager } from "../utils/event-listener-manager";
import { DOMInteractionLayer } from "../utils/dom-interaction-layer";
import { DOMUtils } from "../utils/dom-utils";

// User interaction instrumentation configuration
export interface UserInteractionInstrumentationConfig {
  enabled?: boolean;
  eventTypes?: string[];
  shouldPreventSpanCreation?: (eventType: string, element: Element) => boolean;
  shouldCaptureFormData?: boolean;
  applyCustomAttributesOnSpan?: (span: Span, element: Element) => void;
  ignoredSelectors?: string[];
  debounceTimeout?: number;
}

// Interaction event data interface
interface InteractionEventData {
  type: string;
  element: Element;
  timestamp: number;
  coordinates?: { x: number; y: number };
  formData?: { [key: string]: string };
}

// Default configuration
var DEFAULT_CONFIG: UserInteractionInstrumentationConfig = {
  enabled: true,
  eventTypes: ["click", "dblclick", "submit", "keydown", "focus", "blur"],
  shouldPreventSpanCreation: function () {
    return false;
  },
  shouldCaptureFormData: true,
  ignoredSelectors: ["script", "style", "meta", "title"],
  debounceTimeout: 100,
};

// IE11-compatible User Interaction Instrumentation
export var UserInteractionInstrumentation = function (
  this: any,
  config?: UserInteractionInstrumentationConfig
): any {
  var instrumentation = this;
  var _config = objectAssign({}, DEFAULT_CONFIG, config || {});
  var _enabled = _config.enabled !== false;
  var _isInstrumented = false;
  var _activeSpans: { [key: string]: Span } = {};
  var _debounceTimers: { [key: string]: number } = {};

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

  // Get element identifier for span naming
  function getElementIdentifier(element: Element): string {
    var tagName = element.tagName.toLowerCase();
    var id = (element as any).id;
    var className = element.className;

    if (id) {
      return tagName + "#" + id;
    } else if (className && typeof className === "string") {
      var firstClass = className.split(" ")[0];
      if (firstClass) {
        return tagName + "." + firstClass;
      }
    }

    return tagName;
  }

  // Get element attributes for span
  function getElementAttributes(element: Element): { [key: string]: any } {
    var attributes: { [key: string]: any } = {
      "element.tag_name": element.tagName.toLowerCase(),
      "element.xpath": getElementXPath(element),
    };

    // Add element ID if present
    if ((element as any).id) {
      attributes["element.id"] = (element as any).id;
    }

    // Add element classes
    if (element.className && typeof element.className === "string") {
      attributes["element.classes"] = element.className.trim();
    }

    // Add accessible name
    var accessibleName =
      DOMInteractionLayer.accessibility.getAccessibleName(element);
    if (accessibleName) {
      attributes["element.accessible_name"] = accessibleName;
    }

    // Add element role
    var role = DOMInteractionLayer.accessibility.getRole(element);
    if (role) {
      attributes["element.role"] = role;
    }

    // Add text content for certain elements
    var textContent =
      DOMInteractionLayer.accessibility.getAccessibleName(element);
    if (textContent && textContent.length < 100) {
      attributes["element.text"] = textContent;
    }

    // Add href for links
    if (element.tagName.toLowerCase() === "a") {
      var href = element.getAttribute("href");
      if (href) {
        attributes["element.href"] = href;
      }
    }

    // Add src for images
    if (element.tagName.toLowerCase() === "img") {
      var src = element.getAttribute("src");
      var alt = element.getAttribute("alt");
      if (src) {
        attributes["element.src"] = src;
      }
      if (alt) {
        attributes["element.alt"] = alt;
      }
    }

    return attributes;
  }

  // Generate XPath for element
  function getElementXPath(element: Element): string {
    if (!element || element === document.documentElement) {
      return "/html";
    }

    var path = "";
    var current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      var tagName = current.tagName.toLowerCase();
      var siblings = current.parentNode
        ? Array.prototype.filter.call(
            current.parentNode.children,
            function (child: Element) {
              return child.tagName.toLowerCase() === tagName;
            }
          )
        : [current];

      var index = Array.prototype.indexOf.call(siblings, current) + 1;
      path = "/" + tagName + "[" + index + "]" + path;

      current = current.parentElement;
    }

    return path;
  }

  // Check if element should be ignored
  function shouldIgnoreElement(element: Element): boolean {
    if (!element) {
      return true;
    }

    var tagName = element.tagName.toLowerCase();

    // Check ignored selectors
    if (_config.ignoredSelectors) {
      for (var i = 0; i < _config.ignoredSelectors.length; i++) {
        var selector = _config.ignoredSelectors[i];
        if (
          tagName === selector ||
          DOMInteractionLayer.selector.querySelector(selector, element)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // Get form data if applicable
  function getFormData(
    element: Element
  ): { [key: string]: string } | undefined {
    if (!_config.shouldCaptureFormData) {
      return undefined;
    }

    // Check if element is a form
    if (element.tagName.toLowerCase() === "form") {
      return DOMInteractionLayer.forms.getFormData(element as HTMLFormElement);
    }

    // Check if element is inside a form
    var form = DOMUtils.closest(element, "form");
    if (form) {
      return DOMInteractionLayer.forms.getFormData(form as HTMLFormElement);
    }

    return undefined;
  }

  // Start interaction span
  function startInteractionSpan(eventData: InteractionEventData): Span | null {
    if (shouldIgnoreElement(eventData.element)) {
      return null;
    }

    // Check if span creation should be prevented
    if (
      _config.shouldPreventSpanCreation &&
      _config.shouldPreventSpanCreation(eventData.type, eventData.element)
    ) {
      return null;
    }

    // Get tracer
    if (typeof window === "undefined" || !(window as any).opentelemetry) {
      return null;
    }

    var tracer = (window as any).opentelemetry.trace.getActiveTracer();
    if (!tracer) {
      return null;
    }

    // Create span name
    var elementId = getElementIdentifier(eventData.element);
    var spanName = eventData.type + " " + elementId;

    // Start span
    var span = tracer.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: objectAssign(
        {
          component: "user-interaction",
          "interaction.type": eventData.type,
          "interaction.timestamp": eventData.timestamp,
        },
        getElementAttributes(eventData.element)
      ),
    });

    // Add coordinates if available
    if (eventData.coordinates) {
      span.setAttribute("interaction.x", eventData.coordinates.x);
      span.setAttribute("interaction.y", eventData.coordinates.y);
    }

    // Add form data if available
    if (eventData.formData) {
      for (var key in eventData.formData) {
        if (Object.prototype.hasOwnProperty.call(eventData.formData, key)) {
          span.setAttribute("form." + key, eventData.formData[key]);
        }
      }
    }

    // Apply custom attributes if configured
    if (_config.applyCustomAttributesOnSpan) {
      try {
        _config.applyCustomAttributesOnSpan(span, eventData.element);
      } catch (error) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Error applying custom attributes:", error);
        }
      }
    }

    return span;
  }

  // Handle user interaction event
  function handleInteractionEvent(event: Event): void {
    if (!_enabled || !event.target) {
      return;
    }

    var element = event.target as Element;
    var eventType = event.type;

    // Create event data
    var eventData: InteractionEventData = {
      type: eventType,
      element: element,
      timestamp: Date.now(),
    };

    // Add coordinates for mouse events
    if (event instanceof MouseEvent || (event as any).clientX !== undefined) {
      eventData.coordinates = {
        x: (event as any).clientX || 0,
        y: (event as any).clientY || 0,
      };
    }

    // Add form data
    eventData.formData = getFormData(element);

    // Create debounce key
    var debounceKey = eventType + ":" + getElementXPath(element);

    // Clear existing debounce timer
    if (_debounceTimers[debounceKey]) {
      clearTimeout(_debounceTimers[debounceKey]);
    }

    // Set debounce timer
    _debounceTimers[debounceKey] = setTimeout(function () {
      delete _debounceTimers[debounceKey];

      // Start interaction span
      var span = startInteractionSpan(eventData);
      if (span) {
        var spanKey = span.spanContext().spanId;
        _activeSpans[spanKey] = span;

        // End span after a short delay for most events
        if (eventType !== "focus") {
          setTimeout(function () {
            if (_activeSpans[spanKey]) {
              span.setStatus({ code: 1 }); // OK
              span.end();
              delete _activeSpans[spanKey];
            }
          }, 100);
        }
      }
    }, _config.debounceTimeout || 100) as any;
  }

  // Handle focus events (longer duration)
  function handleFocusEvent(event: Event): void {
    var element = event.target as Element;
    var spanKey = "focus:" + getElementXPath(element);

    if (event.type === "focus") {
      // Start focus span
      var eventData: InteractionEventData = {
        type: "focus",
        element: element,
        timestamp: Date.now(),
      };

      var span = startInteractionSpan(eventData);
      if (span) {
        _activeSpans[spanKey] = span;
      }
    } else if (event.type === "blur") {
      // End focus span
      var activeSpan = _activeSpans[spanKey];
      if (activeSpan) {
        activeSpan.setStatus({ code: 1 }); // OK
        activeSpan.end();
        delete _activeSpans[spanKey];
      }
    }
  }

  // Handle form submit events
  function handleFormSubmit(event: Event): void {
    var form = event.target as HTMLFormElement;

    // Validate form
    var isValid = DOMInteractionLayer.forms.validateForm(form);

    var eventData: InteractionEventData = {
      type: "submit",
      element: form,
      timestamp: Date.now(),
      formData: DOMInteractionLayer.forms.getFormData(form),
    };

    var span = startInteractionSpan(eventData);
    if (span) {
      span.setAttribute("form.valid", isValid);
      span.setAttribute("form.action", form.action || "");
      span.setAttribute("form.method", form.method || "get");

      // End span after form submission completes
      setTimeout(function () {
        span.setStatus({ code: isValid ? 1 : 2 }); // OK or ERROR
        span.end();
      }, 100);
    }
  }

  // Enable instrumentation
  instrumentation.enable = function (): void {
    if (_isInstrumented) {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Set up event listeners for different event types
    var eventTypes = _config.eventTypes || DEFAULT_CONFIG.eventTypes;

    for (var i = 0; i < eventTypes!.length; i++) {
      var eventType = eventTypes![i];

      if (eventType === "focus" || eventType === "blur") {
        EventListenerManager.addEventListener(
          document,
          eventType,
          handleFocusEvent,
          true
        );
      } else if (eventType === "submit") {
        EventListenerManager.addEventListener(
          document,
          eventType,
          handleFormSubmit,
          true
        );
      } else {
        EventListenerManager.addEventListener(
          document,
          eventType,
          handleInteractionEvent,
          true
        );
      }
    }

    _isInstrumented = true;
    _enabled = true;
  };

  // Disable instrumentation
  instrumentation.disable = function (): void {
    if (!_isInstrumented) {
      return;
    }

    // Remove event listeners
    var eventTypes = _config.eventTypes || DEFAULT_CONFIG.eventTypes;

    for (var i = 0; i < eventTypes!.length; i++) {
      var eventType = eventTypes![i];

      if (eventType === "focus" || eventType === "blur") {
        EventListenerManager.removeEventListener(
          document,
          eventType,
          handleFocusEvent,
          true
        );
      } else if (eventType === "submit") {
        EventListenerManager.removeEventListener(
          document,
          eventType,
          handleFormSubmit,
          true
        );
      } else {
        EventListenerManager.removeEventListener(
          document,
          eventType,
          handleInteractionEvent,
          true
        );
      }
    }

    // End any active spans
    for (var spanKey in _activeSpans) {
      if (Object.prototype.hasOwnProperty.call(_activeSpans, spanKey)) {
        var span = _activeSpans[spanKey];
        span.setStatus({ code: 1 }); // OK
        span.end();
      }
    }

    _activeSpans = {};

    // Clear debounce timers
    for (var timerKey in _debounceTimers) {
      if (Object.prototype.hasOwnProperty.call(_debounceTimers, timerKey)) {
        clearTimeout(_debounceTimers[timerKey]);
      }
    }

    _debounceTimers = {};

    _isInstrumented = false;
    _enabled = false;
  };

  // Check if enabled
  instrumentation.isEnabled = function (): boolean {
    return _enabled;
  };

  // Get active spans
  instrumentation.getActiveSpans = function (): { [key: string]: Span } {
    return objectAssign({}, _activeSpans);
  };

  // Force end all active spans
  instrumentation.endAllSpans = function (): void {
    for (var spanKey in _activeSpans) {
      if (Object.prototype.hasOwnProperty.call(_activeSpans, spanKey)) {
        var span = _activeSpans[spanKey];
        span.setStatus({ code: 1 }); // OK
        span.end();
      }
    }
    _activeSpans = {};
  };

  // Auto-enable if configured
  if (_enabled && typeof document !== "undefined") {
    EventListenerManager.whenReady(function () {
      instrumentation.enable();
    });
  }

  return instrumentation;
};

UserInteractionInstrumentation.prototype = {
  constructor: UserInteractionInstrumentation,
};
