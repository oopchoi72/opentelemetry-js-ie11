// IE11 Performance Data Batcher
// Implements batching for DOM updates and data operations to optimize IE11 performance

export interface BatchConfig {
  maxBatchSize?: number;
  flushInterval?: number;
  enableAutoFlush?: boolean;
  priority?: "high" | "normal" | "low";
}

export interface BatchItem<T = any> {
  id: string;
  data: T;
  timestamp: number;
  priority: "high" | "normal" | "low";
  retryCount?: number;
}

export interface BatchProcessor<T = any> {
  (items: BatchItem<T>[]): Promise<void> | void;
}

export interface DOMBatchOperation {
  type: "insert" | "update" | "remove" | "style" | "attribute";
  element: Element | string; // Element or selector
  data: any;
  priority: "high" | "normal" | "low";
}

var DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 50,
  flushInterval: 100, // 100ms for IE11 optimization
  enableAutoFlush: true,
  priority: "normal",
};

// Generic data batcher
export function createDataBatcher<T = any>(
  processor: BatchProcessor<T>,
  config?: BatchConfig
) {
  var cfg = Object.assign({}, DEFAULT_BATCH_CONFIG, config || {});
  var batch: BatchItem<T>[] = [];
  var flushTimer: any = null;
  var isProcessing = false;
  var itemCounter = 0;

  function generateId(): string {
    return "batch_" + Date.now() + "_" + ++itemCounter;
  }

  function scheduleFlush(): void {
    if (flushTimer || !cfg.enableAutoFlush) {
      return;
    }

    flushTimer = setTimeout(function () {
      flush();
    }, cfg.flushInterval);
  }

  function clearFlushTimer(): void {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }

  function sortBatchByPriority(): void {
    batch.sort(function (a, b) {
      var priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  function add(data: T, priority?: "high" | "normal" | "low"): string {
    var item: BatchItem<T> = {
      id: generateId(),
      data: data,
      timestamp: Date.now(),
      priority: priority || cfg.priority || "normal",
      retryCount: 0,
    };

    batch.push(item);

    // Auto-flush if batch is full
    if (batch.length >= (cfg.maxBatchSize || 50)) {
      clearFlushTimer();
      flush();
    } else {
      scheduleFlush();
    }

    return item.id;
  }

  function flush(): Promise<void> {
    return new Promise(function (resolve, reject) {
      if (isProcessing || batch.length === 0) {
        resolve();
        return;
      }

      clearFlushTimer();
      isProcessing = true;

      var currentBatch = batch.slice();
      batch = [];

      // Sort by priority for IE11 optimization
      sortBatchByPriority();

      try {
        var result = processor(currentBatch);

        if (result && typeof result.then === "function") {
          result
            .then(function () {
              isProcessing = false;
              resolve();
            })
            .catch(function (error) {
              isProcessing = false;
              // Re-add failed items to batch for retry
              batch = currentBatch.concat(batch);
              reject(error);
            });
        } else {
          isProcessing = false;
          resolve();
        }
      } catch (error) {
        isProcessing = false;
        // Re-add failed items to batch for retry
        batch = currentBatch.concat(batch);
        reject(error);
      }
    });
  }

  function clear(): void {
    clearFlushTimer();
    batch = [];
  }

  function size(): number {
    return batch.length;
  }

  function isEmpty(): boolean {
    return batch.length === 0;
  }

  return {
    add: add,
    flush: flush,
    clear: clear,
    size: size,
    isEmpty: isEmpty,
  };
}

// DOM-specific batcher for IE11 optimization
export function createDOMBatcher(config?: BatchConfig) {
  var cfg = Object.assign({}, DEFAULT_BATCH_CONFIG, config || {});

  function processDOMBatch(items: BatchItem<DOMBatchOperation>[]): void {
    // Use DocumentFragment for efficient DOM manipulation in IE11
    var fragment = document.createDocumentFragment();
    var styleUpdates: { element: Element; styles: any }[] = [];
    var attributeUpdates: { element: Element; attributes: any }[] = [];
    var removals: Element[] = [];

    // Group operations by type for optimal batching
    var insertions: { element: Element; parent: Element }[] = [];
    var updates: { element: Element; content: any }[] = [];

    items.forEach(function (item) {
      var operation = item.data;
      var element: Element | null = null;

      // Resolve element if selector is provided
      if (typeof operation.element === "string") {
        element = document.querySelector(operation.element);
        if (!element) {
          console.warn("Element not found for selector:", operation.element);
          return;
        }
      } else {
        element = operation.element;
      }

      // At this point, element is guaranteed to be non-null
      var targetElement = element as Element;

      switch (operation.type) {
        case "insert":
          if (operation.data.parent) {
            insertions.push({
              element: targetElement,
              parent: operation.data.parent,
            });
          }
          break;

        case "update":
          updates.push({
            element: targetElement,
            content: operation.data.content,
          });
          break;

        case "remove":
          removals.push(targetElement);
          break;

        case "style":
          styleUpdates.push({
            element: targetElement,
            styles: operation.data.styles,
          });
          break;

        case "attribute":
          attributeUpdates.push({
            element: targetElement,
            attributes: operation.data.attributes,
          });
          break;
      }
    });

    // Process operations in optimal order for IE11

    // 1. Remove elements first
    removals.forEach(function (element) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // 2. Update content
    updates.forEach(function (update) {
      if (typeof update.content === "string") {
        update.element.innerHTML = update.content;
      } else if (update.content.textContent) {
        update.element.textContent = update.content.textContent;
      }
    });

    // 3. Batch style updates to minimize reflows
    styleUpdates.forEach(function (update) {
      var element = update.element as HTMLElement;
      for (var property in update.styles) {
        if (update.styles.hasOwnProperty(property)) {
          element.style[property as any] = update.styles[property];
        }
      }
    });

    // 4. Batch attribute updates
    attributeUpdates.forEach(function (update) {
      for (var attribute in update.attributes) {
        if (update.attributes.hasOwnProperty(attribute)) {
          update.element.setAttribute(attribute, update.attributes[attribute]);
        }
      }
    });

    // 5. Insert new elements using DocumentFragment
    if (insertions.length > 0) {
      var fragmentsByParent: {
        [key: string]: { parent: Element; elements: Element[] };
      } = {};

      insertions.forEach(function (insertion) {
        var parentKey =
          insertion.parent.tagName + "_" + (insertion.parent.id || "no_id");
        if (!fragmentsByParent[parentKey]) {
          fragmentsByParent[parentKey] = {
            parent: insertion.parent,
            elements: [],
          };
        }
        fragmentsByParent[parentKey].elements.push(insertion.element);
      });

      // Insert elements by parent to minimize DOM operations
      for (var parentKey in fragmentsByParent) {
        if (fragmentsByParent.hasOwnProperty(parentKey)) {
          var group = fragmentsByParent[parentKey];
          var parentFragment = document.createDocumentFragment();

          group.elements.forEach(function (element) {
            parentFragment.appendChild(element);
          });

          group.parent.appendChild(parentFragment);
        }
      }
    }
  }

  var batcher = createDataBatcher<DOMBatchOperation>(processDOMBatch, cfg);

  function addInsertion(
    element: Element,
    parent: Element,
    priority?: "high" | "normal" | "low"
  ): string {
    return batcher.add(
      {
        type: "insert",
        element: element,
        data: { parent: parent },
        priority: priority || "normal",
      },
      priority
    );
  }

  function addUpdate(
    element: Element | string,
    content: any,
    priority?: "high" | "normal" | "low"
  ): string {
    return batcher.add(
      {
        type: "update",
        element: element,
        data: { content: content },
        priority: priority || "normal",
      },
      priority
    );
  }

  function addRemoval(
    element: Element | string,
    priority?: "high" | "normal" | "low"
  ): string {
    return batcher.add(
      {
        type: "remove",
        element: element,
        data: {},
        priority: priority || "normal",
      },
      priority
    );
  }

  function addStyleUpdate(
    element: Element | string,
    styles: any,
    priority?: "high" | "normal" | "low"
  ): string {
    return batcher.add(
      {
        type: "style",
        element: element,
        data: { styles: styles },
        priority: priority || "normal",
      },
      priority
    );
  }

  function addAttributeUpdate(
    element: Element | string,
    attributes: any,
    priority?: "high" | "normal" | "low"
  ): string {
    return batcher.add(
      {
        type: "attribute",
        element: element,
        data: { attributes: attributes },
        priority: priority || "normal",
      },
      priority
    );
  }

  return {
    addInsertion: addInsertion,
    addUpdate: addUpdate,
    addRemoval: addRemoval,
    addStyleUpdate: addStyleUpdate,
    addAttributeUpdate: addAttributeUpdate,
    flush: batcher.flush,
    clear: batcher.clear,
    size: batcher.size,
    isEmpty: batcher.isEmpty,
  };
}

// Event batching for high-frequency events
export function createEventBatcher(config?: BatchConfig) {
  var cfg = Object.assign({}, DEFAULT_BATCH_CONFIG, config || {});
  cfg.flushInterval = cfg.flushInterval || 16; // ~60fps for events

  function processEventBatch(items: BatchItem<Event>[]): void {
    // Group events by type for efficient processing
    var eventGroups: { [key: string]: Event[] } = {};

    items.forEach(function (item) {
      var event = item.data;
      var eventType = event.type;

      if (!eventGroups[eventType]) {
        eventGroups[eventType] = [];
      }
      eventGroups[eventType].push(event);
    });

    // Process events by type
    for (var eventType in eventGroups) {
      if (eventGroups.hasOwnProperty(eventType)) {
        var events = eventGroups[eventType];

        // For high-frequency events, only process the latest
        if (
          eventType === "mousemove" ||
          eventType === "scroll" ||
          eventType === "resize"
        ) {
          events = [events[events.length - 1]];
        }

        events.forEach(function (event) {
          // Process individual event
          if (typeof console !== "undefined" && console.log) {
            console.log("Processing batched event:", event.type);
          }
        });
      }
    }
  }

  return createDataBatcher<Event>(processEventBatch, cfg);
}

// Global DOM batcher instance
var globalDOMBatcher: ReturnType<typeof createDOMBatcher> | null = null;

// Initialize global DOM batcher
export function initializeGlobalDOMBatcher(config?: BatchConfig): void {
  globalDOMBatcher = createDOMBatcher(config);
}

// Get global DOM batcher
export function getGlobalDOMBatcher(): ReturnType<
  typeof createDOMBatcher
> | null {
  return globalDOMBatcher;
}

// Utility function for batched DOM operations
export function batchDOMOperations(
  operations: (() => void)[],
  config?: BatchConfig
): Promise<void> {
  var batcher = createDOMBatcher(config);

  operations.forEach(function (operation, index) {
    batcher.addUpdate(document.body, { operation: operation }, "normal");
  });

  return batcher.flush();
}
