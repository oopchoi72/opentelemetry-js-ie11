// Browser Detection and Conditional Loading
// Unified entry point for browser-specific functionality

export * from "./browser-detection";
export * from "./conditional-loader";

// Convenience imports
import {
  detectIE11,
  isModernBrowser,
  needsPolyfills,
  getBrowserCapabilityLevel,
  detectBrowserInfo,
  BrowserInfo,
  BrowserFeatures,
  BrowserCapabilityLevel,
} from "./browser-detection";

import {
  createConditionalLoader,
  initializeGlobalLoader,
  loadOpenTelemetry,
  autoLoad,
  LoaderConfig,
  LoadResult,
  LoaderInstance,
} from "./conditional-loader";

// Quick setup function for most common use case
export function quickSetup(config?: {
  enableLogging?: boolean;
  baseCDN?: string;
}): Promise<LoadResult> {
  var quickConfig: LoaderConfig = {
    enableLogging: config?.enableLogging || false,
    baseCDN: config?.baseCDN,
  };

  return autoLoad(quickConfig);
}

// Browser compatibility report
export function getBrowserCompatibilityReport(): {
  browser: BrowserInfo;
  needsPolyfills: boolean;
  recommendedVersion: "ie11" | "modern" | "fallback";
  features: BrowserFeatures;
} {
  var browser = detectBrowserInfo();
  var polyfillsNeeded = needsPolyfills();
  var capabilityLevel = getBrowserCapabilityLevel();

  var recommendedVersion: "ie11" | "modern" | "fallback";
  if (browser.isIE11) {
    recommendedVersion = "ie11";
  } else if (capabilityLevel === "modern") {
    recommendedVersion = "modern";
  } else {
    recommendedVersion = "fallback";
  }

  return {
    browser: browser,
    needsPolyfills: polyfillsNeeded,
    recommendedVersion: recommendedVersion,
    features: browser.supports,
  };
}

// Export commonly used functions
export {
  detectIE11,
  isModernBrowser,
  needsPolyfills,
  getBrowserCapabilityLevel,
  detectBrowserInfo,
  createConditionalLoader,
  initializeGlobalLoader,
  loadOpenTelemetry,
  autoLoad,
};
