module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 120,
  trailingComma: 'all',
  arrowParens: 'avoid',
  // prettier-plugin-tailwindcss MUST be last so class sort runs after import sort
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^(apollo|assets|components|connectors|constants|data|hooks|locales|pages|state|theme|types|utils)(/.+)?$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  tailwindConfig: './tailwind.config.ts',
  tailwindFunctions: ['cn', 'cva', 'clsx', 'twMerge'],
}
