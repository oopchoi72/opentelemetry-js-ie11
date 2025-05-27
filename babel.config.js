module.exports = {
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
        debug: false,
        shippedProposals: true,
        forceAllTransforms: false,
      },
    ],
    [
      "@babel/preset-typescript",
      {
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
      },
    ],
  ],
  plugins: [],
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current",
            },
          },
        ],
        "@babel/preset-typescript",
      ],
    },
  },
};
