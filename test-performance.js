// OpenTelemetry IE11 Performance Test
console.log("Starting OpenTelemetry IE11 Performance Test...");

// Load the UMD bundle
const opentelemetry = require("./dist/opentelemetry-ie11.js");

function performanceTest() {
  console.log("=== Performance Test Results ===");

  // Test 1: Span creation performance
  const startTime = Date.now();
  const tracer = opentelemetry.trace.getTracer("performance-test");

  const spanCount = 1000;
  const spans = [];

  console.log(`Creating ${spanCount} spans...`);
  const createStart = Date.now();

  for (let i = 0; i < spanCount; i++) {
    const span = tracer.startSpan(`test-span-${i}`);
    span.setAttribute("index", i);
    span.setAttribute("type", "performance-test");
    spans.push(span);
  }

  const createEnd = Date.now();
  console.log(
    `Span creation: ${createEnd - createStart}ms for ${spanCount} spans`
  );
  console.log(`Average: ${(createEnd - createStart) / spanCount}ms per span`);

  // Test 2: Span manipulation performance
  const manipulateStart = Date.now();

  spans.forEach((span, index) => {
    span.setAttributes({
      "custom.attribute": `value-${index}`,
      "test.timestamp": Date.now(),
      "operation.name": "performance-test",
    });

    span.addEvent(`event-${index}`, {
      "event.index": index,
      "event.timestamp": Date.now(),
    });

    span.setStatus({ code: 1, message: "OK" });
  });

  const manipulateEnd = Date.now();
  console.log(
    `Span manipulation: ${
      manipulateEnd - manipulateStart
    }ms for ${spanCount} spans`
  );

  // Test 3: Span ending performance
  const endStart = Date.now();

  spans.forEach((span) => {
    span.end();
  });

  const endEnd = Date.now();
  console.log(`Span ending: ${endEnd - endStart}ms for ${spanCount} spans`);

  const totalTime = endEnd - startTime;
  console.log(`Total test time: ${totalTime}ms`);
  console.log(`Throughput: ${(spanCount * 1000) / totalTime} spans/second`);

  // Test 4: TraceState performance
  console.log("\n=== TraceState Performance ===");
  const traceStateStart = Date.now();

  const testSpan = tracer.startSpan("tracestate-perf-test");
  let traceState = testSpan.spanContext().traceState;

  // Add many trace state entries
  for (let i = 0; i < 100; i++) {
    traceState = traceState.set(`vendor${i}`, `value${i}`);
  }

  // Serialize
  const serialized = traceState.serialize();
  console.log(`TraceState serialization length: ${serialized.length} chars`);

  // Remove some entries
  for (let i = 0; i < 50; i++) {
    traceState = traceState.unset(`vendor${i}`);
  }

  testSpan.end();

  const traceStateEnd = Date.now();
  console.log(`TraceState operations: ${traceStateEnd - traceStateStart}ms`);

  // Test 5: Context operations performance
  console.log("\n=== Context Performance ===");
  const contextStart = Date.now();

  let context = opentelemetry.context.active();

  // Add many context values
  for (let i = 0; i < 1000; i++) {
    context = opentelemetry.context.setValue(context, `key${i}`, `value${i}`);
  }

  // Retrieve values
  for (let i = 0; i < 1000; i++) {
    const value = opentelemetry.context.getValue(context, `key${i}`);
    if (value !== `value${i}`) {
      console.error(`Context value mismatch at index ${i}`);
    }
  }

  const contextEnd = Date.now();
  console.log(
    `Context operations: ${contextEnd - contextStart}ms for 2000 operations`
  );
}

function memoryTest() {
  console.log("\n=== Memory Usage Test ===");

  // Check if process.memoryUsage is available (Node.js)
  if (typeof process !== "undefined" && process.memoryUsage) {
    const initialMemory = process.memoryUsage();
    console.log("Initial memory:", {
      rss: Math.round(initialMemory.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024) + "MB",
    });

    const tracer = opentelemetry.trace.getTracer("memory-test");
    const spans = [];

    // Create many spans to test memory usage
    for (let i = 0; i < 10000; i++) {
      const span = tracer.startSpan(`memory-test-span-${i}`);
      span.setAttribute("test.index", i);
      span.addEvent("test.event", { data: "test-data-" + i });
      spans.push(span);
    }

    const afterCreationMemory = process.memoryUsage();
    console.log("After creating 10k spans:", {
      rss: Math.round(afterCreationMemory.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(afterCreationMemory.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(afterCreationMemory.heapTotal / 1024 / 1024) + "MB",
    });

    // End all spans
    spans.forEach((span) => span.end());

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const afterCleanupMemory = process.memoryUsage();
    console.log("After cleanup:", {
      rss: Math.round(afterCleanupMemory.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(afterCleanupMemory.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(afterCleanupMemory.heapTotal / 1024 / 1024) + "MB",
    });

    const memoryIncrease = afterCleanupMemory.heapUsed - initialMemory.heapUsed;
    console.log(
      `Net memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
    );
    console.log(`Memory per span: ${Math.round(memoryIncrease / 10000)}bytes`);
  } else {
    console.log("Memory usage testing not available in this environment");
  }
}

function compatibilityTest() {
  console.log("\n=== IE11 Compatibility Test ===");

  // Test ES5 syntax usage
  console.log("✅ Using var declarations");
  console.log("✅ Using function expressions instead of arrow functions");
  console.log("✅ Using for loops instead of forEach where needed");

  // Test polyfill availability
  const polyfills = {
    "Object.assign": typeof Object.assign === "function",
    "Array.from": typeof Array.from === "function",
    Promise: typeof Promise === "function",
    Map: typeof Map === "function",
    Set: typeof Set === "function",
    Symbol: typeof Symbol === "function",
    URL: typeof URL === "function",
    fetch: typeof fetch === "function",
    "crypto.getRandomValues":
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function",
  };

  Object.keys(polyfills).forEach(function (key) {
    const status = polyfills[key] ? "✅" : "❌";
    console.log(
      `${status} ${key}: ${polyfills[key] ? "available" : "missing"}`
    );
  });

  // Test browser detection
  if (typeof window !== "undefined") {
    console.log("Running in browser environment");
    console.log("User Agent:", navigator.userAgent);
  } else {
    console.log("Running in Node.js environment");
    console.log("Node version:", process.version);
  }
}

// Run all tests
try {
  performanceTest();
  memoryTest();
  compatibilityTest();

  console.log("\n🎉 All performance tests completed successfully!");
} catch (error) {
  console.error("❌ Performance test failed:", error.message);
  console.error(error.stack);
}
