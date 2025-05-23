// Core-js polyfills for IE11 compatibility
// Import only what we need to minimize bundle size

// Essential ES6+ features for OpenTelemetry
import "core-js/features/promise";
import "core-js/features/symbol";
import "core-js/features/map";
import "core-js/features/set";
import "core-js/features/object/assign";
import "core-js/features/object/keys";
import "core-js/features/object/values";
import "core-js/features/object/entries";
import "core-js/features/array/from";
import "core-js/features/array/find";
import "core-js/features/array/find-index";
import "core-js/features/array/includes";
import "core-js/features/string/includes";
import "core-js/features/string/starts-with";
import "core-js/features/string/ends-with";
import "core-js/features/number/is-nan";
import "core-js/features/number/is-finite";

// Additional polyfills for modern JS features
import "core-js/features/object/get-own-property-descriptors";
import "core-js/features/reflect";

// Performance polyfill
if (typeof performance === "undefined") {
  (window as any).performance = {
    now: function (): number {
      return Date.now();
    },
    timing: {
      navigationStart: Date.now(),
    },
  };
}

export function initializeCorePolyfills(): void {
  console.log("Core.js polyfills loaded for IE11");
}
