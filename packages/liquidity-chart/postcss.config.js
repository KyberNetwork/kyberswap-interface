const prefixOverrideList = ['html', 'body', "[role='portal']"];

export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: { config: 'tailwind.config.ts' },
    'postcss-prefix-selector': {
      prefix: '.ks-lc-style',
      transform(prefix, selector, prefixedSelector) {
        if (prefixOverrideList.includes(selector)) {
          return prefix;
        }
        return prefixedSelector;
      },
    },
    autoprefixer: {},
  },
};
