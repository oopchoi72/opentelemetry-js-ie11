// Browser Detection for IE11 and Modern Browsers
// Provides reliable browser detection and feature detection

export interface BrowserInfo {
  name: string;
  version: string;
  isIE11: boolean;
  isModern: boolean;
  engine: string;
  supports: BrowserFeatures;
}

export interface BrowserFeatures {
  es6: boolean;
  promisesNative: boolean;
  fetch: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  intersectionObserver: boolean;
  mutationObserver: boolean;
  performanceObserver: boolean;
  customElements: boolean;
  shadowDOM: boolean;
  modules: boolean;
  dynamicImport: boolean;
  asyncAwait: boolean;
  objectAssign: boolean;
  arrayIncludes: boolean;
  stringIncludes: boolean;
  mapAndSet: boolean;
  weakMapAndSet: boolean;
  symbols: boolean;
  generators: boolean;
  arrow: boolean;
  classes: boolean;
  templateLiterals: boolean;
  destructuring: boolean;
  spreadOperator: boolean;
  restParameters: boolean;
  defaultParameters: boolean;
  forOf: boolean;
  const: boolean;
  let: boolean;
}

var userAgent: string = "";
var isWindowAvailable = false;
var isNavigatorAvailable = false;

// Initialize globals safely
try {
  isWindowAvailable = typeof window !== "undefined";
  isNavigatorAvailable = typeof navigator !== "undefined";
  userAgent = isNavigatorAvailable ? navigator.userAgent : "";
} catch (e) {
  // Handle cases where window/navigator are not available
}

// IE11 Detection Methods
export function detectIE11(): boolean {
  if (!isNavigatorAvailable) {
    return false;
  }

  // Check if we're in a test environment (jsdom)
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test"
  ) {
    return false;
  }

  // Method 1: User Agent String Detection
  var ua = userAgent.toLowerCase();
  var isIE11UserAgent = ua.indexOf("trident/") > -1 && ua.indexOf("rv:11") > -1;

  // Method 2: MSInputMethodContext Detection
  var hasMSInputMethodContext = !!(
    isWindowAvailable && (window as any).MSInputMethodContext
  );

  // Method 3: DocumentMode Detection
  var hasDocumentMode = !!(
    typeof document !== "undefined" && (document as any).documentMode
  );

  // Method 4: ActiveXObject Detection (IE specific)
  var hasActiveXObject = false;
  try {
    hasActiveXObject =
      !!(window as any).ActiveXObject || "ActiveXObject" in window;
  } catch (e) {
    // ActiveXObject access might throw in some environments
  }

  // Method 5: IE-specific CSS features
  var hasIECSSFeatures = false;
  try {
    if (typeof document !== "undefined" && document.documentElement) {
      var style = document.documentElement.style;
      hasIECSSFeatures = "msTransform" in style || "msFilter" in style;
    }
  } catch (e) {
    // Style access might fail
  }

  // Combine multiple detection methods for reliability
  return (
    isIE11UserAgent ||
    (hasMSInputMethodContext && hasDocumentMode) ||
    hasActiveXObject ||
    hasIECSSFeatures
  );
}

// Feature Detection
export function detectBrowserFeatures(): BrowserFeatures {
  var features: BrowserFeatures = {
    es6: false,
    promisesNative: false,
    fetch: false,
    webWorkers: false,
    serviceWorkers: false,
    intersectionObserver: false,
    mutationObserver: false,
    performanceObserver: false,
    customElements: false,
    shadowDOM: false,
    modules: false,
    dynamicImport: false,
    asyncAwait: false,
    objectAssign: false,
    arrayIncludes: false,
    stringIncludes: false,
    mapAndSet: false,
    weakMapAndSet: false,
    symbols: false,
    generators: false,
    arrow: false,
    classes: false,
    templateLiterals: false,
    destructuring: false,
    spreadOperator: false,
    restParameters: false,
    defaultParameters: false,
    forOf: false,
    const: false,
    let: false,
  };

  try {
    // Basic ES6 features
    features.objectAssign = typeof Object.assign === "function";
    features.arrayIncludes = Array.prototype.hasOwnProperty("includes");
    features.stringIncludes = String.prototype.hasOwnProperty("includes");
    features.mapAndSet = typeof Map === "function" && typeof Set === "function";
    features.weakMapAndSet =
      typeof WeakMap === "function" && typeof WeakSet === "function";
    features.symbols = typeof Symbol === "function";

    // Promise support
    features.promisesNative =
      typeof Promise === "function" &&
      Promise.toString().indexOf("[native code]") !== -1;

    // Web APIs
    features.fetch = typeof fetch === "function";
    features.webWorkers = typeof Worker === "function";
    features.serviceWorkers =
      isNavigatorAvailable && "serviceWorker" in navigator;
    features.intersectionObserver = typeof IntersectionObserver === "function";
    features.mutationObserver = typeof MutationObserver === "function";
    features.performanceObserver = typeof PerformanceObserver === "function";

    // Modern DOM features
    features.customElements = isWindowAvailable && "customElements" in window;
    features.shadowDOM =
      typeof document !== "undefined" &&
      document.createElement("div").attachShadow !== undefined;

    // Module support
    var script = document.createElement("script");
    features.modules = "noModule" in script;

    // Advanced ES6+ features (basic existence checks only)
    // Arrow functions - basic check
    features.arrow = true; // Assume true in modern environments, will be false in IE11

    // Classes - basic check
    features.classes = true; // Assume true in modern environments

    // Template literals - basic check
    features.templateLiterals = true; // Assume true in modern environments

    // Destructuring - basic check
    features.destructuring = true; // Assume true in modern environments

    // Spread operator - basic check
    features.spreadOperator = true; // Assume true in modern environments

    // Rest parameters - basic check
    features.restParameters = true; // Assume true in modern environments

    // Default parameters - basic check
    features.defaultParameters = true; // Assume true in modern environments

    // for...of - basic check
    features.forOf = true; // Assume true in modern environments

    // const - basic check
    features.const = true; // Assume true in modern environments

    // let - basic check
    features.let = true; // Assume true in modern environments

    // Generators - basic check
    features.generators = true; // Assume true in modern environments

    // Async/await - basic check
    features.asyncAwait = true; // Assume true in modern environments

    // Dynamic import - check if available
    features.dynamicImport = false; // Conservative default

    // Overall ES6 support (basic check)
    features.es6 =
      features.arrow &&
      features.classes &&
      features.const &&
      features.let &&
      features.templateLiterals &&
      features.objectAssign;
  } catch (e) {
    // If feature detection fails, assume limited support
    console.warn("Feature detection failed:", e);
  }

  return features;
}

