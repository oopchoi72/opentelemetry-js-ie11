// IE11-compatible DOM Utilities for OpenTelemetry

// DOM traversal and manipulation utilities
export var DOMUtils = {
  // Element.closest() polyfill for IE11
  closest: function (element: Element, selector: string): Element | null {
    if (!element || !selector) {
      return null;
    }

    // Use native method if available
    if (element.closest) {
      return element.closest(selector);
    }

    // IE11 fallback
    var currentElement = element;
    while (currentElement && currentElement.nodeType === 1) {
      if (DOMUtils.matches(currentElement, selector)) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }

    return null;
  },

  // Element.matches() polyfill for IE11
  matches: function (element: Element, selector: string): boolean {
    if (!element || !selector) {
      return false;
    }

    // Use native method if available
    if (element.matches) {
      return element.matches(selector);
    }

    // IE11 fallback using msMatchesSelector
    if ((element as any).msMatchesSelector) {
      return (element as any).msMatchesSelector(selector);
    }

    // Fallback using querySelectorAll
    if (element.parentNode) {
      var matches = element.parentNode.querySelectorAll(selector);
      for (var i = 0; i < matches.length; i++) {
        if (matches[i] === element) {
          return true;
        }
      }
    }

    return false;
  },

  // classList polyfill for IE11
  hasClass: function (element: Element, className: string): boolean {
    if (!element || !className) {
      return false;
    }

    if (element.classList) {
      return element.classList.contains(className);
    }

    // IE11 fallback
    var classes = element.className.split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return true;
      }
    }

    return false;
  },

  addClass: function (element: Element, className: string): void {
    if (!element || !className) {
      return;
    }

    if (element.classList) {
      element.classList.add(className);
      return;
    }

    // IE11 fallback
    if (!DOMUtils.hasClass(element, className)) {
      element.className = (element.className + " " + className).trim();
    }
  },

  removeClass: function (element: Element, className: string): void {
    if (!element || !className) {
      return;
    }

    if (element.classList) {
      element.classList.remove(className);
      return;
    }

    // IE11 fallback
    var classes = element.className.split(/\s+/);
    var newClasses = [];
    for (var i = 0; i < classes.length; i++) {
      if (classes[i] !== className) {
        newClasses.push(classes[i]);
      }
    }
    element.className = newClasses.join(" ");
  },

  toggleClass: function (element: Element, className: string): boolean {
    if (!element || !className) {
      return false;
    }

    if (element.classList) {
      return element.classList.toggle(className);
    }

    // IE11 fallback
    var hasClass = DOMUtils.hasClass(element, className);
    if (hasClass) {
      DOMUtils.removeClass(element, className);
    } else {
      DOMUtils.addClass(element, className);
    }

    return !hasClass;
  },

  // Custom data attributes for IE11
  getDataAttribute: function (
    element: Element,
    attributeName: string
  ): string | null {
    if (!element || !attributeName) {
      return null;
    }

    // Use dataset if available
    if ((element as any).dataset) {
      return (element as any).dataset[attributeName] || null;
    }

    // IE11 fallback
    var dataAttr =
      "data-" +
      attributeName.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
      });

    return element.getAttribute(dataAttr);
  },

  setDataAttribute: function (
    element: Element,
    attributeName: string,
    value: string
  ): void {
    if (!element || !attributeName) {
      return;
    }

    // Use dataset if available
    if ((element as any).dataset) {
      (element as any).dataset[attributeName] = value;
      return;
    }

    // IE11 fallback
    var dataAttr =
      "data-" +
      attributeName.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
      });

    element.setAttribute(dataAttr, value);
  },

  // NodeList iteration for IE11
  forEach: function <T extends Node>(
    nodeList: NodeListOf<T> | T[],
    callback: (node: T, index: number) => void
  ): void {
    if (!nodeList || !callback) {
      return;
    }

    // Use native forEach if available
    if ((nodeList as any).forEach) {
      (nodeList as any).forEach(callback);
      return;
    }

    // IE11 fallback
    for (var i = 0; i < nodeList.length; i++) {
      callback(nodeList[i], i);
    }
  },

  // Convert NodeList to Array for IE11
  toArray: function <T extends Node>(nodeList: NodeListOf<T>): T[] {
    if (!nodeList) {
      return [];
    }

    // Use Array.from if available
    if (Array.from) {
      return Array.from(nodeList);
    }

    // IE11 fallback
    var array: T[] = [];
    for (var i = 0; i < nodeList.length; i++) {
      array.push(nodeList[i]);
    }

    return array;
  },

  // Check if element is visible
  isVisible: function (element: Element): boolean {
    if (!element) {
      return false;
    }

    // Check display style
    var style = window.getComputedStyle
      ? window.getComputedStyle(element)
      : (element as any).currentStyle;

    if (style) {
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
    }

    // Check if element has dimensions
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  },

  // Get element position
  getPosition: function (element: Element): { top: number; left: number } {
    if (!element) {
      return { top: 0, left: 0 };
    }

    var rect = element.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
    };
  },

  // Get element size
  getSize: function (element: Element): { width: number; height: number } {
    if (!element) {
      return { width: 0, height: 0 };
    }

    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  },

  // Check if element contains another element
  contains: function (parent: Element, child: Element): boolean {
    if (!parent || !child) {
      return false;
    }

    // Use native contains if available
    if (parent.contains) {
      return parent.contains(child);
    }

    // IE11 fallback
    var currentNode = child.parentNode;
    while (currentNode) {
      if (currentNode === parent) {
        return true;
      }
      currentNode = currentNode.parentNode;
    }

    return false;
  },

  // Get all text content from element
  getTextContent: function (element: Element): string {
    if (!element) {
      return "";
    }

    // Use textContent if available
    if (element.textContent !== undefined) {
      return element.textContent;
    }

    // IE11 fallback
    if ((element as any).innerText !== undefined) {
      return (element as any).innerText;
    }

    return "";
  },

  // Set text content for element
  setTextContent: function (element: Element, text: string): void {
    if (!element) {
      return;
    }

    // Use textContent if available
    if (element.textContent !== undefined) {
      element.textContent = text;
      return;
    }

    // IE11 fallback
    if ((element as any).innerText !== undefined) {
      (element as any).innerText = text;
      return;
    }
  },

  // Create element with attributes
  createElement: function (
    tagName: string,
    attributes?: { [key: string]: string }
  ): Element {
    var element = document.createElement(tagName);

    if (attributes) {
      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          element.setAttribute(key, attributes[key]);
        }
      }
    }

    return element;
  },

  // Remove element from DOM
  remove: function (element: Element): void {
    if (!element) {
      return;
    }

    // Use native remove if available
    if (element.remove) {
      element.remove();
      return;
    }

    // IE11 fallback
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },

  // Insert element after another element
  insertAfter: function (newElement: Element, targetElement: Element): void {
    if (!newElement || !targetElement || !targetElement.parentNode) {
      return;
    }

    var parent = targetElement.parentNode;
    var nextSibling = targetElement.nextSibling;

    if (nextSibling) {
      parent.insertBefore(newElement, nextSibling);
    } else {
      parent.appendChild(newElement);
    }
  },

  // Get viewport size
  getViewportSize: function (): { width: number; height: number } {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight,
    };
  },

  // Check if element is in viewport
  isInViewport: function (element: Element): boolean {
    if (!element) {
      return false;
    }

    var rect = element.getBoundingClientRect();
    var viewport = DOMUtils.getViewportSize();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewport.height &&
      rect.right <= viewport.width
    );
  },
};

export { DOMUtils };
