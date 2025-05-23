// Test UMD module loading
console.log("Testing UMD module loading...");

try {
  // Test CommonJS style require
  const opentelemetry = require("./dist/opentelemetry-ie11.js");
  console.log("✅ CommonJS require success");
  console.log("opentelemetry.trace:", typeof opentelemetry.trace);
  console.log("opentelemetry.metrics:", typeof opentelemetry.metrics);
  console.log("opentelemetry.context:", typeof opentelemetry.context);

  // Test trace API
  if (opentelemetry.trace) {
    const tracer = opentelemetry.trace.getTracer("test-tracer");
    console.log("✅ Tracer creation success:", typeof tracer);

    if (tracer.startSpan) {
      const span = tracer.startSpan("test-span");
      console.log("✅ Span creation success:", typeof span);
      span.end();
    }
  }
} catch (error) {
  console.error("❌ Module loading failed:", error.message);
}
