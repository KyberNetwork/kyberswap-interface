const path = require('path')

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      // Allows for the parsing of JSX
      jsx: true,
    },
  },
  ignorePatterns: [
    'src/locales/**/*.js',
    'src/locales/**/en-US.po',
    'node_modules',
    'src/**/charting_library.*',
    'src/service-worker.ts',
    'src/serviceWorker/document.ts',
    'src/**/charting_library/**',
    'build',
    'dist',
    '.DS_Store',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    '.idea/',
    '.vscode/',
    'public',
    'package-lock.json',
    'yarn.lock',
  ],
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['unused-imports', 'jsx-a11y', 'lingui', 'tailwindcss'],
  rules: {
    'unused-imports/no-unused-imports': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/camelcase': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    'no-duplicate-imports': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-pascal-case': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    'lingui/no-unlocalized-strings': 0,
    'lingui/t-call-in-function': 2,
    'lingui/no-single-variables-to-translate': 2,
    'lingui/no-expression-in-message': 2,
    'lingui/no-single-tag-to-translate': 2,
    'lingui/no-trans-inside-trans': 2,

    // Tailwind plugin: keep noisy rules off; rely on prettier-plugin-tailwindcss for ordering.
    'tailwindcss/classnames-order': 'off',
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/enforces-shorthand': 'warn',

    // Guardrails: block reintroduction of the libraries removed by the styled-components→Tailwind
    // and ethers.js→viem migrations.
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'styled-components', message: 'Use Tailwind classes + cn() (utils/cn) instead.' },
          { name: 'rebass', message: 'Use Tailwind classes + cn() (utils/cn) instead.' },
          { name: 'polished', message: 'Use Tailwind opacity modifier (e.g. bg-X/N) or hexAlpha for runtime needs.' },
          {
            name: '@wagmi/core',
            importNames: ['getWalletClient'],
            message:
              'Use `getGatedWalletClient` / `signTypedDataSafe` from src/utils/walletClient.ts so the Blackjack compliance gate runs at the EIP-1193 boundary.',
          },
          {
            name: 'wagmi',
            importNames: ['useWalletClient'],
            message:
              'Use `useGatedWalletClient` from src/hooks/useGatedWalletClient.ts so the Blackjack compliance gate runs at the EIP-1193 boundary.',
          },
          { name: 'ethers', message: 'Use viem (see src/utils/viem.ts).' },
          { name: 'ethers/lib/utils', message: 'Use parseUnits/formatUnits/etc. from src/utils/viem.ts.' },
          { name: '@ethersproject/units', message: 'Use parseUnits/formatUnits from src/utils/viem.ts.' },
          { name: '@ethersproject/bignumber', message: 'Use native bigint.' },
          { name: '@ethersproject/abi', message: 'Use encodeFunctionData/decodeFunctionResult from src/utils/viem.ts.' },
          { name: '@ethersproject/contracts', message: 'Use wagmi useReadContract / @wagmi/core readContract instead.' },
          { name: '@ethersproject/providers', message: 'Use viem PublicClient via wagmi (usePublicClient / getPublicClient).' },
          { name: '@ethersproject/abstract-provider', message: 'Use viem types from src/utils/viem.ts.' },
          { name: '@ethersproject/address', message: 'Use getAddress/isAddress from src/utils/viem.ts.' },
          { name: '@ethersproject/bytes', message: 'Use viem byte helpers (toBytes/toHex) from src/utils/viem.ts.' },
          { name: '@ethersproject/constants', message: 'Inline the constant or use viem (zeroAddress, maxUint256, ...).' },
          { name: '@ethersproject/solidity', message: 'Use viem encodePacked.' },
          { name: '@ethersproject/strings', message: 'Use viem string helpers.' },
        ],
        patterns: [
          { group: ['rebass/*'], message: 'Use Tailwind classes + cn() (utils/cn) instead.' },
          { group: ['styled-components/*'], message: 'Use Tailwind classes + cn() (utils/cn) instead.' },
        ],
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
    tailwindcss: {
      config: path.resolve(__dirname, 'tailwind.config.ts'),
      callees: ['cn', 'cva', 'clsx', 'twMerge'],
    },
  },
}
