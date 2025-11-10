const config = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src'],
      exclude: ['**/*.d.ts'],
    },
  ],
  compileNamespace: 'es',
  fallbackLocales: {
    default: 'en-US',
  },
  format: 'po',
  formatOptions: {
    lineNumbers: false,
  },
  locales: ['en-US', 'zh-CN'],
  orderBy: 'messageId',
  rootDir: '.',
  runtimeConfigModule: ['@/lingui', 'i18n'],
  sourceLocale: 'en-US',
};

export default config;
