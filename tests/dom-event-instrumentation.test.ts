// DOM Event Instrumentation Tests for IE11
import {
  createDOMEventInstrumentation,
  instrumentDocument,
  instrumentWindow,
  autoInstrument,
  DOMEventConfig,
  DOMEventData,
  DOMEventHandler,
} from "../src/web/dom-event-instrumentation";

// Mock DOM environment for testing
class MockElement {
  public tagName = "div";
  public id = "";
  public className = "";
  public nodeType = 1;
  private listeners: { [key: string]: EventListener[] } = {};

  addEventListener(
    type: string,
    listener: EventListener,
    useCapture?: boolean
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    useCapture?: boolean
  ): void {
    if (this.listeners[type]) {
      const index = this.listeners[type].indexOf(listener);
      if (index !== -1) {
        this.listeners[type].splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event): void {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach((listener) => {
        listener(event);
      });
    }
  }
}

class MockEvent {
  public type: string;
  public target: MockElement;
  public bubbles = true;
  public defaultPrevented = false;
  public isTrusted = true;

  constructor(type: string, target: MockElement) {
    this.type = type;
    this.target = target;
  }
}

describe("DOM Event Instrumentation", () => {
  let mockElement: MockElement;

  beforeEach(() => {
    mockElement = new MockElement();
  });

  describe("createDOMEventInstrumentation", () => {
    it("should create instrumentation with default config", () => {
      const instrumentation = createDOMEventInstrumentation();

      expect(instrumentation).toBeDefined();
      expect(typeof instrumentation.instrument).toBe("function");
      expect(typeof instrumentation.uninstrument).toBe("function");
      expect(typeof instrumentation.addHandler).toBe("function");
      expect(typeof instrumentation.removeHandler).toBe("function");
      expect(typeof instrumentation.getEventHistory).toBe("function");
      expect(typeof instrumentation.clearHistory).toBe("function");
      expect(typeof instrumentation.destroy).toBe("function");
    });

    it("should create instrumentation with custom config", () => {
      const config: DOMEventConfig = {
        trackedEvents: ["click", "mouseover"],
        capturePhase: false,
        bubblePhase: true,
        enableTiming: false,
        maxEventHistory: 500,
        throttleInterval: 32,
      };

      const instrumentation = createDOMEventInstrumentation(config);
      expect(instrumentation).toBeDefined();
    });

    it("should track events when instrumented", (done) => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
        enableTiming: true,
      });

      const eventData: DOMEventData[] = [];
      const handler: DOMEventHandler = (data) => {
        eventData.push(data);
      };

      instrumentation.addHandler(handler);
      instrumentation.instrument(mockElement as any);

      // Simulate adding event listener
      const clickListener = jest.fn();
      mockElement.addEventListener("click", clickListener);

      // Simulate event
      const mockEvent = new MockEvent("click", mockElement);
      mockElement.dispatchEvent(mockEvent as any);

      setTimeout(() => {
        expect(eventData.length).toBe(1);
        expect(eventData[0].type).toBe("click");
        expect(eventData[0].target).toBe("div");
        expect(eventData[0].phase).toBe("bubbling");
        expect(typeof eventData[0].timestamp).toBe("number");
        done();
      }, 50);
    });

    it("should handle event listener removal", () => {
      const instrumentation = createDOMEventInstrumentation();
      instrumentation.instrument(mockElement as any);

      const clickListener = jest.fn();
      mockElement.addEventListener("click", clickListener);
      mockElement.removeEventListener("click", clickListener);

      // Should not throw error
      expect(() => {
        const mockEvent = new MockEvent("click", mockElement);
        mockElement.dispatchEvent(mockEvent as any);
      }).not.toThrow();
    });

    it("should filter events by tracked types", (done) => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"], // Only track clicks
      });

      const eventData: DOMEventData[] = [];
      const handler: DOMEventHandler = (data) => {
        eventData.push(data);
      };

      instrumentation.addHandler(handler);
      instrumentation.instrument(mockElement as any);

      // Add listeners for both events
      mockElement.addEventListener("click", jest.fn());
      mockElement.addEventListener("mouseover", jest.fn());

      // Dispatch both events
      const clickEvent = new MockEvent("click", mockElement);
      const mouseoverEvent = new MockEvent("mouseover", mockElement);

      mockElement.dispatchEvent(clickEvent as any);
      mockElement.dispatchEvent(mouseoverEvent as any);

