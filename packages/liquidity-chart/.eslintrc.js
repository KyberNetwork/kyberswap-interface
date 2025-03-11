/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@kyber/eslint-config/react.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.lint.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/no-unsafe-call": "off",
    "no-nested-ternary": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "unicorn/filename-case": "off",
    "eslint-comments/require-description": "off",
    "@typescript-eslint/unbound-method": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "@typescript-eslint/no-confusing-void-expression": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
  },
};
