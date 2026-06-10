// Mirrors @kyber/eslint-config/prettier — kept standalone (no workspace dep) so this service stays
// self-contained / Docker-deployable, while formatting identically to the rest of the monorepo.
module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 120,
  trailingComma: 'all',
  arrowParens: 'avoid',
  // Resolve the plugin by absolute path (from this file) so it always loads THIS package's v4
  // (prettier-3 compatible) — when an editor runs eslint from the repo root, a bare name otherwise
  // resolves to a hoisted older version that mangles TS generics.
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: [
    '^react$',
    '^react-(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@kyber/(.*)$',
    '^@kyberswap/(.*)$',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
};