      setTimeout(() => {
        expect(eventData.length).toBe(1);
        expect(eventData[0].type).toBe("click");
        done();
      }, 50);
    });

    it("should limit event history size", () => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
        maxEventHistory: 3,
      });

      instrumentation.instrument(mockElement as any);
      mockElement.addEventListener("click", jest.fn());

      // Dispatch 5 events
      for (let i = 0; i < 5; i++) {
        const mockEvent = new MockEvent("click", mockElement);
        mockElement.dispatchEvent(mockEvent as any);
      }

      const history = instrumentation.getEventHistory();
      expect(history.length).toBe(3);
    });

    it("should handle element selector generation", () => {
      mockElement.id = "test-element";
      mockElement.className = "class1 class2 class3";

      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
      });

      const eventData: DOMEventData[] = [];
      const handler: DOMEventHandler = (data) => {
        eventData.push(data);
      };

      instrumentation.addHandler(handler);
      instrumentation.instrument(mockElement as any);
      mockElement.addEventListener("click", jest.fn());

      const mockEvent = new MockEvent("click", mockElement);
      mockElement.dispatchEvent(mockEvent as any);

      setTimeout(() => {
        expect(eventData[0].target).toBe("div#test-element");
      }, 50);
    });

    it("should uninstrument elements", () => {
      const instrumentation = createDOMEventInstrumentation();

      const originalAddEventListener = mockElement.addEventListener;
      instrumentation.instrument(mockElement as any);

      // Should have been patched
      expect(mockElement.addEventListener).not.toBe(originalAddEventListener);

      instrumentation.uninstrument(mockElement as any);

      // Should restore original method
      expect(mockElement.addEventListener).toBe(originalAddEventListener);
    });

    it("should handle handler management", () => {
      const instrumentation = createDOMEventInstrumentation();

      const handler1: DOMEventHandler = jest.fn();
      const handler2: DOMEventHandler = jest.fn();

      instrumentation.addHandler(handler1);
      instrumentation.addHandler(handler2);

      // Should not add duplicate handlers
      instrumentation.addHandler(handler1);

      instrumentation.removeHandler(handler1);

      // Test by triggering an event and checking if handlers are called
      instrumentation.instrument(mockElement as any);
      mockElement.addEventListener("click", jest.fn());

      const mockEvent = new MockEvent("click", mockElement);
      mockElement.dispatchEvent(mockEvent as any);

      setTimeout(() => {
        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
      }, 50);
    });

    it("should clear event history", () => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
      });

      instrumentation.instrument(mockElement as any);
      mockElement.addEventListener("click", jest.fn());

      const mockEvent = new MockEvent("click", mockElement);
      mockElement.dispatchEvent(mockEvent as any);

      setTimeout(() => {
        expect(instrumentation.getEventHistory().length).toBeGreaterThan(0);

        instrumentation.clearHistory();
        expect(instrumentation.getEventHistory().length).toBe(0);
      }, 50);
    });

    it("should destroy instrumentation properly", () => {
      const instrumentation = createDOMEventInstrumentation();

      const handler: DOMEventHandler = jest.fn();
      instrumentation.addHandler(handler);
      instrumentation.instrument(mockElement as any);

      instrumentation.destroy();

      // Should not process events after destruction
      mockElement.addEventListener("click", jest.fn());
      const mockEvent = new MockEvent("click", mockElement);
      mockElement.dispatchEvent(mockEvent as any);

      setTimeout(() => {
        expect(handler).not.toHaveBeenCalled();
        expect(instrumentation.getEventHistory().length).toBe(0);
      }, 50);
    });
  });

  describe("Helper functions", () => {
    it("instrumentDocument should work", () => {
      // Mock document for testing
      const mockDocument = new MockElement();
      (global as any).document = mockDocument;

      const instrumentation = instrumentDocument({
        trackedEvents: ["click"],
      });

      expect(instrumentation).toBeDefined();

      // Clean up
      delete (global as any).document;
    });

    it("instrumentWindow should work", () => {
      // Mock window for testing
      const mockWindow = new MockElement();
      (global as any).window = mockWindow;

      const instrumentation = instrumentWindow({
        trackedEvents: ["resize"],
      });

      expect(instrumentation).toBeDefined();

      // Clean up
      delete (global as any).window;
    });

    it("autoInstrument should create both document and window instrumentations", () => {
      // Mock both document and window
      const mockDocument = new MockElement();
      const mockWindow = new MockElement();
      (global as any).document = mockDocument;
      (global as any).window = mockWindow;

      const result = autoInstrument({
        trackedEvents: ["click", "resize"],
      });

      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.window).toBeDefined();
      expect(typeof result.destroy).toBe("function");

      // Test destroy
      result.destroy();

      // Clean up
      delete (global as any).document;
      delete (global as any).window;
    });
  });

  describe("IE11 specific features", () => {
    it("should handle IE11 event options compatibility", () => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
        capturePhase: true,
        bubblePhase: true,
      });

      instrumentation.instrument(mockElement as any);

      // Test boolean capture option (IE11 style)
      mockElement.addEventListener("click", jest.fn(), true);
      mockElement.addEventListener("click", jest.fn(), false);

      // Should not throw errors
      expect(() => {
        const mockEvent = new MockEvent("click", mockElement);
        mockElement.dispatchEvent(mockEvent as any);
      }).not.toThrow();
    });

    it("should handle throttling for high frequency events", (done) => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["mousemove", "scroll"],
        throttleInterval: 50,
      });

      const eventData: DOMEventData[] = [];
      const handler: DOMEventHandler = (data) => {
        eventData.push(data);
      };

      instrumentation.addHandler(handler);
      instrumentation.instrument(mockElement as any);
      mockElement.addEventListener("mousemove", jest.fn());

      // Dispatch multiple mousemove events rapidly
      for (let i = 0; i < 10; i++) {
        const mockEvent = new MockEvent("mousemove", mockElement);
        mockElement.dispatchEvent(mockEvent as any);
      }

      // Should be throttled
      setTimeout(() => {
        expect(eventData.length).toBeLessThan(10);
        done();
      }, 100);
    });

    it("should handle error in event handlers gracefully", () => {
      const instrumentation = createDOMEventInstrumentation({
        trackedEvents: ["click"],
      });

      const errorHandler: DOMEventHandler = () => {
        throw new Error("Test error");
      };

      const goodHandler: DOMEventHandler = jest.fn();

      instrumentation.addHandler(errorHandler);
      instrumentation.addHandler(goodHandler);
      instrumentation.instrument(mockElement as any);

      mockElement.addEventListener("click", jest.fn());

      // Should not break when one handler throws
      expect(() => {
        const mockEvent = new MockEvent("click", mockElement);
        mockElement.dispatchEvent(mockEvent as any);
      }).not.toThrow();

      setTimeout(() => {
        expect(goodHandler).toHaveBeenCalled();
      }, 50);
    });
  });
});
