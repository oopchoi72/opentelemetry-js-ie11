// OpenTelemetry IE11 Agent - Unified Entry Point
// This file consolidates all modules into a single bundle for IE11 compatibility

// 1. Load core-js polyfills first (critical for IE11)
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// 2. Load custom polyfills
import './polyfills/index';

// 3. Import specific modules to avoid conflicts
import { trace, metrics, context, VERSION, isIE11 } from './index';
import { hrTime, getTimeOrigin, objectAssign } from './core/utils';
import {
  createCounter,
  createHistogram,
  createGauge,
  createMeter,
} from './metrics/index';

// 4. Re-export all modules
export * from './api/index';
export * from './trace/index';
export * from './metrics/index';
export * from './browser/index';
export * from './performance/index';
export * from './web/dom-event-instrumentation';

// 5. Create unified global object for IE11 compatibility
const OpenTelemetryIE11Agent = {
  // Core APIs
  trace,
  metrics,
  context,
  
  // Core utilities
  core: {
    objectAssign,
    hrTime,
    getTimeOrigin,
  },
  
  // Metrics utilities
  metricsUtils: {
    createCounter,
    createHistogram,
    createGauge,
    createMeter,
  },
  
  // Version and compatibility
  VERSION,
  isIE11,
  
  // Agent-specific metadata
  agentVersion: '1.0.0',
  buildType: 'unified-bundle',
  ie11Compatible: true,
};

// 6. Global exposure for browser environments
if (typeof window !== 'undefined') {
  // Primary namespace
  (window as any).OpenTelemetryIE11Agent = OpenTelemetryIE11Agent;
  
  // Backward compatibility
  (window as any).OpenTelemetryIE11 = OpenTelemetryIE11Agent;
  (window as any).opentelemetry = OpenTelemetryIE11Agent;
  
  // Agent-specific namespace
  (window as any).OTelAgent = OpenTelemetryIE11Agent;
}

// 7. Node.js/CommonJS environment
if (typeof global !== 'undefined') {
  (global as any).OpenTelemetryIE11Agent = OpenTelemetryIE11Agent;
  (global as any).OpenTelemetryIE11 = OpenTelemetryIE11Agent;
  (global as any).opentelemetry = OpenTelemetryIE11Agent;
}

// 8. Auto-initialization for IE11
if (typeof window !== 'undefined' && isIE11()) {
  console.log('OpenTelemetry IE11 Agent initialized for IE11 environment');
  
  // Auto-start performance optimization if available
  try {
    const { autoOptimizeForIE11 } = require('./performance/index');
    if (typeof autoOptimizeForIE11 === 'function') {
      autoOptimizeForIE11();
    }
  } catch (error) {
    // Graceful fallback if performance module is not available
    console.warn('Performance optimization not available:', error);
  }
}

// 9. Default export for UMD compatibility
export default OpenTelemetryIE11Agent;

// 10. Named exports for tree-shaking in modern environments
export {
  trace,
  metrics,
  context,
  objectAssign,
  hrTime,
  getTimeOrigin,
  VERSION,
  isIE11,
  createCounter,
  createHistogram,
  createGauge,
  createMeter,
};

// 11. Agent-specific exports
export const agentVersion = '1.0.0';
export const buildType = 'unified-bundle';
export const ie11Compatible = true; 