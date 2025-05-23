// Conditional Loader for OpenTelemetry IE11
// Loads appropriate version based on browser capabilities

import {
  detectIE11,
  isModernBrowser,
  needsPolyfills,
  getBrowserCapabilityLevel,
  BrowserCapabilityLevel,
  browserInfo,
} from "./browser-detection";

export interface LoaderConfig {
  baseCDN?: string;
  polyfillsPath?: string;
  ie11Path?: string;
  modernPath?: string;
  fallbackPath?: string;
  enableLogging?: boolean;
  timeout?: number;
  retryAttempts?: number;
  loadingStrategy?: "script" | "dynamic" | "defer" | "async";
}

export interface LoadResult {
  success: boolean;
  version: "ie11" | "modern" | "fallback";
  loadTime: number;
  error?: Error;
  polyfillsLoaded?: boolean;
}

export interface LoaderInstance {
  load(): Promise<LoadResult>;
  loadPolyfills(): Promise<boolean>;
  loadOpenTelemetry(): Promise<any>;
  isLoaded(): boolean;
  getLoadedVersion(): string | null;
  cleanup(): void;
}

var DEFAULT_CONFIG: LoaderConfig = {
  baseCDN: "https://cdn.jsdelivr.net/npm/opentelemetry-js-ie11@1.0.0",
  polyfillsPath: "/polyfills.js",
  ie11Path: "/ie11.js",
  modernPath: "/modern.js",
  fallbackPath: "/fallback.js",
  enableLogging: false,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  loadingStrategy: "script",
};

// Global state
var isLoaded = false;
var loadedVersion: string | null = null;
var loadedModule: any = null;