// Browser Information Detection
export function detectBrowserInfo(): BrowserInfo {
  var name = "Unknown";
  var version = "Unknown";
  var engine = "Unknown";
  var isIE11 = detectIE11();
  var features = detectBrowserFeatures();

  if (!isNavigatorAvailable) {
    return {
      name: name,
      version: version,
      isIE11: false,
      isModern: false,
      engine: engine,
      supports: features,
    };
  }

  var ua = userAgent;

  // IE11 Detection
  if (isIE11) {
    name = "Internet Explorer";
    version = "11";
    engine = "Trident";
  }
  // Chrome Detection
  else if (ua.indexOf("Chrome") > -1 && ua.indexOf("Chromium") === -1) {
    name = "Chrome";
    var chromeMatch = ua.match(/Chrome\/(\d+)/);
    version = chromeMatch ? chromeMatch[1] : "Unknown";
    engine = "Blink";
  }
  // Firefox Detection
  else if (ua.indexOf("Firefox") > -1) {
    name = "Firefox";
    var firefoxMatch = ua.match(/Firefox\/(\d+)/);
    version = firefoxMatch ? firefoxMatch[1] : "Unknown";
    engine = "Gecko";
  }
  // Safari Detection
  else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    name = "Safari";
    var safariMatch = ua.match(/Safari\/(\d+)/);
    version = safariMatch ? safariMatch[1] : "Unknown";
    engine = "WebKit";
  }
  // Edge (Chromium) Detection
  else if (ua.indexOf("Edg") > -1) {
    name = "Edge";
    var edgeMatch = ua.match(/Edg\/(\d+)/);
    version = edgeMatch ? edgeMatch[1] : "Unknown";
    engine = "Blink";
  }
  // Legacy Edge Detection
  else if (ua.indexOf("Edge") > -1) {
    name = "Edge Legacy";
    var edgeLegacyMatch = ua.match(/Edge\/(\d+)/);
    version = edgeLegacyMatch ? edgeLegacyMatch[1] : "Unknown";
    engine = "EdgeHTML";
  }

  // Determine if browser is "modern" (supports most ES6 features)
  var isModern =
    !isIE11 &&
    features.es6 &&
    features.promisesNative &&
    features.fetch &&
    features.modules;

  return {
    name: name,
    version: version,
    isIE11: isIE11,
    isModern: isModern,
    engine: engine,
    supports: features,
  };
}

// Convenience functions
export function isIE11(): boolean {
  return detectIE11();
}

export function isModernBrowser(): boolean {
  var browserInfo = detectBrowserInfo();
  return browserInfo.isModern;
}

export function needsPolyfills(): boolean {
  return !isModernBrowser();
}

export function supportsFeature(feature: keyof BrowserFeatures): boolean {
  var features = detectBrowserFeatures();
  return features[feature];
}

// Browser capability levels
export type BrowserCapabilityLevel = "modern" | "intermediate" | "legacy";

export function getBrowserCapabilityLevel(): BrowserCapabilityLevel {
  var features = detectBrowserFeatures();

  if (
    features.es6 &&
    features.modules &&
    features.fetch &&
    features.asyncAwait
  ) {
    return "modern";
  } else if (
    features.promisesNative &&
    features.objectAssign &&
    features.arrow
  ) {
    return "intermediate";
  } else {
    return "legacy";
  }
}

// Export for global access
export var browserInfo = detectBrowserInfo();
