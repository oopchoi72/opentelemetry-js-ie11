module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(core-js|regenerator-runtime)/)"],
  testMatch: [
    "<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)",
    "<rootDir>/test/**/*.test.(ts|tsx|js|jsx)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/polyfills/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/lib/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
