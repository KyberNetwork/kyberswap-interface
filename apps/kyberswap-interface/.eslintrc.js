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
  plugins: ['better-styled-components', 'unused-imports', 'jsx-a11y', 'lingui', 'tailwindcss'],
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
  overrides: [
    {
      // Migration guardrail: forbids styled-components / rebass / polished in already-migrated folders.
      // ➜ When a folder finishes migration, add its glob to `files` below (e.g. 'src/components/Button/**/*.{ts,tsx}').
      // ➜ Goal at end of Phase 5: files = ['src/**/*.{ts,tsx}'].
      // See MIGRATION.md.
      files: [
        // Sentinel — replace/extend with real paths as folders finish migration.
        // Examples once Phase 3 starts:
        //   'src/components/Button/**/*.{ts,tsx}',
        //   'src/components/Modal/**/*.{ts,tsx}',
        'src/components/__migrated__/**/*.{ts,tsx}',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'styled-components',
                message: 'styled-components is being migrated to Tailwind CSS. Use Tailwind utilities + cn() instead. See apps/kyberswap-interface/MIGRATION.md',
              },
              {
                name: 'rebass',
                message: 'rebass is being removed. Use plain elements + Tailwind utilities.',
              },
              {
                name: 'polished',
                message: 'polished helpers are being removed. Use Tailwind utilities (brightness-*, opacity-*) or plain CSS.',
              },
            ],
          },
        ],
      },
    },
  ],
}
