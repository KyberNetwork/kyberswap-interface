import { formatter } from '@lingui/format-po'

const config = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src'],
      exclude: ['**/**.d.ts'],
    },
  ],
  compileNamespace: 'cjs',
  fallbackLocales: {
    default: 'en-US',
  },
  format: formatter({ explicitIdAsDefault: true }),
  formatOptions: {
    lineNumbers: false,
  },
  locales: ['en-US', 'ko-KR', 'tr-TR', 'vi-VN', 'zh-CN', 'tl-PH'],
  orderBy: 'messageId',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en-US',
}

export default config
