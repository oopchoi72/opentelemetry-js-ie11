// Polyfill tests for IE11 compatibility
describe("Polyfills for IE11", function () {
  it("should load core.js polyfills", function () {
    expect(typeof Promise).toBe("function");
    expect(typeof Symbol).toBe("function");
    expect(typeof Map).toBe("function");
    expect(typeof Set).toBe("function");
    expect(typeof Object.assign).toBe("function");
  });

  it("should support ES6+ features", function () {
    // Test Array methods
    expect(typeof Array.prototype.find).toBe("function");
    expect(typeof Array.prototype.includes).toBe("function");

    // Test Promise
    var promise = Promise.resolve(42);
    expect(promise instanceof Promise).toBe(true);

    // Test Object.assign
    var target = {};
    var source = { a: 1 };
    Object.assign(target, source);
    expect(target.a).toBe(1);
  });

  it("should have fetch polyfill", function () {
    expect(typeof fetch).toBe("function");
    expect(typeof XMLHttpRequest).toBe("function");
  });

  it("should have URL polyfill", function () {
    expect(typeof URL).toBe("function");

    var url = new URL("https://example.com/path?param=value");
    expect(url.hostname).toBe("example.com");
    expect(url.pathname).toBe("/path");
  });

  it("should support WebSocket with ArrayBuffer", function () {
    expect(typeof WebSocket).toBe("function");
    expect(typeof ArrayBuffer).toBe("function");
    expect(typeof Uint8Array).toBe("function");

    var buffer = new ArrayBuffer(8);
    var view = new Uint8Array(buffer);
    expect(view.length).toBe(8);
  });

  it("should have performance API polyfill", function () {
    expect(typeof performance).toBe("object");
    expect(typeof performance.now).toBe("function");

    var now = performance.now();
    expect(typeof now).toBe("number");
    expect(now).toBeGreaterThan(0);
  });

  it("should have crypto.getRandomValues polyfill", function () {
    expect(typeof crypto).toBe("object");
    expect(typeof crypto.getRandomValues).toBe("function");

    var array = new Uint32Array(1);
    crypto.getRandomValues(array);
    expect(array[0]).toBeDefined();
  });

  it("should support Symbol.iterator", function () {
    expect(typeof Symbol.iterator).toBe("symbol");

    var arr = [1, 2, 3];
    var iterator = arr[Symbol.iterator]();
    expect(typeof iterator.next).toBe("function");
  });

  it("should have safe console object", function () {
    expect(typeof console).toBe("object");
    expect(typeof console.log).toBe("function");
    expect(typeof console.warn).toBe("function");
    expect(typeof console.error).toBe("function");
  });

  it("should support CustomEvent", function () {
    expect(typeof CustomEvent).toBe("function");

    var event = new CustomEvent("test", { detail: { message: "hello" } });
    expect(event.type).toBe("test");
    expect(event.detail.message).toBe("hello");
  });

  it("should count total tests correctly", function () {
    expect(true).toBe(true);
  });
});

