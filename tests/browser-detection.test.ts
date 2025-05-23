// Browser Detection Tests for IE11
import {
  detectIE11,
  detectBrowserInfo,
  detectBrowserFeatures,
  isIE11,
  isModernBrowser,
  needsPolyfills,
  supportsFeature,
  getBrowserCapabilityLevel,
} from "../src/browser/browser-detection";

describe("Browser Detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectIE11", () => {
    it("should not detect IE11 in test environment", () => {
      expect(detectIE11()).toBe(false);
    });
  });

  describe("detectBrowserFeatures", () => {
    it("should detect basic ES6 features", () => {
      const features = detectBrowserFeatures();

      expect(typeof features.objectAssign).toBe("boolean");
      expect(typeof features.arrayIncludes).toBe("boolean");
      expect(typeof features.stringIncludes).toBe("boolean");
      expect(typeof features.mapAndSet).toBe("boolean");
      expect(typeof features.weakMapAndSet).toBe("boolean");
      expect(typeof features.symbols).toBe("boolean");
    });

    it("should detect Web APIs", () => {
      const features = detectBrowserFeatures();

      expect(typeof features.fetch).toBe("boolean");
      expect(typeof features.webWorkers).toBe("boolean");
      expect(typeof features.serviceWorkers).toBe("boolean");
      expect(typeof features.intersectionObserver).toBe("boolean");
      expect(typeof features.mutationObserver).toBe("boolean");
      expect(typeof features.performanceObserver).toBe("boolean");
    });

    it("should detect Promise support", () => {
      const features = detectBrowserFeatures();

      expect(typeof features.promisesNative).toBe("boolean");
    });

    it("should detect modern DOM features", () => {
      const features = detectBrowserFeatures();

      expect(typeof features.customElements).toBe("boolean");
      expect(typeof features.shadowDOM).toBe("boolean");
    });
  });

  describe("detectBrowserInfo", () => {
    it("should detect browser info", () => {
      const info = detectBrowserInfo();

      expect(info).toBeDefined();
      expect(typeof info.name).toBe("string");
      expect(typeof info.version).toBe("string");
      expect(typeof info.engine).toBe("string");
      expect(typeof info.isIE11).toBe("boolean");
      expect(typeof info.isModern).toBe("boolean");
      expect(info.supports).toBeDefined();
    });
  });

  describe("Convenience functions", () => {
    it("isIE11 should work", () => {
      expect(typeof isIE11()).toBe("boolean");
    });

    it("isModernBrowser should work", () => {
      expect(typeof isModernBrowser()).toBe("boolean");
    });

    it("needsPolyfills should work", () => {
      expect(typeof needsPolyfills()).toBe("boolean");
    });

    it("supportsFeature should work", () => {
      expect(typeof supportsFeature("fetch")).toBe("boolean");
      expect(typeof supportsFeature("objectAssign")).toBe("boolean");
      expect(typeof supportsFeature("arrow")).toBe("boolean");
    });

    it("getBrowserCapabilityLevel should return valid level", () => {
      const level = getBrowserCapabilityLevel();
      expect(["modern", "intermediate", "legacy"]).toContain(level);
    });
  });
});
