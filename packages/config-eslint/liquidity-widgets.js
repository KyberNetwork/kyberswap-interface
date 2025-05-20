const baseConfig = require("./library.js");

module.exports = {
  ...baseConfig,
  parserOptions: {
    ...baseConfig.parserOptions,
    project: "./tsconfig.json",
  },
  plugins: [
    ...baseConfig.plugins,
    "better-styled-components",
    "unused-imports",
    "jsx-a11y",
  ],
  rules: {
    ...baseConfig.rules,
    "unused-imports/no-unused-imports":
      process.env.NODE_ENV === "production" ? "error" : "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/camelcase": "off",
    "react/prop-types": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "no-duplicate-imports": "error",
    "react/react-in-jsx-scope": "off",
    "react/jsx-pascal-case": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
    "no-empty-function": "off",
    "@typescript-eslint/no-empty-function": "off",
  },
};
