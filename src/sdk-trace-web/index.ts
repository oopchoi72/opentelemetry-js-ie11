// OpenTelemetry SDK Trace Web for IE11
// This module provides web-specific tracing functionality compatible with IE11

// Core web components
export { XMLHttpRequestTransport } from "./transport/xhr-transport";
export { IE11FetchPolyfill } from "./polyfills/fetch-polyfill";

// Web-specific instrumentation
export { XMLHttpRequestInstrumentation } from "./instrumentation/xhr-instrumentation";
export { DocumentLoadInstrumentation } from "./instrumentation/document-load-instrumentation";
export { UserInteractionInstrumentation } from "./instrumentation/user-interaction-instrumentation";

// Web resource timing
export { ResourceTimingCollector } from "./timing/resource-timing-collector";
export { IE11PerformanceTiming } from "./timing/performance-timing";

// Event handling
export { EventListenerManager } from "./utils/event-listener-manager";
export { DOMUtils } from "./utils/dom-utils";

// Web-specific exporters
export { ConsoleSpanExporter } from "./export/console-span-exporter";
export { HTTPSpanExporter } from "./export/http-span-exporter";

// Web context propagation
export { TraceContextHeaders } from "./context/trace-context-headers";
export { WebContextManager } from "./context/web-context-manager";

// Types and utilities
export * from "./types";
