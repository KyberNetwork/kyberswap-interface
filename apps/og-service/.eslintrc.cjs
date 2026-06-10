/* eslint-env node */
// Standalone (no workspace dep), mirroring the monorepo's TS + prettier rules. The React-specific
// rules from @kyber/eslint-config are omitted — this is a Node service with no JSX. The prettier rule
// enforces formatting + import order (via .prettierrc.cjs and its sort-imports plugin).
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier'],
  env: { node: true, es2022: true },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'fonts/'],
};
