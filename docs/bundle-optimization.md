# Bundle Optimization Guide

## Overview

The OpenTelemetry IE11 library has been optimized to minimize bundle size while maintaining full IE11 compatibility. The library is split into multiple chunks for better caching and selective loading.

## Bundle Structure

### Total Size: 157KB (6KB reduction from 163KB)

The bundle is split into the following chunks:

1. **polyfills.js** (136KB)

   - Core-js polyfills for IE11 compatibility
   - Promise, Map, Set, Symbol, and other ES6+ features
   - Largest chunk but essential for IE11 support

2. **vendor.js** (11.5KB)

   - Third-party dependencies
   - whatwg-fetch polyfill
   - process/browser polyfill

3. **744.js** (7.87KB)

   - Babel runtime helpers
   - Helper functions for transpiled code

4. **opentelemetry-ie11.js** (1.62KB)
   - Main OpenTelemetry IE11 library code
   - Your application logic

## Usage Strategies

### 1. Full Bundle (Recommended for IE11)

```html
<!-- Load all chunks for complete IE11 compatibility -->
<script src="polyfills.js"></script>
<script src="vendor.js"></script>
<script src="744.js"></script>
<script src="opentelemetry-ie11.js"></script>
```

### 2. Conditional Loading

```javascript
// Check if IE11 and load accordingly
if (isIE11()) {
  // Load full bundle for IE11
  await loadScript("polyfills.js");
  await loadScript("vendor.js");
  await loadScript("744.js");
  await loadScript("opentelemetry-ie11.js");
} else {
  // Use standard OpenTelemetry for modern browsers
  await import("@opentelemetry/web");
}
```

### 3. Dynamic Import (Modern Approach)

```javascript
// Load features on demand
const { loadCoreFeatures, getBundleOptimizationInfo } = await import(
  "./opentelemetry-ie11.js"
);

// Get optimization information
const bundleInfo = getBundleOptimizationInfo();
console.log("Bundle info:", bundleInfo);

// Load core features
const core = await loadCoreFeatures();
```

## Optimization Features

### 1. Conditional Compilation

The library uses webpack DefinePlugin for conditional compilation:

- `__DEV__`: Development vs production optimizations
- `__BROWSER__`: Browser-specific code paths
- `__NODE__`: Node.js-specific code paths

### 2. Tree Shaking

Enabled features:

- Dead code elimination
- Unused export removal
- Aggressive minification with Terser

### 3. Production Optimizations

- Console logging removed in production builds
- Debug functions stripped out
- Source maps disabled for smaller bundles
- Comments and whitespace removed

## Performance Recommendations

### For IE11 Users

1. **Cache Strategy**

   - Set long cache headers for polyfills.js (changes rarely)
   - Set shorter cache for main bundle (changes with updates)

2. **Loading Strategy**

   - Load polyfills.js first (required for everything else)
   - Load vendor.js and 744.js in parallel
   - Load main bundle last

3. **Preloading**
   ```html
   <link rel="preload" href="polyfills.js" as="script" />
   <link rel="preload" href="vendor.js" as="script" />
   ```

### For Modern Browsers

1. **Avoid IE11 Bundle**

   - Use standard OpenTelemetry library
   - Significantly smaller bundle size
   - Better performance

2. **Feature Detection**
   ```javascript
   if (typeof Promise === "undefined" || typeof Map === "undefined") {
     // Load IE11-compatible version
     await import("./opentelemetry-ie11.js");
   } else {
     // Use standard version
     await import("@opentelemetry/web");
   }
   ```

## Bundle Analysis

To analyze the bundle composition:

```bash
npm run build:analyze
```

This generates a detailed report showing:

- Chunk sizes and contents
- Module dependencies
- Optimization opportunities

## Size Comparison

| Version | Bundle Size | Chunks      | Notes                   |
| ------- | ----------- | ----------- | ----------------------- |
| v1.0.0  | 163KB       | Single file | Initial release         |
| v1.0.1  | 157KB       | 4 chunks    | Optimized with chunking |

## Future Optimizations

Planned improvements:

1. Optional polyfill loading based on feature detection
2. Further tree shaking of unused core-js modules
3. Selective polyfill inclusion based on target browsers
4. WebAssembly version for critical performance paths
