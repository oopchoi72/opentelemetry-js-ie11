const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isAnalyze = process.env.ANALYZE === "true";

  // Single unified entry point for agent.js bundle
  const entries = {
    "agent": "./src/agent.ts",
  };

  return {
    mode: isProduction ? "production" : "development",
    entry: entries,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "agent.js",
      library: {
        name: "OpenTelemetryIE11Agent",
        type: "umd",
        export: "default",
        umdNamedDefine: true,
      },
      globalObject: "(typeof self !== 'undefined' ? self : this)",
      clean: true,
      chunkFilename: "chunks/[name].[contenthash:8].js",
      assetModuleFilename: "assets/[name].[contenthash:8][ext]",
      // Custom UMD template for IE11 compatibility
      auxiliaryComment: {
        root: "OpenTelemetry IE11 - Root",
        commonjs: "OpenTelemetry IE11 - CommonJS",
        commonjs2: "OpenTelemetry IE11 - CommonJS2",
        amd: "OpenTelemetry IE11 - AMD",
      },
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@core": path.resolve(__dirname, "src/core"),
        "@trace": path.resolve(__dirname, "src/sdk-trace-base"),
        "@web": path.resolve(__dirname, "src/sdk-trace-web"),
        "@utils": path.resolve(__dirname, "src/utils"),
      },
      fallback: {
        util: false,
        os: false,
        fs: false,
        path: false,
        assert: false,
        buffer: false,
        stream: false,
        crypto: false,
        http: false,
        https: false,
        url: false,
        querystring: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      targets: {
                        ie: "11",
                        browsers: ["ie >= 11", "last 2 versions", "> 1%"],
                      },
                      useBuiltIns: "entry",
                      corejs: {
                        version: 3,
                        proposals: false,
                      },
                      modules: false,
                      loose: true,
                    },
                  ],
                  "@babel/preset-typescript",
                ],
                plugins: [
                  "@babel/plugin-transform-runtime",
                  "@babel/plugin-transform-template-literals",
                  "@babel/plugin-transform-arrow-functions",
                  "@babel/plugin-transform-block-scoping",
                  "@babel/plugin-transform-destructuring",
                  "@babel/plugin-transform-parameters",
                  "@babel/plugin-transform-shorthand-properties",
                  "@babel/plugin-transform-spread",
                ],
                compact: isProduction,
                minified: false, // Let Terser handle minification
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          include: /node_modules\/(core-js|regenerator-runtime)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: { ie: "11" },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          test: /\.js$/,
          include: /\.min\.js$/,
          terserOptions: {
            ecma: 5,
            parse: {
              ecma: 5,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_getters: true,
              unsafe: true,
              unsafe_comps: true,
              unsafe_Function: true,
              unsafe_math: true,
              unsafe_symbols: true,
              unsafe_methods: true,
              unsafe_proto: true,
              unsafe_regexp: true,
              unsafe_undefined: true,
              unused: true,
              dead_code: true,
              // IE11 specific optimizations
              keep_fargs: false,
              hoist_funs: true,
              hoist_props: true,
              hoist_vars: false,
              if_return: true,
              join_vars: true,
              loops: true,
              negate_iife: false,
              properties: true,
              reduce_funcs: true,
              reduce_vars: true,
              switches: true,
              typeofs: true,
              booleans: true,
              collapse_vars: true,
              computed_props: true,
              conditionals: true,
              evaluate: true,
              expression: true,
              passes: 3, // Multiple passes for better optimization
            },
            mangle: {
              safari10: true,
              ie8: false,
              keep_fnames: false,
              reserved: ["OpenTelemetryIE11", "OpenTelemetryAPI"],
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
              safari10: true,
              ie8: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        cacheGroups: {
          default: false,
          defaultVendors: false,
        },
      },
      usedExports: true,
      sideEffects: false,
      providedExports: true,
      mangleExports: "size",
      innerGraph: true,
      realContentHash: true,
      moduleIds: "deterministic",
      chunkIds: "deterministic",
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        __BROWSER__: JSON.stringify(true),
        __NODE__: JSON.stringify(false),
        __IE11__: JSON.stringify(true),
        __VERSION__: JSON.stringify(require("./package.json").version),
        "process.env.NODE_ENV": JSON.stringify(
          isProduction ? "production" : "development"
        ),
      }),
      new webpack.BannerPlugin({
        banner: `OpenTelemetry IE11 v${
          require("./package.json").version
        } - Build: ${new Date().toISOString()}
Compatible with IE11, Chrome 49+, Firefox 52+, Safari 10+, Edge 12+
UMD build supports AMD, CommonJS, and global browser environments`,
        entryOnly: true,
      }),
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
      // Conditional polyfill loading
      new webpack.NormalModuleReplacementPlugin(
        /^core-js$/,
        path.resolve(__dirname, "src/polyfills/conditional-core-js.js")
      ),
      ...(isAnalyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              openAnalyzer: false,
              reportFilename: "bundle-analysis/bundle-report.html",
              defaultSizes: "gzip",
              generateStatsFile: true,
              statsFilename: "bundle-analysis/ie11-bundle-stats.json",
              statsOptions: {
                source: false,
                modules: true,
                chunks: true,
                chunkModules: true,
                chunkOrigins: true,
                reasons: true,
                usedExports: true,
                providedExports: true,
                optimizationBailout: true,
                errorDetails: true,
                publicPath: true,
                exclude: /node_modules/,
              },
            }),
          ]
        : []),
    ],
    performance: {
      hints: isProduction ? "warning" : false,
      maxEntrypointSize: 300000, // 300KB limit for full bundle
      maxAssetSize: 200000, // 200KB per asset limit
      assetFilter: function (assetFilename) {
        return (
          assetFilename.endsWith(".js") && !assetFilename.includes("chunk")
        );
      },
    },
    devtool: isProduction ? false : "eval-source-map",
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: true,
      assets: true,
      assetsSort: "size",
      modulesSort: "size",
      chunksSort: "size",
      builtAt: true,
      hash: false,
      version: false,
      timings: true,
      performance: true,
      reasons: false,
      source: false,
      warnings: true,
      errors: true,
      errorDetails: true,
    },
    // IE11 specific configurations
    target: ["web", "es5"],
    experiments: {
      outputModule: false, // Disable ES modules for IE11 compatibility
    },
  };
};