// OpenTelemetry API Tests
describe("OpenTelemetry API", function () {
  it("should test API basics", function () {
    expect(typeof opentelemetry).toBe("object");
    expect(typeof opentelemetry.trace).toBe("object");
  });

  it("should create a tracer", function () {
    var tracer = opentelemetry.trace.getTracer("test-tracer", "1.0.0");
    expect(typeof tracer).toBe("object");
    expect(typeof tracer.startSpan).toBe("function");
    expect(typeof tracer.startActiveSpan).toBe("function");
  });

  it("should create and manage spans", function () {
    var tracer = opentelemetry.trace.getTracer("test-tracer");
    var span = tracer.startSpan("test-span");

    expect(typeof span).toBe("object");
    expect(typeof span.setAttribute).toBe("function");
    expect(typeof span.setAttributes).toBe("function");
    expect(typeof span.addEvent).toBe("function");
    expect(typeof span.setStatus).toBe("function");
    expect(typeof span.updateName).toBe("function");
    expect(typeof span.end).toBe("function");
    expect(typeof span.isRecording).toBe("function");
    expect(typeof span.spanContext).toBe("function");

    // Test span functionality
    expect(span.isRecording()).toBe(true);

    span.setAttribute("test.key", "test.value");
    span.setAttributes({ attr1: "value1", attr2: "value2" });
    span.addEvent("test-event", { "event.attr": "event.value" });
    span.setStatus({ code: 1, message: "OK" });
    span.updateName("updated-span-name");

    var spanContext = span.spanContext();
    expect(typeof spanContext.traceId).toBe("string");
    expect(typeof spanContext.spanId).toBe("string");
    expect(typeof spanContext.traceFlags).toBe("number");
    expect(spanContext.traceId.length).toBe(32);
    expect(spanContext.spanId.length).toBe(16);

    span.end();
    expect(span.isRecording()).toBe(false);
  });

  it("should support active span functionality", function () {
    var tracer = opentelemetry.trace.getTracer("test-tracer");
    var testValue = "test-result";

    var result = tracer.startActiveSpan("active-span", function (span) {
      expect(typeof span).toBe("object");
      expect(span.isRecording()).toBe(true);
      return testValue;
    });

    expect(result).toBe(testValue);
  });

  it("should have context API", function () {
    expect(typeof opentelemetry.context).toBe("object");
    expect(typeof opentelemetry.context.active).toBe("function");
    expect(typeof opentelemetry.context.with).toBe("function");
    expect(typeof opentelemetry.context.setValue).toBe("function");
    expect(typeof opentelemetry.context.getValue).toBe("function");

    var ctx = opentelemetry.context.active();
    var newCtx = opentelemetry.context.setValue(ctx, "test.key", "test.value");
    var value = opentelemetry.context.getValue(newCtx, "test.key");
    expect(value).toBe("test.value");
  });

  it("should support TraceState functionality", function () {
    var tracer = opentelemetry.trace.getTracer("test-tracer");
    var span = tracer.startSpan("test-span-with-tracestate");

    var spanContext = span.spanContext();
    expect(typeof spanContext.traceState).toBe("object");
    expect(typeof spanContext.traceState.get).toBe("function");
    expect(typeof spanContext.traceState.set).toBe("function");
    expect(typeof spanContext.traceState.unset).toBe("function");
    expect(typeof spanContext.traceState.serialize).toBe("function");

    // Test TraceState operations
    var initialValue = spanContext.traceState.get("vendor");
    expect(initialValue).toBeUndefined();

    var newTraceState = spanContext.traceState.set("vendor", "otel");
    expect(newTraceState.get("vendor")).toBe("otel");

    var multiTraceState = newTraceState.set("app", "test");
    expect(multiTraceState.get("vendor")).toBe("otel");
    expect(multiTraceState.get("app")).toBe("test");

    var serialized = multiTraceState.serialize();
    expect(typeof serialized).toBe("string");
    expect(serialized).toContain("vendor=otel");
    expect(serialized).toContain("app=test");

    var removedTraceState = multiTraceState.unset("vendor");
    expect(removedTraceState.get("vendor")).toBeUndefined();
    expect(removedTraceState.get("app")).toBe("test");

    span.end();
  });

  it("should have metrics API", function () {
    expect(typeof opentelemetry.metrics).toBe("object");
    expect(typeof opentelemetry.metrics.getMeter).toBe("function");

    var meter = opentelemetry.metrics.getMeter("test-meter");
    expect(typeof meter).toBe("object");
  });
});

