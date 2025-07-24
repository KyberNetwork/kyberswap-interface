module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 120,
  trailingComma: 'all',
  arrowParens: 'avoid',
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^(apollo|assets|components|connectors|constants|data|hooks|locales|pages|state|theme|types|utils)(/.+)?$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
