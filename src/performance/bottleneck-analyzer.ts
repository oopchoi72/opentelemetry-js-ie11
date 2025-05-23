// IE11 Performance Bottleneck Analyzer
// Identifies and measures performance bottlenecks specific to IE11

export interface PerformanceMetrics {
  renderTime: number;
  scriptExecutionTime: number;
  domManipulationTime: number;
  memoryUsage: number;
  gcPressure: number;
  eventProcessingTime: number;
}

export interface BottleneckReport {
  timestamp: number;
  userAgent: string;
  isIE11: boolean;
  metrics: PerformanceMetrics;
  bottlenecks: BottleneckIssue[];
  recommendations: string[];
}

export interface BottleneckIssue {
  type: "render" | "script" | "dom" | "memory" | "event";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  impact: string;
  measurement: number;
  threshold: number;
}

export interface PerformanceConfig {
  enableProfiling?: boolean;
  sampleInterval?: number;
  maxSamples?: number;
  thresholds?: {
    renderTime?: number;
    scriptTime?: number;
    domTime?: number;
    memoryUsage?: number;
    eventTime?: number;
  };
}

// Default thresholds for IE11 performance issues
var DEFAULT_THRESHOLDS = {
  renderTime: 100, // ms - IE11 render times can be 100-1000x slower
  scriptTime: 50, // ms - Script execution threshold
  domTime: 20, // ms - DOM manipulation threshold
  memoryUsage: 50 * 1024 * 1024, // 50MB - Memory usage threshold
  eventTime: 16, // ms - Event processing threshold (~60fps)
};

var DEFAULT_CONFIG: PerformanceConfig = {
  enableProfiling: true,
  sampleInterval: 1000, // 1 second
  maxSamples: 100,
  thresholds: DEFAULT_THRESHOLDS,
};