// Create conditional loader
export function createConditionalLoader(config?: LoaderConfig): LoaderInstance {
  var cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
  var polyfillsLoaded = false;

  function log(message: string, data?: any): void {
    if (cfg.enableLogging && typeof console !== "undefined") {
      console.log("[OpenTelemetry Loader]", message, data || "");
    }
  }

  function logError(message: string, error?: any): void {
    if (cfg.enableLogging && typeof console !== "undefined") {
      console.error("[OpenTelemetry Loader]", message, error || "");
    }
  }

  // Load script via DOM
  function loadScript(src: string): Promise<void> {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      var timeoutId: any = null;

      function cleanup(): void {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        script.onload = null;
        script.onerror = null;
      }

      script.onload = function () {
        cleanup();
        log("Script loaded successfully:", src);
        resolve();
      };

      script.onerror = function () {
        cleanup();
        var error = new Error("Failed to load script: " + src);
        logError("Script loading failed:", error);
        reject(error);
      };

      // Set timeout
      if (cfg.timeout) {
        timeoutId = setTimeout(function () {
          cleanup();
          var error = new Error("Script loading timeout: " + src);
          logError("Script loading timeout:", error);
          reject(error);
        }, cfg.timeout);
      }

      // Configure script loading strategy
      switch (cfg.loadingStrategy) {
        case "async":
          script.async = true;
          break;
        case "defer":
          script.defer = true;
          break;
        default:
          // Default synchronous loading
          break;
      }

      script.src = src;
      document.head.appendChild(script);
    });
  }

  // Load module via dynamic import (for modern browsers)
  function loadModule(src: string): Promise<any> {
    return new Promise(function (resolve, reject) {
      if (typeof (window as any).import === "function") {
        (window as any).import(src).then(resolve).catch(reject);
      } else {
        // Fallback to script loading
        loadScript(src)
          .then(function () {
            var global =
              (window as any).OpenTelemetryIE11 ||
              (window as any).opentelemetry;
            if (global) {
              resolve(global);
            } else {
              reject(new Error("Module not found in global scope"));
            }
          })
          .catch(reject);
      }
    });
  }

  // Load polyfills for IE11
  function loadPolyfills(): Promise<boolean> {
    return new Promise(function (resolve, reject) {
      if (polyfillsLoaded || !needsPolyfills()) {
        resolve(true);
        return;
      }

      var polyfillsUrl = (cfg.baseCDN || "") + (cfg.polyfillsPath || "");
      log("Loading polyfills for IE11:", polyfillsUrl);

      loadScript(polyfillsUrl)
        .then(function () {
          polyfillsLoaded = true;
          log("Polyfills loaded successfully");
          resolve(true);
        })
        .catch(function (error) {
          logError("Failed to load polyfills:", error);
          reject(error);
        });
    });
  }

  // Load appropriate OpenTelemetry version
  function loadOpenTelemetry(): Promise<any> {
    return new Promise(function (resolve, reject) {
      var isIE11 = detectIE11();
      var capabilityLevel = getBrowserCapabilityLevel();
      var targetPath: string;
      var version: string;

      if (isIE11) {
        targetPath = cfg.ie11Path!;
        version = "ie11";
        log("Loading IE11 version", { browser: browserInfo });
      } else if (capabilityLevel === "modern") {
        targetPath = cfg.modernPath!;
        version = "modern";
        log("Loading modern version", { browser: browserInfo });
      } else {
        targetPath = cfg.fallbackPath!;
        version = "fallback";
        log("Loading fallback version", { browser: browserInfo });
      }

      var targetUrl = (cfg.baseCDN || "") + targetPath;
      var loadFunction =
        cfg.loadingStrategy === "dynamic" && capabilityLevel === "modern"
          ? loadModule
          : loadScript;

      var loadPromise: Promise<any>;

      if (loadFunction === loadModule) {
        loadPromise = loadModule(targetUrl);
      } else {
        loadPromise = loadScript(targetUrl).then(function () {
          // Return the global OpenTelemetry object
          return (
            (window as any).OpenTelemetryIE11 ||
            (window as any).opentelemetry ||
            {}
          );
        });
      }

      loadPromise
        .then(function (module) {
          loadedModule = module;
          loadedVersion = version;
          isLoaded = true;
          log("OpenTelemetry loaded successfully:", version);
          resolve(module);
        })
        .catch(function (error) {
          logError("Failed to load OpenTelemetry:", error);
          reject(error);
        });
    });
  }

  // Main load function with retry logic
  function load(): Promise<LoadResult> {
    return new Promise(function (resolve, reject) {
      var startTime = Date.now();
      var attempt = 0;

      function attemptLoad(): void {
        attempt++;
        log("Load attempt", attempt + "/" + cfg.retryAttempts);

        var loadSequence: Promise<any>;

        if (needsPolyfills()) {
          loadSequence = loadPolyfills().then(function () {
            return loadOpenTelemetry();
          });
        } else {
          loadSequence = loadOpenTelemetry();
        }

        loadSequence
          .then(function (module) {
            var loadTime = Date.now() - startTime;
            var result: LoadResult = {
              success: true,
              version: loadedVersion as any,
              loadTime: loadTime,
              polyfillsLoaded: polyfillsLoaded,
            };
            log("Loading completed successfully", result);
            resolve(result);
          })
          .catch(function (error) {
            if (attempt < (cfg.retryAttempts || 3)) {
              log("Load attempt failed, retrying...", error);
              setTimeout(attemptLoad, 1000 * attempt); // Exponential backoff
            } else {
              var loadTime = Date.now() - startTime;
              var result: LoadResult = {
                success: false,
                version: "fallback" as any,
                loadTime: loadTime,
                error: error,
                polyfillsLoaded: polyfillsLoaded,
              };
              logError("All load attempts failed", result);
              resolve(result); // Don't reject, return failed result
            }
          });
      }

      attemptLoad();
    });
  }

  function getIsLoaded(): boolean {
    return isLoaded;
  }

  function getLoadedVersion(): string | null {
    return loadedVersion;
  }

  function cleanup(): void {
    isLoaded = false;
    loadedVersion = null;
    loadedModule = null;
    polyfillsLoaded = false;
  }

  return {
    load: load,
    loadPolyfills: loadPolyfills,
    loadOpenTelemetry: loadOpenTelemetry,
    isLoaded: getIsLoaded,
    getLoadedVersion: getLoadedVersion,
    cleanup: cleanup,
  };
}

// Global loader instance
var globalLoader: LoaderInstance | null = null;

// Initialize global loader
export function initializeGlobalLoader(config?: LoaderConfig): LoaderInstance {
  globalLoader = createConditionalLoader(config);
  return globalLoader;
}

// Get global loader
export function getGlobalLoader(): LoaderInstance | null {
  return globalLoader;
}

// Convenience function for quick loading
export function loadOpenTelemetry(config?: LoaderConfig): Promise<LoadResult> {
  var loader = globalLoader || createConditionalLoader(config);
  return loader.load();
}

// Auto-detect and load
export function autoLoad(config?: LoaderConfig): Promise<LoadResult> {
  log("Auto-detecting browser and loading appropriate version...");

  var detectedConfig = Object.assign({}, DEFAULT_CONFIG, config || {});

  // Auto-adjust config based on browser
  if (detectIE11()) {
    detectedConfig.loadingStrategy = "script"; // IE11 doesn't support dynamic imports
    detectedConfig.timeout = 60000; // Longer timeout for IE11
  } else if (getBrowserCapabilityLevel() === "modern") {
    detectedConfig.loadingStrategy = "dynamic"; // Use dynamic imports for modern browsers
  }

  return loadOpenTelemetry(detectedConfig);
}

// Export detection functions for convenience
export {
  detectIE11,
  isModernBrowser,
  needsPolyfills,
  getBrowserCapabilityLevel,
};

function log(message: string, data?: any): void {
  if (DEFAULT_CONFIG.enableLogging && typeof console !== "undefined") {
    console.log("[OpenTelemetry Loader]", message, data || "");
  }
}
