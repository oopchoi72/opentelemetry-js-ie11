// IE11-compatible DOM Interaction Layer for OpenTelemetry

import { DOMUtils } from "./dom-utils";
import { EventListenerManager } from "./event-listener-manager";

// DOM selector engine interface
export interface SelectorEngine {
  querySelector: (selector: string, context?: Element) => Element | null;
  querySelectorAll: (selector: string, context?: Element) => Element[];
}

// DOM mutation observation interface for IE11
export interface MutationObserverInterface {
  observe: (target: Element, options: MutationObserverInit) => void;
  disconnect: () => void;
  takeRecords: () => MutationRecord[];
}

// Form data collection interface
export interface FormDataInterface {
  getFormData: (form: HTMLFormElement) => { [key: string]: string };
  getFormFields: (form: HTMLFormElement) => HTMLElement[];
}

// IE11-compatible DOM Interaction Layer
export var DOMInteractionLayer = {
  // Advanced selector engine with IE11 compatibility
  selector: (function () {
    return {
      // Enhanced querySelector with context support
      querySelector: function (
        selector: string,
        context?: Element
      ): Element | null {
        var searchContext = context || document;

        try {
          if (searchContext.querySelector) {
            return searchContext.querySelector(selector);
          }
        } catch (error) {
          // Fallback for complex selectors that IE11 might not support
          if (typeof console !== "undefined" && console.warn) {
            console.warn("Selector not supported:", selector, error);
          }
        }

        // IE11 fallback for simple selectors
        if (selector.indexOf("#") === 0) {
          // ID selector
          var id = selector.substring(1);
          return document.getElementById(id);
        } else if (selector.indexOf(".") === 0) {
          // Class selector
          var className = selector.substring(1);
          var elements = searchContext.getElementsByTagName("*");
          for (var i = 0; i < elements.length; i++) {
            if (DOMUtils.hasClass(elements[i], className)) {
              return elements[i];
            }
          }
        } else if (
          selector.indexOf("[") === -1 &&
          selector.indexOf(":") === -1
        ) {
          // Simple tag selector
          var tagElements = searchContext.getElementsByTagName(selector);
          return tagElements.length > 0 ? tagElements[0] : null;
        }

        return null;
      },

      // Enhanced querySelectorAll with context support
      querySelectorAll: function (
        selector: string,
        context?: Element
      ): Element[] {
        var searchContext = context || document;
        var results: Element[] = [];

        try {
          if (searchContext.querySelectorAll) {
            var nodeList = searchContext.querySelectorAll(selector);
            results = DOMUtils.toArray(nodeList);
          }
        } catch (error) {
          // Fallback for complex selectors
          if (typeof console !== "undefined" && console.warn) {
            console.warn("Selector not supported:", selector, error);
          }
        }

        // IE11 fallback for simple selectors
        if (results.length === 0) {
          if (selector.indexOf("#") === 0) {
            // ID selector
            var id = selector.substring(1);
            var element = document.getElementById(id);
            if (element) {
              results = [element];
            }
          } else if (selector.indexOf(".") === 0) {
            // Class selector
            var className = selector.substring(1);
            var elements = searchContext.getElementsByTagName("*");
            for (var i = 0; i < elements.length; i++) {
              if (DOMUtils.hasClass(elements[i], className)) {
                results.push(elements[i]);
              }
            }
          } else if (
            selector.indexOf("[") === -1 &&
            selector.indexOf(":") === -1
          ) {
            // Simple tag selector
            var tagElements = searchContext.getElementsByTagName(selector);
            // Convert HTMLCollection to array manually
            var convertedElements: Element[] = [];
            for (var j = 0; j < tagElements.length; j++) {
              convertedElements.push(tagElements[j]);
            }
            results = convertedElements;
          }
        }

        return results;
      },

      // Find elements by attribute value
      findByAttribute: function (
        attributeName: string,
        attributeValue?: string,
        context?: Element
      ): Element[] {
        var searchContext = context || document;
        var results: Element[] = [];
        var elements = searchContext.getElementsByTagName("*");

        for (var i = 0; i < elements.length; i++) {
          var element = elements[i];
          var attrValue = element.getAttribute(attributeName);

          if (attrValue !== null) {
            if (attributeValue === undefined || attrValue === attributeValue) {
              results.push(element);
            }
          }
        }

        return results;
      },
    };
  })(),

  // DOM tree traversal utilities
  traversal: {
    // Get all child elements recursively
    getAllChildren: function (element: Element): Element[] {
      var children: Element[] = [];

      function collectChildren(parent: Element) {
        var childNodes = parent.children || parent.childNodes;
        for (var i = 0; i < childNodes.length; i++) {
          var child = childNodes[i];
          if (child.nodeType === 1) {
            // Element node
            children.push(child as Element);
            collectChildren(child as Element);
          }
        }
      }

      collectChildren(element);
      return children;
    },

    // Get parent chain up to root
    getParentChain: function (element: Element): Element[] {
      var parents: Element[] = [];
      var current = element.parentElement;

      while (current) {
        parents.push(current);
        current = current.parentElement;
      }

      return parents;
    },

    // Get next sibling element
    getNextSibling: function (element: Element): Element | null {
      var sibling = element.nextSibling;
      while (sibling && sibling.nodeType !== 1) {
        sibling = sibling.nextSibling;
      }
      return sibling as Element | null;
    },

    // Get previous sibling element
    getPreviousSibling: function (element: Element): Element | null {
      var sibling = element.previousSibling;
      while (sibling && sibling.nodeType !== 1) {
        sibling = sibling.previousSibling;
      }
      return sibling as Element | null;
    },
  },

  // Form interaction utilities
  forms: {
    // Get form data as key-value pairs
    getFormData: function (form: HTMLFormElement): { [key: string]: string } {
      var data: { [key: string]: string } = {};

      if (!form) {
        return data;
      }

      var elements = form.elements;
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i] as HTMLInputElement;
        var name = element.name;

        if (name && !element.disabled) {
          var value = "";

          if (element.type === "checkbox" || element.type === "radio") {
            if (element.checked) {
              value = element.value;
            } else {
              continue;
            }
          } else if (element.type === "select-multiple") {
            var select = element as unknown as HTMLSelectElement;
            var selectedValues: string[] = [];
            for (var j = 0; j < select.options.length; j++) {
              if (select.options[j].selected) {
                selectedValues.push(select.options[j].value);
              }
            }
            value = selectedValues.join(",");
          } else {
            value = element.value;
          }

          data[name] = value;
        }
      }

      return data;
    },

    // Get all form fields
    getFormFields: function (form: HTMLFormElement): HTMLElement[] {
      var fields: HTMLElement[] = [];

      if (!form) {
        return fields;
      }

      var elements = form.elements;
      for (var i = 0; i < elements.length; i++) {
        fields.push(elements[i] as HTMLElement);
      }

      return fields;
    },

    // Validate form using HTML5 validation API
    validateForm: function (form: HTMLFormElement): boolean {
      if (!form) {
        return false;
      }

      // Use HTML5 validation if available
      if (form.checkValidity) {
        return form.checkValidity();
      }

      // IE11 fallback - basic validation
      var elements = form.elements;
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i] as HTMLInputElement;

        if (element.required && !element.value.trim()) {
          return false;
        }

        // Basic email validation
        if (element.type === "email" && element.value) {
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(element.value)) {
            return false;
          }
        }
      }

      return true;
    },
  },

  // Mutation observation for IE11
  mutation: (function () {
    var observers: Array<{
      target: Element;
      callback: (mutations: MutationRecord[]) => void;
      options: MutationObserverInit;
      timer?: number;
    }> = [];

    function pollForChanges() {
      // Simple polling-based mutation detection for IE11
      for (var i = 0; i < observers.length; i++) {
        var observer = observers[i];
        // This is a simplified implementation
        // In a real scenario, you'd implement more sophisticated change detection
        if (observer.callback) {
          observer.callback([]);
        }
      }
    }

    return {
      // Create a mutation observer
      create: function (
        callback: (mutations: MutationRecord[]) => void
      ): MutationObserverInterface {
        var observerInstance = {
          observe: function (
            target: Element,
            options: MutationObserverInit
          ): void {
            if (typeof MutationObserver !== "undefined") {
              // Use native MutationObserver if available
              var nativeObserver = new MutationObserver(callback);
              nativeObserver.observe(target, options);
            } else {
              // IE11 fallback using polling
              var observer = {
                target: target,
                callback: callback,
                options: options,
                timer: setInterval(pollForChanges, 100) as any,
              };
              observers.push(observer);
            }
          },

          disconnect: function (): void {
            for (var i = observers.length - 1; i >= 0; i--) {
              var observer = observers[i];
              if (observer.timer) {
                clearInterval(observer.timer);
              }
              observers.splice(i, 1);
            }
          },

          takeRecords: function (): MutationRecord[] {
            return [];
          },
        };

        return observerInstance;
      },
    };
  })(),

  // Intersection observation for visibility tracking
  intersection: {
    // Check if element is in viewport
    isElementVisible: function (element: Element): boolean {
      if (!DOMUtils.isVisible(element)) {
        return false;
      }

      var rect = element.getBoundingClientRect();
      var viewport = DOMUtils.getViewportSize();

      return (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= viewport.height &&
        rect.left <= viewport.width
      );
    },

    // Create intersection observer for IE11
    createObserver: function (
      callback: (entries: any[]) => void,
      options?: any
    ): any {
      if (typeof IntersectionObserver !== "undefined") {
        return new IntersectionObserver(callback, options);
      }

      // IE11 fallback using scroll events
      var observedElements: Element[] = [];
      var isObserving = false;

      function checkIntersections() {
        var entries: any[] = [];
        for (var i = 0; i < observedElements.length; i++) {
          var element = observedElements[i];
          var isVisible =
            DOMInteractionLayer.intersection.isElementVisible(element);
          entries.push({
            target: element,
            isIntersecting: isVisible,
            intersectionRatio: isVisible ? 1 : 0,
          });
        }
        callback(entries);
      }

      function startObserving() {
        if (!isObserving) {
          EventListenerManager.addEventListener(
            window,
            "scroll",
            checkIntersections
          );
          EventListenerManager.addEventListener(
            window,
            "resize",
            checkIntersections
          );
          isObserving = true;
        }
      }

      function stopObserving() {
        if (isObserving) {
          EventListenerManager.removeEventListener(
            window,
            "scroll",
            checkIntersections
          );
          EventListenerManager.removeEventListener(
            window,
            "resize",
            checkIntersections
          );
          isObserving = false;
        }
      }

      return {
        observe: function (element: Element) {
          if (observedElements.indexOf(element) === -1) {
            observedElements.push(element);
            startObserving();
          }
        },

        unobserve: function (element: Element) {
          var index = observedElements.indexOf(element);
          if (index !== -1) {
            observedElements.splice(index, 1);
            if (observedElements.length === 0) {
              stopObserving();
            }
          }
        },

        disconnect: function () {
          observedElements = [];
          stopObserving();
        },
      };
    },
  },

  // Focus management utilities
  focus: {
    // Get currently focused element
    getActiveElement: function (): Element | null {
      return document.activeElement || null;
    },

    // Check if element can receive focus
    isFocusable: function (element: Element): boolean {
      if (!element || !DOMUtils.isVisible(element)) {
        return false;
      }

      var tagName = element.tagName.toLowerCase();
      var focusableTags = ["input", "textarea", "select", "button", "a"];

      if (focusableTags.indexOf(tagName) !== -1) {
        return !(element as any).disabled;
      }

      // Check for tabindex
      var tabIndex = element.getAttribute("tabindex");
      return tabIndex !== null && parseInt(tabIndex, 10) >= 0;
    },

    // Get all focusable elements within a container
    getFocusableElements: function (container: Element): Element[] {
      var focusable: Element[] = [];
      var candidates = DOMInteractionLayer.selector.querySelectorAll(
        "input, textarea, select, button, a, [tabindex]",
        container
      );

      for (var i = 0; i < candidates.length; i++) {
        if (DOMInteractionLayer.focus.isFocusable(candidates[i])) {
          focusable.push(candidates[i]);
        }
      }

      return focusable;
    },

    // Focus trap for modal dialogs
    createFocusTrap: function (container: Element): () => void {
      var focusableElements =
        DOMInteractionLayer.focus.getFocusableElements(container);
      var firstFocusable = focusableElements[0];
      var lastFocusable = focusableElements[focusableElements.length - 1];

      function handleTabKey(event: KeyboardEvent) {
        if (event.keyCode === 9) {
          // Tab key
          if (event.shiftKey) {
            // Shift + Tab
            if (
              document.activeElement === firstFocusable ||
              !DOMUtils.contains(container, document.activeElement as Element)
            ) {
              event.preventDefault();
              if (lastFocusable && (lastFocusable as any).focus) {
                (lastFocusable as any).focus();
              }
            }
          } else {
            // Tab
            if (
              document.activeElement === lastFocusable ||
              !DOMUtils.contains(container, document.activeElement as Element)
            ) {
              event.preventDefault();
              if (firstFocusable && (firstFocusable as any).focus) {
                (firstFocusable as any).focus();
              }
            }
          }
        }
      }

      EventListenerManager.addEventListener(
        document,
        "keydown",
        handleTabKey as any
      );

      // Return cleanup function
      return function () {
        EventListenerManager.removeEventListener(
          document,
          "keydown",
          handleTabKey as any
        );
      };
    },
  },

  // Accessibility utilities
  accessibility: {
    // Get accessible name for element
    getAccessibleName: function (element: Element): string {
      if (!element) {
        return "";
      }

      // Check aria-label first
      var ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel) {
        return ariaLabel.trim();
      }

      // Check aria-labelledby
      var labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        var labelElement = document.getElementById(labelledBy);
        if (labelElement) {
          return DOMUtils.getTextContent(labelElement).trim();
        }
      }

      // Check associated label for form elements
      if ((element as any).id) {
        var label = DOMInteractionLayer.selector.querySelector(
          'label[for="' + (element as any).id + '"]'
        );
        if (label) {
          return DOMUtils.getTextContent(label).trim();
        }
      }

      // Check parent label
      var parentLabel = DOMUtils.closest(element, "label");
      if (parentLabel) {
        return DOMUtils.getTextContent(parentLabel).trim();
      }

      // Fallback to element text content
      return DOMUtils.getTextContent(element).trim();
    },

    // Check if element has accessible description
    hasAccessibleDescription: function (element: Element): boolean {
      if (!element) {
        return false;
      }

      return !!(
        element.getAttribute("aria-describedby") ||
        element.getAttribute("title") ||
        element.getAttribute("alt")
      );
    },

    // Get element role
    getRole: function (element: Element): string {
      if (!element) {
        return "";
      }

      var role = element.getAttribute("role");
      if (role) {
        return role;
      }

      // Implicit roles based on tag name
      var tagName = element.tagName.toLowerCase();
      var implicitRoles: { [key: string]: string } = {
        button: "button",
        a: "link",
        input: "textbox",
        textarea: "textbox",
        select: "listbox",
        img: "img",
        h1: "heading",
        h2: "heading",
        h3: "heading",
        h4: "heading",
        h5: "heading",
        h6: "heading",
      };

      return implicitRoles[tagName] || "";
    },
  },

  // Element creation utilities
  create: {
    // Create element with attributes and content
    element: function (
      tagName: string,
      attributes?: { [key: string]: string },
      textContent?: string
    ): Element {
      var element = DOMUtils.createElement(tagName, attributes);

      if (textContent) {
        DOMUtils.setTextContent(element, textContent);
      }

      return element;
    },

    // Create document fragment
    fragment: function (): DocumentFragment {
      return document.createDocumentFragment();
    },

    // Create template element with IE11 compatibility
    template: function (htmlString: string): DocumentFragment {
      var fragment = document.createDocumentFragment();

      if (typeof DOMParser !== "undefined") {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(htmlString, "text/html");
          var nodes = doc.body.childNodes;

          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 1) {
              fragment.appendChild(nodes[i].cloneNode(true));
            }
          }
        } catch (error) {
          // Fallback for IE11
          var tempDiv = document.createElement("div");
          tempDiv.innerHTML = htmlString;

          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
        }
      } else {
        // IE11 fallback
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
      }

      return fragment;
    },
  },

  // Cleanup all registered observers and listeners
  cleanup: function (): void {
    // Clean up event listeners
    EventListenerManager.cleanup();

    // Clean up mutation observers
    DOMInteractionLayer.mutation.create(function () {}).disconnect();
  },
};