export function createBottleneckAnalyzer(config?: PerformanceConfig) {
  var cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
  var samples: PerformanceMetrics[] = [];
  var isRunning = false;
  var intervalId: any = null;
  var startTime = 0;

  // IE11 detection
  function isIE11(): boolean {
    return !!(
      typeof window !== "undefined" &&
      (window as any).MSInputMethodContext &&
      (document as any).documentMode
    );
  }

  // High-resolution timing for IE11
  function getHighResTime(): number {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  // Memory usage estimation for IE11
  function estimateMemoryUsage(): number {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }

    // Fallback estimation based on DOM complexity
    var domNodes = document.getElementsByTagName("*").length;
    var estimatedSize = domNodes * 1000; // Rough estimate: 1KB per DOM node
    return estimatedSize;
  }

  // Measure DOM manipulation performance
  function measureDOMPerformance(): number {
    var start = getHighResTime();

    // Create a test element to measure DOM performance
    var testDiv = document.createElement("div");
    testDiv.style.position = "absolute";
    testDiv.style.left = "-9999px";
    testDiv.innerHTML = "<span>Test</span>";

    document.body.appendChild(testDiv);

    // Force layout calculation
    var height = testDiv.offsetHeight;

    document.body.removeChild(testDiv);

    return getHighResTime() - start;
  }

  // Measure script execution performance
  function measureScriptPerformance(): number {
    var start = getHighResTime();

    // Perform a CPU-intensive task
    var result = 0;
    for (var i = 0; i < 10000; i++) {
      result += Math.sqrt(i);
    }

    return getHighResTime() - start;
  }

  // Measure event processing performance
  function measureEventPerformance(): number {
    var start = getHighResTime();

    // Simulate event processing
    var event = document.createEvent("Event");
    event.initEvent("test", true, true);

    var handler = function () {
      // Simulate event processing work
      var temp = 0;
      for (var i = 0; i < 1000; i++) {
        temp += i;
      }
    };

    document.addEventListener("test", handler);
    document.dispatchEvent(event);
    document.removeEventListener("test", handler);

    return getHighResTime() - start;
  }

  // Collect performance metrics
  function collectMetrics(): PerformanceMetrics {
    var renderStart = getHighResTime();

    // Force a render by accessing layout properties
    var body = document.body;
    var renderTime = body.offsetHeight + body.offsetWidth;
    renderTime = getHighResTime() - renderStart;

    return {
      renderTime: renderTime,
      scriptExecutionTime: measureScriptPerformance(),
      domManipulationTime: measureDOMPerformance(),
      memoryUsage: estimateMemoryUsage(),
      gcPressure: 0, // Will be estimated based on memory patterns
      eventProcessingTime: measureEventPerformance(),
    };
  }

  // Analyze metrics for bottlenecks
  function analyzeBottlenecks(metrics: PerformanceMetrics): BottleneckIssue[] {
    var issues: BottleneckIssue[] = [];
    var thresholds = cfg.thresholds || DEFAULT_THRESHOLDS;

    // Check render performance
    if (metrics.renderTime > thresholds.renderTime!) {
      issues.push({
        type: "render",
        severity:
          metrics.renderTime > thresholds.renderTime! * 5 ? "critical" : "high",
        description: "Slow rendering detected",
        impact: "UI responsiveness degraded, user experience affected",
        measurement: metrics.renderTime,
        threshold: thresholds.renderTime!,
      });
    }

    // Check script execution
    if (metrics.scriptExecutionTime > thresholds.scriptTime!) {
      issues.push({
        type: "script",
        severity:
          metrics.scriptExecutionTime > thresholds.scriptTime! * 3
            ? "high"
            : "medium",
        description: "Slow script execution detected",
        impact: "JavaScript performance degraded, potential UI blocking",
        measurement: metrics.scriptExecutionTime,
        threshold: thresholds.scriptTime!,
      });
    }

    // Check DOM manipulation
    if (metrics.domManipulationTime > thresholds.domTime!) {
      issues.push({
        type: "dom",
        severity:
          metrics.domManipulationTime > thresholds.domTime! * 2
            ? "high"
            : "medium",
        description: "Slow DOM manipulation detected",
        impact: "DOM updates causing performance issues",
        measurement: metrics.domManipulationTime,
        threshold: thresholds.domTime!,
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > thresholds.memoryUsage!) {
      issues.push({
        type: "memory",
        severity:
          metrics.memoryUsage > thresholds.memoryUsage! * 2
            ? "critical"
            : "high",
        description: "High memory usage detected",
        impact: "Potential memory leaks, increased GC pressure",
        measurement: metrics.memoryUsage,
        threshold: thresholds.memoryUsage!,
      });
    }

    // Check event processing
    if (metrics.eventProcessingTime > thresholds.eventTime!) {
      issues.push({
        type: "event",
        severity:
          metrics.eventProcessingTime > thresholds.eventTime! * 2
            ? "high"
            : "medium",
        description: "Slow event processing detected",
        impact: "Event handling delays, reduced interactivity",
        measurement: metrics.eventProcessingTime,
        threshold: thresholds.eventTime!,
      });
    }

    return issues;
  }

  // Generate recommendations based on bottlenecks
  function generateRecommendations(issues: BottleneckIssue[]): string[] {
    var recommendations: string[] = [];
    var hasRenderIssues = issues.some(function (issue) {
      return issue.type === "render";
    });
    var hasScriptIssues = issues.some(function (issue) {
      return issue.type === "script";
    });
    var hasDOMIssues = issues.some(function (issue) {
      return issue.type === "dom";
    });
    var hasMemoryIssues = issues.some(function (issue) {
      return issue.type === "memory";
    });
    var hasEventIssues = issues.some(function (issue) {
      return issue.type === "event";
    });

    if (hasRenderIssues) {
      recommendations.push(
        "Optimize CSS to avoid complex selectors and deeply nested elements"
      );
      recommendations.push(
        "Use CSS transforms instead of changing layout properties"
      );
      recommendations.push(
        "Minimize table usage, especially with percentage heights"
      );
      recommendations.push(
        "Batch DOM reads and writes to reduce layout thrashing"
      );
    }

    if (hasScriptIssues) {
      recommendations.push(
        "Break up long-running scripts using setTimeout or requestAnimationFrame"
      );
      recommendations.push("Optimize loops and reduce algorithmic complexity");
      recommendations.push(
        "Use Web Workers for CPU-intensive tasks (if supported)"
      );
      recommendations.push("Minimize object creation in hot code paths");
    }

    if (hasDOMIssues) {
      recommendations.push("Use DocumentFragment for multiple DOM insertions");
      recommendations.push(
        "Cache DOM queries and reuse elements when possible"
      );
      recommendations.push("Minimize DOM depth and complexity");
      recommendations.push(
        "Use event delegation instead of multiple event listeners"
      );
    }

    if (hasMemoryIssues) {
      recommendations.push(
        "Implement object pooling for frequently created objects"
      );
      recommendations.push(
        "Remove event listeners and clear references when no longer needed"
      );
      recommendations.push("Avoid closures that capture large scopes");
      recommendations.push("Use weak references where appropriate");
    }

    if (hasEventIssues) {
      recommendations.push(
        "Implement throttling for high-frequency events (scroll, resize, mousemove)"
      );
      recommendations.push("Use passive event listeners where possible");
      recommendations.push("Debounce user input events");
      recommendations.push("Optimize event handler logic");
    }

    if (isIE11()) {
      recommendations.push("Consider using IE11-specific optimizations");
      recommendations.push(
        "Minimize polyfill usage and use native IE11 features when available"
      );
      recommendations.push("Test performance regularly in IE11 environment");
    }

    return recommendations;
  }

  // Start performance monitoring
  function startMonitoring(): void {
    if (isRunning || !cfg.enableProfiling) {
      return;
    }

    isRunning = true;
    startTime = getHighResTime();

    intervalId = setInterval(function () {
      try {
        var metrics = collectMetrics();
        samples.push(metrics);

        // Limit sample history
        if (samples.length > (cfg.maxSamples || 100)) {
          samples.shift();
        }
      } catch (error) {
        console.warn("Performance monitoring error:", error);
      }
    }, cfg.sampleInterval || 1000);
  }

  // Stop performance monitoring
  function stopMonitoring(): void {
    if (!isRunning) {
      return;
    }

    isRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Generate bottleneck report
  function generateReport(): BottleneckReport {
    var currentMetrics =
      samples.length > 0 ? samples[samples.length - 1] : collectMetrics();
    var issues = analyzeBottlenecks(currentMetrics);
    var recommendations = generateRecommendations(issues);

    return {
      timestamp: Date.now(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      isIE11: isIE11(),
      metrics: currentMetrics,
      bottlenecks: issues,
      recommendations: recommendations,
    };
  }

  // Get performance history
  function getPerformanceHistory(): PerformanceMetrics[] {
    return samples.slice(); // Return copy
  }

  // Get average metrics
  function getAverageMetrics(): PerformanceMetrics | null {
    if (samples.length === 0) {
      return null;
    }

    var totals = samples.reduce(
      function (acc, sample) {
        return {
          renderTime: acc.renderTime + sample.renderTime,
          scriptExecutionTime:
            acc.scriptExecutionTime + sample.scriptExecutionTime,
          domManipulationTime:
            acc.domManipulationTime + sample.domManipulationTime,
          memoryUsage: acc.memoryUsage + sample.memoryUsage,
          gcPressure: acc.gcPressure + sample.gcPressure,
          eventProcessingTime:
            acc.eventProcessingTime + sample.eventProcessingTime,
        };
      },
      {
        renderTime: 0,
        scriptExecutionTime: 0,
        domManipulationTime: 0,
        memoryUsage: 0,
        gcPressure: 0,
        eventProcessingTime: 0,
      }
    );

    var count = samples.length;
    return {
      renderTime: totals.renderTime / count,
      scriptExecutionTime: totals.scriptExecutionTime / count,
      domManipulationTime: totals.domManipulationTime / count,
      memoryUsage: totals.memoryUsage / count,
      gcPressure: totals.gcPressure / count,
      eventProcessingTime: totals.eventProcessingTime / count,
    };
  }

  return {
    startMonitoring: startMonitoring,
    stopMonitoring: stopMonitoring,
    generateReport: generateReport,
    getPerformanceHistory: getPerformanceHistory,
    getAverageMetrics: getAverageMetrics,
    collectMetrics: collectMetrics,
    isIE11: isIE11,
  };
}

// Global analyzer instance
var globalAnalyzer: ReturnType<typeof createBottleneckAnalyzer> | null = null;

// Initialize global analyzer
export function initializeGlobalAnalyzer(config?: PerformanceConfig): void {
  if (globalAnalyzer) {
    globalAnalyzer.stopMonitoring();
  }

  globalAnalyzer = createBottleneckAnalyzer(config);
  globalAnalyzer.startMonitoring();
}

// Get global analyzer instance
export function getGlobalAnalyzer(): ReturnType<
  typeof createBottleneckAnalyzer
> | null {
  return globalAnalyzer;
}

// Quick performance check
export function quickPerformanceCheck(): BottleneckReport {
  var analyzer = createBottleneckAnalyzer({ enableProfiling: false });
  return analyzer.generateReport();
}
