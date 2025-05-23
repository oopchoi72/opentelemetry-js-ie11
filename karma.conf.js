// Karma configuration for IE11 testing
module.exports = function (config) {
  var isCI = process.env.CI === "true";
  var useBrowserStack = process.env.USE_BROWSERSTACK === "true";

  var customLaunchers = {
    // Local IE11 launcher
    IE11_local: {
      base: "IE",
      "x-ua-compatible": "IE=EmulateIE11",
      flags: [
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    },

    // BrowserStack launchers
    bs_ie11_win10: {
      base: "BrowserStack",
      browser: "IE",
      browser_version: "11.0",
      os: "Windows",
      os_version: "10",
      resolution: "1024x768",
    },
    bs_ie11_win8_1: {
      base: "BrowserStack",
      browser: "IE",
      browser_version: "11.0",
      os: "Windows",
      os_version: "8.1",
      resolution: "1024x768",
    },
    bs_ie11_win7: {
      base: "BrowserStack",
      browser: "IE",
      browser_version: "11.0",
      os: "Windows",
      os_version: "7",
      resolution: "1024x768",
    },
  };

  var browsers = [];
  if (useBrowserStack) {
    browsers = ["bs_ie11_win10", "bs_ie11_win8_1", "bs_ie11_win7"];
  } else {
    browsers = ["IE11_local"];
  }

  config.set({
    // Base path that will be used to resolve all patterns
    basePath: "",

    // Frameworks to use
    frameworks: ["jasmine"],

    // List of files / patterns to load in the browser
    files: [
      // IE11 polyfills (load first)
      "test/polyfills/ie11-polyfills.js",

      // Core OpenTelemetry files
      "dist/opentelemetry-ie11.js",

      // Test utilities
      "test/utils/test-helpers.js",
      "test/utils/ie11-test-utils.js",

      // Test specs
      "test/unit/**/*.spec.js",
      "test/integration/**/*.spec.js",
      "test/ie11/**/*.spec.js",
    ],

    // List of files / patterns to exclude
    exclude: ["test/**/*.es6.spec.js", "test/**/*.modern.spec.js"],

    // Preprocess matching files before serving them to the browser
    preprocessors: {
      "dist/**/*.js": ["coverage"],
      "test/**/*.js": ["babel"],
    },

    // Babel preprocessor configuration
    babelPreprocessor: {
      options: {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                ie: "11",
              },
              useBuiltIns: "entry",
              corejs: 3,
            },
          ],
        ],
        plugins: ["@babel/plugin-transform-runtime"],
      },
      filename: function (file) {
        return file.originalPath.replace(/\.js$/, ".es5.js");
      },
      sourceFileName: function (file) {
        return file.originalPath;
      },
    },

    // Test results reporter to use
    reporters: ["progress", "junit", "coverage", "spec"],

    // JUnit reporter configuration
    junitReporter: {
      outputDir: "test-results",
      outputFile: "ie11-test-results.xml",
      suite: "IE11 Tests",
      useBrowserName: true,
      nameFormatter: function (browser, result) {
        return browser + ": " + result.description;
      },
      classNameFormatter: function (browser, result) {
        return browser + "." + result.suite.join(".");
      },
    },

    // Coverage reporter configuration
    coverageReporter: {
      type: "html",
      dir: "coverage/ie11/",
      subdir: function (browser) {
        return browser.toLowerCase().split(/[ /-]/)[0];
      },
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcov", subdir: "lcov" },
        { type: "text-summary" },
      ],
    },

    // Spec reporter configuration
    specReporter: {
      maxLogLines: 5,
      suppressErrorSummary: true,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: true,
      failFast: false,
    },

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: !isCI,

    // Start these browsers
    browsers: browsers,

    // Custom launchers
    customLaunchers: customLaunchers,

    // BrowserStack configuration
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      project: "OpenTelemetry IE11",
      build: process.env.BROWSERSTACK_BUILD_ID || "Local Build",
      name: "IE11 Compatibility Tests",
      timeout: 600, // 10 minutes
      idleTimeout: 300, // 5 minutes
      video: false,
      screenshots: false,
      local: false,
      localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
      retryLimit: 2,
    },

    // Continuous Integration mode
    singleRun: isCI,

    // Concurrency level (how many browser will be started simultaneously)
    concurrency: useBrowserStack ? 2 : 1,

    // Timeout settings
    captureTimeout: 120000,
    browserDisconnectTimeout: 120000,
    browserNoActivityTimeout: 120000,
    processKillTimeout: 120000,

    // Client configuration
    client: {
      jasmine: {
        random: false,
        seed: "12345",
        stopOnFailure: false,
        failFast: false,
        timeoutInterval: 30000,
      },
      captureConsole: true,
      clearContext: false,
      runInParent: false,
      useIframe: true,
    },

    // Proxy configuration for IE11
    proxies: {
      "/base/": "/base/",
      "/absolute/": "/absolute/",
    },

    // MIME type configuration
    mime: {
      "text/x-typescript": ["ts", "tsx"],
    },

    // Plugin configuration
    plugins: [
      "karma-jasmine",
      "karma-ie-launcher",
      "karma-browserstack-launcher",
      "karma-junit-reporter",
      "karma-coverage",
      "karma-spec-reporter",
      "karma-babel-preprocessor",
    ],

    // Browser configuration
    browserConsoleLogOptions: {
      level: "log",
      format: "%b %T: %m",
      terminal: true,
    },

    // Fail on empty test suite
    failOnEmptyTestSuite: false,

    // Restart browser if it crashes
    restartOnFileChange: true,
  });

  // Environment-specific overrides
  if (process.env.NODE_ENV === "development") {
    config.set({
      logLevel: config.LOG_DEBUG,
      autoWatch: true,
      singleRun: false,
    });
  }

  if (process.env.KARMA_HEADLESS === "true") {
    config.set({
      browsers: ["ChromeHeadless"],
      singleRun: true,
    });
  }
};
