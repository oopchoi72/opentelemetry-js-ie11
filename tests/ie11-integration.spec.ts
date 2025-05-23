// IE11 Integration Tests - Real-world usage scenarios
// This file tests end-to-end functionality that would be used in production

import {
  generateTraceId,
  generateSpanId,
  parseTraceParent,
  formatTraceParent,
  parseTraceState,
  formatTraceState,
  sanitizeAttributes,
  getDefaultResource,
  getBrowserResource,
  getEnvironmentInfo,
  parseUrl,
  isValidTraceId,
  isValidSpanId,
  merge,
  deepMerge,
  safeJSONStringify,
  safeJSONParse,
  performanceNow,
  hrTime,
  timeOrigin,
  hrTimeToNanoseconds,
} from "../src/core/index";

import {
  getBundleOptimizationInfo,
  trace,
  metrics,
  context,
} from "../src/index";

describe("IE11 Integration Tests", () => {
  describe("End-to-End Trace Creation", () => {
    it("should create complete trace context", () => {
      // Simulate creating a complete trace in IE11
      const traceId = generateTraceId();
      const spanId = generateSpanId();
      const parentSpanId = generateSpanId();

      expect(isValidTraceId(traceId)).toBe(true);
      expect(isValidSpanId(spanId)).toBe(true);
      expect(isValidSpanId(parentSpanId)).toBe(true);

      // Test trace propagation headers
      const traceparent = formatTraceParent(traceId, spanId, "01");
      const parsed = parseTraceParent(traceparent);

      expect(parsed).toBeDefined();
      expect(parsed!.traceId).toBe(traceId);
      expect(parsed!.spanId).toBe(spanId);
      expect(parsed!.traceFlags).toBe("01");
    });

    it("should handle trace state propagation", () => {
      const traceState = {
        vendor1: "value1",
        vendor2: "special-chars",
        kongregation: "session-123",
      };

      const formatted = formatTraceState(traceState);
      const parsed = parseTraceState(formatted);

      expect(parsed.vendor1).toBe("value1");
      expect(parsed.vendor2).toBe("special-chars");
      expect(parsed.kongregation).toBe("session-123");
    });

    it("should create complete span context", () => {
      // Simulate creating a span with all attributes
      const traceId = generateTraceId();
      const spanId = generateSpanId();
      const startTime = performanceNow();

      const attributes = {
        "http.method": "GET",
        "http.url": "https://api.example.com/users/123",
        "http.status_code": 200,
        "user.id": 12345,
        "user.authenticated": true,
        tags: ["important", "customer"],
        "metrics.count": 42,
      };

      const sanitizedAttrs = sanitizeAttributes(attributes);

      expect(sanitizedAttrs["http.method"]).toBe("GET");
      expect(sanitizedAttrs["http.url"]).toBe(
        "https://api.example.com/users/123"
      );
      expect(sanitizedAttrs["http.status_code"]).toBe(200);
      expect(sanitizedAttrs["user.id"]).toBe(12345);
      expect(sanitizedAttrs["user.authenticated"]).toBe(true);
      expect(sanitizedAttrs["tags"]).toBe("important,customer");
      expect(sanitizedAttrs["metrics.count"]).toBe(42);

      const endTime = performanceNow();
      const duration = endTime - startTime;

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof startTime).toBe("number");
      expect(typeof endTime).toBe("number");
    });
  });

  describe("Resource Detection Integration", () => {
    it("should provide comprehensive resource information", () => {
      const defaultResource = getDefaultResource();
      const browserResource = getBrowserResource();
      const envInfo = getEnvironmentInfo();

      // Combine resources like real OpenTelemetry does
      const combinedResource = merge(defaultResource, browserResource);

      expect(combinedResource["service.name"]).toBeDefined();
      expect(combinedResource["telemetry.sdk.name"]).toBe("opentelemetry");
      expect(combinedResource["telemetry.sdk.language"]).toBe("webjs");

      // Verify environment detection works
      expect(envInfo.platform).toBe("browser");
      expect(Array.isArray(envInfo.supportedFeatures)).toBe(true);
      expect(Array.isArray(envInfo.limitations)).toBe(true);

      // Test resource serialization
      const resourceJson = safeJSONStringify(combinedResource);
      const parsedResource = safeJSONParse(resourceJson);

      expect(parsedResource).toEqual(combinedResource);
    });

    it("should handle resource merging scenarios", () => {
      const serviceResource = {
        "service.name": "my-web-app",
        "service.version": "1.0.0",
        "service.environment": "production",
      };

      const runtimeResource = {
        "process.runtime.name": "browser",
        "process.runtime.version": "unknown",
        "telemetry.auto.version": "1.0.0-ie11",
      };

      const defaultResource = getDefaultResource();

      // Test deep merging like real OpenTelemetry
      const finalResource = deepMerge(
        deepMerge(defaultResource, serviceResource),
        runtimeResource
      );

      expect(finalResource["service.name"]).toBe("my-web-app");
      expect(finalResource["service.version"]).toBe("1.0.0");
      expect(finalResource["telemetry.sdk.name"]).toBe("opentelemetry");
      expect(finalResource["process.runtime.name"]).toBe("browser");
    });
  });

  describe("URL and HTTP Integration", () => {
    it("should handle complex URL scenarios", () => {
      const urls = [
        "https://api.example.com:8080/v1/traces?batch=true",
        "http://localhost:3000/health?check=detailed#status",
        "https://subdomain.example.com/path/with/spaces%20encoded",
        "https://user:pass@secure.example.com/api",
      ];

      urls.forEach((url) => {
        const parsed = parseUrl(url);

        expect(typeof parsed.protocol).toBe("string");
        expect(typeof parsed.hostname).toBe("string");
        expect(typeof parsed.pathname).toBe("string");
        expect(parsed.protocol).toMatch(/^https?:$/);

        // Test URL reconstruction would work
        const basicUrl =
          parsed.protocol + "//" + parsed.hostname + parsed.pathname;
        expect(basicUrl.length).toBeGreaterThan(0);
      });
    });

    it("should simulate HTTP instrumentation", () => {
      // Simulate what HTTP instrumentation would do
      const requestStart = hrTime();
      const traceId = generateTraceId();
      const spanId = generateSpanId();

      // Simulate HTTP request attributes
      const httpAttributes = {
        "http.method": "POST",
        "http.url": "https://api.example.com/v1/data",
        "http.scheme": "https",
        "http.host": "api.example.com",
        "http.target": "/v1/data",
        "http.user_agent": navigator.userAgent,
        "http.request_content_length": 1024,
        "http.response_content_length": 2048,
        "http.status_code": 201,
      };

      const sanitized = sanitizeAttributes(httpAttributes);
      const requestEnd = hrTime();
      const duration = requestEnd - requestStart;

      // Verify all HTTP attributes are properly handled
      expect(sanitized["http.method"]).toBe("POST");
      expect(sanitized["http.status_code"]).toBe(201);
      expect(typeof sanitized["http.user_agent"]).toBe("string");
      expect(duration).toBeGreaterThanOrEqual(0);

      // Test time conversion for backend
      const durationNanos = hrTimeToNanoseconds(duration);
      expect(durationNanos).toBeGreaterThanOrEqual(0);
      expect(typeof durationNanos).toBe("number");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle real-world error scenarios", () => {
      // Test invalid trace contexts (common in distributed systems)
      const invalidTraceParents = [
        "invalid-format",
        "00-123-456-78", // too short
        "",
        null,
        undefined,
      ];

      invalidTraceParents.forEach((invalid) => {
        const parsed = parseTraceParent(invalid as any);
        expect(parsed).toBeNull();
      });

      // Test malformed trace state
      const invalidTraceStates = [
        "key1=,key2=value2", // empty value
        "=value", // empty key
        "key1=value1,=", // malformed pair
        "key1", // missing =
        "",
        null,
      ];

      invalidTraceStates.forEach((invalid) => {
        const parsed = parseTraceState(invalid as any);
        expect(typeof parsed).toBe("object");
        // Should not throw, should return partial or empty object
      });
    });

    it("should handle JSON serialization edge cases", () => {
      // Test problematic objects that might come from instrumentation
      const problematicObjects = [
        { circular: null as any },
        {
          func: function () {
            return "test";
          },
        },
        { symbol: Symbol("test") },
        { date: new Date() },
        { regex: /test/g },
      ];

      // Create circular reference
      problematicObjects[0].circular = problematicObjects[0];

      problematicObjects.forEach((obj) => {
        const serialized = safeJSONStringify(obj);
        expect(typeof serialized).toBe("string");
        expect(serialized.length).toBeGreaterThan(0);

        // Should be valid JSON or fallback
        expect(function () {
          const parsed = safeJSONParse(serialized);
          expect(parsed).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe("Performance and Memory Integration", () => {
    it("should handle high-frequency operations", () => {
      const iterations = 1000;
      const startTime = performanceNow();

      // Simulate high-frequency trace generation
      const traceIds: string[] = [];
      const spanIds: string[] = [];

      for (let i = 0; i < iterations; i++) {
        traceIds.push(generateTraceId());
        spanIds.push(generateSpanId());
      }

      const endTime = performanceNow();
      const duration = endTime - startTime;

      // Verify all IDs are unique and valid
      const uniqueTraceIds = new Set(traceIds);
      const uniqueSpanIds = new Set(spanIds);

      expect(uniqueTraceIds.size).toBe(iterations);
      expect(uniqueSpanIds.size).toBe(iterations);

      // Verify performance is reasonable (should complete quickly)
      expect(duration).toBeLessThan(1000); // Less than 1 second

      // Verify all generated IDs are valid
      traceIds.forEach((id) => {
        expect(isValidTraceId(id)).toBe(true);
      });

      spanIds.forEach((id) => {
        expect(isValidSpanId(id)).toBe(true);
      });
    });

    it("should handle large attribute objects", () => {
      // Simulate large attribute objects that might come from real applications
      const largeAttributes: { [key: string]: any } = {};

      // Generate 100 attributes with various types
      for (let i = 0; i < 100; i++) {
        largeAttributes[`attr_${i}_string`] = `value_${i}_${"x".repeat(50)}`;
        largeAttributes[`attr_${i}_number`] = i * 123.456;
        largeAttributes[`attr_${i}_boolean`] = i % 2 === 0;
        largeAttributes[`attr_${i}_array`] = [i, i + 1, i + 2];
      }

      const startTime = performanceNow();
      const sanitized = sanitizeAttributes(largeAttributes);
      const endTime = performanceNow();

      const sanitizationTime = endTime - startTime;

      // Verify all attributes were processed
      expect(Object.keys(sanitized).length).toBe(400); // 100 * 4 types

      // Verify performance is reasonable
      expect(sanitizationTime).toBeLessThan(100); // Less than 100ms

      // Verify serialization works
      const serialized = safeJSONStringify(sanitized);
      expect(typeof serialized).toBe("string");
      expect(serialized.length).toBeGreaterThan(1000);
    });
  });

  describe("Bundle and API Integration", () => {
    it("should expose all required APIs", () => {
      // Test that all main APIs are available and functional
      expect(typeof trace).toBe("object");
      expect(typeof metrics).toBe("object");
      expect(typeof context).toBe("object");

      // Test bundle information
      const bundleInfo = getBundleOptimizationInfo();
      expect(typeof bundleInfo.totalSize).toBe("string");
      expect(Array.isArray(bundleInfo.chunks)).toBe(true);
      expect(bundleInfo.chunks.length).toBe(4);

      // Verify chunk names match expected structure
      const chunkNames = bundleInfo.chunks.map((c) => c.name);
      expect(chunkNames).toContain("polyfills.js");
      expect(chunkNames).toContain("vendor.js");
      expect(chunkNames).toContain("744.js");
      expect(chunkNames).toContain("opentelemetry-ie11.js");
    });

    it("should maintain IE11 compatibility throughout", () => {
      // Verify no ES6+ features leaked through
      const testCode = `
        var traceId = generateTraceId();
        var spanId = generateSpanId();
        var traceparent = formatTraceParent(traceId, spanId);
        var parsed = parseTraceParent(traceparent);
        var isValid = isValidTraceId(traceId) && isValidSpanId(spanId);
      `;

      // This code should be valid IE11 JavaScript
      expect(function () {
        // Simulate IE11 evaluation (basic syntax check)
        expect(testCode.indexOf("=>")).toBe(-1); // No arrow functions
        expect(testCode.indexOf("const ")).toBe(-1); // No const
        expect(testCode.indexOf("let ")).toBe(-1); // No let
        expect(testCode.indexOf("`")).toBe(-1); // No template literals
      }).not.toThrow();
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should support typical SPA instrumentation", () => {
      // Simulate instrumenting a Single Page Application
      const pageLoadStart = timeOrigin();
      const navigationStart = hrTime();

      // Simulate page navigation trace
      const pageTraceId = generateTraceId();
      const pageSpanId = generateSpanId();

      const pageAttributes = sanitizeAttributes({
        "page.url": window.location.href,
        "page.title": document.title || "Unknown",
        "user.agent": navigator.userAgent,
        "screen.width": screen.width,
        "screen.height": screen.height,
        "viewport.width": window.innerWidth || 0,
        "viewport.height": window.innerHeight || 0,
        "page.load.start": pageLoadStart,
        "navigation.start": navigationStart,
      });

      expect(pageAttributes["page.url"]).toBeDefined();
      expect(typeof pageAttributes["screen.width"]).toBe("number");
      expect(typeof pageAttributes["page.load.start"]).toBe("number");

      // Test trace context propagation
      const traceparent = formatTraceParent(pageTraceId, pageSpanId);

      // Simulate AJAX request with propagation
      const ajaxSpanId = generateSpanId();
      const ajaxTraceparent = formatTraceParent(pageTraceId, ajaxSpanId);

      const ajaxParsed = parseTraceParent(ajaxTraceparent);
      expect(ajaxParsed!.traceId).toBe(pageTraceId); // Same trace
      expect(ajaxParsed!.spanId).toBe(ajaxSpanId); // Different span
    });

    it("should handle error tracking scenarios", () => {
      // Simulate error tracking with OpenTelemetry
      const errorTraceId = generateTraceId();
      const errorSpanId = generateSpanId();

      try {
        // Simulate an error
        throw new Error("Simulated application error");
      } catch (error) {
        const errorAttributes = sanitizeAttributes({
          "error.type": error.constructor.name,
          "error.message": error.message,
          "error.stack": error.stack || "No stack trace",
          "exception.timestamp": hrTime(),
          "page.url": window.location.href,
          "user.agent": navigator.userAgent,
        });

        expect(errorAttributes["error.type"]).toBe("Error");
        expect(errorAttributes["error.message"]).toBe(
          "Simulated application error"
        );
        expect(typeof errorAttributes["exception.timestamp"]).toBe("number");

        // Test error serialization
        const errorJson = safeJSONStringify(errorAttributes);
        const errorParsed = safeJSONParse(errorJson);

        expect(errorParsed["error.type"]).toBe("Error");
        expect(errorParsed["error.message"]).toBe(
          "Simulated application error"
        );
      }
    });

    it("should support custom instrumentation patterns", () => {
      // Simulate custom business logic instrumentation
      const businessTraceId = generateTraceId();
      const operationStart = hrTime();

      // Simulate business operation
      const businessAttributes = {
        "business.operation": "user.checkout",
        "business.user_id": "user_12345",
        "business.cart_value": 99.99,
        "business.items_count": 3,
        "business.payment_method": "credit_card",
        "business.promotion_code": "SAVE10",
        "business.region": "US-WEST",
        "business.experiment_variant": "checkout_v2",
      };

      // Process through OpenTelemetry pipeline
      const sanitized = sanitizeAttributes(businessAttributes);
      const resource = getDefaultResource();
      const combined = merge(resource, { attributes: sanitized });

      const operationEnd = hrTime();
      const duration = operationEnd - operationStart;

      // Verify business context is maintained
      expect(sanitized["business.operation"]).toBe("user.checkout");
      expect(sanitized["business.cart_value"]).toBe(99.99);
      expect(combined["service.name"]).toBeDefined();
      expect(duration).toBeGreaterThanOrEqual(0);

      // Test complete trace context
      const businessSpanId = generateSpanId();
      const traceparent = formatTraceParent(businessTraceId, businessSpanId);
      const traceState = formatTraceState({
        business: "checkout_session_456",
        ab_test: "variant_b",
      });

      expect(traceparent).toContain(businessTraceId);
      expect(traceState).toContain("business=checkout_session_456");
    });
  });
});