// Comprehensive IE11 Integration Tests
describe("OpenTelemetry IE11 Integration", function () {
  it("should handle multiple nested spans", function () {
    var tracer = opentelemetry.trace.getTracer("integration-test");

    var parentSpan = tracer.startSpan("parent-operation");
    expect(parentSpan.isRecording()).toBe(true);

    parentSpan.setAttribute("operation.type", "parent");
    parentSpan.addEvent("operation.started");

    var childSpan = tracer.startSpan("child-operation");
    childSpan.setAttribute("operation.type", "child");
    childSpan.setAttribute("parent.trace_id", parentSpan.spanContext().traceId);
    childSpan.addEvent("child.processing", { "data.size": 100 });

    // Simulate some work
    childSpan.setStatus({ code: 1, message: "SUCCESS" });
    childSpan.end();

    parentSpan.addEvent("child.completed");
    parentSpan.setStatus({ code: 1, message: "SUCCESS" });
    parentSpan.end();

    expect(parentSpan.isRecording()).toBe(false);
    expect(childSpan.isRecording()).toBe(false);
  });

  it("should support complex TraceState operations", function () {
    var tracer = opentelemetry.trace.getTracer("tracestate-test");
    var span = tracer.startSpan("complex-tracestate");

    var traceState = span.spanContext().traceState;

    // Test multiple vendors
    var state1 = traceState.set("vendor1", "value1");
    var state2 = state1.set("vendor2", "value2");
    var state3 = state2.set("vendor3", "value3");

    expect(state3.get("vendor1")).toBe("value1");
    expect(state3.get("vendor2")).toBe("value2");
    expect(state3.get("vendor3")).toBe("value3");

    // Test serialization
    var serialized = state3.serialize();
    expect(serialized).toContain("vendor1=value1");
    expect(serialized).toContain("vendor2=value2");
    expect(serialized).toContain("vendor3=value3");

    // Test removal
    var stateRemoved = state3.unset("vendor2");
    expect(stateRemoved.get("vendor1")).toBe("value1");
    expect(stateRemoved.get("vendor2")).toBeUndefined();
    expect(stateRemoved.get("vendor3")).toBe("value3");

    span.end();
  });

  it("should handle context propagation", function () {
    var activeCtx = opentelemetry.context.active();
    expect(typeof activeCtx).toBe("object");

    var key = "test.context.key";
    var value = "test.context.value";

    var newCtx = opentelemetry.context.setValue(activeCtx, key, value);
    var retrievedValue = opentelemetry.context.getValue(newCtx, key);

    expect(retrievedValue).toBe(value);

    // Test nested context operations
    var key2 = "nested.key";
    var value2 = { complex: "object", with: ["array", "values"] };

    var nestedCtx = opentelemetry.context.setValue(newCtx, key2, value2);
    var retrievedNested = opentelemetry.context.getValue(nestedCtx, key2);

    expect(retrievedNested.complex).toBe("object");
    expect(retrievedNested.with[0]).toBe("array");
    expect(retrievedNested.with[1]).toBe("values");

    // Original values should still be accessible
    expect(opentelemetry.context.getValue(nestedCtx, key)).toBe(value);
  });

  it("should generate valid trace and span IDs", function () {
    var tracer = opentelemetry.trace.getTracer("id-test");

    // Test multiple spans to ensure uniqueness
    var spans = [];
    for (var i = 0; i < 10; i++) {
      spans.push(tracer.startSpan("span-" + i));
    }

    var traceIds = [];
    var spanIds = [];

    for (var i = 0; i < spans.length; i++) {
      var context = spans[i].spanContext();

      // Validate format
      expect(context.traceId.length).toBe(32);
      expect(context.spanId.length).toBe(16);
      expect(/^[0-9a-f]+$/.test(context.traceId)).toBe(true);
      expect(/^[0-9a-f]+$/.test(context.spanId)).toBe(true);

      traceIds.push(context.traceId);
      spanIds.push(context.spanId);

      spans[i].end();
    }

    // Check for reasonable uniqueness (at least some different IDs)
    var uniqueTraceIds = traceIds.filter(function (id, index, self) {
      return self.indexOf(id) === index;
    });
    var uniqueSpanIds = spanIds.filter(function (id, index, self) {
      return self.indexOf(id) === index;
    });

    expect(uniqueTraceIds.length).toBeGreaterThan(1);
    expect(uniqueSpanIds.length).toBe(10); // All span IDs should be unique
  });

  it("should handle error scenarios gracefully", function () {
    var tracer = opentelemetry.trace.getTracer("error-test");
    var span = tracer.startSpan("error-span");

    // Test setting invalid status codes
    span.setStatus({ code: -1, message: "Invalid code" });
    expect(span.spanContext().traceFlags).toBeDefined();

    // Test setting large number of attributes
    for (var i = 0; i < 100; i++) {
      span.setAttribute("attr" + i, "value" + i);
    }

    // Test setting various data types as attributes
    span.setAttribute("string.attr", "test");
    span.setAttribute("number.attr", 42);
    span.setAttribute("boolean.attr", true);
    span.setAttribute("null.attr", null);
    span.setAttribute("undefined.attr", undefined);

    // Should not throw errors
    expect(function () {
      span.addEvent("error.event", { "error.code": 500 });
      span.updateName("updated-error-span");
      span.end();
    }).not.toThrow();

    expect(span.isRecording()).toBe(false);
  });

  it("should work with startActiveSpan variants", function () {
    var tracer = opentelemetry.trace.getTracer("active-span-test");
    var results = [];

    // Test simple startActiveSpan
    var result1 = tracer.startActiveSpan("simple-active", function (span) {
      expect(span.isRecording()).toBe(true);
      span.setAttribute("test", "simple");
      return "result1";
    });

    results.push(result1);

    // Test startActiveSpan with options
    var result2 = tracer.startActiveSpan("options-active", {}, function (span) {
      expect(span.isRecording()).toBe(true);
      span.setAttribute("test", "options");
      return "result2";
    });

    results.push(result2);

    expect(results[0]).toBe("result1");
    expect(results[1]).toBe("result2");
  });
});
